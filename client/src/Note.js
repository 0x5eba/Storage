import React, { Component } from 'react';
import MDReactComponent from 'markdown-react-js';

class Note extends Component {
	render() {
		return (
			<div>
				<MDReactComponent text={this.props.text} style={{wordBreak: "break-all"}} />  
			</div>
		)
	}
}

export default Note;