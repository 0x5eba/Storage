const FolderController = require('./folder.controller')
const AuthController = require("../common/middlewares/auth.validation.middleware")

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
}