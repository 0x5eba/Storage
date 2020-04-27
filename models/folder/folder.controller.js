const FolderController = require('./folder.model')
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const escapeRegExp = require('lodash.escaperegexp')
// const // print = require("../logs/logs.js")

exports.createFolder = (req, res, next) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) return res.status(403).send({ err: "Error creating folder" })

        if(req.body.password.length !== 0){
            let salt = bcrypt.genSaltSync(10)
            let hash = bcrypt.hashSync(req.body.password, salt)
            req.body.password = hash
        } else {
            req.body.password = ""
        }

        var idFolder = buf.toString('hex') + Date.now()

        req.body = {
            idFolder: idFolder,
            owner: req.body.owner,
            name: req.body.name,
            parent: req.body.parent,
            password: req.body.password,
            linkView: crypto.createHash('sha256').update(idFolder).digest('hex'),
            visibleToEveryone: req.body.visibleToEveryone,
        }

        FolderController.saveFolder(req.body)
            .then((result) => {
                return next()
            })
            .catch(err => {
                // print(err)
                res.status(403).send({ err: "Error creating folder" })
            })
    })
}

exports.addFolderToParent = (req, res, next) => {
    FolderController.addFolderToParent(req.body.parent, req.body.idFolder)
        .then((result) => {
            res.status(200).send({})
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error adding id to parent folder" })
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
            // print(err)
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.checkPrivileges = (req, res, next) => {
    var folder = req.body.result

    if(folder.password.length !== 0){
        if(!req.body.password || req.body.password.length === 0){
            // print("No password provided for this folder")
            res.status(403).send({ err: "No password provided for this folder" })
        } else {
            if(bcrypt.compareSync(req.body.password, folder.password)){
                return next()
            } else {
                // print("Error wrong password for this folder")
                res.status(403).send({ err: "Error wrong password for this folder" })
            }
        }
    } else {
        return next()
    }
}

exports.checkIfFolderExistForNote = (req, res, next) => {
    if(req.body.parent === "/"){
        req.body.deleteFile = true
        return next()
    }

    FolderController.getFolder(req.body.parent)
        .then((result) => {
            if(result !== null){
                req.body.parent = result.idFolder
                return next()
            } else {
                // print("Error this folder doesn't exist")
                req.body.deleteFile = true
                return next()
            }
        })
        .catch(err => {
            // print(err)
            req.body.deleteFile = true
            return next()
        })
}

exports.checkIfFolderExistForFile = (req, res, next) => {
    if(req.body.parent === "/"){
        return res.status(403).send({ err: "You can not create not here" })
    }

    FolderController.getFolder(req.body.parent)
        .then((result) => {
            if(result !== null){
                req.body.parent = result.idFolder
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error check for folder" })
        })
}

exports.checkIfFolderExist = (req, res, next) => {
    if(req.body.parent === "/"){
        return next()
    }

    FolderController.getFolder(req.body.parent)
        .then((result) => {
            if(result !== null){
                req.body.parent = result.idFolder
                return next()
            } else {
                // print("Error this folder doesn't exist")
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolders = (req, res, next) => {
    FolderController.getFolders(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.deleteFolders = async (req, res, next) => {
    var folders = [req.body.idFolder]
	while(folders.length !== 0){
		await FolderController.deleteFolders(folders)
            .then((result) => {
                folders = result
                if(folders.length === 0){
                    return res.status(201).send({});
                }
            })
            .catch(err => {
                // print(err)
                return res.status(403).send({ err: "Error deleting folder" })
            })
    }
}

exports.isOwner = (req, res, next) => {
    FolderController.isOwner(req.body.owner, req.body.idFolder)
        .then((result) => {
            if(result === null){
                // print("No folder found")
                res.status(403).send({ err: "No folder found" })
            } else if(result.owner !== req.body.owner){
                // print("You are not authorized to access this folder")
                res.status(403).send({ err: "You are not authorized to access this folder" })
            } else {
                return next()
            }
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error deleting folder" })
        })
}

exports.checkIfPasswordRequired = (req, res, next) => {
    if(req.body.parent === "/"){
        return next()
    }

    FolderController.getFolder(req.body.parent) // e' contorto che ci sia parent, ma e' giusto
        .then((result) => {
            if(result === null){
                // print("No folder found")
                res.status(403).send({ err: "No folder found" })
            } else if(result.password.length !== 0){

                var passwords = req.body.passwords
                console.log(passwords)
                for(let a = 0; a < passwords.length; ++a){
                    if(bcrypt.compareSync(passwords[a], result.password)){
                        return next()
                    }
                }
                
                res.status(200).send({ passwordRequired: true })
            } else {
                return next()
            }
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error deleting folder" })
        })
}

exports.checkIfPasswordChanged = (req, res, next) => {
    FolderController.getFolder(req.body.idFolder)
        .then((result) => {
            if(req.body.password === result.password){ // 2 hash uguali
                return next()
            } else {
                crypto.randomBytes(16, (err, buf) => {
                    if (err) return res.status(403).send({ err: "Error changing password folder" })

                    let salt = bcrypt.genSaltSync(10)
                    let hash = bcrypt.hashSync(req.body.password, salt)
                    req.body.password = hash

                    return next()
                })
            }
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error changing password folder" })
        })
}

exports.modify = (req, res, next) => {
    FolderController.modify(req.body.owner, req.body.idFolder, req.body.password, req.body.name, req.body.visibleToEveryone)
        .then((result) => {
            res.status(201).send({});
        })
        .catch(err => {
            // print(err)
            res.status(403).send({ err: "Error modifying folder" })
        })
}