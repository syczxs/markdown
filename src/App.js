import React, { useState, useEffect } from 'react';
import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css'

//引入富文本编辑器
import SimpleMDE from 'react-simplemde-editor'
//富文本编辑器样式文件
import "easymde/dist/easymde.min.css"
//引入uuid
import uuidv4 from 'uuid/v4'

//js文件引用
import { flattenArr, objToArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'



//组件引用
//1搜索框
import FileSearch from './components/fileSearch/FileSerach'
//2左侧列表
import FileList from './components/fileList/FileList'
//3左侧下部按钮
import ButtonBtn from './components/buttonBtn/ButtonBtn'
//4右侧上部利表
import TabList from './components/tabList/TabList'


//hook
import useIpcRenderer from './hooks/useIpcRenderer'

//使用node
const { join, basename, extname, dirname } = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'Files Data' })
const settingsStore = new Store({ name: 'Settings' })

const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))

//文件保存
const saveFilesToStore = (files) => {
  //数组方便处理
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})

  fileStore.set('files', filesStoreObj)

}


function App() {

  //文件数组
  const [files, setFiles] = useState(fileStore.get('files') || {})

  //当前被激活文件
  const [activeFileID, setActiveFileID] = useState("")
  //打开文件（数组）
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  //未保存文件(数组)
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  //搜索数组
  const [searchedFiles, setSearchedFiles] = useState([])

  //electron中获取目录，document默认为电脑文档下
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')

  //转回数组
  const filesArr = objToArr(files)



  //通过openedFileIds筛选files数组
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  //通过acticeId获取代选中文件
  const activeFile = files[activeFileID]
  //搜索出来数组
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr



  //方法

  //左侧列表点击onFileClick
  const fileClick = (fileID) => {
    //设置选择窗口ID
    setActiveFileID(fileID)
    //打开文件内容
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile
    console.log(currentFile)
    if (!currentFile.isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(currentFile.path).then(value => {
          const newFile = { ...files[fileID], body: value, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile })
        }).catch(err => {
          const newFile = { ...files[fileID], isLoaded: true, err: true }
          setFiles({ ...files, [fileID]: newFile })
        })

      }


    }

    //不可重复加入
    if (!openedFileIDs.includes(fileID)) {
      //加入open数组,
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  //右上导航栏点击onTabClick
  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }
  //关闭窗口,筛选id不相等
  const tabClose = (id) => {
    const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    //关闭窗口后，将转换编辑器内容编辑器
    if (tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID("")
    }
  }
  //修改文本
  const fileChange = (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })

      //更新未保存文件ID
      if (!unsavedFileIDs.includes(id)) {
        setUnsavedFileIDs([...unsavedFileIDs, id])
      }

    }


  }

  //删除文件回调
  const deleteFile = (id) => {
    //新建文件时点esc bug解决
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        //关闭右侧窗口
        tabClose(id)
      })

    }


  }
  //修改文件名回调

  const updateFileName = (id, title, isNew) => {
    const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }

    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      const sameTitle = filesArr.filter(item => item.title == title)
      if (sameTitle.length > 0) {
        const sameNameFile = { ...files[id], title, isNew: true, path: newPath, sameName: true }
        setFiles({ ...files, [id]: sameNameFile })
      } else {

        fileHelper.writeFile(newPath, files[id].body).then(() => {

          setFiles(newFiles)
          saveFilesToStore(newFiles)
        }).catch(err => {
          console.log(err, "123")
        })
      }
    } else {
      fileHelper.renameFile(files[id].path, newPath).then(() => {
        console.log('222')
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })

    }


  }
  //根据文件名查找onFileSearch
  const fileSearch = (keyword) => {
    if (!!keyword) {
      // filter out the new files based on the keyword
      const newFiles = filesArr.filter(file => file.title.includes(keyword))
      setSearchedFiles(newFiles)

    } else {
      setSearchedFiles({})
    }

  }

  //新建文件
  const createNewFile = () => {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: "",
      body: '请输入内容',
      createdAt: new Date().getTime(),
      isNew: true
    }
    console.log(newFile)
    setFiles({ ...files, [newID]: newFile })
  }
  //保存文件
  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    console.log(path, body, title)
    fileHelper.writeFile(path, body).then(() => {

      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id

      ))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })

      }
    })
  }
  //删除不存在文件
  const deleteErrFile = (id) => {
    const { [id]: value, ...afterDelete } = files
    setFiles(afterDelete)
    saveFilesToStore(afterDelete)
    //关闭右侧窗口
    tabClose(id)

  }
  //导入文件
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: "选择导入文件",
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }, (paths) => {
      if (Array.isArray(paths)) {
        //过滤（已有文件）数组
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path == path

          })
          console.log(!alreadyAdded, alreadyAdded)
          return !alreadyAdded
        })
        //文件进行扩展
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          }
        })
        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入${importFilesArr.length}个文件`,
            message: `成功导入${importFilesArr.length}个文件`,
          })
        }

      }
    })
  }
  //文件云保存后回调
  const activeFileUploaded = () => {
    const { id } = activeFile
    console.log(id)
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  //云文件对比后回调
  const activeFileDownloaded = (event, message) => {
    console.log("1")
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value=>{
      let newFile
      if(message.status==='download-succes'){
        newFile={...files[id],body:value,isLoad:true,isSynced:true,updatedAt:new Date().getTime()}
      }else{
        newFile={...files[id],body:value,isLoad:true}
      }
      const newFiles={...files,[id]:newFile}
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })

  }


  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded
  })


  return (
    <div className="App">
      <div className="body">
        <div className="body-left">
          <FileSearch
            title="胖虎的makdown编辑器"
            onFileSearch={fileSearch}
          />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          ></FileList>
          <div className="header-footer">
            <div className="footer-item" >
              <ButtonBtn
                text="新建"
                onBtnClick={createNewFile}
              ></ButtonBtn>
            </div>
            <div className="footer-item">
              <ButtonBtn
                text="导入 "
                onBtnClick={importFiles}
              ></ButtonBtn>
            </div>
          </div>
        </div>
        <div className="body-right">
          {
            !activeFile && <div >未打开文件</div>
          }{
            activeFile &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              ></TabList>
              {activeFile.err &&
                <>
                  <div>文件不存在</div>
                  <button onClick={() => { deleteErrFile(activeFile.id) }}>确定</button>
                </>
              }{
                !activeFile.err &&
                <>
                  <SimpleMDE
                    key={activeFile && activeFile.id}
                    value={activeFile && activeFile.body}
                    onChange={(value) => { fileChange(activeFile.id, value) }}
                    options={{
                      minHeight: '456px'
                    }}></SimpleMDE>
                </>
              }
              {activeFile.isSynced &&
                <span className="sync-status">已同步，上次同步时间{timestampToString(activeFile.updateAt)}</span>
              }


            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
