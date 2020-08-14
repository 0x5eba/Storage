const NoteController = require('./note.model')
const crypto = require("crypto")
const escapeRegExp = require('lodash.escaperegexp')

exports.createNote = (req, res) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) return res.status(403).send({ err: "Error creating note" })

        var idNote = buf.toString('hex') + Date.now()

        req.body = {
            idNote: idNote,
            title: req.body.name,
            text: req.body.text,
            owner: req.body.owner,
            parent: req.body.parent,
            linkView: crypto.createHash('sha256').update(idNote).digest('hex'),
        }

        NoteController.createNote(req.body)
            .then((result) => {
                res.status(201).send(result)
            })
            .catch(err => {
                res.status(403).send({ err: "Error creating note" })
            })
    })
}

exports.getNote = (req, res, next) => {
    NoteController.getNote(req.body.idNote)
        .then((result) => {
            if(result !== null){
                req.body.result = result
                return next()
            } else {
                res.status(403).send({ err: "Error this note doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting note" })
        })
}

exports.getNoteById = (req, res, next) => {
    NoteController.getNoteById(req.params.id)
        .then((result) => {
            if(result !== null){
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this note doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting note by id" })
        })
}

exports.checkPrivileges = (req, res, next) => {
    var note = req.body.result

    if(note.visibleToEveryone === false && req.body.owner !== note.owner){
        res.status(403).send({ err: "You are not autorized to access this note" })
    } else {
        return next()
    }
}

exports.getNotes = (req, res, next) => {
    NoteController.getNotes(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting notes" })
        })
}

exports.removeNote = (req, res, next) => {
    NoteController.removeNote(req.body.idNote)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing note" })
        })
}

exports.removeNoteWihCheck = (req, res, next) => {
    if(req.body.deleteNote !== undefined){
        NoteController.removeNote(req.body.idNote)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing note" })
        })
    } else {
        return next()
    }
}

exports.searchNote = (req, res, next) => {
    var search = escapeRegExp(req.body.search)
    NoteController.searchNotes(req.body.owner, search)
        .then((result) => {
            req.body.notes = result
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error searching notes" })
        })
}

exports.deleteNote = (req, res, next) => {
    NoteController.deleteNote(req.body.owner, req.body.idNote)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting note" })
        })
}

exports.isOwner = (req, res, next) => {
    NoteController.isOwner(req.body.owner, req.body.idNote)
        .then((result) => {
            if(result === null){
                res.status(403).send({ err: "No note found or you are not authorized to access this note" })
            } else if(result.owner !== req.body.owner){
                res.status(403).send({ err: "You are not authorized to access this note" })
            } else {
                return next()
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting note" })
        })
}

exports.getNoteSharedLink = (req, res, next) => {
    NoteController.getSharedNote(req.body.link)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting note" })
        })
}

exports.saveNote = (req, res, next) => {
    NoteController.saveNote(req.body.owner, req.body.idNote, req.body.title, req.body.text)
        .then((result) => {
            res.status(201).send({});
        })
        .catch(err => {
            res.status(403).send({ err: "Error modifying note" })
        })
}

exports.changeFolder = (req, res, next) => {
    NoteController.changeFolder(req.body.idNote, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error changing parent note" })
        })
}