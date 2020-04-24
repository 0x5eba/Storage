const crypto = require("crypto")

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