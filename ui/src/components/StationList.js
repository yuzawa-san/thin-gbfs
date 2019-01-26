import React from 'react';
import injectSheet from 'react-jss';
import Progress from './Progress';
import PointsLabel from './PointsLabel';
import geo from '../geo';

const LIMIT = 25;

const styles = {
	row: {
		'cursor': 'pointer',
		'padding': '2px',
		'&:nth-child(even)': {
			'background-color': '#f0f0f0'
		}
	},
	stationLeft: {
		padding: '3px',
		display: 'inline-block',
		width: '50px',
		'vertical-align': 'middle'
	},
	stationRight: {
		padding: '3px',
		display: 'inline-block',
		'vertical-align': 'middle'
	},
	stationInfo: {
		'font-size': '10px',
		'color': 'grey'
	}
};

class StationList extends React.Component {
	render() {
		const { stations, mainColor, onCenter, classes } = this.props;
		const items = stations
			.filter((station) => station.active)
			.sort((a,b) => (a.delta.distance - b.delta.distance))
			.slice(0, LIMIT)
			.map((station) => {
				return <div
					key={station.id}
					className={classes.row}
					onClick={(e) => onCenter(e,station.coords)}>
						<div className={classes.stationLeft}>
							<Progress width="100%" mainColor={mainColor} value={station.status.pct}/>
						</div>
						<div className={classes.stationRight}>
							{station.emoji} <strong>{station.name}</strong>
							<div className={classes.stationInfo}>
								{station.status.bikes} bikes, {station.status.docks} docks, {geo.getDistanceString(station.delta.distance)} {geo.cardinalDirection(station.delta.bearing)}
								<PointsLabel prefix=", " pts={station.status.pts}/>
							</div>
						</div>
					</div>
			});
		return <div>{items}</div>;
	}
}

export default injectSheet(styles)(StationList);