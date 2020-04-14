const FolderController = require('./folder.controller')
const AuthController = require("../common/middlewares/auth.validation.middleware")
const FileController = require('../file/file.controller')


exports.routesConfig = function (app) {
	app.post('/api/folder/createFolder', [
        AuthController.proofToken,
        FolderController.checkIfFolderExist,
        FolderController.createFolder
    ]);

    app.post('/api/folder/getFolder', [
        AuthController.proofToken,
        FolderController.getFolder,
        FolderController.checkPrivileges,
    ]);

    app.get('/api/folder/getFolder/:id', [
        AuthController.proofToken,
        FolderController.getFolderById,
        FolderController.checkPrivileges,
    ]);

    app.post('/api/folder/getFolders', [
        AuthController.proofToken,
        FolderController.getFolders
    ]);

    app.delete('/api/folder/deleteFolder', [
        AuthController.proofToken,
        FolderController.isOwner,
        FolderController.deleteFolder
    ]);


    
    app.post('/api/search', [
        AuthController.proofToken,
        FileController.searchFile,
        FolderController.searchFolder,
    ]);
}