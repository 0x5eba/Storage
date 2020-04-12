const FileController = require('./file.model')
const crypto = require("crypto")

exports.uploadFile = (req, res) => {

	req.body.linkView = crypto.createHash('sha256').update(req.body.idFile).digest('hex');

    FileController.uploadFile(req.body)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error uploading file" })
        })
}

exports.getFile = (req, res) => {
    FileController.getFile(req, res)
}

exports.getFileById = (req, res, next) => {
    FileController.getFileById(req.params.id)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file by id" })
        })
}

exports.getFiles = (req, res, next) => {
    FileController.getFiles(req.body.owner, req.body.path)
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