const config = require('../../common/config/env.config.js')
const jwt = require('jsonwebtoken')
var randtoken = require('rand-token')

const jwtSecret = config.jwtSecret
const jwtSecret2 = config.jwtSecret2
const jwtExpireAccessToken = config.jwtExpireAccessToken
const jwtExpireRefreshToken = config.jwtExpireRefreshToken
const ADMIN = config.permissionLevels.ADMIN
const UTENTE = config.permissionLevels.UTENTE

exports.login = (req, res) => {
    try {
        req.body.salt = randtoken.uid(128)
        req.body.permissionLevel = UTENTE
        if(req.body.email === "ciao"){
            req.body.permissionLevel = ADMIN
        }
        req.body = {
            id: req.body.id,
            email: req.body.email,
            salt: req.body.salt,
            permissionLevel: req.body.permissionLevel,
            type: req.body.type,
        }
        let accessToken = jwt.sign(req.body, jwtSecret, { expiresIn: jwtExpireAccessToken })
        
        let refreshToken = jwt.sign(req.body, jwtSecret2, { expiresIn: jwtExpireRefreshToken })

        // redis.setToken(refreshToken, req.body.id)

        res.status(201).cookie('refreshToken', refreshToken, {
            httpOnly: true,
            SameSite: "None",
        }).send({ id: req.body.id, accessToken: accessToken })

    } catch (err) {
        res.status(500).send({err: "Login falied"})
    }
}