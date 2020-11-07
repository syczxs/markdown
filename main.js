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
  // mainWindow.webContents.openDevTools();
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
    // 检测型号
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle
      })
    }
    const qiniuIsConfiged =  ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
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
  ipcMain.on('download-file', (event, data) => {
    const manager = createManager()
    mainWindow.webContents.send('loading-status',true)
    const filesObj = fileStore.get('files')
    const { key, path, id } = data
    manager.getStat(data.key).then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000)
      const localUpdatedTime = filesObj[id].updatedAt
      console.log(localUpdatedTime,serverUpdatedTime)
      if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime){
        console.log('new file downloaded')
        manager.downloadFile(key,path).then(()=>{
          mainWindow.webContents.send('file-downloaded',{ status: 'download-success',id })
          mainWindow.webContents.send('loading-status',false)
         
        })
      }else{
        console.log('no new file')
        mainWindow.webContents.send('file-downloaded',{ status: 'no-new-file',id })
        mainWindow.webContents.send('loading-status',false)
        

        
      }

    }, (error) => {
      console.log(error)
      if (error.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file' ,id})
        mainWindow.webContents.send('loading-status',false)
       
      }
    })
  })
  //上传全部文件到七牛
  ipcMain.on('upload-all-to-qiniu',()=>{
    
    mainWindow.webContents.send('loading-status',true)
    const manager = createManager()
    const filesObj=fileStore.get('files') || {}
    const uploadPromiseArr=Object.keys(filesObj).map(key=>{
      const file=filesObj[key]
      return manager.uploadFile(`${file.title}.md`,file.path)

    })
    Promise.all(uploadPromiseArr).then(result=>{
      console.log(result)
      dialog.showMessageBox({
        type:'info',
        title:`成功上传了${result.length}个文件`,
        message:`成功上传了${result.length}个文件`
      })
      mainWindow.webContents.send('files-uploaded')
    }).catch(()=>{
      dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
    }).finally(()=>{
      mainWindow.webContents.send('loading-status',false)

    })
    
  })
  //从云端删除文件
  ipcMain.on('delete-file',(event, data)=>{
    const manager = createManager()
      manager.deleteFile(data).then(res=>{
        console.log("删除成功")

      }).catch(() => {
        dialog.showErrorBox('云端删除失败', '请检查七牛云参数是否正确')
      })
  

  })
  //云端文件重命名
  ipcMain.on('rename-file', (event, data) => {
    const manager = createManager()
    console.log(data.oldName,data.newName)
   
      manager.renameFile(`${data.oldName}.md`, `${data.newName}.md`).catch((err) => {
        console.log(err)
        dialog.showErrorBox('云端重命名失败', '请检查七牛云参数是否正确',err)
      })
    
  })
  //下载到本地
  ipcMain.on('download-from-qiniu',()=>{
    const manager = createManager()
    manager.getFileList().then(items=>{
      
      const ownloadPromiseArr=Object.keys(items).filter(item=>{
        
      })
      // const localfiles=Object.keys(fileStore.get('files'))
      console.log(serverFiles,localfiles)
      // const downloadPromiseArr =items.filter(item=>{
      //   console.log(item)
      // })

    })
    
  })



})
