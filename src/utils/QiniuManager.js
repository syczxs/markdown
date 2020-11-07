const qiniu = require('qiniu')
const axios=require('axios')
const fs=require('fs');
const { resolve } = require('path');

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.bucket = bucket

        //初始化一个配置类
        this.config = new qiniu.conf.Config();
        // 空间对应的机房
        this.config.zone = qiniu.zone.Zone_z0;
        // 是否使用https域名
        //config.useHttpsDomain = true;
        // 上传是否使用cdn加速
        //config.useCdnDomain = true

        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

    }
    uploadFile(key, localFilePath) {
        //上传凭证
        const options = {
            scope: this.bucket + ":" + key,
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(this.mac);
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();

        // 文件上传

        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallBack(resolve, reject));

        })


    }

    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallBack(resolve, reject));

        })

    }
    renameFile(oldKey, newKey) {
        const options = {
          force: true
        }
        return new Promise((resolve, reject) => {
          this.bucketManager.move(this.bucket, oldKey, this.bucket, newKey, options, this._handleCallBack(resolve, reject))
        })
      }
    getFileList(prefix = ''){
        const options = {
            limit: 10,
            prefix,
          }
          return new Promise((resolve,reject)=>{
            this.bucketManager.listPrefix(this.bucket, options, this._handleCallBack(resolve, reject) )

          })
         
          
    }
    getBucketDomain() {
        const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
        const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, digest, this._handleCallBack(resolve, reject))
        })
    }

    getStat(key){
        return new Promise((resolve,reject)=>{
            this.bucketManager.stat(this.bucket,key,this._handleCallBack(resolve,reject))
        })
    }
    generateDownloadLink(key) {
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain()
        return domainPromise.then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const pattern = /^https?/
                this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data}`
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key)
            } else {
                throw Error('域名未找到，请查看储存空间是否过期')
            }
        })
    }

    downloadFile(key,downloadPath){
        return this.generateDownloadLink(key).then(link=>{
            const timeStamp=new Date().getTime()
            const url=`${link}?timeStamp=${timeStamp}`
            return axios({
                url,
                method:'GET',
                responseType:'stream',
                headers:{'Cache-Control':'no-cache'}
            })

        }).then(response=>{
            const writer=fs.createWriteStream(downloadPath)
            response.data.pipe(writer)
            return new Promise((resolve,reject)=>{
                writer.on('finish',resolve)
                writer.on('err',reject)
            })
        }).catch(err=>{
            return Promise.reject({err:err.response})
        })
    }

    _handleCallBack(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr;
            }

            if (respInfo.statusCode == 200) {
                resolve(respBody)
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })

            }

        }


    }



}

module.exports = QiniuManager