import React from 'react';
import injectSheet from 'react-jss';
import pivot from '../pivot';
import geo from '../geo';
import SplitView from './SplitView';
import StationList from './StationList';
import StationTripList from './StationTripList';
import StationMarker from './map/StationMarker';
import { getFilter } from '../filters.js';
import ProgressView from './ProgressView';

import AllIcon from '@material-ui/icons/ImportExport';
import BikeIcon from '@material-ui/icons/CallMade';
import DockIcon from '@material-ui/icons/CallReceived';
import TripIcon from '@material-ui/icons/Redo';

import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';

const styles = {
	root: {
		width: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column'
	},
	scroll: {
		flex: 1,
		overflow: "auto",
		'-webkit-overflow-scrolling': 'touch'
	},
	bottomBar: {
		flexShrink: 0
	},
}

class SystemView extends React.Component {
	state = {
		displayMode: localStorage.getItem("display") || "all",
		bikes: [],
		stations: [],
		idToStations: {},
		labelsToStations: {},
		statuses: {}
	}
	
	componentWillUnmount() {
		clearInterval(this.timerID);
	}
	
	componentDidMount(){
		const system = this.props.currentSystem;
		return fetch("/systems/"+system.id+"/info")
			.then((response) => response.json())
			.then((responseJson) => {
				const {id} = system;
				// load favorites and labels
				// TODO: remove legacy migration
				const favorites = JSON.parse(localStorage.getItem("fave_"+id)) || {};
				const destination = localStorage.getItem("destination_"+id);
				const labelsToStations = JSON.parse(localStorage.getItem("labels_"+id))
					|| JSON.parse(localStorage.getItem("commute_"+id))
					|| {};
				// localStorage.removeItem("commute_"+id);
				// localStorage.removeItem("commute_"+id+"_from");
				// localStorage.removeItem("commute_"+id+"_to");
				
				const {url} = responseJson;
				// region and stations should be constant
				const regions = pivot(responseJson.regions);
				const stations = pivot(responseJson.stations);
				const stationsToRegion = {};
				const idToStations = {};
				stations.forEach((station) => {
					// maintain station to region lookups for alerting
					stationsToRegion[station.id] = station.region
					idToStations[station.id] = station;
					station.coords = [station.lat, station.lon];
				});
				// save all of this immutable info on the state
				this.setState({
					id,
					url,
					favorites,
					destination,
					labelsToStations,
					regions,
					stations,
					stationsToRegion,
					idToStations
				});
				// fetch system's station statuses
				this.reload();
				// and do that periodically
				this.timerID = setInterval(() => this.reload(),	10000);
			})
			.catch((error) =>{
				alert(error);
			});
	}
	
	reload = () => {
		return fetch("/systems/"+this.state.id+"/status")
			.then((response) => response.json())
			.then((responseJson) => {
				const timestamp = Date.now();
				// stash the raw state on the system
				const statuses = {}
				const bikes = pivot(responseJson.bikes);
				bikes.forEach((bike) => {
					statuses[bike.id] = {timestamp, isBike:true, docks: 0, bikes: 0, pct: 1.0, alerts: []};
				});
				pivot(responseJson.statuses).forEach((statusItem) => {
					statusItem.timestamp = timestamp;
					// calculate percentage full and fast lookup tabld
					statusItem.pct = statusItem.bikes / (statusItem.docks + statusItem.bikes);
					// TODO: alerts
					statusItem.alerts = [];
					statuses[statusItem.id] = statusItem;
				});
				// trigger a redraw
				this.setState({
					bikes,
					statuses,
					loaded: true
				})
			})
			.catch((error) =>{
				alert(error);
			});
	}
	
	setFavorite = (stationId, isFavorite) => {
		const {id, favorites} = this.state;
		if (isFavorite) {
			favorites[stationId] = 1;
		} else {
			delete favorites[stationId];
		}
		localStorage.setItem("fave_"+id, JSON.stringify(favorites));
		this.setState({
			favorites
		});
	}
	
	setLabel = (stationId, label) => {
		const {id, labelsToStations} = this.state;
		const existingLabel = Object.keys(labelsToStations).find(key => labelsToStations[key] === stationId);
		delete labelsToStations[existingLabel];
		if (label) {
			labelsToStations[label] = stationId;
		}
		localStorage.setItem("labels_"+id, JSON.stringify(labelsToStations));
		this.setState({
			labelsToStations
		});
	}

	setDestination = (destination) => {
		const {id } = this.state;
		localStorage.setItem("destination_"+id, destination);
		this.setState({
			destination
		});
	}
	
	setDisplayMode = (e, value) => {
		localStorage.setItem("display", value);
		this.setState({
			displayMode: value
		});
	}
	
	render() {
		const { classes,  currentSystem, onSetCenter, currentPosition, onViewportChanged, viewport } = this.props;
		const { displayMode, url, stations, bikes, statuses, favorites, idToStations, destination, labelsToStations, loaded } = this.state;
		let attribution = null;
		let content = null;
		
		const labels = {};
		if (labelsToStations) {
			Object.keys(labelsToStations).forEach((label) => {
				labels[labelsToStations[label]] = label;
			});
		}
	
		const {latitude, longitude} = currentPosition.coords;
		const destinationStation = idToStations[labelsToStations[destination]] || {};
		const filter = getFilter(displayMode);
		const METERS_PER_POINT = 250;
		const effective = bikes.concat(stations).map((station) => {
			const { id, lat, lon } = station;
			const out = {
				...station,
				favorite: favorites[id],
				label: labels[id],
				status: statuses[id] || {},
				delta: geo.delta(latitude, longitude, lat, lon),
				deltaDestination: geo.delta(lat, lon, destinationStation.lat, destinationStation.lon)
			};
			const pts = (out.status.pts || 0);
			out.bikeAffinity = out.delta.distance + pts * METERS_PER_POINT;
			out.dockAffinity = out.deltaDestination.distance - pts * METERS_PER_POINT;
			out.active = filter(out);
			return out;
		});
		const markers = effective.map((station) => {
			return (<StationMarker key={station.id} station={station} mainColor="red" hue={43} onSetLabel={this.setLabel} onSetFavorite={this.setFavorite}/>);
		});
		if (loaded) {
			attribution = `<a href="${url}" target="blank">${currentSystem.name}</a>`;
			if(displayMode==="trip"){
				content = (<StationTripList stations={effective} onSetCenter={onSetCenter} onSetDestination={this.setDestination} destination={destination}/>);
			}else{
				content = (<StationList stations={effective} onSetCenter={onSetCenter}/>);
			}
		} else {
			content = (<ProgressView/>);
		}
		const dt=(<p>{`${Date.now()}`}</p>);
		return (
			<SplitView
				attribution={attribution}
				currentPosition={currentPosition}
				onViewportChanged={onViewportChanged}
				viewport={viewport} markers={markers}>
				<div className={classes.root}>
					<div className={classes.scroll}>
						{dt}
						{content}
					</div>
					<BottomNavigation value={displayMode} onChange={this.setDisplayMode} className={classes.bottomBar}>
						<BottomNavigationAction label="All" value="all" icon={<AllIcon />} />
						<BottomNavigationAction label="Bikes" value="bike" icon={<BikeIcon />} />
						<BottomNavigationAction label="Docks" value="dock" icon={<DockIcon />} />
						<BottomNavigationAction label="Trip" value="trip" icon={<TripIcon />} />
					</BottomNavigation>
				</div>
			</SplitView>
		);
	}
}

export default injectSheet(styles)(SystemView);