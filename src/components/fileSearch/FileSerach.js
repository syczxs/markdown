import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './FileSearch.css'
//键盘监听hook
import useKeyPress from '../../hooks/useKeyPress'
//监听主进程回调
import useIpcRenderer from '../../hooks/useIpcRenderer'
import pic from '../../assets/pic/select.png'
import pic2 from '../../assets/pic/delet.png'


//显示文字，搜索enter的回调方法
const FileSearch = ({ title, onFileSearch }) => {
  //搜索输入框显示状态
  const [inputActive, setInputActive] = useState(false)
  //搜索框输入值
  const [value, setValue] = useState('')

  //储存输入框焦点状态，从node.current上取得dom节点
  let node = useRef(null)

  //监听enter，esc
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  //关闭输入框
  const closeSearch = () => {
    setInputActive(false)
    setValue('')
    onFileSearch('')
  }
  //当监听到enter，esc后对应的逻辑
  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(value)
    }
    if (escPressed && inputActive) {
      closeSearch()
    }
  })
  //当输入框出现时获取dom节点，获取焦点
  useEffect(() => {
    if (inputActive) {
      node.current.focus()
    }
  }, [inputActive])

 //监听搜索
  useIpcRenderer({
    'search-file': ()=>{
      setInputActive(true) 
    }
    
  })

  return (
    <div className="box1">
      {
        !inputActive &&
        <>
          <div className="box2">
            <span>{title}</span>
            <div className="pic-box" onClick={() => { setInputActive(true) }}>
              <img className="pic" src={pic}></img>
            </div>
          
          </div>
        </>
      }{
        inputActive &&
        <>
          <div className="box2">
            <input
            placeholder="按下enter确认搜索"
              value={value}
              ref={node}
              onChange={(e) => { setValue(e.target.value);onFileSearch(value)}}
            ></input>
             {/* <div className="pic-box" onClick={()=>onFileSearch(value)}>
              <img className="pic" src={pic}></img>
            </div> */}
            <div className="pic-box" onClick={closeSearch}>
              <img className="pic" src={pic2}></img>
            </div>
           
          </div>
        </>
      }
    </div>
  )

}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired,
}

FileSearch.defaultProps = {
  title: '胖虎的makdown编辑器'
}
export default FileSearch