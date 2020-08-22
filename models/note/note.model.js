const mongodb = require('mongodb');
const fs = require("fs")
const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const NoteModel = new mongoose.Schema({
    idNote: { type: String, trim: true, default: "", require: true }, // notename
    owner: { type: String, trim: true, default: "", require: true }, // is a token
    parent: { type: String, trim: true, default: "", require: true }, // idFolder which is inside
	title: { type: String, trim: true, default: "" }, 
    text: { type: String, trim: true, default: "" }, 
    linkView: { type: String, trim: true, default: "" }, // _id + random_string
	visibleToEveryone: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now },
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

exports.getNotes = (owner, parent) => {
    return new Promise((resolve, reject) => {
        Note.find({ parent: parent, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, note) {
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

exports.deleteNotesByParent = (parents) => {
	return new Promise((resolve, reject) => {
		Note.deleteMany({ parent: { $in: parents } }, {}, function (err, note) {
			if (err) return reject(err)
			resolve({})
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

exports.changeFolder = (idNote, parent) => {
	return new Promise((resolve, reject) => {
		Note.findOneAndUpdate({ idNote: idNote }, { $set: { parent: parent } }, {new: true}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}