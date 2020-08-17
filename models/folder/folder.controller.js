const FolderController = require('./folder.model')
const FileController = require('../file/file.model')
const NoteController = require('../note/note.model')
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

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
                res.status(200).send(result)
            })
            .catch(err => {
                res.status(403).send({ err: "Error creating folder" })
            })
    })
}

exports.createFolderRoom = (req, res, next) => {
    req.body = {
        idFolder: req.body.idFolder,
        owner: req.body.idFolder + Date.now(),
        name: req.body.name,
        parent: req.body.parent,
        linkView: req.body.idFolder,
        visibleToEveryone: false
    }

    FolderController.saveFolder(req.body)
        .then((result) => {
            res.status(200).send(result)
        })
        .catch(err => {
            res.status(403).send({ err: "Error creating folder room" })
        })
}

exports.addFolderToParent = (req, res, next) => {
    FolderController.addFolderToParent(req.body.parent, req.body.idFolder)
        .then((result) => {
            res.status(200).send({})
        })
        .catch(err => {
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
                return next()
            } else {
                res.status(403).send({ err: "Error wrong password for this folder" })
            }
        }
    } else {
        return next()
    }
}

exports.checkIfFolderExistForFile = (req, res, next) => {
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
    if(req.body.parent === "/"){
        return next()
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
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolders = (req, res, next) => {
    FolderController.getFolders(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.deleteFolders = async (req, res, next) => {
    var folders = [req.body.idFolder]
    var allFolders = new Set()
    allFolders.add(req.body.idFolder)

	while(folders.length !== 0){
		await FolderController.deleteFolders(folders)
            .then((result) => {
                folders = result

                for(let a = 0; a < result.length; ++a){
                    allFolders.add(result[a])
                }

                if(folders.length === 0){

                    allFolders = [...allFolders]

                    FileController.deleteFilesByParents(allFolders)
                        .then(() => {})
                        .catch(() => {})

                    NoteController.deleteNotesByParent(allFolders)
                        .then(() => {})
                        .catch(() => {})

                    return res.status(201).send({});
                }
            })
            .catch(err => {
                return res.status(403).send({ err: "Error deleting folder" })
            })
    }
}

exports.isOwner = (req, res, next) => {
    FolderController.isOwner(req.body.owner, req.body.idFolder)
        .then((result) => {
            if(result === null){
                res.status(403).send({ err: "No folder found" })
            } else if(result.owner !== req.body.owner){
                res.status(403).send({ err: "You are not authorized to access this folder" })
            } else {
                return next()
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error isOwner folder" })
        })
}

exports.checkIfPasswordRequired = (req, res, next) => {
    if(req.body.parent === "/"){
        return next()
    }

    FolderController.getFolder(req.body.parent) // e' contorto che ci sia parent, ma e' giusto
        .then((result) => {
            if(result === null){
                res.status(403).send({ err: "No folder found" })
            } else if(result.password.length !== 0){

                var passwords = req.body.passwords
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
            res.status(403).send({ err: "Error check if password required folder" })
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
            res.status(403).send({ err: "Error changing password folder" })
        })
}

exports.modify = (req, res, next) => {
    FolderController.modify(req.body.owner, req.body.idFolder, req.body.password, req.body.name, req.body.visibleToEveryone)
        .then((result) => {
            res.status(201).send({});
        })
        .catch(err => {
            res.status(403).send({ err: "Error modifying folder" })
        })
}

exports.checkIfFolderExistRoom = (req, res, next) => {
    if(req.body.parent === "/"){
        FolderController.getFolder(req.body.idFolder)
            .then((result) => {
                if(result !== null){
                    res.status(403).send({ err: "Folder already created" })
                } else {
                    return next()
                }
            })
            .catch(err => {
                res.status(403).send({ err: "Error changing password folder" })
            })
    } else {
        res.status(403).send({ err: "Error not the right folder" })
    }
}