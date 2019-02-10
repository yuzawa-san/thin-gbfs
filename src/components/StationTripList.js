import React from 'react';
import injectSheet from 'react-jss';
import PointsLabel from './PointsLabel';
import geo from '../geo';
import { emojiString, STATION_EMOJI_CODES } from '../emoji';
import { FILTER_BIKES, FILTER_DOCKS } from '../filters.js';
import Button from '@material-ui/core/Button';
import ChangeIcon from '@material-ui/icons/Create';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import LinearProgress from '@material-ui/core/LinearProgress';
import Avatar from '@material-ui/core/Avatar';

const LIMIT = 15;
const AT_DESTINATION_METERS = 500;

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
		borderRight: '1px solid black',
		fontSize: '10px'
	},
	tripHeader: {
		background: '#ccc',
		padding: '2px'
	},
	split: {
		width: '100%',
		display: 'table',
	},
	splitRight: {
		display: 'table-cell',
		verticalAlign: 'middle',
		textAlign: 'right'
	},
	splitLeft: {
		display: 'table-cell',
		verticalAlign: 'middle'
	},
	row: {
		cursor: 'pointer',
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
		let destinationButton = (<Button size="small" variant="outlined" onClick={(e) => onSetDestination("")}><ChangeIcon/></Button>);
		let destinationSelect = null;
		const destinationStation = labeledStations[destination];
		if (!destinationStation || destinationStation.delta.distance < AT_DESTINATION_METERS) {
			const destinations = STATION_EMOJI_CODES
				.filter((code) => labeledStations[code])
				.map((code) => {
					const labeledStation = labeledStations[code];
					const distance = labeledStation.delta.distance < AT_DESTINATION_METERS ?
						"\u2705 You are here" :
						`${geo.getDistanceString(labeledStation.delta.distance)} ${geo.cardinalDirection(labeledStation.delta.bearing)}`
					return (<div key={code} className={classes.row} onClick={(e) => onSetDestination(code)}>
							<ListItem>
								<ListItemAvatar>
									<Avatar>{emojiString(code)}</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={labeledStation.name}
									secondary={distance} />
							</ListItem>
						</div>
						
						);
				});
			destinationButton = null;
			destinationSelect = (<div>
				<div className={classes.message}>Select trip destination:</div>
				<List dense={true}>
					{destinations}
				</List>
				<div className={classes.message}>
					<span className={classes.destinationInfo}>
						Select a station marker in the map to set a label which can be used as a destination.
					</span>
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
					const emoji = emojiString(station.label, station.favorite);
					if (emoji) {
						title=`${emoji} ${title}`;
					}
					return (
					<div className={classes.row} key={station.id} onClick={(e) => onSetCenter(e,station.coords)}>
						<ListItem className={classes.stationInner}>
							<ListItemAvatar>
								<LinearProgress className={classes.progress} variant="determinate" value={station.status.pct*100} />
							</ListItemAvatar>
							{title}
							<ListItemSecondaryAction>
								<PointsLabel pts={station.status.pts}/>
							</ListItemSecondaryAction>
						</ListItem>
					</div>);
				});
		};
		return (<div>
			{destinationSelect}
			<div className={classes.tripHeader}>
				<div className={classes.split}>
					<div className={classes.splitLeft}>
						Bikes near you
					</div>
					<div className={classes.splitRight}>
						Docks near {emojiString(destination)} {destinationButton}
					</div>
				</div>
			</div>
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

export default injectSheet(styles)(StationList);