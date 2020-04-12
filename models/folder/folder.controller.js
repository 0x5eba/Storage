const FolderController = require('./folder.model')
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

exports.createFolder = (req, res) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) return res.status(403).send({ err: "Error creating folder" })

        if(req.body.password.length !== 0){
            let salt = bcrypt.genSaltSync(10)
            let hash = bcrypt.hashSync(req.body.password, salt)
            req.body.password = hash
        }

        req.body.idFolder = buf.toString('hex') + (req.body.name).toString('hex') + Date.now() 
        req.body.linkView = crypto.createHash('sha256').update(req.body.idFolder).digest('hex')

        FolderController.saveFolder(req.body)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error creating folder" })
        })
    })
}

exports.getFolder = (req, res) => {
    FolderController.getFolder(req.body.idFolder)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolderById = (req, res) => {
    FolderController.getFolderById(req.params.id)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolders = (req, res) => {
    FolderController.getFolders(req.body.owner, req.body.path)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}