import React, { Component } from 'react';

import { Upload, message, Button as ButtonAntd, Input as InputAntd } from 'antd';
import { UploadOutlined, FolderAddOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import { Button, TextField } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FolderIcon from '@material-ui/icons/Folder';
import LockIcon from '@material-ui/icons/Lock';
import FolderSharedIcon from '@material-ui/icons/FolderShared';
import { Divider } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import SearchIcon from '@material-ui/icons/Search';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Typography from '@material-ui/core/Typography';
import DraftsIcon from '@material-ui/icons/Drafts';

import Modal from 'react-bootstrap/Modal';
import { Row, Col } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

import Note from './Note'

import "./Home.css"

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
			showPassword: false,
			folders: [],
			files: [],
			search: "",
            viewLink: null,
            passwords: [],

			url: null,
			downloading: false,
			showModalFile: false,

			mouseX: null,
			mouseY: null,
			isFile: false,
			infos: null,
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)
    }
    
    UNSAFE_componentWillMount = () => {
        if(window.sessionStorage.getItem("passwords") === null) {
            window.sessionStorage.setItem("passwords", JSON.stringify([]))
            this.setState({
				passwords: [],
			})
        } else {
            this.setState({
				passwords: window.sessionStorage.getItem("passwords"),
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
	}

	getFoldersAndFiles = () => {
		if (this.state.path.includes("/file/")) {
			// query per prendere solo quel file, e metterlo in this.state.files

			var viewLink = this.state.path.split('/file/')
			viewLink = viewLink[viewLink.length - 1]

			this.setState({
				viewLink: viewLink,
			}, () => {
				this.getSharedFile()
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
                        })
                    }
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})


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
                    
                    // salva la password in sessionStorage
                    var newPasswords = [...this.state.passwords, this.state.password]
                    window.sessionStorage.setItem("passwords", JSON.stringify(newPasswords))

					this.setState({
                        showModalPassword: false,
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
			message.success(`${info.file.name} file uploaded successfully`);
			this.getFoldersAndFiles()
		} else if (info.file.status === 'error') {
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
		}

		this.setState({
			name: this.state.infos.name,
			showModalFile: showModel,
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
				}, () => {
					this.setState({
						downloading: false,
					}, () => {


						if (this.state.viewFileClicked === true) {
							this.setState({
								viewFileClicked: false
							})
							this.viewFile()
						} else if (this.state.downloadFileClicked === true) {
							this.setState({
								downloadFileClicked: false
							})
							this.downloadFile()
						}


					})
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

	openModal = () => {
		this.setState({
			showModal: true,
			name: "",
			password: "",
			showPassword: false,
		}, () => { })
	}

	openModalPassword = () => {
		this.setState({
			showModalPassword: true,
			password: "",
		}, () => { })
	}

	closeModal = () => {
		this.setState({
			showModal: false,
			showModalPassword: false,
			showModalFile: false,
		}, () => { })
	}

	closeMenu = () => {
		this.setState({
			mouseX: null,
			mouseY: null,
		})
	}

	remove = () => {
		var data = {
			idFolder: this.state.infos.idFolder,
			owner: this.state.owner,
			token: this.state.token,
		}
		var url = "/api/folder/deleteFolders"

		if (this.state.isFile === true) {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/file/deleteFile"
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
					message.success(`${this.state.isFile === true ? "File" : "Folder"} deleted`)
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
                {/* right click folder / file */}
				<Menu
					keepMounted
					open={this.state.mouseY !== null}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
				>
					{this.state.isFile === true ?
						<div style={{ width: "250px" }}>
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
									Get share link
								</Typography>
							</MenuItem>
							{/* <MenuItem onClick={}>Rename</MenuItem> */}

						</div>
						:
						<div style={{ width: "250px" }}>
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
								this.getShareLinkFolder()
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get share link
								</Typography>
							</MenuItem>
						</div>
					}
				</Menu>

                {/* create file with name, password, visible */}
				<Modal show={this.state.showModal} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							New Folder
					</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<div>
								<InputAntd placeholder="Folder name" onChange={(e) => this.setState({
									name: e.target.value
								})} />
							</div>
							<div>
								<FormControlLabel
									value="password"
									control={
										<Checkbox color="primary" onClick={() => this.setState({
											showPassword: !this.state.showPassword
										})}
										/>}
									label="Password"
								/>
								{this.state.showPassword === true ?
									<InputAntd placeholder="Password" type="password" onChange={(e) => this.setState({
										password: e.target.value
									})} />
									: null}
							</div>
							<div>
								<FormControlLabel
									value="Visible to everyone"
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
						<Button variant="contained" style={{
							backgroundColor: "#4caf50",
							marginLeft: "20px",
							marginRight: "20px"
						}}
							onClick={this.createFolder}>Create</Button>
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
							File {this.state.name.length > 20 ? (this.state.name.split("").splice(0, 20).join("") + "...") : this.state.name}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px", textAlign: "center" }}>
							<Button variant="contained" style={{ backgroundColor: "#ef5350" }} onClick={this.viewFile}>View</Button>
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
							style={{
								margin: "20px",
								marginBottom: "0px",
								maxWidth: "600px",
								width: "80%",
								backgroundColor: "white",
							}} onChange={this.searchFilesAndFolders} />
					</div>

					<div style={{ margin: "20px" }}>
						<Upload {...{
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
								return true
							},
							data: {
								owner: this.state.owner,
								token: this.state.token,
								parent: this.getParent(),
								// password: this.state.password,  // TODO
								visibleToEveryone: true, // TODO
							},
							showUploadList: false,
							onChange: this.showMessageUploadFile
						}}>
							<Button
								variant="contained"
								className="buttons-folders"
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

						<Button
							variant="contained"
							className="buttons-folders"
							style={{
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
					
					<Row style={{ maxHeight: "230px", overflow: "auto", overflowY: "scroll" }}>
						{this.state.folders.map((item) => {
							return (
								<Col className="folders" key={item._id}>
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
												isFile: false,
												infos: item,
											})
										}}
										onClick={() => {
											this.setState({
												isFile: false,
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
								</Col>
							)
						})}
					</Row>

					<Divider />

					<Row style={{ overflow: "auto", overflowY: "scroll" }}>
						{this.state.files.map((item) => {
							return (
								<Col className="files" key={item._id}>
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"
										}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons" style={{ marginRight: "10px" }} /> :
											<DescriptionIcon className="icons" style={{ marginRight: "10px" }} />)}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												isFile: true,
												infos: item,
											}, () => this.clickFile(false))
										}}
										onClick={() => {
											this.setState({
												isFile: true,
												infos: item,
											}, () => {
												this.clickFile()
											})
										}}
									>
										<Typography variant="inherit" noWrap>
											{item.name}
										</Typography>
									</Button>
								</Col>
							)
						})}
					</Row>
				</div>
			</div>
		);
	}
}

export default Home;