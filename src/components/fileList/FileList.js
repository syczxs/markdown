import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './FileList.css'
//键盘监听hook
import useKeyPress from '../../hooks/useKeyPress'

//文件和三个回调
const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {


    //文件重命名（传入选取项的id,输入的值）
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState("")

    //监听enter，esc
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

     //关闭输入框
     const closeSearch=(editItem)=>{
        // e.preventDefault()
        setEditStatus(false)
        setValue('')
        //当时新建文件时，直接删除此文件
        if(editItem.isNew){
            onFileDelete(editItem.id)
        }

    }

    useEffect(()=>{
        const editItem=files.find(file=>file.id===editStatus)
        if(enterPressed&&editStatus && value.trim()!==""){
            onSaveEdit(editItem.id,value,editItem.isNew)
            
            setEditStatus(false)
            setValue('')
        }
        if(escPressed&&editStatus){
            closeSearch(editItem)
        }
    })
    useEffect(()=>{
        const newFile=files.find(file=>file.isNew)
        if(newFile){
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }

    },[files])
   

    return (
        <div className="list-box">
            {
                files.map(file => (
                    <div
                        className="list-item"
                        key={file.id}
                    >
                        {(file.id !== editStatus && !file.isNew) &&
                            <>
                                <span
                                    onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                               
                                <button
                                    onClick={() => { setEditStatus(file.id); setValue(file.title) }}>编辑</button>
                                <button
                                    onClick={() => { onFileDelete(file.id) }}>删除</button>
                            </>
                        }
                        {((file.id === editStatus) || file.isNew) &&
                            <>
                                <input
                                    value={value}
                                    placeholder="请输入文件名称"
                                    onChange={(e) => { setValue(e.target.value) }}
                                ></input>
                                {file.sameName &&
                                <span>已有相同文件</span>}
                                <button type="button"
                                    onClick={()=>{closeSearch(file)}}>关闭</button>
                            </>
                        }

                    </div>
                ))

            }
        </div>
    )
}
FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func,
}

export default FileList