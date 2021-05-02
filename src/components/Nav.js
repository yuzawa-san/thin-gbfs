import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import HueControl from './HueControl';

import SystemsListIcon from '@material-ui/icons/Language';
import CenterMapIcon from '@material-ui/icons/GpsFixed';
import InfoIcon from '@material-ui/icons/Info';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';

import 'leaflet/dist/leaflet.css';


const styles = {
	root: {
		width: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		fontSize: '14px',
		fontFamily: 'sans-serif'
	},
	content: {
		flex: 1,
		overflow: 'hidden'
	},
	header: {
		flexShrink: 0,
	},
	grow: {
		flexGrow: 1,
	}
};

class Nav extends React.Component {
	state = {
		showInfo: false
	};
	
	hideInfo = () => {
		this.setState({ showInfo: false });
	}
	
	showInfo = () => {
		this.setState({ showInfo: true });
	}
	
	
	render() {
		const {classes, title, children, onClearSystem, onSetCenter} = this.props;
		const { showInfo } = this.state;
		return (
			<div className={classes.root}>
				<AppBar position="static" className={classes.header}>
					<Toolbar>
						<Typography color="inherit" className={classes.grow}>
							<strong>
								thin-gbfs
							</strong>
							<br/>
							<small>
								{title}
							</small>
						</Typography>
						<IconButton color="inherit" onClick={this.showInfo}>
							<InfoIcon />
						</IconButton>
						<IconButton color="inherit" onClick={onClearSystem}>
							<SystemsListIcon />
						</IconButton>
						<IconButton color="inherit" onClick={onSetCenter}>
							<CenterMapIcon />
						</IconButton>
					</Toolbar>
					<Dialog onClose={this.hideInfo} open={showInfo}>
						<DialogContent>
							<Typography gutterBottom>
								<strong>thin-gbfs</strong> by <a href="https://github.com/yuzawa-san" target="blank">yuzawa-san</a><br/>
								<a href="https://github.com/yuzawa-san/thin-gbfs" target="blank">GitHub</a><br/>
								<a href="https://github.com/yuzawa-san/thin-gbfs/blob/master/README.md#software-license-info" target="blank">Licensing Info</a><br/>
								<a href="https://github.com/yuzawa-san/thin-gbfs/blob/master/LICENSE" target="blank">License</a><br/>
								sourced from <a href="https://github.com/NABSA/gbfs" target="blank">gbfs</a> &amp; <a href="https://github.com/eskerda/pybikes" target="blank">pybikes</a> via <a href="https://api.citybik.es/" target="blank">citibik.es</a>
								<HueControl/>
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button variant='contained' onClick={this.hideInfo} color="primary">
								Close
							</Button>
						</DialogActions>
					</Dialog>
				</AppBar>
				<div className={classes.content}>
					{children}
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(Nav);