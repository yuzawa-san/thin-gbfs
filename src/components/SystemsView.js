import React from 'react';
import SplitView from './SplitView';
import SystemMarker from './map/SystemMarker';
import List from '@material-ui/core/List';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import SelectIcon from '@material-ui/icons/Input';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';

const PAGE = 25;

export default class SystemsView extends React.Component {
	state = {
		search: '',
		count: PAGE
	};
	
	onSearch = (e) => {
		this.setState({
			search: e.target.value
		})
	}
	
	onShowMore = () => {
		this.setState({
			count: this.state.count + PAGE
		})
	}
	
	render() {
		const { systems, onSetSystem, onSetCenter, currentPosition, viewport } = this.props;
		const { search, count } = this.state;
		const lowercaseSearch = search.toLowerCase();
		let filteredSystems = systems;
		if (search) {
			filteredSystems = filteredSystems.filter((system) => {
				return system.name.toLowerCase().includes(lowercaseSearch) || system.city.toLowerCase().includes(lowercaseSearch);
			})
		}
		let showMore = null;
		if (filteredSystems.length > count) {
			filteredSystems = filteredSystems.slice(0, count);
			showMore = (<Button onClick={this.onShowMore}>show more</Button>);
		}
		return (
			<SplitView 
				currentPosition={currentPosition}
				viewport={viewport}
				markers={systems.map((system)=>{
					return (<SystemMarker key={system.id} system={system} mainColor="red" />);
				})}>
				<input value={search} onChange={this.onSearch} placeholder="search..." style={{margin:'5px'}}/>
				<List dense={true}>
				{filteredSystems.map((system) => {
					return (
						<ListItem key={system.id} alignItems="flex-start">
							<ListItemAvatar>
								<Avatar>
									{system.emoji}
								</Avatar>
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
				{showMore}
			</SplitView>
		);
	}
}