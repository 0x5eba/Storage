const utenteModel = require('../../utente/utente.model')
const bcrypt = require("bcrypt")

exports.hasAuthValidFields = (req, res, next) => {
    let errors = []

    if (req.body) {
        if (!req.body.email) {
            errors.push('Missing email field')
        }
        if (!req.body.password) {
            errors.push('Missing password field')
        }
        if (!req.body.type) {
            errors.push('Missing type field')
        }

        if (errors.length) {
            return res.status(400).send({err: errors.join(',')})
        } else {
            return next()
        }
    } else {
        return res.status(400).send({ err: 'Missing email and password fields'})
    }
}

exports.isPasswordAndUserMatch = (req, res, next) => {
    utenteModel.utenteInfoForAuthenitcate(req.body.email)
        .then((result) => {
            if(result !== null){
                if(bcrypt.compareSync(req.body.password, result.password)) {
                    req.body = {
                        id: String(result._id),
                        email: result.email,
                        type: req.body.type,
                    }
                    return next()
                } else {
                    res.status(404).send({ err: "Wrong credential" })
                }
            } else {
                res.status(403).send({ err: "User not found" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error login user" })
        })
}