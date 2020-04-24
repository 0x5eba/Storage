const FolderController = require('./folder.controller')
const AuthController = require("../authorization/auth.js")
const FileController = require('../file/file.controller')

exports.routesConfig = function (app) {
	app.post('/api/folder/createFolder', [
        AuthController.proofToken,
        FolderController.checkIfFolderExist,
        FolderController.createFolder,
        FolderController.addFolderToParent,
    ]);

    app.post('/api/folder/getFolders', [
        AuthController.proofToken,
        FolderController.checkIfPasswordRequired,
        FolderController.getFolders
    ]);

    app.delete('/api/folder/deleteFolders', [
        AuthController.proofToken,
        FolderController.isOwner,
        FolderController.deleteFolders
    ]);

    app.post('/api/folder/getFolderWithPassword', [
        AuthController.proofToken,
        FolderController.getFolder,
        FolderController.checkPrivileges,
        FolderController.getFolders
    ]);

    app.patch('/api/folder/modifyFolder', [
        AuthController.proofToken,
        FolderController.isOwner,
        FolderController.checkIfPasswordChanged,
        FolderController.modify,
    ]);
}