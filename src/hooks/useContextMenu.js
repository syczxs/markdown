import { useEffect, useRef } from 'react'
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

const useContextMenu = (itemArr,targetSelector,dps) => {
    let clickedElement = useRef(null)
    useEffect(() => {
        const menu = new Menu()
        itemArr.forEach(item => {
            menu.append(new MenuItem(item))
        })
       
        const handleContextMenu = (e) => {
             //选择器
        if(document.querySelector(targetSelector).contains(e.target)){
            clickedElement.current = e.target
            menu.popup({ window: remote.getCurrentWindow() })     
        }
            
        }

        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, dps)
    return clickedElement

}

export default useContextMenu