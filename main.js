const { app, BrowserWindow, Menu, ipcMain ,dialog} = require('electron')
const isDev = require('electron-is-dev')

const path = require('path')

const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')

const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })


const QiniuManager = require('./src/utils/QiniuManager')

let mainWindow, settingsWindow

//实例化七牛类
const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('screctKey')
  const bucketName = settingsStore.get('bucketName')
  return new  QiniuManager(accessKey,secretKey,bucketName)
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
  ipcMain.on('upload-file',(event,data)=>{
    const manager=createManager()
    manager.uploadFile(data.key,data.path).then(res=>{
      console.log("上传成功",res)
    }).catch(err=>{
      dialog.showErrorBox("同步失败","请检查七牛云参数是否正确")
    })
  })



})
