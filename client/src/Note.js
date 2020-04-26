import React, { Component } from 'react';
import MDReactComponent from 'markdown-react-js';

class Note extends Component {
	render() {
		return (
			<div>
				<MDReactComponent text={this.props.text} />  
			</div>
		)
	}
}

export default Note;