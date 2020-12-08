const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
// const {autoUpdater}=require('electron-updater')

const path = require('path')
const uuidv4 = require('uuid/v4')

const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')

const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })
const savedLocation = settingsStore.get('savedFileLocation') || app.getPath('documents')


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
  // autoUpdater.autoDownload = false
  // autoUpdater.checkForUpdatesAndNotify()
  // autoUpdater.on('error', (error) => {
  //   dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
  // })
  // autoUpdater.on('update-available', () => {
  //   dialog.showMessageBox({
  //     type: 'info',
  //     title: '应用有新的版本',
  //     message: '发现新版本，是否现在更新?',
  //     buttons: ['是', '否']
  //   }, (buttonIndex) => {
  //     if (buttonIndex === 0) {
  //       autoUpdater.downloadUpdate()
  //     }
  //   })
  // })
  // autoUpdater.on('update-not-available', () => {
  //   dialog.showMessageBox({
  //     title: '没有新版本',
  //     message: '当前已经是最新版本'
  //   })
  // })

  const mainWindowConfig = {
    width: 1440,
    height: 768,

  }


  const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname,'./index.html')}`
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
 
    const filesObj = fileStore.get('files')
    const { key, path, id } = data
    manager.getStat(data.key).then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000)
      const localUpdatedTime = filesObj[id].updatedAt
      console.log(localUpdatedTime,serverUpdatedTime)
      if (serverUpdatedTime-localUpdatedTime>1000 || !localUpdatedTime){
        console.log('new file downloaded')
        manager.downloadFile(key,path).then(()=>{
          mainWindow.webContents.send('file-downloaded',{ status: 'download-success',id })
           
        }).catch((err)=>{
          console.log(err)
        })
      }else{
        console.log('no new file')
        mainWindow.webContents.send('file-downloaded',{ status: 'no-new-file',id })
   
      }

    }, (error) => {
      console.log(error,1111)
      if (error.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file' ,id}) 
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
    mainWindow.webContents.send('loading-status',true)
      const localFilesObj = fileStore.get('files') || {}
      let options  = {
        buttons: ["是", "取消"],
        message: "从七牛云下载所有文件，会覆盖本地同名文件，您是否要继续？"
      }
      dialog.showMessageBox(options,response=>{
        if(response==0){
          let fileList = []
          mainWindow.webContents.send('request-loading')
          manager.getFileList().then(res=>{
            return res.items
          }).then(items=>{
            fileList=items
            const downloadPromiseArr = items.map(item => {
              return manager.downloadFile(item.key, path.join(savedLocation, item.key))
            })
            return Promise.all(downloadPromiseArr)
          }).then(result=>{
            dialog.showMessageBox({
              type: 'info',
              title: `成功下载了${result.length}个文件`,
              message: `成功下载了${result.length}个文件`,
            })
            const finalFilesObj=fileList.reduce((newFilesObj,qiniuFile)=>{
              const keyExisted = Object.keys(localFilesObj).find(key => `${localFilesObj[key].title}.md` === qiniuFile.key)
              console.log(keyExisted)
              const updatedTime = Math.round(qiniuFile.putTime / 10000)
              const newPath = path.join(savedLocation, qiniuFile.key)
              if(keyExisted){
                const newFileItem = {
                  ...localFilesObj[keyExisted],
                  path: newPath,
                  updatedAt: updatedTime,
                }
                return {
                  ...newFilesObj, [keyExisted]: newFileItem
                }
              }else{
                const newID = uuidv4()
                const newFileItem = {
                  id: newID,
                  title: path.basename(qiniuFile.key, '.md'),
                  path: newPath,
                  createdAt: updatedTime,
                  updatedAt: updatedTime,
                  isSynced: true,
                }
                return {
                  ...newFilesObj, [newID]: newFileItem
                }
              }
            },{...localFilesObj})
            fileStore.set('files', finalFilesObj)          
          }).catch((err) => {
            dialog.showErrorBox('下载失败', '请检查七牛云参数是否正确')
            console.log(err)
          }).finally(() => {
            mainWindow.webContents.send('loading-status',false)
          })     
        }

      })
      
   
  })



})
