const FolderController = require('./folder.controller')
const AuthController = require("../common/middlewares/auth.validation.middleware")

exports.routesConfig = function (app) {
	app.post('/api/folder/createFolder', [
        AuthController.proofToken,
        FolderController.createFolder
    ]);

    app.get('/api/folder/getFolder', [
        AuthController.proofToken,
        FolderController.getFolder
    ]);

    app.get('/api/folder/getFolder/:id', [
        AuthController.proofToken,
        FolderController.getFolderById
    ]);

    app.post('/api/folder/getFolders', [
        AuthController.proofToken,
        FolderController.getFolders
    ]);
}