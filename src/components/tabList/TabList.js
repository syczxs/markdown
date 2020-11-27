import React from 'react'
import PropTypes from 'prop-types'
import close from '../../assets/pic/x.png'
import unsave from '../../assets/pic/unsave.png'
//类名插件
import classNames from 'classnames'
import './TabList.css'
//文件名。选择中文件名，未保存文件(数组)
const TabList = ({ files, activeId, unsaveIds, onTabClick, onCloseTab }) => {
    return (

        <div className="TabList">
            {
                files.map(file => {
                    const withUnsavedMark = unsaveIds.includes(file.id)
                    const fClassName = classNames({
                        "list-item": true,
                        'active': file.id === activeId,
                        'withUnsaved': withUnsavedMark
                    })
                    return (
                        <div className={fClassName}
                            key={file.id}
                            onClick={(e) => { e.preventDefault(); onTabClick(file.id) }}>
                            <span>{
                                file.title.length < 5 && file.title
                            }{
                                    file.title.length > 5 && file.title.substr(0, 3) + '...'
                                }</span>
                            <img className="close"
                                onClick={(e) => { e.stopPropagation(); onCloseTab(file.id) }} src={close}>
                            
                            </img>
                            {
                                withUnsavedMark && <div className="unasve">
                                    <img className="unsave-pic" src={unsave}></img>
                                </div>
                            }
                        </div>
                    )
                })
            }

        </div>
    )

}

TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unsaveIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func,
}
TabList.defaultProps = {
    unsaveIds: []
}

export default TabList