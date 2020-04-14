import React, { Component } from 'react';
import Home from "./Home"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

class App extends Component {
	render() {
		return (
			<div>
				<Router>
					<Switch>
						<Route path="/" component={Home} />
						{/* <Route path="/file" component={File} />
						<Route path="/folder" component={Folder} /> */}
					</Switch>
				</Router>
			</div>
		)
	}
}

export default App;