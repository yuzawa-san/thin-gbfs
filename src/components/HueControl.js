import React from 'react';
import injectSheet from 'react-jss';
import { withTheme } from '@material-ui/core/styles';
import { hcl } from 'd3-color';

const styles = {
	sample: {
		display: 'inline-block',
		width: '10px',
		height: '10px'
	}
}

export const DEFAULT_HUE = 46;
export const MAIN_LUMINANCE = 58;
export const ALT_LUMINANCE = 85;

class HueControl extends React.Component {
	state = {};
	save = () => {
		localStorage.setItem("color", this.state.hue)
		window.location.reload();
	}
	reset = () => {
		localStorage.setItem("color", DEFAULT_HUE)
		window.location.reload();
	}
	
	update = (e) => {
		this.setState({hue:parseInt(e.target.value)});
	}
	
	componentDidMount(){
		const {hue} = this.props.theme;
		this.setState({hue});
	}
	
	render() {
		const { hue } = this.state;
		if (hue === undefined) {
			return null;
		}
		const preview = hcl(hue, 100, MAIN_LUMINANCE).toString();
		return (
			<div>
				Customize Hue: <div className={this.props.classes.sample} style={{background:preview}}></div><br/>
				<input onChange={this.update} defaultValue={hue} type="range" min="0" max="360"/><br/>
				<button onClick={this.save}>save</button>
				<button onClick={this.reset}>reset</button>
			</div>
		);
	}
}

export default withTheme()(injectSheet(styles)(HueControl));