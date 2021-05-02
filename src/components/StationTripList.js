import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PointsLabel from './PointsLabel';
import geo from '../geo';
import { emojiString, STATION_EMOJI_CODES } from '../emoji';
import { FILTER_BIKES, FILTER_DOCKS } from '../filters.js';
import ChangeIcon from '@material-ui/icons/Create';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import LinearProgress from '@material-ui/core/LinearProgress';
import Avatar from '@material-ui/core/Avatar';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

const LIMIT = 15;
const AT_DESTINATION_METERS = 500;

const styles = {
	message: {
		padding: '5px'
	},
	stationEntry: {
		display: 'flex',
		width: '100%'
	},
	stationName: {
		flex: 1
	},
	stationPoints: {
		textAlign: 'right'
	},
	tripContainer: {
		display: 'flex',
		width: '100%',
	},
	tripCell: {
		flex: '1',
		borderRight: '1px solid black',
		fontSize: '10px'
	},
	tripHeader: {
		display: 'flex',
		minHeight: 'unset',
		padding: '3px'
	},
	tripHeaderRight: {
		flex: 1,
		textAlign: 'right'
	},
	changeIcon: {
		verticalAlign: 'middle'
	},
	row: {
		cursor: 'pointer',
		userSelect: 'none',
		'&:nth-child(even)': {
			backgroundColor: '#f0f0f0'
		}
	},
	stationInner: {
		padding: '2px',
	},
	progress: {
		width: "20px"
	},
	destinationInfo: {
		fontSize: '10px',
		color: 'grey'
	}
};

class StationList extends React.Component {
	render() {
		const { stations, onSetCenter, classes, destination, onSetDestination } = this.props;
		const labeledStations = {};
		stations.forEach((station) => {
			if (station.label ) {
				labeledStations[station.label] = station;
			}
		});
		let destinationSelect = null;
		const destinationStation = labeledStations[destination];
		if (!destinationStation || destinationStation.delta.distance < AT_DESTINATION_METERS) {
			const destinations = STATION_EMOJI_CODES
				.filter((code) => labeledStations[code])
				.map((code) => {
					const labeledStation = labeledStations[code];
					const distance = labeledStation.delta.distance < AT_DESTINATION_METERS ?
						"\u2705 You are here" :
						`${geo.getDistanceString(labeledStation.delta.distance)} ${geo.cardinalDirection(labeledStation.delta.bearing)}`;
					return (<div key={code} className={classes.row} onClick={(e) => onSetDestination(code)}>
							<ListItem>
								<ListItemAvatar>
									<Avatar>
										{emojiString(code)}
									</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={labeledStation.name}
									secondary={distance} />
							</ListItem>
						</div>
						
						);
				});
			const help = (<span className={classes.destinationInfo}>
				Select a station marker in the map to set a label which can be used as a destination.
			</span>);
			if (destinations.length === 0) {
				return (<div className={classes.message}>
					No labeled stations!
					<br/>
					{help}
				</div>);
			}
			destinationSelect = (<div>
				<div className={classes.message}>Select trip destination:</div>
				<List dense={true}>
					{destinations}
				</List>
				<div className={classes.message}>
					{help}
				</div>
			</div>);
		}
		const process = (filter, affinity) => {
			return stations
				.filter((station) => station.active && filter(station))
				.sort((a,b) => {
					return (a[affinity] - b[affinity]);
				})
				.slice(0, LIMIT)
				.map((station) => {
					let title = station.name;
					const emoji = emojiString(station.isBike ? '1F6B2' : station.label, station.favorite);
					if (emoji) {
						title=`${emoji} ${title}`;
					}
					return (
					<div className={classes.row} key={station.id} onClick={(e) => onSetCenter(e,station.coords)}>
						<ListItem className={classes.stationInner}>
							<ListItemAvatar>
								<LinearProgress className={classes.progress} variant="determinate" value={station.status.pct*100} />
							</ListItemAvatar>
							<div className={classes.stationEntry}>
								<div className={classes.stationName}>
									{title}
								</div>
								<div className={classes.stationPoints}>
									<PointsLabel pts={station.status.pts}/>
								</div>
							</div>
						</ListItem>
					</div>);
				});
		};
		return (<div>
			<AppBar position="sticky" color="primary">
				<Toolbar className={classes.tripHeader}>
					<div>Bikes near you</div>
					<div className={classes.tripHeaderRight} onClick={(e) => onSetDestination("")}>
						Docks near {emojiString(destination)}
						<ChangeIcon className={classes.changeIcon} />
					</div>
				</Toolbar>
			</AppBar>
			{destinationSelect}
			<div className={classes.tripContainer}>
				<div className={classes.tripCell}>
					<List dense={true}>
					{process(FILTER_BIKES, 'bikeAffinity')}
					</List>
				</div>
				<div className={classes.tripCell}>
					<List dense={true}>
					{process(FILTER_DOCKS, 'dockAffinity')}
					</List>
				</div>
			</div>
		</div>);
	}
}

export default withStyles(styles)(StationList);