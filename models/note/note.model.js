const mongodb = require('mongodb');
const fs = require("fs")
const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const NoteModel = new mongoose.Schema({
    idNote: { type: String, trim: true, default: "", require: true }, // notename
    owner: { type: String, trim: true, default: "", require: true }, // e' un token
    parent: { type: String, trim: true, default: "", require: true }, // idFolder in cui e' dentro
	title: { type: String, trim: true, default: "" }, 
    text: { type: String, trim: true, default: "" }, 
    password: { type: String, trim: true, default: "" }, // se password !== '' allora devi passargli password per vederlo o essere l'owner
    linkView: { type: String, trim: true, default: "" }, // _id + random_string
    visibleToEveryone: { type: Boolean, default: true },
})

const Note = mongoose.model('Note', NoteModel, 'Note')

exports.createNote = (noteData) => {
	return new Promise((resolve, reject) => {
		const note = new Note(noteData)
		note.save(function (err, newnote) {
			if (err) return reject(err)
			resolve(newnote) // mi servirebbe solo idNote ma ok
		})
	})
}

exports.getNoteById = (id) => {
	return new Promise((resolve, reject) => {
		Note.findById(id, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.getNote = (idNote) => {
	return new Promise((resolve, reject) => {
		Note.findOne({idNote: idNote}, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.changeNote = (id, data) => {
	return new Promise((resolve, reject) => {
		Note.findByIdAndUpdate(id, data, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.removeNote = (idNote) => {
    return new Promise((resolve, reject) => {
        gfs.remove({ idNote: idNote, root: 'uploads' }, (err, gridStore) => {
            if (err) return reject(err)
            Note.findOneAndRemove({ idNote: idNote }, function (err, note) {
                if (err) return reject(err)
                resolve(note)
            })
        });
    })
}

exports.getNoteFormGridfs = (req, res) => { 
    gfs.notes.findOne({ notename: req.body.idNote }, (err, note) => { // "metadata.name": req.body.name
        if (!note || note.length === 0) {
            return res.status(404).send({ err: "Note doesn't exist" });
        }

        const readstream = gfs.createReadStream(note.notename)
        res.header({ 'Content-type': note.contentType })
        readstream.on('error', (err) => {
            res.status(404).send({ err: "Error getting the note" })
        })
        readstream.pipe(res)
        readstream.on('end', function () {
            res.status(201).end()
        })
    });
}

exports.deleteNoteGrid = (req, res) => { 
    gfs.notes.remove({ notename: req.body.idNote }, (err, note) => {
        if (!note || note.length === 0) {
            return res.status(404).send({ err: "Note doesn't exist" })
        }
        res.status(201).send({})
    });
}

exports.getNotes = (owner, parent) => {
    return new Promise((resolve, reject) => {
        Note.find({ parent: parent, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
    })
}

exports.searchNotes = (owner, search) => {
	return new Promise((resolve, reject) => {
		Note.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") }, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {})
			.limit(50).exec(function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.deleteNote = (owner, idNote) => {
	return new Promise((resolve, reject) => {
		Note.findOneAndDelete({ owner: owner, idNote: idNote }, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.isOwner = (owner, idNote) => {
	return new Promise((resolve, reject) => {
		Note.findOne({ owner: owner, idNote: idNote }, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.getSharedNote = (link) => {
	return new Promise((resolve, reject) => {
		Note.findOne({ linkView: link }, {}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}

exports.saveNote = (owner, idNote, title, text) => {
	return new Promise((resolve, reject) => {
		Note.findOneAndUpdate({ owner: owner, idNote: idNote }, 
			{ $set: { title: title, text: text } }, 
			{new: true}, function (err, note) {
			if (err) return reject(err)
			resolve(note)
		})
	})
}