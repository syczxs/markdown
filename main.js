const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')

const path = require('path')

const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')

const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })


const QiniuManager = require('./src/utils/QiniuManager')

let mainWindow, settingsWindow

//实例化七牛类
const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucketName = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucketName)
}

app.on('ready', () => {

  const mainWindowConfig = {
    width: 1440,
    height: 768,

  }


  const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.webContents.openDevTools();
  // mainWindow.loadURL(urlLocation)

  mainWindow.on('close', () => {
    mainWindow = null

  })

  //设置菜单
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 500,
      parent: mainWindow

    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.removeMenu()
    settingsWindow.on('close', () => {
      settingsWindow = null

    })
  })
  //填写完七牛key后自动显示云保存项
  ipcMain.on('config-is-saved', () => {
    // watch out menu items index for mac and windows
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle
      })
    }
    const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
    if (qiniuIsConfiged) {
      switchItems(true)
    } else {
      switchItems(false)
    }
  })
  //点击保存后，上传到七牛云
  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager()
    manager.uploadFile(data.key, data.path).then(data => {
      console.log('上传成功', data)
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
    })
  })
  //打开文件前，对比云文件
  ipcMain.on('download', (event, data) => {
    console.log("1")
    const manager = createManager()
    const filesObj = fileStore.get('files')
    const { key, path, id } = data
    manager.getStat(data.key).then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000)
      const localUpdatedTime = filesObj[id].updaedAt
      if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime){
        console.log('new file downloaded')
        manager.downloadFile(key,path).then(()=>{
          mainWindow.webContents.send('file-downloaded',{ status: 'download-success',id })
        })
      }else{
        console.log('no new file')
        mainWindow.webContents.send('file-downloaded',{ status: 'no-new-file',id })

      }

    }, (error) => {
      console.log(error)
      if (error.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file' ,id})
      }
    })
  })



})
