const FileController = require('./file.model')
const crypto = require("crypto")

exports.uploadFile = (req, res) => {

	req.body.linkView = crypto.createHash('sha256').update(req.body.idFile).digest('hex');

    req.body = {
        linkView: req.body.linkView,
        idFile: req.body.idFile,
        name: req.body.name,
        owner: req.body.owner,
        parent: req.body.parent,
        type: req.body.type,
        sizeFile: Math.ceil(parseInt(req.body.sizeFile, 10)/1000),
    }

    FileController.uploadFile(req.body)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error uploading file" })
        })
}

exports.getFileFormGridfs = (req, res) => {
    FileController.getFileFormGridfs(req, res)
}

exports.getFile = (req, res, next) => {
    FileController.getFile(req.body.idFile)
        .then((result) => {
            if(result !== null){
                req.body.result = result
                return next()
            } else {
                res.status(403).send({ err: "Error this file doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file" })
        })
}

exports.getFileById = (req, res, next) => {
    FileController.getFileById(req.params.id)
        .then((result) => {
            if(result !== null){
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this file doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file by id" })
        })
}

exports.checkPrivileges = (req, res, next) => {
    var file = req.body.result

    if(file.visibleToEveryone === false && req.body.owner !== file.owner){
        res.status(403).send({ err: "You are not autorized to access this file" })
    } else {
        return next()
    }
}

exports.getFiles = (req, res, next) => {
    FileController.getFiles(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting files" })
        })
}

exports.removeFile = (req, res, next) => {
    FileController.removeFile(req.body.idFile)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing file" })
        })
}

exports.removeFileWihCheck = (req, res, next) => {
    if(req.body.deleteFile !== undefined){
        FileController.removeFile(req.body.idFile)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing file" })
        })
    } else {
        return next()
    }
}

exports.deleteFile = (req, res, next) => {
    FileController.deleteFile(req.body.owner, req.body.idFile)
        .then((result) => {
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file" })
        })
}

exports.deleteFileGrid = (req, res) => {
    FileController.deleteFileGrid(req.body.idFile)
        .then((result) => {
            res.status(201).send({})
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file from grid" })
        })
}

exports.isOwner = (req, res, next) => {
    FileController.isOwner(req.body.owner, req.body.idFile)
        .then((result) => {
            if(result === null){
                res.status(403).send({ err: "No file found or you are not authorized to access this file" })
            } else if(result.owner !== req.body.owner){
                res.status(403).send({ err: "You are not authorized to access this file" })
            } else {
                return next()
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file" })
        })
}

exports.getFileSharedLink = (req, res, next) => {
    FileController.getSharedFile(req.body.link)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting shared file" })
        })
}

exports.getSharedFileDownload = (req, res, next) => {
    FileController.getSharedFile(req.body.link)
        .then((result) => {
            if(result !== null){
                req.body.idFile = result.idFile
                return next()
            } else {
                res.status(403).send({ err: "Error getting shared file" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file" })
        })
}

exports.changeFolder = (req, res, next) => {
    FileController.changeFolder(req.body.idFile, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error changing parent file" })
        })
}