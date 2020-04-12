const FileController = require('./file.model')
const crypto = require("crypto")

exports.uploadFile = (req, res) => {

	req.body.linkView = crypto.createHash('sha256').update(req.body.idFile).digest('hex');

    FileController.uploadFile(req.body)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error upload photo" })
        })
}

exports.getFile = (req, res) => {
    FileController.getFile(req, res)
}

exports.getFiles = (req, res, next) => {
    FileController.getFiles(req.body.owner, req.body.path)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error upload photo" })
        })
}