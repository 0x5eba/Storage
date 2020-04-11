const FileController = require('./file.controller')
const path = require("path")
const crypto = require('crypto')
const multer = require('multer')
const fs = require('fs')
const GridFsStorage = require('multer-gridfs-storage')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

exports.routesConfig = function (app) {
	app.post('/api/file/uploadFile', [
        upload.single('file'),
        FileController.uploadFile
    ]);

    app.get('/api/file/getFile', [
        FileController.getFile
    ]);
}

const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/' + config.name,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject({ err: "Error uploading file" })
                }
                var filename = buf.toString('hex') + Date.now() + path.extname(file.originalname);

                req.body = {
                    idFile: filename,
                    owner: req.body.owner,
                    name: file.originalname,
                    path: req.body.path,
                }

                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                    metadata: req.body
                }
                resolve(fileInfo)
            });
        });
    }
});
const upload = multer({ storage });