const mongodb = require('mongodb');
const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const FileModel = new mongoose.Schema({
    idFile: { type: String, trim: true, default: "", require: true }, // filename
    owner: { type: String, trim: true, default: "", require: true }, // e' un token
    name: { type: String, trim: true, default: "", require: true }, // nome file con estenzione
    path: { type: String, trim: true, default: "", require: true },
    password: { type: String, trim: true, default: "" }, // se password !== '' allora devi passargli password per vederlo o essere l'owner
    // linkModify: { type: String, trim: true, default: "" }, // _id + random_string
    linkView: { type: String, trim: true, default: "" }, // _id + random_string
    visibleToEveryone: { type: Boolean, default: true },
    // type: { type: String, trim: true, default: "" }, // se e' un'immagine o un txt o pdf posso fare una preview, altrimenti solo download
})

const File = mongoose.model('File', FileModel, 'File')

const Grid = require('gridfs-stream');
let mongoURI = 'mongodb://localhost:27017/meet';
mongoose.createConnection(mongoURI);
var conn = mongoose.connection;
var gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

exports.uploadFile = (fileData) => {
	return new Promise((resolve, reject) => {
		const file = new File(fileData)
		file.save(function (err, newfile) {
			if (err) return reject(err)
			resolve(newfile) // mi servirebbe solo idFile ma ok
		})
	})
}

exports.getFileById = (id) => {
	return new Promise((resolve, reject) => {
		File.findById(id, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.getFile = (idFile) => {
	return new Promise((resolve, reject) => {
		File.findOne({idFile: idFile}, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.changeFile = (id, data) => {
	return new Promise((resolve, reject) => {
		File.findByIdAndUpdate(id, data, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.removeFile = (idFile) => {
    return new Promise((resolve, reject) => {
        gfs.remove({ idFile: idFile, root: 'uploads' }, (err, gridStore) => {
            if (err) return reject(err)
            File.findOneAndRemove({ idFile: idFile }, function (err, file) {
                if (err) return reject(err)
                resolve(file)
            })
        });
    })
}

exports.getFileFormGridfs = (req, res) => { 
    gfs.files.findOne({ filename: req.body.idFile }, (err, file) => { // "metadata.name": req.body.name
        if (!file || file.length === 0) {
            return res.status(404).send({ err: "File doesn't exist" });
        }

        const readstream = gfs.createReadStream(file.filename)
        res.header({ 'Content-type': file.contentType })
        readstream.on('error', (err) => {
            res.status(404).send({ err: "Error getting the file" })
        })
        readstream.pipe(res)
        readstream.on('end', function () {
            res.status(201).end()
        })
    });
}

exports.deleteFileGrid = (req, res) => { 
    gfs.files.remove({ filename: req.body.idFile }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).send({ err: "File doesn't exist" })
        }
        res.status(201).send({})
    });
}

exports.getFiles = (owner, path) => {
    return new Promise((resolve, reject) => {
        File.find({ path: path, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
    })
}

exports.searchFiles = (owner, search) => {
	return new Promise((resolve, reject) => {
		File.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") }, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {})
			.limit(50).exec(function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.deleteFile = (owner, idFile) => {
	return new Promise((resolve, reject) => {
		File.findOneAndDelete({ owner: owner, idFile: idFile }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.isOwner = (owner, idFile) => {
	return new Promise((resolve, reject) => {
		File.findOne({ owner: owner, idFile: idFile }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.getSharedFile = (link) => {
	return new Promise((resolve, reject) => {
		File.findOne({ linkView: link }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}