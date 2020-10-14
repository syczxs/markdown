const qiniu = require('qiniu')

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
        formUploader.putFile(uploadToken, key, localFilePath, putExtra, function (respErr,
            respBody, respInfo) {
            if (respErr) {
                throw respErr;
            }

            if (respInfo.statusCode == 200) {
                console.log(respBody);
            } else {
                console.log(respInfo.statusCode);
                console.log(respBody);
            }
        });

    }

    deletFile(key) {
        this.bucketManager.delete(this.bucket, key, function (err, respBody, respInfo) {
            if (err) {
                console.log(err);
                //throw err;
            } else {
                console.log(respInfo.statusCode);
                console.log(respBody);
            }
        });
    }



}

module.exports = QiniuManager