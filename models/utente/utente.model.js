const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const UtenteModel = new mongoose.Schema({
    email: { type: String, trim: true, require: true},
    password: { type: String, require: true, trim: true },
    nome: { type: String, trim: true, default: "" },
    cognome: { type: String, trim: true, default: "" },
})

const Utente = mongoose.model('Utente', UtenteModel, 'Utente')

let Grid = require('gridfs-stream');
let mongoURI = 'mongodb://localhost:27017/meet';
mongoose.createConnection(mongoURI);
let conn = mongoose.connection;
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

exports.createUser = (userData) => {
	return new Promise((resolve, reject) => {
		const user = new Utente(userData)
		user.save(function (err, newuser) {
			if (err) return reject(err)
			resolve(newuser)
		})
	})
}

exports.utenteInfoForAuthenitcate = (email) => {
	return new Promise((resolve, reject) => {
		Utente.findOne({ email: email }, { email: 1, password: 1, _id: 1 }, function (err, user) {
			if (err) return reject(err)
			resolve(user)
		})
	})
}

exports.getEmailById = (id) => {
	return new Promise((resolve, reject) => {
		Utente.findById(id, { email: 1, _id: 0}, function (err, user) {
			if (err) return reject(err)
			resolve(user)
		})
	})
}

exports.getUtenteByEmail = (email) => {
	return new Promise((resolve, reject) => {
		Utente.findOne({ email: email }, {}, function (err, user) {
			if (err) return reject(err)
			resolve(user)
		})
	})
}

exports.getUtenteById = (id) => {
	return new Promise((resolve, reject) => {
		Utente.findById(id, {}, function (err, user) {
			if (err) return reject(err)
			resolve(user)
		})
	})
}

exports.changeUtente = (id, data) => {
	return new Promise((resolve, reject) => {
		Utente.findByIdAndUpdate(id, data, function (err, user) {
			if (err) return reject(err)
			resolve(user)
		})
	})
}



exports.uploadPic = (id, filename) => {
    return new Promise((resolve, reject) => {
        Utente.findById(id, function (err, user) {
            if (err) reject(err);

            if (user['pic'] !== ''){
                gfs.remove({ filename: user['pic'], root: 'uploads' }, (err, gridStore) => {
                    if (err) return reject(err);
                    user['pic'] = filename
                    user.save(function (err, updatedUser) {
                        if (err) return reject(err);
                        return resolve(updatedUser);
                    });
                });
            } else {
                user['pic'] = filename
                user.save(function (err, updatedUser) {
                    if (err) return reject(err);
                    return resolve(updatedUser);
                });
            }
        });
    })
}

exports.getPic = (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).send({ err: "No file exists" });
        }
        
        const readstream = gfs.createReadStream(file.filename);
        res.header({ 'Content-type': "image/jpg" });
        readstream.on('error', () => {
            res.status(404).send({ err: "Error getting the file" });
        })
        readstream.pipe(res);

        readstream.on('end', function () {
            res.status(201).end()
        })
    });
}

exports.getFilenamePic = (id) => {
    return new Promise((resolve, reject) => {
        Utente.findById(id, { pic: 1 }, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
}