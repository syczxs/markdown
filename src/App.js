import React, { useState } from 'react';
import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css'

//引入富文本编辑器
import SimpleMDE from 'react-simplemde-editor'
//富文本编辑器样式文件
import "easymde/dist/easymde.min.css"
//引入uuid
import uuidv4 from 'uuid/v4'

//js文件引用
import defaultFiles from './utils/defaultFiles'
import { flattenArr, objToArr } from './utils/helper'
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

//使用node
const { join } = window.require('path')
const { remote } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'Files Data' })

//文件保存
const saveFilesToStore = (files) => {
  //数组方便处理
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt}=file
    result[id]={
      id,
      path,
      title,
      createdAt
    }
    return result
  }, {})

  fileStore.set('files',fileStore)

}


function App() {

  //文件数组
  const [files, setFiles] = useState(fileStore.get('files')  || {})
  console.log(files)
  //当前被激活文件
  const [activeFileID, setActiveFileID] = useState("")
  //打开文件（数组）
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  //未保存文件(数组)
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  //搜索数组
  const [searchedFiles, setSearchedFiles] = useState([])

  //electron中获取目录，document默认为电脑文档下
  const savedLocation = remote.app.getPath('documents')

  //转回数组
  const filesArr = objToArr(files)
  console.log(filesArr)


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
    const currentFile =files(fileID)
    const(!currentFile.isLoaded){
      
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
    // const newFiles=files.map(file=>{
    //   if(file.id===id){
    //     file.body=value
    //   }
    //   return file
    // })
    const newFile = { ...files[id], body: value }
    setFiles({ ...files, [id]: newFile })

    //更新未保存文件ID
    if (!unsavedFileIDs.includes(id)) {
      setUnsavedFileIDs([...unsavedFileIDs, id])
    }
  }

  //删除文件回调
  const deleteFile = (id) => {
    // const newFiles=files.filter(file=>file.id!==id)
    fileHelper.deleteFile(files[id].path).then(() => {
      delete files[id]
      setFiles(files)
      saveFilesToStore(files)
      //关闭右侧窗口
      tabClose(id)
    })

  }
  //修改文件名回调
  const updataFileName = (id, title, isNew) => {
    const newPath=join(savedLocation, `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false,path:newPath }
    const newFiles={ ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      fileHelper.renameFile(join(savedLocation, `${files[id].title}.md`),
        newPath).then(() => {
          setFiles(newFiles)
          saveFilesToStore(newFiles)
        })

    }


  }
  //根据文件名查找onFileSearch
  const fileSearch = (keyword) => {
    // console.log(keyword)
    // filter out the new files based on the keyword
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    // console.log(newFiles)
    setSearchedFiles(newFiles)
  }

  //新建文件
  const createNewFile = () => {
    const newID = uuidv4()
    // const newFiles=[
    //   ...files,
    //   {
    //     id:newID,
    //     title:"",
    //     body:'请输入内容',
    //     createdAt:new Date().getTime(),
    //     isNew:true
    //   }
    // ]
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
    fileHelper.writeFile(join(savedLocation, `${activeFile.title}.md`),
      activeFile.body).then(() => {
        setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id
        ))
      })
  }


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
            onSaveEdit={updataFileName}
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
                onBtnClick={(e) => { console.log(encodeURIComponent) }}
              ></ButtonBtn>
            </div>
          </div>
        </div>
        <div className="body-right">
          {
            !activeFile && <div className="">未打开文件</div>
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
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={(value) => { fileChange(activeFile.id, value) }}
                options={{
                  minHeight: '456px'
                }}></SimpleMDE>
              <button onClick={saveCurrentFile}>保存</button>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
