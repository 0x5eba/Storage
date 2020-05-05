import React, { Component } from 'react';

class Shell extends Component {
    constructor(props) {
		super(props)
		this.state = {

        }
    }

    componentWillMount = () => {
        console.log(this.props)
    }

    // command = () => {
    //     var command = "ls"
    //     if(command.length > 0){
    //         var result = []

    //         if(command.substring(0, 2) === "ls"){
    //             folders.forEach((element) => {
    //                 result.push(element['name'])
    //             })

    //             files.forEach((element) => {
    //                 result.push(element['name'])
    //             })

    //             notes.forEach((element) => {
    //                 result.push(element['title'])
    //             })

    //             console.log(result)
    //         }

    //         else if(command.substring(0, 2) === "cd"){
    //             console.log(command)
    //         }

    //         else if(command.substring(0, 2) === "rm"){
    //             console.log(command)
    //         }

    //         else if(command.substring(0, 3) === "cat"){
    //             console.log(command)
    //         }

    //         else if(command.substring(0, 4) === "help"){
    //             console.log(command)
    //         }

    //         else if(command.substring(0, 4) === "clear"){
    //             console.log(command)
    //         }

    //         else if(command.substring(0, 14) === "shareable_link"){
    //             console.log(command)
    //         }
    //     }
    // }

	render() {
		return (
			<div style={{ width: "100%", height: "300px", backgroundColor: "#263238" }}>
                <div>
                    {true === true ? <span style={{color: "#54c3f8", margin: "0px"}}>d</span> : <span style={{color: "#656565", margin: "0px"}}>-</span>}
                    <span style={{color: "#cc861e", margin: "0px"}}>r</span>
                    {true === true ? <span style={{color: "#b83346", margin: "0px"}}>w</span> : <span style={{color: "#656565", margin: "0px"}}>-</span>}
                    {true === true ? <span style={{color: "#6b9c3b", margin: "0px"}}>x</span> : <span style={{color: "#656565", margin: "0px"}}>-</span>}
                    <span style={{color: "#cc861e", margin: "0px"}}>r</span>
                    <span style={{color: "#656565", margin: "0px"}}>-</span>
                    {true === true ? <span style={{color: "#6b9c3b", margin: "0px"}}>x</span> : <span style={{color: "#656565", margin: "0px"}}>-</span>}
                    <span style={{color: "#cc861e", margin: "0px"}}>r</span>
                    <span style={{color: "#656565", margin: "0px"}}>-</span>
                    {true === true ? <span style={{color: "#6b9c3b", margin: "0px"}}>x</span> : <span style={{color: "#656565", margin: "0px"}}>-</span>}
                </div>
            </div>
		)
	}
}

export default Shell;