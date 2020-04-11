const VerifyUserMiddleware = require('./middlewares/verify.user.middleware')
const AuthorizationController = require('./controllers/authorization.controller')
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware')

exports.routesConfig = function (app) {
    app.post('/api/login', [
        VerifyUserMiddleware.hasAuthValidFields,
        VerifyUserMiddleware.isPasswordAndUserMatch,
        AuthorizationController.login
    ])

    app.post('/api/auth/refresh', [
        AuthValidationMiddleware.verifyRefresh
    ])
}