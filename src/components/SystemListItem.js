import React from 'react';

import IconButton from '@material-ui/core/IconButton';
import GpsNotFixedIcon from '@material-ui/icons/GpsNotFixed';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InputIcon from '@material-ui/icons/Input';


export default class SystemListItem extends React.Component {
	render() {
		const { system } = this.props;
		const label = system.nearby ? <CheckCircleIcon/> : <InputIcon/>;
		return (
			<div>
				{system.emoji} <IconButton size="small" onClick={this.setCenter}><GpsNotFixedIcon/></IconButton> <IconButton size="small" onClick={this.selectSystem}>{label}</IconButton> <strong>{system.name}</strong> - {system.city}
		</div>);
	}
	selectSystem = () => {
		this.props.onSystemSelect(this.props.system);
	};
	setCenter = (e) => {
		const {lat, lon} = this.props.system;
		this.props.onCenter(e,[lat, lon]);
	};
}