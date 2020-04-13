const FolderController = require('./folder.model')
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

exports.createFolder = (req, res, next) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) return res.status(403).send({ err: "Error creating folder" })

        if(req.body.password.length !== 0){
            let salt = bcrypt.genSaltSync(10)
            let hash = bcrypt.hashSync(req.body.password, salt)
            req.body.password = hash
        }

        req.body.idFolder = buf.toString('hex') + Date.now() 
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

exports.getFolder = (req, res, next) => {
    FolderController.getFolder(req.body.idFolder)
        .then((result) => {
            if(result !== null){
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolderById = (req, res, next) => {
    FolderController.getFolderById(req.params.id)
        .then((result) => {
            if(result !== null){
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.checkPrivileges = (req, res, next) => {
    var folder = req.body.result

    if(folder.password.length !== 0){
        if(!req.body.password || req.body.password.length === 0){
            res.status(403).send({ err: "No password provided for this folder" })
        } else {
            if(bcrypt.compareSync(req.body.password, folder.password)){
                res.status(201).send(folder);
            } else {
                res.status(403).send({ err: "Error wrong password for this folder" })
            }
        }
    } else if(folder.visibleToEveryone === false && req.body.owner !== folder.owner){
        res.status(403).send({ err: "You are not autorized to access this folder" })
    } else {
        res.status(201).send(folder);
    }
}

exports.checkIfFolderExistForFile = (req, res, next) => {
    var idFolder = req.body.path.split("/")
    idFolder = idFolder[idFolder.length-1]

    if(req.body.path === "http://localhost:8000/"){
        return next()
    }

    FolderController.getFolder(idFolder)
        .then((result) => {
            if(result !== null){
                return next()
            } else {
                req.body.deleteFile = true
                return next()
            }
        })
        .catch(err => {
            req.body.deleteFile = true
            return next()
        })
}

exports.checkIfFolderExist = (req, res, next) => {
    var idFolder = req.body.path.split("/")
    idFolder = idFolder[idFolder.length-1]

    if(req.body.path === "http://localhost:8000/"){
        return next()
    }

    FolderController.getFolder(idFolder)
        .then((result) => {
            if(result !== null){
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
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