import React from 'react';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { hcl } from 'd3-color';
import Button from '@material-ui/core/Button';

const styles = {
	sample: {
		display: 'inline-block',
		width: '10px',
		height: '10px'
	},
	slider: {
		width: '100%'
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
		const { classes } = this.props;
		const { hue } = this.state;
		if (hue === undefined) {
			return null;
		}
		const preview = hcl(hue, 100, MAIN_LUMINANCE).toString();
		return (
			<div>
				Customize Hue: <div className={classes.sample} style={{background:preview}}></div><br/>
				<input className={classes.slider} onChange={this.update} defaultValue={hue} type="range" min="0" max="360"/><br/>
				<Button size='small' onClick={this.save}>Save</Button>
				<Button size='small' onClick={this.reset}>Reset</Button>
			</div>
		);
	}
}

export default withTheme()(withStyles(styles)(HueControl));