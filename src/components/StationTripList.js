import React from 'react';
import injectSheet from 'react-jss';
import Progress from './Progress';
import PointsLabel from './PointsLabel';
import geo from '../geo';
import { emojiString, STATION_EMOJI_CODES } from '../emoji';
import { FILTER_BIKES, FILTER_DOCKS } from '../filters.js';

const LIMIT = 10;
const AT_DESTINATION_METERS = 300;

const styles = {
	message: {
		padding: '5px'
	},
	tripContainer: {
		display: 'flex',
		width: '100%',
	},
	tripCell: {
		flex: '1',
		'border-right': '1px solid black',
		'font-size': '10px'
	},
	tripHeader: {
		flex: '1',
		'border-right': '1px solid black',
		'font-size': '10px',
		padding: '2px',
		background: "#ccc"
	},
	tripPoints: {
		float: 'right'
	},
	row: {
		'cursor': 'pointer',
		'padding': '2px',
		'&:nth-child(even)': {
			'background-color': '#f0f0f0'
		}
	},
	destinationLeft: {
		padding: '1px',
		'font-size': '1.5em',
		display: 'inline-block',
		'vertical-align': 'middle'
	},
	destinationRight: {
		padding: '1px',
		display: 'inline-block',
		'vertical-align': 'middle'
	},
	destinationInfo: {
		'font-size': '10px',
		'color': 'grey'
	}
};

class StationList extends React.Component {
	render() {
		const { stations, mainColor, onCenter, trip, classes, destination, onDestination } = this.props;
		const labeledStations = {};
		stations.forEach((station) => {
			if (station.label ) {
				labeledStations[station.label] = station;
			}
		});
		let destinationButton = <button onClick={(e) => onDestination("")}>Change</button>
		let destinationSelect = null;
		const destinationStation = labeledStations[destination];
		if (!destinationStation || destinationStation.delta.distance < AT_DESTINATION_METERS) {
			const destinations = STATION_EMOJI_CODES
				.filter((code) => labeledStations[code])
				.map((code) => {
					const labeledStation = labeledStations[code];
					const distance = labeledStation.delta.distance < AT_DESTINATION_METERS ?
						"You are here" :
						`${geo.getDistanceString(labeledStation.delta.distance)} ${geo.cardinalDirection(labeledStation.delta.bearing)}`
					return <div key={code} className={classes.row} onClick={(e) => onDestination(code)}>
							<div className={classes.destinationLeft}>{emojiString(code)}</div>
							<div className={classes.destinationRight}>
								<strong>{labeledStation.name}</strong>
								<div className={classes.destinationInfo}>{distance}</div>
							</div>
						</div>
				});
			destinationButton = null;
			destinationSelect = <div>
				<div className={classes.message}>Select trip destination:</div>
				<div>
					{destinations}
				</div>
				<div className={classes.message}>
					<span className={classes.destinationInfo}>
						Select a station marker in the map to set a label which can be used as a destination.
					</span>
				</div>
			</div>
		}
		const process = (filter, deltaName) => {
			return stations
				.filter(filter)
				.sort((a,b) => (a[deltaName].distance - b[deltaName].distance))
				.slice(0, LIMIT)
				.map((station) => {
					return <div
						key={station.id}
						className={classes.row} onClick={(e) => onCenter(e,station.coords)}>
							<Progress width="20px" mainColor={mainColor} value={station.status.pct}/> {station.emoji} <strong>{station.name}</strong>
							<div className={classes.tripPoints}><PointsLabel pts={station.status.pts}/></div>
					</div>
				});
		};
		return <div>
			{destinationSelect}
			<div className={classes.tripContainer}>
				<div className={classes.tripHeader}>
					Bikes near you
				</div>
				<div className={classes.tripHeader}>
					Docks near {emojiString(destination)} {destinationButton}
				</div>
			</div>
			<div className={classes.tripContainer}>
				<div className={classes.tripCell}>
					{process(FILTER_BIKES, 'delta')}
				</div>
				<div className={classes.tripCell}>
					{process(FILTER_DOCKS, 'deltaDestination')}
				</div>
			</div>
		</div>;
	}
}

export default injectSheet(styles)(StationList);