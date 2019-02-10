import React from 'react';
import SplitView from './SplitView';
import SystemMarker from './map/SystemMarker';
import List from '@material-ui/core/List';

import IconButton from '@material-ui/core/IconButton';
import SelectIcon from '@material-ui/icons/Input';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';

export default class SystemsView extends React.Component {
	render() {
		const { systems, onSetSystem, onSetCenter, currentPosition, onViewportChanged, viewport } = this.props;
		return (
			<SplitView 
				currentPosition={currentPosition}
				onViewportChanged={onViewportChanged}
				viewport={viewport}
				markers={systems.map((system)=>{
					return (<SystemMarker key={system.id} system={system} mainColor="red" />);
				})}>
				<List dense={true}>
				{systems.map((system) => {
					return (
						<ListItem key={system.id} alignItems="flex-start">
							<ListItemAvatar>
								<Avatar>{system.emoji}</Avatar>
							</ListItemAvatar>
							<ListItemText
								onClick={(e) => onSetCenter(e,[system.lat, system.lon])}
								primary={system.name}
								secondary={system.city}
							/>
							<ListItemSecondaryAction onClick={() => onSetSystem(system)}>
								<IconButton>
									<SelectIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>);
				})}
				</List>
			</SplitView>
		);
	}
}