const adminPermission = require('../config/env.config')['permissionLevels']['ADMIN']

exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return (req, res, next) => {
        if (req.jwt === undefined || req.jwt.permissionLevel === undefined){
            return res.status(403).send({ err: "Wrong permissions" })
        }
        
        let user_permission_level = parseInt(req.jwt.permissionLevel)
        if (user_permission_level === adminPermission || user_permission_level === required_permission_level) {
            return next()
        } else {
            return res.status(403).send({ err: "Wrong permissions" })
        }
    }
}

exports.onlySameUserOrAdminCanDoThisAction = (req, res, next) => {
    if (req.jwt === undefined || req.jwt.permissionLevel === undefined) {
        return res.status(403).send({ err: "Wrong permissions" })
    }

    let user_permission_level = parseInt(req.jwt.permissionLevel)
    let id = req.jwt.id

    if (req.params && req.params.id && id === req.params.id) {
        return next()
    } else {
        if (user_permission_level === adminPermission) {
            return next()
        } else {
            return res.status(403).send({ err: "You are not authorized" })
        }
    }
}