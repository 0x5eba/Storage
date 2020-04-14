const jwt = require('jsonwebtoken')
const config = require('../config/env.config.js')
var randtoken = require('rand-token')
const crypto = require("crypto")

const jwtSecret = config.jwtSecret
const jwtSecret2 = config.jwtSecret2
const jwtExpireAccessToken = config.jwtExpireAccessToken
const jwtExpireRefreshToken = config.jwtExpireRefreshToken

exports.verifyRefresh = (req, res) => {
    return newAccessToken(req, res)
}

exports.validJWTNeeded = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ')
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send({ err: 'Invalid access token' })
            } else {
                jwt.verify(authorization[1], jwtSecret, function (err, decoded) {
                    if (err) {
                        newAccessToken(req, res)
                    } else {
                        req.jwt = decoded
                        var current_time = new Date().getTime() / 1000
                        if (current_time > decoded.exp) {
                            newAccessToken(req, res)
                        } else {
                            return next()
                        }
                    }
                })
            }
        } catch (err) {
            console.log(err)
            return res.status(403).send({err: "Invalid access token"})
        }
    } else {
        return newAccessToken(req, res)
    }
}

function newAccessToken(req, res) {
    var cookieRefreshToken = null
    let rc = req.headers.cookie
    rc && rc.split('').forEach(function (cookie) {
        let parts = cookie.split('=')
        if (parts[0].trim() === "refreshToken") {
            cookieRefreshToken = decodeURI(parts[1].trim())
        }
    })

    // if (cookieRefreshToken) {

    //     redis.getToken(cookieRefreshToken)
    //         .then((id) => {

    //             // qui devi controllare se refresh token e' valido, se lo e' crea un nuovo accesstoken e mettilo in req, poi fai next()
    //             try {
    //                 jwt.verify(cookieRefreshToken, jwtSecret2, function (err, decoded) {
    //                     if (err) return res.status(403).send({ err: 'Invalid refresh token' })
    //                     var current_time = new Date().getTime() / 1000
    //                     if (current_time > decoded.exp) {
    //                         /* expired login again */ 
    //                         return res.status(403).send({ err: 'Invalid refresh token' })
    //                     } else {
    //                         req.jwt = decoded
    //                         req.jwt = {
    //                             id: req.jwt.id,
    //                             email: req.jwt.email,
    //                             salt: randtoken.uid(128),
    //                             permissionLevel: req.jwt.permissionLevel,
    //                             type: req.jwt.type,
    //                         }

    //                         if(req.jwt.id !== id){
    //                             return res.status(403).send({ err: 'Invalid refresh token' })
    //                         }

    //                         redis.delToken(cookieRefreshToken)
    //                             .then((ok) => {
    //                             })
    //                             .catch((err) => {
    //                                 console.log(err)
    //                             })

    //                         let accessToken = jwt.sign(req.jwt, jwtSecret, { expiresIn: jwtExpireAccessToken })
        
    //                         let refreshToken = jwt.sign(req.jwt, jwtSecret2, { expiresIn: jwtExpireRefreshToken })

    //                         redis.setToken(refreshToken, req.jwt.id)

    //                         return res.status(201).cookie('refreshToken', refreshToken, {
    //                             httpOnly: true,
    //                             SameSite: "None",
    //                         }).send({ id: req.jwt.id, accessToken: accessToken })
    //                     }
    //                 })
    //             } catch (err) {
    //                 console.log("newAccessToken", err)
    //                 return res.status(403).send({ err: 'Invalid refresh token' })
    //             }
    //         })
    //         .catch((err) => {
    //             console.log(err)
    //             return res.status(403).send({ err: 'Refresh token not found' })
    //         })
    // } else {
    //     // non c'e' il refresh token, quindi deve ri loggare
    //     return res.status(403).send({ err: 'Refresh token not found' })
    // }
}

var ipCreateAccount = {}
exports.limitRequest = (req, res, next) => {
    let remoteip = req.connection.remoteAddress
    let currDate = new Date()
    if(ipCreateAccount[remoteip] !== undefined){
        if(currDate - ipCreateAccount[remoteip] > 21600*1000) { // 6 ore
            ipCreateAccount[remoteip] = currDate
            return next()
        } else {
            return res.status(500).send({ err: 'Wait to creating another account' })
        }
    } else {
        ipCreateAccount[remoteip] = currDate
        return next()
    }
}

exports.proofToken = (req, res, next) => {
    if(!req.body.token || !req.body.owner){
        return res.status(500).send({ err: 'No proof given' })
    }

    if(crypto.createHash('sha256').update(req.body.token).digest('hex') === req.body.owner){
        return next()
    } else {
        return res.status(500).send({ err: 'Wrong proof' })
    }
}

exports.proofTokenForUpload = (req, res, next) => {
    if(!req.body.token || !req.body.owner){
        req.body.deleteFile = true
        return next()
    }

    if(crypto.createHash('sha256').update(req.body.token).digest('hex') === req.body.owner){
        return next()
    } else {
        req.body.deleteFile = true
        return next()
    }
}