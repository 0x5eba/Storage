import React, { Component } from 'react';
import Home from "./Home"
import Home2 from "./Home2"
import Note from "./Note"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

class App extends Component {
	render() {
		return (
			<div>
				<Router>
					<Switch>
						<Route path="/note" exact component={Note} />
						<Route path="/" component={Home2} />

						{/* <Route path="/file" component={File} />
						<Route path="/folder" component={Folder} /> */}
					</Switch>
				</Router>
			</div>
		)
	}
}

export default App;