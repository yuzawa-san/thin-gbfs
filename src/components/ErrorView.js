import React from 'react';
import injectSheet from 'react-jss';
import Button from '@material-ui/core/Button';

const styles = {
	root: {
		width: '100%',
		height: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '5px'
	},
	inner: {
		margin: 'auto'
	}
}

class ErrorView extends React.Component {
	render() {
		const { classes, error } = this.props
		return (
			<div className={classes.root}>
				<div className={classes.inner}>
					<strong>An error has occurred:</strong><br/>
					<p>{error}</p>
					<Button variant='contained' onClick={() => window.location.reload()}>Reload</Button>
				</div>
			</div>
		);
	}
}

export default injectSheet(styles)(ErrorView);