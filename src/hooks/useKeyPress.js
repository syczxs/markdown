import { useState, useEffect } from 'react'


//传入监听按键
const useKeyPress = (targetKeyCode) => {

    //按键按下抬起状态
    const [keyPressed, setKeyPressed] = useState(false)

    const keyDownHandler = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(true)
        }

    }
    const keyUpHandler = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(false)
        }
    }
    useEffect(() => {
        //解构
        document.addEventListener('keydown', keyDownHandler)
        document.addEventListener('keyup', keyUpHandler)
        return () => {
            document.removeEventListener('keydown', keyDownHandler)
            document.removeEventListener('keyup', keyUpHandler)
        }
    }, [])
    return keyPressed
}
export default useKeyPress