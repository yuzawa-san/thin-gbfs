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

const LIMIT = 25;

const styles = {
	row: {
		cursor: 'pointer',
		padding: '5px',
		'&:nth-child(even)': {
			backgroundColor: '#f0f0f0'
		}
	}
};

class StationList extends React.Component {
	render() {
		const { stations, onSetCenter, classes } = this.props;
		const items = stations
			.filter((station) => station.active)
			.sort((a,b) => (a.delta.distance - b.delta.distance))
			.slice(0, LIMIT)
			.map((station) => {
				let title = station.name;
				const emoji = emojiString(station.label, station.favorite);
				if (emoji) {
					title=`${emoji} ${title}`;
				}
				return (
					<ListItem className={classes.row} key={station.id} onClick={(e) => onSetCenter(e,station.coords)}>
						<ListItemAvatar>
							<LinearProgress variant="determinate" value={station.status.pct*100} />
						</ListItemAvatar>
						<ListItemText
							primary={title}
							secondary={<span>
								{station.status.bikes} bikes, {station.status.docks} docks, {geo.getDistanceString(station.delta.distance)} {geo.cardinalDirection(station.delta.bearing)}
								<PointsLabel prefix=", " pts={station.status.pts}/></span>}
						/>
					</ListItem>);
			});
		return (<List dense={true}>{items}</List>);
	}
}

export default injectSheet(styles)(StationList);