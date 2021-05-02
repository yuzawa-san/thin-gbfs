import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = {
	root: {
		width: '100%',
		height: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	progress: {
		margin: 'auto'
	}
};

class ProgressView extends React.Component {
	render() {
		const { classes } = this.props;
		return (
			<div className={classes.root}>
				<CircularProgress className={classes.progress}/>
			</div>
		);
	}
}

export default withStyles(styles)(ProgressView);