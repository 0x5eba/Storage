const FileController = require('./file.controller')
const path = require("path")
const crypto = require('crypto')
const multer = require('multer')
const fs = require('fs')
const GridFsStorage = require('multer-gridfs-storage')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const AuthController = require("../common/middlewares/auth.validation.middleware")


exports.routesConfig = function (app) {
	app.post('/api/file/uploadFile', [
        upload.single('file'),
        AuthController.proofTokenForUpload,
        FileController.removeFileWihCheck,
        FileController.uploadFile
    ]);

    app.get('/api/file/getFile', [
        AuthController.proofToken,
        FileController.getFile
    ]);

    app.post('/api/file/getFiles', [
        AuthController.proofToken,
        FileController.getFiles
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

                req.body.idFile = filename
                req.body.name = file.originalname

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