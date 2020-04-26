const FileController = require('./note.controller')
const AuthController = require("../authorization/auth.js")
const FolderController = require('../folder/folder.controller')
const fs = require('fs')

exports.routesConfig = function (app) {
	app.post('/api/file/uploadFile', [
        AuthController.proofTokenForUpload,
        FolderController.checkIfFolderExistForFile,
        FileController.removeFileWihCheck,
        FileController.uploadFile
    ]);

    app.post('/api/file/getFiles', [
        AuthController.proofToken,
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
        FileController.getFile,
        FileController.checkPrivileges,
        FileController.getFileFormGridfs,
    ]);

    app.post('/api/file/getSharedFile', [
        AuthController.proofToken,
        FileController.getFileSharedLink,
    ]);
}