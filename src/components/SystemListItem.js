import React from 'react';


export default class SystemListItem extends React.Component {
	render() {
		const { system } = this.props;
		const button = system.nearby ? <button onClick={this.selectSystem}>Use</button> : ""
		return (
			<div onClick={this.setCenter}>
				{system.emoji} {button} <strong>{system.name}</strong> - {system.city}
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