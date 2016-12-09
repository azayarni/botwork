const
    AWS = require('aws-sdk')
uuid = require('uuid')
request = require("request");

module.exports = (config) => {

    if (!config.key || !config.secret) {
        throw new Error("Missing AWS credentials");
    }

    return {

        S3 : {

            uuid() {
                return uuid()
            },

            upload(src_url, path, opts = {}) {

                opts.ACL = opts.ACL || "public-read";

                options = {
                    uri: src_url,
                    encoding: null
                }

                return new Promise((resolve, reject) => {
                    request(options, (err, res, data) => {

                        if (err) reject(err);

                        let s3 = new AWS.S3({ accessKeyId: config.key, secretAccessKey: config.secret, region: config.s3.region });

                        opts.Bucket = config.s3.bucket;
                        opts.Key = path;
                        opts.Body = data;


                        s3.putObject(opts, (err, data) => {
                            if (err) return reject(err);

                            resolve(data);
                        });

                    })
                });

            },

            uploadB64(body, path, opts = {}) {

                let buf = Buffer.from(body, 'base64');

                opts.ACL = opts.ACL || "public-read";

                options = {
                    encoding: null
                }

                return new Promise((resolve, reject) => {

                    let s3 = new AWS.S3({ accessKeyId: config.key, secretAccessKey: config.secret, region: config.s3.region });

                    opts.Bucket = config.s3.bucket;
                    opts.Key = path;
                    opts.Body = buf;

                    s3.putObject(opts, (err, data) => {
                        if (err) return reject(err);

                        resolve(data);
                    });

                });

            },

        }
    }

};
