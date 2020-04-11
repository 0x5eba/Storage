const bcrypt = require('bcryptjs')
const UtenteController = require('./utente.model')

exports.insert = (req, res, next) => {
	if(req.body.password !== undefined && req.body.email !== undefined){
		let salt = bcrypt.genSaltSync(10)
		let hash = bcrypt.hashSync(req.body.password, salt)
		req.body.password = hash

		UtenteController.createUser(req.body)
			.then((result) => {
				req.body.id = String(result._id)
				return next()
			})
			.catch(err => {
				return res.status(403).send({ err: "Error creating user" })
			})
	} else {
		return res.status(403).send({ err: "Error creating user" })
	}
}

exports.uniqueEmail = (req, res, next) => {
	if(req.body.email !== undefined){
		UtenteController.getUtenteByEmail(req.body.email)
			.then((result) => {
				if(result === null){
					return next()
				} else {
					return res.status(403).send({ err: "Email already found" })
				}
			})
			.catch(err => {
				return res.status(403).send({ err: "Error searching user" })
			})
	} else {
		return res.status(403).send({ err: "No email provided" })
	}
}

exports.getEmailById = (req, res, next) => {
	if(req.params.id !== undefined){
		UtenteController.getEmailById(req.params.id)
			.then((result) => {
				req.body.email = result.email
				if(result !== null){
					return next()
				} else {
					return res.status(403).send({ err: "User not found" })
				}
			})
			.catch(err => {
				return res.status(403).send({ err: "User not found" })
			})
	} else {
		return res.status(403).send({ err: "No email provided" })
	}
}

exports.getData = (req, res, next) => {
	UtenteController.getUtenteById(req.params.id)
		.then((result) => {
			res.status(200).send(result)
		})
		.catch(err => {
			res.status(403).send({ err: "Error get data user" })
		})
}

exports.changeData = (req, res, next) => {
	UtenteController.changeUtente(req.params.id, req.body)
		.then((result) => {
			res.status(200).send(result)
		})
		.catch(err => {
			res.status(403).send({ err: "Error change data user" })
		})
}



exports.uploadPic = (req, res) => {
    ProfileController.uploadPic(req.params.userId, req.file.filename)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error upload photo" })
        })
}

exports.getPic = (req, res) => {
    ProfileController.getPic(req, res)
}

exports.getFilenamePic = (req, res, next) => {
    ProfileController.getFilenamePic(req.params.userId)
        .then((result) => {
            if(result.pic === undefined) {
                res.status(403).send({ err: "Error get pic profile" })
            }
            req.params.filename = result.pic
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error get pic profile" })
        })
}