import React from 'react';
import injectSheet from 'react-jss';

const styles = {
	progressBar: {
		width: '100px',
		display: 'inline-block',
		'background-color': '#eee',
		'border-radius': '2px',
		'box-shadow': '0 2px 5px rgba(0,0,0,0.25) inset',
		height: '6px',
		'vertical-align': 'middle'
	},
	progressBarValue: {
		'border-radius': '2px',
		'height': '100%',
	}
};

class Progress extends React.Component {
	render() {
		const {width, value, mainColor, classes} = this.props;
		const inlineStyle = {
			width: ((value || 0) * 100).toFixed(1) + "%",
			background: mainColor
		}
		return (<div className={classes.progressBar} style={{width: width}}>
			<div className={classes.progressBarValue} style={inlineStyle}></div>
		</div>);
	}
}

export default injectSheet(styles)(Progress);