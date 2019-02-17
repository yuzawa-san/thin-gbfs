import React from 'react';
import injectSheet from 'react-jss';
import PointsLabel from './PointsLabel';
import geo from '../geo';
import { emojiString } from '../emoji';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import Avatar from '@material-ui/core/Avatar';

const LIMIT = 25;

const styles = {
	row: {
		cursor: 'pointer',
		userSelect: 'none',
		padding: '5px',
		'&:nth-child(even)': {
			backgroundColor: '#f0f0f0'
		}
	}
};

class StationList extends React.Component {
	render() {
		const { stations, onSetCenter, classes } = this.props;
		const nowMs = Date.now();
		const items = stations
			.filter((station) => station.active)
			.sort((a,b) => (a.delta.distance - b.delta.distance))
			.slice(0, LIMIT)
			.map((station) => {
				let geoInfo = `${geo.getDistanceString(station.delta.distance)} ${geo.cardinalDirection(station.delta.bearing)}`;
				if (station.isBike) {
					return (
						<ListItem className={classes.row} key={station.id} onClick={(e) => onSetCenter(e,station.coords)}>
							<ListItemAvatar>
								<Avatar>
									{emojiString('1F6B2')}
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={station.name}
								secondary={geoInfo}
							/>
						</ListItem>);
				}
				let title = station.name;
				const emoji = emojiString(station.label, station.favorite);
				if (emoji) {
					title=`${emoji} ${title}`;
				}
				let info = `${station.status.bikes} bikes, ${station.status.docks} docks, ${geoInfo}`;
				if (station.status.mod) {
					info += ", " + ((nowMs / 1000 - station.status.mod) / 60).toFixed(0) + "m ago";
				}
				return (
					<ListItem className={classes.row} key={station.id} onClick={(e) => onSetCenter(e,station.coords)}>
						<ListItemAvatar>
							<LinearProgress variant="determinate" value={station.status.pct*100} />
						</ListItemAvatar>
						<ListItemText
							primary={title}
							secondary={<span>
								{info}
								<PointsLabel prefix=", " pts={station.status.pts}/></span>}
						/>
					</ListItem>);
			});
		return (<List dense={true}>
			{items}
		</List>);
	}
}

export default injectSheet(styles)(StationList);