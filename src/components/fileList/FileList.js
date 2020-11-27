import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './FileList.css'
import { getParentNode } from '../../utils/helper'
//键盘监听hook
import useKeyPress from '../../hooks/useKeyPress'
//监听右键菜单hook
import useContextMenu from '../../hooks/useContextMenu'

import word from '../../assets/pic/word.png'
import delet from '../../assets/pic/delet.png'
import update from '../../assets/pic/重命名.png'
import { timestampToString } from '../../utils/helper'

//使用node
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

//文件和三个回调
const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {


    //文件重命名（传入选取项的id,输入的值）
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState("")

    //监听enter，esc
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    //关闭输入框
    const closeSearch = (editItem) => {
        // e.preventDefault()
        setEditStatus(false)
        setValue('')
        //当时新建文件时，直接删除此文件
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }

    }

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== "") {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
            setValue('')
        }
        if (escPressed && editStatus) {
            closeSearch(editItem)
        }
    })
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }

    }, [files])


    const clickedItem = useContextMenu([
        {
            label: "打开",
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'list-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }

            }
        },
        {
            label: "重命名",
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'list-item')
                if (parentElement) {
                    setEditStatus(parentElement.dataset.id); setValue(parentElement.dataset.title)
                }

            }
        },
        {
            label: "删除",
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'list-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }


            }
        }
    ], '.lists', [files])


    //创建点击菜单



    return (
        <div className="list-box">
            <div className="lists">
                {
                    files.map(file => (
                        <div
                            className="list-item"
                            key={file.id}
                            data-id={file.id}
                            data-title={file.title}
                        >
                            {(file.id !== editStatus && !file.isNew) &&
                                <>

                                    <div className="title-pic" onClick={() => { onFileClick(file.id) }}> <img src={word}></img></div>
                                    <div className="title-left">
                                        <span className="text1"
                                            onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                        <span className="text2">上次打开：{timestampToString(file.updatedAt)}</span>
                                    </div>
                                    <div className="title-right">
                                        <div className="pic-box"
                                            onClick={() => { setEditStatus(file.id); setValue(file.title) }}>
                                            <img className="pic" src={update}></img>
                                        </div>
                                        <div className="pic-box" style={{ marginLeft: '10px' }}
                                            onClick={() => { onFileDelete(file.id) }}>
                                            <img className="pic" src={delet}></img>
                                        </div>

                                    </div>


                                </>
                            }
                            {((file.id === editStatus) || file.isNew) &&
                                <>
                                    <div className="title-pic" > <img src={word}></img></div>
                                    <div>
                                    <input
                                        value={value}
                                        style={{ marginLeft: '10px' }}
                                        placeholder="请输入文件名称"
                                        onChange={(e) => { setValue(e.target.value) }}
                                    ></input>
                                    <span className="small-title">按下enter确认新建</span>
                                    </div>
                                    {file.sameName &&
                                        <span>已有相同文件</span>}
                                    <div className="pic-box delet-pic"
                                        
                                        onClick={() => { closeSearch(file) }}>
                                        <img className="pic" src={delet}></img>
                                    </div>

                                </>
                            }

                        </div>
                    ))


                }
            </div>
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