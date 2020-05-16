import React, { Component } from 'react';

import { Upload, message, Input as InputAntd } from 'antd';
import { UploadOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import { Button, TextField } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FolderIcon from '@material-ui/icons/Folder';
import LockIcon from '@material-ui/icons/Lock';
import FolderSharedIcon from '@material-ui/icons/FolderShared';
import { Divider } from '@material-ui/core';
import { TextareaAutosize } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import InputAdornment from '@material-ui/core/InputAdornment';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Typography from '@material-ui/core/Typography';
import DraftsIcon from '@material-ui/icons/Drafts';

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

			url: null,
			downloading: false,
			showModalFile: false,

			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
			infos: null,

			searchFolders: [],
			searchFiles: [],

			showModalNote: false,
			edit: false,
			createNote: false,
			titleNote: "",
			textNote: "",
			idNote: "",
			savingNote: false,

			isMobile: window.matchMedia("only screen and (max-width: 760px)").matches,
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)
		this.saveNote = this.saveNote.bind(this)
    }
    
    UNSAFE_componentWillMount = () => {
        if(window.sessionStorage.getItem("passwords") === null) {
            window.sessionStorage.setItem("passwords", JSON.stringify([]))
            this.setState({
				passwords: [],
			})
        } else {
            this.setState({
				passwords: JSON.parse(window.sessionStorage.getItem("passwords")),
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

		if(window.localStorage.getItem("message1") === null){
			if(this.getParent() === "/"){
				var msg = ""
				if(this.state.isMobile === false){
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
                    if(data.passwordRequired === true){
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
					console.log(data)
					this.setState({
						files: data
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
					console.log(data)
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
        parent = parent[parent.length-1]

        if(parent.length === 0){
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
                    window.sessionStorage.setItem("passwords", JSON.stringify(newPasswords))

					this.setState({
						showModalPassword: false,
						disableBottons: false,
                        folders: data,
                        passwords: newPasswords,
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
    }
    
    getShareLinkFolder = () => {
        var path = this.state.path.split("/")
        path.pop()
        path = path.join("/") + "/"

        var text = path + this.state.infos.idFolder

        if (!navigator.clipboard) {
			var textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				console.log(msg)
				message.success("Link copied to clipboard!")
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
				console.log(data)
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
		}, () => {

			
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
						files: [data]
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getShareLinkFile = () => {
		var path = this.state.path.split("/")
        path.pop()
        path = path.join("/") + "/"

        var text = path + "file/" + this.state.infos.linkView

		if (!navigator.clipboard) {
			var textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				console.log(msg)
				message.success("Link copied to clipboard!")
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

	clickFile = (showModel=true) => {
		var data = {
			idFile: this.state.infos.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			password: this.state.password,
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
					if(showModel === true){
						var win = window.open(this.state.url, '_blank');
 						win.focus();
					}

					// if (this.state.viewFileClicked === true) {
					// 	this.setState({
					// 		viewFileClicked: false
					// 	})
					// 	this.viewFile()
					// } else if (this.state.downloadFileClicked === true) {
					// 	this.setState({
					// 		downloadFileClicked: false
					// 	})
					// 	this.downloadFile()
					// }
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

	openModal = (modifyFolder=false) => {
		if(modifyFolder === true){
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

		if(this.state.isType === "file"){
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/file/deleteFile"
		} else if(this.state.isType === "folder") {
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

		for(let k in icon_classes){
			if(mime_type.indexOf(k) === 0){
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

	getShareLinkNote = () => {
		var path = this.state.path.split("/")
        path.pop()
        path = path.join("/") + "/"

        var text = path + "note/" + this.state.infos.linkView

		if (!navigator.clipboard) {
			var textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				console.log(msg)
				message.success("Link copied to clipboard!")
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
		if(this.state.createNote === true){
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

		if(this.state.createNote === true){
			// create note
			setTimeout(this.preventDuplicate(e), Math.random()*1000 + Math.random()*500);
		} else {
			// simple update
			this.setState({
				[e.target.name]: e.target.value,
			}, () => {
				if(this.state.idNote !== ""){
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
		if(this.getParent() === "/"){
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

		if(this.state.isType === "file"){
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
					{this.state.folders.map((item, index) => (
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
								this.getShareLinkFile()
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
								this.getShareLinkFolder()
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
								this.getShareLinkNote()
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
								style={{width: "100%", borderRadius: "6px", border: "none", 
								borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none", 
								margin: "0px"}} />
							}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{overflowY: "auto", wordBreak: "break-word", width: "100%", maxHeight: "calc(100vh - 200px)", minHeight: "400px"}}>
						<div>
							{this.state.edit === false ?
							<Note text={this.state.textNote} style={{width: "100%", minHeight: "100%", borderRadius: "6px", border: "none", 
							borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none", 
							margin: "0px", fontSize: "14px"}}></Note>
							:
							<div>
								<TextareaAutosize placeholder="Write a note in markdown..." value={this.state.textNote} name="textNote" onChange={this.handleInputNote}
								style={{width: "100%", minHeight: "100%", borderRadius: "6px", border: "none", 
								borderColor: "Transparent", overflow: "auto", outline: "none", resize: "none", 
								margin: "0px", fontSize: "14px"}} />
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
									<InputAntd  defaultValue={this.state.password} placeholder="Password" 
										type="password" onChange={(e) => this.setState({
										password: e.target.value
									})} />
									: null}
							</div>
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
								margin: "20px",
								marginBottom: "0px",
								maxWidth: "600px",
								width: "80%",
								backgroundColor: "white",
							}} onChange={this.searchFilesAndFolders} />
					</div>

					<div style={{ margin: "20px" }}>
						<Row style={{justifyContent: "center"}}>
							<div>
								<div style={{ margin: "10px" }} onClick={() => {
									if(this.getParent() === "/"){
										message.error("Select or create a folder before uploading files");
									}
								}}>
									<Upload {...{
										disabled: (this.getParent() === "/" || this.state.disableBottons === true) ? true : false,
										name: 'file',
										action: '/api/file/uploadFile',
										beforeUpload(file, fileList) {
											var files = fileList
											let size = 16000000
											for (var a = 0; a < files.length; a++) {
												if (files[a].size > size) {
													message.error(`${files[a].name} is too large, please pick a smaller file\n`);
													return false
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
						{this.state.folders.filter(item => {
							if(this.state.search.length > 0){
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

						{this.state.notes.filter(item => {
							if(this.state.search.length > 0){
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.title.toLowerCase()) || re.test(item.text.toLowerCase())
							} else {
								return true
							}
						}).map((item) => {
							return (
								<div key={item._id} props={item}
									variant="contained"
									style={{
										width: "250px", height: "250px", margin: "15px", padding: "15px", paddingTop: "10px",
										textTransform: 'none', backgroundColor: "white", textAlign: "left",
										justifyContent: "left", fontSize: "17px", borderRadius: "10px", 
										display: "inline-block",  whiteSpace: "nowrap", textOverflow: "ellipsis", overflowY: "scroll", 
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
									
									<div style={{ height: "50px" }}>
										<h3><b>{item.title}</b></h3>
									</div>
									<div style={{ height: "200px" }}>
										<Note text={item.text}></Note>
									</div>

								</div>
							)
						})}


						{this.state.files.filter(item => {
							if(this.state.search.length > 0){
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item) => {
							return (
								<div className="files" key={item._id}>
									{/* <i className={this.getMineType(item.type)} style={{fontSize: "70px", marginTop: "20px", position: "absolute", zIndex: "20"}}></i> */}
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"
										}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons" style={{ fontSize: "50px", marginRight: "10px" }} /> :
											<i className={this.getMineType(item.type)} style={{fontSize: "50px", marginRight: "10px"}}></i>)}
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
									<Typography variant="inherit" noWrap >
										{item.name}
									</Typography>
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