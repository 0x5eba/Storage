const UtenteController = require('./utente.controller')
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware')
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware')
const AuthControllerMiddleware = require("../authorization/controllers/authorization.controller")
const UTENTE = require("../common/config/env.config")['permissionLevels']['UTENTE']

const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const fs = require('fs')
const GridFsStorage = require('multer-gridfs-storage')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/' + config.name,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (err, buf) => {
                if (err) {
                    return reject({ err: "Error upload photo" })
                }
                const filename = buf.toString('hex') + path.extname(file.originalname)
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                }
                resolve(fileInfo)
            });
        });
    }
});
const upload = multer({ storage });

exports.routesConfig = function (app) {
	app.post('/api/utente/register', [
		ValidationMiddleware.limitRequest,
		UtenteController.uniqueEmail,
        UtenteController.insert,
		AuthControllerMiddleware.login
	])

	app.post('/api/utente/getdata/:id', [
		ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(UTENTE),
		PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
		UtenteController.getData
	])

	app.patch('/api/utente/changedata/:id', [
		ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(UTENTE),
		PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
		UtenteController.changeData
	])


	app.post('/api/profile/uploadPic/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        upload.single('file'),
        ProfileController.uploadPic
    ]);
    app.get('/api/profile/getPic/:filename', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.getPic
    ]); 
    app.get('/api/profile/getPicById/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.getFilenamePic,
        ProfileController.getPic
    ]);
}
