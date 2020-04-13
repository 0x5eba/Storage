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

import Modal from 'react-bootstrap/Modal';
import { Row, Col} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

import "./Home.css"

const server_url = 'http://localhost:3001'

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			id: "",
			owner: "",
			token: "",
			path: window.location.href,
			name: "",
			password: "",
			visible: false,
			showModal: false,
			showModalPasswod: false,
			showPassword: false,
			folders: [],
			files: [],
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)
	}

	getFoldersAndFiles = () => {
		var data = {
			path: this.state.path,
			owner: this.state.owner,
			token: this.state.token,
		}

		fetch(server_url + "/api/folder/getFolders", {
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
						folders: data
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})

		fetch(server_url + "/api/file/getFiles", {
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
					console.error('Error:', data.err)
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

	UNSAFE_componentWillMount = () => {
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

	createFolder = () => {
		if(this.state.name.length === 0){
			message.error(`Insert a name please\n`);
			return
		}
		var data = {
			owner: this.state.owner,
			token: this.state.token,
			path: this.state.path,
			name: this.state.name,
			password: this.state.password,
			visibleToEveryone: this.state.visible,
		}
		fetch(server_url + "/api/folder/createFolder", {
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
					this.getFoldersAndFiles()
					message.success(`${data.name} folder uploaded successfully`);
				} else {
					message.error(`Folder upload failed.`)
					console.error('Error:', data.err)
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
			idFolder: this.state.id,
			owner: this.state.owner,
			token: this.state.token,
			path: this.state.path,
			name: this.state.name,
			password: this.state.password,
		}
		fetch(server_url + "/api/folder/getFolder", {
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
						showModalPasswod: false,
					}, () => {
						window.location.href = "http://localhost:8000/" + this.state.id
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	showInfoFile = (info) => {
		if (info.file.status === 'done') {
			message.success(`${info.file.name} file uploaded successfully`);
			this.getFoldersAndFiles()
		} else if (info.file.status === 'error') {
			message.error(`${info.file.name} file upload failed.`);
		}
	}

	openModal = () => {
		this.setState({
			showModal: true,
			name: "",
			password: "",
			showPassword: false,
		}, () => {})
	}

	openModalPassword = () => {
		this.setState({
			showModalPassword: true,
			password: "",
		}, () => {})
	}

	closeModal = () => {
		this.setState({
			showModal: false,
			showModalPasswod: false,
		}, () => {})
	}

	rightClickFolder = (e) => {
		e.preventDefault()
	}

	clickFolder = (props) => {
		if(props.password.length === 0){
			window.location.href = "http://localhost:8000/" + props.idFolder
		} else {
			// modal per la password
			this.setState({
				id: props.idFolder,
				name: props.name,
				showModalPasswod: true,
			})
		}
	}

	rightClickFile = (e) => {
		e.preventDefault()
	}

	clickFile = (props) => {
		var url = window.location.href
		if(url[url.length-1] === "/"){
			url = url.slice(0, -1)
		}
		window.location.href = url + "/" + props.idFile
	}

	render() {
		return (
			<div>
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
						<div style={{paddingLeft: "30px", paddingRight: "30px"}}>
							<div>
								<InputAntd placeholder="Folder name" onChange={(e) => this.setState({
									name: e.target.value
								})}/>
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
									})}/>
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
						<Button variant="contained" style={{ backgroundColor: "white"}} onClick={this.closeModal} >Cancel</Button>
						<Button variant="contained" style={{ 
							backgroundColor: "#4caf50", 
							marginLeft: "20px", 
							marginRight: "20px"}} 
							onClick={this.createFolder}>Create</Button>
					</Modal.Footer>
				</Modal>

				<Modal show={this.state.showModalPasswod} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">
						Password Folder
					</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{paddingLeft: "30px", paddingRight: "30px"}}>
							<InputAntd placeholder="Password" type="password" onChange={(e) => this.setState({
								password: e.target.value
							})}/>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white"}} onClick={this.closeModal} >Cancel</Button>
						<Button variant="contained" style={{ 
							backgroundColor: "#4caf50", 
							marginLeft: "20px", 
							marginRight: "20px"}} 
							onClick={this.accessFolder}>Access</Button>
					</Modal.Footer>
				</Modal>
			
				<div className="container">
					<div>
						{/* <Input placeholder="Search" style={{margin: "20px", marginBottom: "0px", maxWidth: "800px", width: "80%"}} onChange={(e) => this.setState({
							search: e.target.value
						})}/> */}
						<TextField label="Search" type="search" variant="outlined" 
							style={{
								margin: "20px",
								marginBottom: "0px", 
								maxWidth: "600px", 
								width: "80%", 
								backgroundColor: "white",
								}} onChange={(e) => this.setState({
							search: e.target.value
						})}/>
					</div>
					
					<div style={{margin: "20px"}}>
						<Upload {...{
								name: 'file',
								action: server_url + '/api/file/uploadFile',
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
									path: this.state.path,
									// password: this.state.password,
									// visibleToEveryone: this.state.visible,
								},
								showUploadList: false,
								onChange: this.showInfoFile
							}}>
							<Button 
								variant="contained"
								className="buttons-folders"
								style={{ 
									textAlign: "left", 
									justifyContent: "left",
									backgroundColor: "#2196f3",
									borderRadius: "7px",
									width: "auto"}}
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
								width: "auto"}}
							startIcon={<FolderAddOutlined />} 
							onClick={this.openModal}>
							Create Folder
						</Button>
					</div>
					
					<Row style={{maxHeight: "230px", overflow: "auto", overflowY: "scroll"}}>
						{this.state.folders.map((item) => {
							return (
								<Col className="folders" key={item._id}>
									<Button
										variant="contained"
										className="buttons-folders"
										style={{textTransform: 'none', backgroundColor: "white", textAlign: "left", justifyContent: "left", 
											borderRadius: "7px", fontSize: "17px", paddingLeft: "20px"}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons" style={{marginRight: "10px"}} /> : 
											(item.visibleToEveryone === true ? <FolderSharedIcon className="icons"  style={{marginRight: "10px"}} /> : 
												<FolderIcon className="icons"  style={{marginRight: "10px"}} />))}
										onContextMenu={this.rightClickFolder}
										onClick={() => this.clickFolder(item)}
									>
										{item.name}
									</Button>
								</Col>
							)
						})}
					</Row>

					<Divider />

					<Row style={{overflow: "auto", overflowY: "scroll"}}>
						{this.state.files.map((item) => {
							return (
								<Col className="files" key={item._id}>
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{textTransform: 'none', backgroundColor: "white", textAlign: "left", 
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons"  style={{marginRight: "10px"}} /> : 
											<DescriptionIcon className="icons"  style={{marginRight: "10px"}}/>)}
										onContextMenu={this.rightClickFile}
										onClick={() => this.clickFile(item)}
									>
										{item.name}
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