const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const FolderModel = new mongoose.Schema({
    idFolder: { type: String, trim: true, default: "", require: true },
    owner: { type: String, trim: true, default: "", require: true }, // e' un token
	parent: { type: String, trim: true, default: "", require: true }, // idFolder del parent
	childs: [{ type: String, trim: true, default: "" }], // idFolders dei figli

    name: { type: String, trim: true, default: "", require: true }, // nome folder
    password: { type: String, trim: true, default: "" }, // se password !== '' allora devi passargli password per vederlo o essere l'owner
	linkView: { type: String, trim: true, default: "" }, // sha id
	visibleToEveryone: { type: Boolean, default: false },
})

const Folder = mongoose.model('Folder', FolderModel, 'Folder')


// creazione di folder
// handle di / (root)
// rimozione di folder
// visibilita' del folder
// link del folder
// password del folder


exports.addFolderToParent = (parent, idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.findOneAndUpdate({ idFolder: parent }, { $push: { childs: idFolder } }, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.saveFolder = (folderData) => {
	return new Promise((resolve, reject) => {
		const folder = new Folder(folderData)
		folder.save(function (err, newfolder) {
			if (err) return reject(err)
			resolve(newfolder)
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

exports.getFolders = (owner, parent) => {
	return new Promise((resolve, reject) => {
		if(parent === "/"){
			Folder.find({ parent: parent, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, folder) {
				if (err) return reject(err)
				resolve(folder)
			})
		} else {
			Folder.find({ parent: parent }, {}, function (err, folder) {
				if (err) return reject(err)
				resolve(folder)
			})
		}
	})
}

exports.getFoldersById = (idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.find({ parent: idFolder }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

// exports.searchFolders = (owner, search) => {
// 	return new Promise((resolve, reject) => {
// 		Folder.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") }, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {})
// 			.limit(50).exec(function (err, folder) {
// 			if (err) return reject(err)
// 			resolve(folder)
// 		})
// 	})
// }

exports.deleteFolders = async (folders) => {
	return new Promise((resolve, reject) => {
		Folder.find({ parent: { $in: folders } }, {}, function (err, folder) {
			
			var newFolders = []
			for(let a = 0; a < folder.length; ++a){
				newFolders.push(folder[a]['idFolder'])
			}

			Folder.deleteMany({ idFolder: { $in: folders } }, {}, function (err, folder) {
				if (err) return reject(err)
				resolve(newFolders)
			})
		})
	})
}

exports.isOwner = (owner, idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.findOne({ owner: owner, idFolder: idFolder }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}