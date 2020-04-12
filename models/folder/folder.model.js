const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const FolderModel = new mongoose.Schema({
    idFolder: { type: String, trim: true, default: "", require: true },
    owner: { type: String, trim: true, default: "", require: true }, // e' un token
    name: { type: String, trim: true, default: "", require: true }, // nome folder con estenzione
    path: { type: String, trim: true, default: "", require: true },
    password: { type: String, trim: true, default: "" }, // se password !== '' allora devi passargli password per vederlo o essere l'owner
    linkView: { type: String, trim: true, default: "" }, // _id + random_string
    visibleToEveryone: { type: Boolean, default: false },
})

const Folder = mongoose.model('Folder', FolderModel, 'Folder')

exports.saveFolder = (folderData) => {
	return new Promise((resolve, reject) => {
		const folder = new Folder(folderData)
		folder.save(function (err, newfolder) {
			if (err) return reject(err)
			resolve(newfolder)
		})
	})
}

exports.getFolderById = (id) => {
	return new Promise((resolve, reject) => {
		Folder.findById(id, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.getFolder = (idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.findOne({idFolder: idFolder}, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.getFolders = (owner, path) => {
	return new Promise((resolve, reject) => {
		Folder.find({ path: path, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}