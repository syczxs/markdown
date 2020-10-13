const{ remote} =require('electron')
const Store =require('electron-store')

const settingsStore=new Store({name:'Settings'})

const $=(id)=>{
   return document.getElementById(id)
}

document.addEventListener('DOMContentLoaded',()=>{
    let savedLocatin=settingsStore.get('savedFileLocation')
    if(savedLocatin){
        $('saved-file-location').value=savedLocatin

    }
    $('select-new-location').addEventListener('click',()=>{
        remote.dialog.showOpenDialog({
            properties:['openDirectory'],
            message:'选择文件的储存路径',
        },(path)=>{
            if(Array.isArray(path)){
               $('saved-file-location').value=path[0]
               savedLocatin=path[0]

            }
        })
    })
    $('settings-form').addEventListener('submit',()=>{
        settingsStore.set('savedFileLocation',savedLocatin)
        remote.getCurrentWindow().close()
    })

})