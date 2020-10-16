// const qiniu = require('qiniu')
const QiniuManager = require('./src/utils/QiniuManager')

//key
var accessKey = 'Q29WiScCAugEH7vz8kFfuj1aJussqP98joDF2ePH';
var secretKey = '7cdW9BvOS1S35SHLj_DjQ9UrpF-1s7oFI07_4eCn';





var localFile = "C:/Users/麦律/Desktop/11.md";

var key = '11.md';

const manager = new QiniuManager(accessKey, secretKey, 'syc-markdown')
// manager.uploadFile(key,localFile).then(res=>{
//     console.log('上传成功过',res)
//     return manager.deletFile(key)
// }).then(res=>{
//     console.log("删除成功",res)
// })
// manager.deletFile(key)

manager.generateDownloadLink(key).then(res => {
    console.log(res)
    return manager.generateDownloadLink('first.md')
}).then(res => {
    console.log(res)
})





// var bucketManager = new qiniu.rs.BucketManager(mac, config);
// var publicBucketDomain = 'http://';
// // 公开空间访问链接
// var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
// console.log(publicDownloadUrl);
