const FileController = require('./file.controller')
const AuthController = require("../authorization/auth.js")
const FolderController = require('../folder/folder.controller')
const path = require("path")
const crypto = require('crypto')
const multer = require('multer')
const fs = require('fs')
const GridFsStorage = require('multer-gridfs-storage')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

exports.routesConfig = function (app) {
	app.post('/api/file/uploadFile', [
        upload.single('file'),
        AuthController.proofTokenForUpload,
        FolderController.checkIfFolderExistForFile,
        FileController.removeFileWihCheck,
        FileController.uploadFile
    ]);

    app.post('/api/file/getFiles', [
        AuthController.proofToken,
        FolderController.checkIfPasswordRequired,
        FileController.getFiles
    ]);

    app.delete('/api/file/deleteFile', [
        AuthController.proofToken,
        FileController.isOwner,
        FileController.deleteFile,
        FileController.deleteFileGrid,
    ]);

    app.post('/api/file/getFile', [
        AuthController.proofToken,
        FolderController.checkIfPasswordRequired,
        FileController.getFile,
        FileController.checkPrivileges,
        FileController.getFileFormGridfs,
    ]);

    app.post('/api/file/getSharedFile', [
        AuthController.proofToken,
        FileController.getFileSharedLink,
    ]);

    app.post('/api/file/getSharedFileDownload', [
        AuthController.proofToken,
        FileController.getSharedFileDownload,
        FileController.getFileFormGridfs,
    ]);

    app.patch('/api/file/changeFolder', [
        AuthController.proofToken,
        FileController.isOwner,
        FolderController.checkIfFolderExist,
        FileController.changeFolder,
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
                req.body.type = file.mimetype

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