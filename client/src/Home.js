import React, { Component } from 'react';

import { Upload, message, Input as InputAntd } from 'antd';
import { UploadOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import {
	Button, TextField, IconButton, Menu,
	MenuItem, ListItemIcon, Typography,
	FormControlLabel, Divider, TextareaAutosize,
	InputAdornment, Checkbox
} from '@material-ui/core';
import FolderIcon from '@material-ui/icons/Folder';
import LockIcon from '@material-ui/icons/Lock';
import FolderSharedIcon from '@material-ui/icons/FolderShared';
import SearchIcon from '@material-ui/icons/Search';
import SettingsIcon from '@material-ui/icons/Settings';
import DraftsIcon from '@material-ui/icons/Drafts';
import EditIcon from '@material-ui/icons/Edit';
import ShareIcon from '@material-ui/icons/Share';

import Modal from 'react-bootstrap/Modal';
import { Row } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

import Note from './Note'

import "./Home.css"

var timerId, hide;

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			owner: "",
			token: "",
			path: window.location.href,
			name: "",
			password: "",
			sizeFile: 0,
			visible: false,
			showModal: false,
			showModalPassword: false,
			disableBottons: false,
			showPassword: false,
			folders: [],
			files: [],
			notes: [],
			search: "",
			viewLink: null,
			passwords: [],
			modifyFolder: false,
			isType: "",
			previewImg: [],

			url: null,
			downloading: false,
			viewFileClicked: false,
			downloadFileClicked: false,
			showModalFile: false,

			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
			infos: null,

			showModalNote: false,
			edit: false,
			createNote: false,
			titleNote: "",
			textNote: "",
			idNote: "",
			savingNote: false,
			indexMouseOverNote: -1,

			showModalAccount: false,
			newToken: "",

			isMobile: window.matchMedia("only screen and (max-width: 760px)").matches,
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)
		this.saveNote = this.saveNote.bind(this)
	}

	UNSAFE_componentWillMount = () => {
		if (window.localStorage.getItem("passwords") === null) {
			window.localStorage.setItem("passwords", JSON.stringify([]))
			this.setState({
				passwords: [],
			})
		} else {
			this.setState({
				passwords: JSON.parse(window.localStorage.getItem("passwords")),
			})
		}
		if (window.localStorage.getItem("owner") !== null && window.localStorage.getItem("token") !== null) {
			this.setState({
				owner: window.localStorage.getItem("owner"),
				token: window.localStorage.getItem("token")
			}, () => {
				this.getFoldersAndFiles()
			})
		} else {
			var token = this.generate_token(32)
			this.sha256(token)
				.then((proofToken) => {
					this.setState({
						owner: proofToken,
						token: token
					}, () => {
						window.localStorage.setItem("owner", this.state.owner)
						window.localStorage.setItem("token", this.state.token)
						this.getFoldersAndFiles()
					})
				})
				.catch((e) => {
					console.log(e)
				})
		}

		if (window.localStorage.getItem("message1") === null) {
			if (this.getParent() === "/") {
				var msg = ""
				if (this.state.isMobile === false) {
					msg = "Right click on file/folder for more actions"
				} else {
					msg = "Long press on file/folder for more actions"
				}
				message.info(msg, 6)
			}

			window.localStorage.setItem("message1", "true")
		}

	}

	getFoldersAndFiles = () => {
		var viewLink
		if (this.state.path.includes("/file/")) {
			viewLink = this.state.path.split('/file/')
			viewLink = viewLink[viewLink.length - 1]

			this.setState({
				viewLink: viewLink,
			}, () => {
				this.getSharedFile()
			})

			return
		}

		if (this.state.path.includes("/note/")) {
			viewLink = this.state.path.split('/note/')
			viewLink = viewLink[viewLink.length - 1]

			this.setState({
				viewLink: viewLink,
			}, () => {
				this.getSharedNote()
			})

			return
		}

		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/folder/getFolders", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					if (data.passwordRequired === true) {
						this.openModalPassword()
					} else {
						this.setState({
							folders: data
						}, () => {
							this.getFiles()
							this.getNotes()
						})
					}
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getFiles = () => {
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFiles", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					let nulls = []
					for(let a = 0; a < data.length; ++a){
						nulls.push(null)
					}
					this.setState({
						files: data,
						previewImg: nulls
					}, () => {
						this.getPreviewsImgs(data)
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getNotes = () => {
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/note/getNotes", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						notes: data
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	sha256 = async (message) => {
		const msgBuffer = new TextEncoder('utf-8').encode(message)
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('')
		return hashHex
	}

	generate_token = (length) => {
		var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("")
		var b = []
		for (var i = 0; i < length; i++) {
			var j = (Math.random() * (a.length - 1)).toFixed(0)
			b[i] = a[j]
		}
		return b.join("")
	}

	getParent = () => {
		var parent = this.state.path.split("/")
		parent = parent[parent.length - 1]

		if (parent.length === 0) {
			parent = "/"
		}

		return parent
	}

	createFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			name: this.state.name,
			password: this.state.password,
			visibleToEveryone: this.state.visible,
		}
		fetch("/api/folder/createFolder", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()
					message.success(`${this.state.name} folder uploaded successfully`);
				} else {
					message.error(`Folder upload failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	accessFolder = () => {
		var data = {
			owner: this.state.owner,
			token: this.state.token,
			idFolder: this.getParent(),
			parent: this.getParent(),
			password: this.state.password,
		}
		fetch("/api/folder/getFolderWithPassword", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {

					var newPasswords = [...this.state.passwords, this.state.password]
					window.localStorage.setItem("passwords", JSON.stringify(newPasswords))

					this.setState({
						showModalPassword: false,
						disableBottons: false,
						folders: data,
						passwords: newPasswords,
					}, () => {
						this.getFiles()
						this.getNotes()
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getShareLink = (type) => {
		var path = this.state.path.split("/")
		path.pop()
		path = path.join("/") + "/"

		var text = ""
		if (type === "folder") {
			text = path + this.state.infos.idFolder
		} else if (type === "file") {
			text = path + "file/" + this.state.infos.linkView
		} else if (type === "note") {
			text = path + "note/" + this.state.infos.linkView
		}

		if (!navigator.clipboard) {
			var textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				var successful = document.execCommand('copy');
				if (successful) {
					message.success("Link copied to clipboard!")
				} else {
					message.error("Failed to copy")
				}
			} catch (err) {
				message.error("Failed to copy")
			}
			document.body.removeChild(textArea)
			return
		}
		navigator.clipboard.writeText(text).then(function () {
			message.success("Link copied to clipboard!")
		}, function (err) {
			message.error("Failed to copy")
		})
	}

	modifyFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			idFolder: this.state.infos.idFolder,
			name: this.state.name,
			password: this.state.password,
			visibleToEveryone: this.state.visible,
		}
		fetch("/api/folder/modifyFolder", {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()

					message.success(`${this.state.name} folder updated successfully`);
				} else {
					message.error(`Folder update failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	searchFilesAndFolders = (e) => {
		this.setState({
			search: e.target.value
		})
	}

	getSharedFile = () => {
		var data = {
			link: this.state.viewLink,
			owner: this.state.owner,
			token: this.state.token,
		}

		fetch("/api/file/getSharedFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						files: [data],
						previewImg: [null]
					}, () => {
						if(data.type.startsWith('image')) {
							this.getSharedFileDownload(false, true)
						}
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getSharedFileDownload = (showModel, showPreviewImg) => {
		var data = {
			link: this.state.viewLink,
			owner: this.state.owner,
			token: this.state.token,
		}

		this.setState({
			downloading: true
		})

		fetch("/api/file/getSharedFileDownload", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						url: URL.createObjectURL(data),
						downloading: false
					}, () => {
						if(showPreviewImg === true) {
							this.setState(prevState => {
								let p = prevState.previewImg
								p[0] = this.state.url
								return {
									previewImg: p
								}
							})
							return
						}

						if (showModel === true) {
							var win = window.open(this.state.url, '_blank')
							win.focus()
						}

						if (this.state.viewFileClicked === true) {
							this.setState({
								viewFileClicked: false
							}, () => {
								this.viewFile()
							})
						}
						if (this.state.downloadFileClicked === true) {
							this.setState({
								downloadFileClicked: false
							}, () => {
								this.downloadFile()
							})
						}
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	downloadFile = () => {
		if (this.state.downloading === false) {
			var link = document.createElement('a')
			link.href = this.state.url
			link.setAttribute('download', this.state.name)
			link.click()
		} else {
			this.setState({
				downloadFileClicked: true,
			})
		}
	}

	showMessageUploadFile = (info) => {
		if (info.file.status === 'done') {
			setTimeout(hide, 0)
			message.success(`${info.file.name} file uploaded successfully`);
			this.getFoldersAndFiles()
		} else if (info.file.status === 'error') {
			setTimeout(hide, 0)
			message.error(`${info.file.name} file upload failed.`);
		}
	}

	clickFolder = () => {
		window.location.href = "/" + this.state.infos.idFolder
	}

	clickFile = (showModel = true) => {

		if (this.state.path.includes("/file/")) {
			return this.getSharedFileDownload(showModel, false)
		}

		var data = {
			idFile: this.state.infos.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		this.setState({
			name: this.state.infos.name,
			// showModalFile: showModel,
			downloading: true,
		})

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				this.setState({
					url: URL.createObjectURL(data),
					downloading: false
				}, () => {
					if (showModel === true) {
						var win = window.open(this.state.url, '_blank')
						win.focus()
					}

					if (this.state.viewFileClicked === true) {
						this.setState({
							viewFileClicked: false
						}, () => {
							this.viewFile()
						})
					}
					if (this.state.downloadFileClicked === true) {
						this.setState({
							downloadFileClicked: false
						}, () => {
							this.downloadFile()
						})
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	viewFile = () => {
		if (this.state.downloading === false) {
			window.location.href = this.state.url
		} else {
			this.setState({
				viewFileClicked: true,
			})
		}
	}

	openModal = (modifyFolder = false) => {
		if (modifyFolder === true) {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: this.state.infos.name,
				password: this.state.infos.password,
				visible: this.state.infos.visibleToEveryone,
				showPassword: this.state.infos.password.length > 0 ? true : false,
			}, () => { })
		} else {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: "",
				visible: false,
				password: "",
				showPassword: false,
			}, () => { })
		}
	}

	openModalPassword = () => {
		this.setState({
			showModalPassword: true,
			password: "",
			disableBottons: true,
		}, () => { })
	}

	closeModal = () => {
		this.setState({
			showModal: false,
			modifyFolder: false,
			showModalPassword: false,
			showModalFile: false,
			showModalNote: false,
			showModalAccount: false,
		}, () => { })
	}

	closeMenu = () => {
		this.setState({
			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
		})
	}

	remove = () => {
		var data = {}
		var url = ""

		if (this.state.isType === "file") {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/file/deleteFile"
		} else if (this.state.isType === "folder") {
			data = {
				idFolder: this.state.infos.idFolder,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/folder/deleteFolders"
		} else {
			data = {
				idNote: this.state.infos.idNote,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/note/deleteNote"
		}

		fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					message.success(`${this.state.isType} deleted`)
					this.getFoldersAndFiles()
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getMineType = (mime_type) => {
		let icon_classes = {
			// Media
			'image': 'far fa-file-image',
			'audio': 'far fa-file-audio',
			'video': 'far fa-file-video',
			// Documents
			'application/pdf': 'far fa-file-pdf',
			'application/msword': 'far fa-file-word',
			'application/vnd.ms-word': 'far fa-file-word',
			'application/vnd.oasis.opendocument.text': 'far fa-file-word',
			'application/vnd.openxmlformats-officedocument.wordprocessingml': 'far fa-file-word',
			'application/vnd.ms-excel': 'far fa-file-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml': 'far fa-file-excel',
			'application/vnd.oasis.opendocument.spreadsheet': 'far fa-file-excel',
			'application/vnd.ms-powerpoint': 'far fa-file-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml': 'far fa-file-powerpoint',
			'application/vnd.oasis.opendocument.presentation': 'far fa-file-powerpoint',
			'text/plain': 'far fa-file-text',
			'text/html': 'far fa-file-code',
			'application/json': 'far fa-file-code',
			// Archives
			'application/gzip': 'far fa-file-archive',
			'application/zip': 'far fa-file-archive',
		}

		for (let k in icon_classes) {
			if (mime_type.indexOf(k) === 0) {
				return icon_classes[k]
			}
		}
		return 'far fa-file'
	}

	editText = () => {
		this.setState({
			edit: true
		})
	}

	saveNote = () => {
		var data = {
			idNote: this.state.idNote,
			title: this.state.titleNote,
			text: this.state.textNote,
			owner: this.state.owner,
			token: this.state.token,
		}

		this.setState({
			savingNote: true,
		})

		fetch("/api/note/saveNote", {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					setTimeout(() => {
						this.setState({
							savingNote: false,
						})
					}, 400)
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getSharedNote = () => {
		var data = {
			link: this.state.viewLink,
			owner: this.state.owner,
			token: this.state.token,
		}

		fetch("/api/note/getSharedNote", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						notes: [data]
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	createNote = () => {
		var data = {
			title: this.state.titleNote,
			text: this.state.textNote,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent()
		}

		fetch("/api/note/createNote", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						idNote: data.idNote
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	preventDuplicate = (e) => {
		if (this.state.createNote === true) {
			this.setState({
				[e.target.name]: e.target.value,
				createNote: false,
			}, () => {
				this.createNote()
			})
		}
	}

	handleInputNote = (e) => {
		if (!(timerId == null)) {
			clearTimeout(timerId);
		}

		if (this.state.createNote === true) {
			// create note
			setTimeout(this.preventDuplicate(e), Math.random() * 1000 + Math.random() * 500);
		} else {
			// simple update
			this.setState({
				[e.target.name]: e.target.value,
			}, () => {
				if (this.state.idNote !== "") {
					timerId = setTimeout(() => {
						this.saveNote()
					}, 400)
				}
			})
		}
	}

	previewText = () => {
		this.setState({
			edit: false
		})
	}

	openModalCreateNote = () => {
		if (this.getParent() === "/") {
			message.error("Select or create a folder before creating note");
			return
		}
		this.setState({
			showModalNote: true,
			createNote: true,
			edit: true,
			idNote: "",
			titleNote: "",
			textNote: "",
		})
	}

	openModalShowNote = () => {
		this.setState({
			showModalNote: true,
			createNote: false,
			edit: false,
		})
	}

	closeNoteModal = () => {
		this.setState({
			showModalNote: false,
		}, () => {
			this.getNotes()
		})
	}

	openFoldersMenu = () => {
		this.setState({
			showMainMenu: false,
			showFoldersMenu: true
		})
	}

	moveToFolder = (folder) => {
		var data = {}
		var url = ""

		if (this.state.isType === "file") {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
				parent: folder.idFolder,
			}
			url = "/api/file/changeFolder"
		} else {
			data = {
				idNote: this.state.infos.idNote,
				owner: this.state.owner,
				token: this.state.token,
				parent: folder.idFolder,
			}
			url = "/api/note/changeFolder"
		}

		fetch(url, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					// message.success(`${this.state.isType} deleted`)
					this.getFoldersAndFiles()
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	saveNewToken = () => {
		var token = this.state.newToken
		if (token.length < 8) {
			message.error("Token must be at least 8 characters long")
			return
		}
		this.sha256(token)
			.then((proofToken) => {
				this.setState({
					owner: proofToken,
					token: token,
					newToken: "",
				}, () => {
					window.localStorage.setItem("owner", this.state.owner)
					window.localStorage.setItem("token", this.state.token)
				})

				message.success("Secret token updated")
			})
			.catch((e) => {
				console.log(e)
			})
	}

	validURL(str) {
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
		  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
		  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
		  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
		  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
		  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		return !!pattern.test(str);
	}

	// some magic to add space as it should be
	parseMarkdown(data) {
		data = data.split("\n")
		var newData = []
		var start = false
		for (let a = 0; a < data.length; ++a) {
			if (data[a].length === 0) {
				if (start === false || a < 1 || data[a - 1].length === 0 || data[a + 1].length === 0) {
					continue
				}
				if (["*", "-", "+"].includes(data[a - 1].trim()[0]) === true ||
					["*", "-", "+"].includes(data[a + 1].trim()[0]) === true ||
					(a !== data.length - 1 && data[a + 1].trim().split(". ").length >= 2 && isNaN(parseInt(data[a + 1].trim().split(". ")[0])) === false)) {
					newData.push("")
					continue
				}
				newData.push("\\")
				newData.push("\\")
			} else {
				start = true

				let split_for_url = data[a].trim().split(" ")
				for(let b = 0; b < split_for_url.length; ++b) {
					if(this.validURL(split_for_url[b])) {
						if(!split_for_url[b].startsWith("https://") && !split_for_url[b].startsWith("http://")) {
							split_for_url[b] = "https://" + split_for_url[b]
						}
						let new_url = split_for_url[b].replace("https://", "").replace("http://", "").replace("www.", "")
						split_for_url[b] = "["+new_url+"]("+split_for_url[b]+")"
					}
				}

				data[a] = split_for_url.join(" ")

				var check_number_list = data[a].trim().split(". ")

				if (check_number_list.length >= 2 && isNaN(parseInt(check_number_list[0])) === false) {
					newData.push(data[a])
					/*
					check cases like:
						1. asd
						2. asd
						text. a	
					*/
					if (a !== data.length - 1) {
						var check_number_list_next = data[a + 1].trim().split(". ")
						if (check_number_list_next.length < 2 ||
							(check_number_list_next.length >= 2 && isNaN(parseInt(check_number_list_next[0])))) {
							newData.push("")
						}
					}
					continue
				}

				if (a !== data.length - 1 && data[a + 1].length > 0 &&
					["*", "-", "+"].includes(data[a + 1].trim()[0]) === false &&
					(data[a + 1].trim().split(". ").length < 2 || (data[a + 1].trim().split(". ").length >= 2 && isNaN(parseInt(data[a + 1].trim().split(". ")[0]))))) {
					newData.push(data[a] + "\\")
				} else {
					newData.push(data[a])
				}
			}
		}
		return newData.join("\n")
	}

	getPreviewsImgs = (data) => {
		console.log(data)
		for(let a = 0; a < data.length; ++a){
			if(data[a].type.startsWith('image')) {
				this.getImagePreview(data[a], a)
			}
		}
	}

	getImagePreview = (item, idx) => {
		var data = {
			idFile: item.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				let url = URL.createObjectURL(data)
				this.setState(prevState => {
					let p = prevState.previewImg
					p[idx] = url
					return {
						previewImg: p
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	render() {
		return (
			<div>
				<Menu
					keepMounted
					open={this.state.showFoldersMenu === true}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
					PaperProps={{
						style: {
							maxHeight: 48 * 4.5,
							width: '250px',
						},
					}}
				>
					{this.state.folders.length > 0 && this.state.folders.filter((item) => {
						if(item.password.length !== 0) {
							return false
						}
						return true
					}).map((item, index) => (
						<MenuItem key={index} onClick={() => {
							this.moveToFolder(item)
							this.closeMenu()
						}}>
							<Typography variant="inherit" noWrap>
								{item.name}
							</Typography>
						</MenuItem>
					))}
				</Menu>

				{/* right click folder / file */}
				<Menu
					keepMounted
					open={this.state.showMainMenu === true}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
				>
					{this.state.isType === "file" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner && this.state.path.includes("/file/") === false &&
								<div>
									<MenuItem onClick={() => {
										this.remove()
										this.closeMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Remove
									</Typography>
									</MenuItem>

									<MenuItem onClick={() => {
										this.openFoldersMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Move to Folder
									</Typography>
									</MenuItem>
								</div>
							}

							<MenuItem onClick={() => {
								this.downloadFile()
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Download
								</Typography>
							</MenuItem>

							<MenuItem onClick={() => {
								this.getShareLink("file")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>
						</div>}

					{this.state.isType === "folder" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.remove()
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Remove
								</Typography>
								</MenuItem>}

							<MenuItem onClick={() => {
								this.getShareLink("folder")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>

							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.openModal(true)
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Modify
									</Typography>
								</MenuItem>}
						</div>}

					{this.state.isType === "note" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<div>
									<MenuItem onClick={() => {
										this.remove()
										this.closeMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Remove
									</Typography>
									</MenuItem>

									<MenuItem onClick={() => {
										this.openFoldersMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Move to Folder
									</Typography>
									</MenuItem>
								</div>
							}

							<MenuItem onClick={() => {
								this.getShareLink("note")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>
						</div>}

				</Menu>

				{/* change account */}
				<Modal show={this.state.showModalAccount} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter" style={{ width: "100%" }}>
							Settings
						</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{ overflowY: "auto", wordBreak: "break-word", width: "100%", maxHeight: "calc(100vh - 200px)", minHeight: "400px" }}>
						<div>
							<h4>Your secret token:</h4>
							<TextField
								label="Secret token"
								defaultValue={this.state.token}
								InputProps={{ readOnly: true }}
								variant="filled"
							/>

							<h4 style={{ paddingTop: "30px" }}>Change account:</h4>
							<TextField
								label="New secret token"
								defaultValue=""
								variant="outlined"
								style={{ width: "70%", marginTop: "5px" }}
								onChange={(e) => this.setState({
									newToken: e.target.value
								})}
							/>
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginTop: "15px", marginLeft: "10px"
							}}
								onClick={this.saveNewToken}>Save</Button>
						</div>
					</Modal.Body>
				</Modal>

				{/* create / modify note */}
				<Modal show={this.state.showModalNote} onHide={this.closeNoteModal}
					size="lg"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter" style={{ width: "100%" }}>
							{this.state.edit === false ?
								this.state.titleNote
								:
								<TextareaAutosize rowsMax={1} placeholder="Title" value={this.state.titleNote} name="titleNote" onChange={this.handleInputNote} autoFocus
									style={{
										width: "100%", borderRadius: "6px", border: "none",
										borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none",
										margin: "0px"
									}} />
							}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{ overflowY: "auto", wordBreak: "break-word", width: "100%", maxHeight: "calc(100vh - 200px)", minHeight: "400px" }}>
						<div>
							{this.state.edit === false ?
								<Note text={this.parseMarkdown(this.state.textNote)} style={{
									width: "100%", minHeight: "100%", borderRadius: "6px", border: "none",
									borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none",
									margin: "0px", fontSize: "14px"
								}}></Note>
								:
								<div>
									<TextareaAutosize placeholder="Write a note in markdown..." value={this.state.textNote} name="textNote" onChange={this.handleInputNote}
										style={{
											width: "100%", minHeight: "100%", borderRadius: "6px", border: "none",
											borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none",
											margin: "0px", fontSize: "14px"
										}} />
								</div>
							}
						</div>
					</Modal.Body>
					<Modal.Footer>
						{this.state.edit === false ?
							this.state.infos !== null && this.state.owner === this.state.infos.owner &&
							<Button variant="contained" style={{
								backgroundColor: "#2196f3",
								marginLeft: "20px",
								marginRight: "20px"
							}} onClick={this.editText}>Edit</Button>
							:
							<Row>
								<div>{this.state.savingNote === false ? "Saved!" : "Saving..."}</div>
								<Button variant="contained" style={{
									backgroundColor: "#4caf50",
									marginLeft: "20px",
									marginRight: "20px"
								}} onClick={this.previewText}>Preview</Button>
							</Row>

						}
					</Modal.Footer>
				</Modal>

				{/* create file with name, password, visible */}
				<Modal show={this.state.showModal} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							{this.state.modifyFolder === true ? "Modify Folder" : "New Folder"}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<div>
								<InputAntd defaultValue={this.state.name} placeholder="Folder name" onChange={(e) => this.setState({
									name: e.target.value
								})} />
							</div>
							<div>
								<FormControlLabel
									checked={this.state.showPassword}
									value="password"
									control={
										<Checkbox color="primary" onClick={() => this.setState({
											showPassword: !this.state.showPassword
										})}
										/>}
									label="Password"
								/>
								{this.state.showPassword === true ?
									<InputAntd defaultValue={this.state.password} placeholder="Password"
										type="password" onChange={(e) => this.setState({
											password: e.target.value
										})} />
									: null}
							</div>
							{this.getParent() !== "/" ?
								<div>
									<FormControlLabel
										value="Visible to everyone"
										checked={this.state.visible}
										control={
											<Checkbox color="primary" onClick={() => this.setState({
												visible: !this.state.visible
											})}
											/>}
										label="Visible to everyone"
									/>
								</div>
								: null
							}
						</div>

					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white" }} onClick={this.closeModal} >Cancel</Button>
						{this.state.modifyFolder === true ?
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.modifyFolder}>Save</Button>
							:
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.createFolder}>Create</Button>
						}

					</Modal.Footer>
				</Modal>

				{/* ask for password */}
				<Modal show={this.state.showModalPassword} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							Password Folder
					</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<InputAntd placeholder="Password" type="password" onChange={(e) => this.setState({
								password: e.target.value
							})} />
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white" }} onClick={this.closeModal} >Cancel</Button>
						<Button variant="contained" style={{
							backgroundColor: "#4caf50",
							marginLeft: "20px",
							marginRight: "20px"
						}}
							onClick={this.accessFolder}>Access</Button>
					</Modal.Footer>
				</Modal>

				{/* show view or download on click file */}
				<Modal show={this.state.showModalFile} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							File {this.state.name.length > 15 ? (this.state.name.split("").splice(0, 15).join("") + "...") : this.state.name}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px", textAlign: "center" }}>
							<Button variant="contained" style={{ backgroundColor: "#fbc02d" }} onClick={this.viewFile}>View</Button>
							<Button variant="contained" style={{
								backgroundColor: "#4caf50", marginLeft: "20px", marginRight: "20px"
							}}
								onClick={this.downloadFile}>Download</Button>
						</div>
					</Modal.Body>
				</Modal>

				<div className="container">
					<div>
						<TextField label="Search" type="search" variant="outlined"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<SearchIcon />
									</InputAdornment>
								),
							}}
							style={{
								marginTop: "20px",
								maxWidth: "600px",
								width: "80%",
								paddingLeft: "0px",
								backgroundColor: "white",
							}} onChange={this.searchFilesAndFolders} />

						<IconButton onClick={() =>
							this.setState({
								showModalAccount: true,
								newToken: "",
							})}
							style={{ marginTop: "20px", marginLeft: "5px" }}
						>
							<SettingsIcon className="icons" />
						</IconButton>
					</div>

					<div style={{ margin: "20px" }}>
						<Row style={{ justifyContent: "center" }}>
							<div>
								<div style={{ margin: "10px" }} onClick={() => {
									if (this.getParent() === "/") {
										message.error("Select or create a folder before uploading files");
									}
								}}>
									<Upload {...{
										disabled: (this.getParent() === "/" || this.state.disableBottons === true) ? true : false,
										name: 'file',
										action: '/api/file/uploadFile',
										beforeUpload: (file, fileList) => {
											var files = fileList
											let size = 16000000
											for (var a = 0; a < files.length; a++) {
												if (files[a].size > size) {
													message.error(`${files[a].name} is too large, please pick a smaller file\n`);
													return false
												} else {
													this.setState({
														sizeFile: files[a].size
													})
												}
											}

											hide = message.loading('Uploading..', 0)

											return true
										},
										data: {
											owner: this.state.owner,
											token: this.state.token,
											parent: this.getParent(),
											password: "", // TODO
											visibleToEveryone: true, // TODO
											sizeFile: this.state.sizeFile,
										},
										showUploadList: false,
										onChange: this.showMessageUploadFile
									}}>

										<Button
											variant="contained"
											className="buttons-folders"
											disabled={this.state.disableBottons}
											style={{
												textAlign: "left",
												justifyContent: "left",
												backgroundColor: "#2196f3",
												borderRadius: "7px",
												width: "auto"
											}}
											startIcon={<UploadOutlined />}>
											Upload File
										</Button>
									</Upload>
								</div>
							</div>

							<div>
								<Button
									variant="contained"
									className="buttons-folders"
									disabled={this.state.disableBottons}
									style={{
										margin: "10px",
										textAlign: "left",
										justifyContent: "left",
										backgroundColor: "#ff9800",
										borderRadius: "7px",
										marginLeft: "20px",
										width: "auto"
									}}
									startIcon={<FolderAddOutlined />}
									onClick={this.openModal}>
									Create Folder
								</Button>
							</div>

							<div>
								<Button
									variant="contained"
									className="buttons-folders"
									disabled={this.state.disableBottons}
									style={{
										margin: "10px",
										textAlign: "left",
										justifyContent: "left",
										backgroundColor: "#4caf50",
										borderRadius: "7px",
										marginLeft: "20px",
										width: "auto"
									}}
									startIcon={<FileAddOutlined />}
									onClick={this.openModalCreateNote}>
									Create Note
								</Button>
							</div>
						</Row>
					</div>

					<Row style={{ maxHeight: "230px", overflow: "auto", overflowY: "scroll", justifyContent: "center" }}>
						{this.state.folders.length > 0 && this.state.folders.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item) => {
							return (
								<div className="folders" key={item._id}>
									<Button
										variant="contained"
										className="buttons-folders"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left", justifyContent: "left",
											borderRadius: "7px", fontSize: "17px", paddingLeft: "20px"
										}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons" style={{ marginRight: "10px" }} /> :
											(item.visibleToEveryone === true ? <FolderSharedIcon className="icons" style={{ marginRight: "10px" }} /> :
												<FolderIcon className="icons" style={{ marginRight: "10px" }} />))}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "folder",
												infos: item,
											})
										}}
										onClick={() => {
											this.setState({
												isType: "folder",
												infos: item,
											}, () => {
												this.clickFolder()
											})
										}}
									>
										<Typography variant="inherit" noWrap>
											{item.name}
										</Typography>
									</Button>
								</div>
							)
						})}
					</Row>

					<Divider />

					<Row style={{ overflow: "auto", overflowY: "scroll", justifyContent: "center", height: "auto" }}>

						{this.state.notes.length > 0 && this.state.notes.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.title.toLowerCase()) || re.test(item.text.toLowerCase())
							} else {
								return true
							}
						}).map((item, idx) => {
							return (
								<div style={{ justifyContent: "center", alignItems: "center" }} key={item._id}
									onMouseEnter={() => this.setState({indexMouseOverNote: idx})}
									onMouseLeave={() => this.setState({indexMouseOverNote: -1})}>
									<div props={item}
										variant="contained"
										style={{
											width: "250px", height: "250px", margin: "15px", marginBottom: "0px", padding: "15px", paddingTop: "10px",
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", borderRadius: "7px",
											display: "inline-block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflowY: "scroll",
											boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)"
										}}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												idNote: item.idNote,
												titleNote: item.title,
												textNote: item.text,
												infos: item,
												isType: "note",
											})
										}}
										onClick={() => {
											this.setState({
												idNote: item.idNote,
												titleNote: item.title,
												textNote: item.text,
												infos: item,
												isType: "note",
											}, () => {
												this.openModalShowNote()
											})
										}}>

										{item.title && item.title.length > 0 ?
											<h3><b>{item.title}</b></h3>
										: null}

										<Note text={this.parseMarkdown(item.text)}></Note>
									</div>
									
									{this.state.indexMouseOverNote === idx &&
										<div style={{ height: "0px", marginTop: "0px", width: "248px", 
										borderRadius: "7px", position: "relative", bottom: "60px", margin: "0 auto"}}>
											{this.state.owner === item.owner && <IconButton style={{color: "#424242", backgroundColor: "white", marginRight: "10px"}}
												onClick={() => {
													this.setState({
														idNote: item.idNote,
														titleNote: item.title,
														textNote: item.text,
														infos: item,
														isType: "note",
													}, () => {
														this.openModalShowNote()
														this.editText()
													})
												}}>
												<EditIcon />
											</IconButton>}
											<IconButton style={{color: "#424242", backgroundColor: "white"}} 
												onClick={() => {
													this.setState({
														idNote: item.idNote,
														titleNote: item.title,
														textNote: item.text,
														infos: item,
														isType: "note",
													}, () => {
														this.getShareLink("note")
													})
												}}>
												<ShareIcon />
											</IconButton>
										</div>}
								</div>
							)
						})}


						{this.state.files.length > 0 && this.state.files.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item, idx) => {
							return (
								<div className="files" key={item._id}>
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"
										}}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "file",
												infos: item,
											}, () => this.clickFile(false))
										}}
										onClick={() => {
											this.setState({
												isType: "file",
												infos: item,
											}, () => {
												this.clickFile()
											})
										}}
									>
										{item.type.startsWith('image') ? 
											<img width="210" height="210" src={(this.state.previewImg.length-1 >= idx && this.state.previewImg[idx] !== null) ? this.state.previewImg[idx] : ""} /> 
											:
											<i className={this.getMineType(item.type)} style={{ fontSize: "50px", marginRight: "10px" }}></i>
										}
										{item.type.startsWith('image') === false &&
										<Typography variant="inherit" noWrap>
											{item.name}
										</Typography>}
									</Button>
								</div>
							)
						})}

					</Row>
				</div>
			</div>
		);
	}
}

export default Home;