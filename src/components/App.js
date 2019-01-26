import React from 'react';
import injectSheet from 'react-jss';
import SystemListItem from './SystemListItem';
import StationList from './StationList';
import StationTripList from './StationTripList';
import SegmentControl from './SegmentControl';
import SystemMarker from './map/SystemMarker';
import StationMarker  from './map/StationMarker';
import YouAreHereMarker from './map/YouAreHereMarker';
import { Map, Circle, CircleMarker, Popup, TileLayer, ScaleControl } from 'react-leaflet';
import { hcl } from 'd3-color';
import EmojiFlags from 'emoji-flags';
import geo from '../geo';
import { emojiString, STATION_EMOJI_CODES } from '../emoji';
import { getFilter } from '../filters.js';

import 'leaflet/dist/leaflet.css';

const styles = {
	container: {
		width: '100%',
		height: '100%',
		'font-size': '14px',
		'font-family': 'sans-serif'
	},
	map: {
		width: '100%',
		height: '50%',
		'border-bottom': '1px solid black',
	},
	leafletMap: {
		width: '100%',
		height: '100%'
	},
	content: {
		width: '100%',
		height: '50%',
		display: 'flex',
		'flex-direction': 'column'
	},
	header: {
		'flex-shrink': '0',
		'border-bottom': '1px solid black'
	},
	controls: {
		padding: '5px'
	},
	scroll: {
		'flex-grow': '1',
		'overflow-y': 'auto',
		'-webkit-overflow-scrolling': 'touch',
		'-webkit-touch-callout': 'none',
		'-webkit-user-select': 'none',
		'user-select': 'none'
	},
	appName: {
		display: 'none',
		'text-align': 'center',
		'font-weight': 'bold',
		'font-size': '1.5em',
		'border-bottom': '1px solid black',
		padding: '5px'
	},
	"@media screen and (min-width: 700px)": {
		container: {
			display: 'flex'
		},
		map: {
			height: '100%',
			flex: '1',
			'border-bottom': 'none',
			'border-right': '1px solid black'
		},
		content: {
			height: '100%',
			flex: 'initial',
			width: '350px'
		},
		appName: {
			display: 'block'
		}
	}
}

const POSITION_THRESHOLD_METERS = 300;
const NEARBY_SYSTEM_METERS = 25000;

class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			displayMode: localStorage.getItem("display") || "all",
			filter: (station) => {
				return !isNaN(station.status.pct);
			},
		}
	}
	
	pivot = (data) => {
      if (!data) {
          return [];
      }
      var out = [];
      for (var i = 1; i < data.length; i++) {
          var obj = {};
          var row = data[i];
          for (var j = 0; j < data[i].length; j++) {
              obj[data[0][j]] = data[i][j];
          }
          out.push(obj);
      }
      return out;
  };

	_joinStatuses = () => {
		const {currentSystem, currentPosition, displayMode} = this.state;
		const {statuses, bikes, alerts, info, favorites, labels, destination } = currentSystem;
		const stationLabels = {};
		Object.keys(labels).forEach((key) => {
			stationLabels[labels[key]] = key;
		});
		const destinationStation = info.idToStations[labels[destination]] || {};
		const filter = getFilter(displayMode);
		return info.stations.concat(bikes).map((station) => {
			const {isBike, id, name, lat, lon} = station;
			const isFavorite = !!favorites[id];
			const label = stationLabels[id];
			const emoji = emojiString(label, isFavorite) || "";
			const status = statuses[id] || {};
			const out = {
				id,
				name,
				coords: [lat, lon],
				status,
				isBike,
				isFavorite,
				label,
				emoji,
				delta: geo.delta(currentPosition[0], currentPosition[1], lat, lon),
				deltaDestination: geo.delta(destinationStation.lat, destinationStation.lon, lat, lon),
				alerts: []
			};
			
			out.active = filter(out);
			return out;
		});
	}
	
	// this triggers on a timer to fetch station status
	reload = () => {
		const {currentSystem} = this.state;
		if (!currentSystem) {
			// bail if no system
			return;
		}
		return fetch("/systems/"+currentSystem.id+"/status")
			.then((response) => response.json())
			.then((responseJson) => {
				// stash the raw state on the system
				const statuses = {}
				const bikes = this.pivot(responseJson.bikes);
				bikes.forEach((bike) => {
					bike.isBike = true;
					statuses[bike.id] = {docks: 0, bikes: 0, pct: 1.0};
				});
				this.pivot(responseJson.statuses).forEach((statusItem) => {
					// calculate percentage full and fast lookup tabld
					statusItem.pct = statusItem.bikes / (statusItem.docks + statusItem.bikes);
					statuses[statusItem.id] = statusItem;
				});
				currentSystem.bikes = bikes;
				currentSystem.alerts = responseJson.alerts;
				currentSystem.statuses = statuses;
				// trigger a redraw
				this.setState({
					currentSystem: currentSystem
				})
			})
			.catch((error) =>{
				alert(error);
			});
	};
	
	// load a system's info
	selectSystem = (system) => {
		localStorage.setItem("system", system.id);
		return fetch("/systems/"+system.id+"/info")
			.then((response) => response.json())
			.then((responseJson) => {
				const {id} = system;
				// load favorites and labels
				// TODO: remove legacy migration
				system.favorites = JSON.parse(localStorage.getItem("fave_"+id)) || {};
				system.destination = localStorage.getItem("destination_"+id);
				system.labels = JSON.parse(localStorage.getItem("labels_"+id))
					|| JSON.parse(localStorage.getItem("commute_"+id))
					|| {};
				localStorage.getItem("labels_"+id, JSON.stringify(system.labels));
				// localStorage.removeItem("commute_"+id);
				// localStorage.removeItem("commute_"+id+"_from");
				// localStorage.removeItem("commute_"+id+"_to");
				
				// region and stations should be constant
				responseJson.regions = this.pivot(responseJson.regions);
				responseJson.stations = this.pivot(responseJson.stations);
				const stationsToRegion = {};
				const idToStations = {};
				responseJson.stations.forEach((station) => {
					// maintain station to region lookups for alerting
					stationsToRegion[station.id] = station.region
					idToStations[station.id] = station;
				})
				responseJson.idToStations = idToStations;
				responseJson.stationsToRegion = stationsToRegion;
				system.info = responseJson;
				// stub status until real status is loaded
				system.alerts = [];
				system.bikes = [];
				system.statuses = {};
				// trigger a redraw
				this.setState({
					currentSystem: system,
				});
				// blow away existing timers
				clearInterval(this.timerID);
				// fetch system's station statuses
				this.reload();
				// and do that periodically
				this.timerID = setInterval(() => this.reload(),	10000);
			})
			.catch((error) =>{
				alert(error);
			});
	};
	
	// blow away system, so system selector will reappear
	clearSystem = () => {
		clearInterval(this.timerID);
		this.setState({
			currentSystem: undefined
		});
	}
	
	// the center to the a location
	setCenter = (e, newCenter) => {
		const {currentPosition} = this.state;
		this.setState({
			centerPosition: newCenter || [currentPosition[0]+Math.random()*1e-9, currentPosition[1]]
		});
	}
	
	setFavorite = (stationId, isFavorite) => {
		const {currentSystem} = this.state;
		const {favorites} = currentSystem;
		if (isFavorite) {
			favorites[stationId] = 1;
		} else {
			delete favorites[stationId];
		}
		localStorage.setItem("fave_"+currentSystem.id, JSON.stringify(favorites));
		this.setState({
			currentSystem: currentSystem
		});
	}
	
	setLabel = (stationId, label) => {
		const {currentSystem} = this.state;
		const {labels} = currentSystem;
		const existingLabel = Object.keys(labels).find(key => labels[key] === stationId);
		delete labels[existingLabel];
		if (label) {
			labels[label] = stationId;
		}
		localStorage.setItem("labels_"+currentSystem.id, JSON.stringify(labels));
		this.setState({
			currentSystem: currentSystem
		});
	}

	setDestination = (destination) => {
		const {currentSystem} = this.state;
		currentSystem.destination = destination;
		localStorage.setItem("destination_"+currentSystem.id, destination);
		this.setState({
			currentSystem: currentSystem
		});
	}
	
	
	setDisplayMode = (e) => {
		const value = e.target.value
		localStorage.setItem("display", value);
		this.setState({
			displayMode: value
		})
	}
	
	componentDidMount(){
		return fetch("/systems")
			.then((response) => response.json())
			.then((responseJson) => {
				const systems = this.pivot(responseJson);
				systems.forEach((system) => {
					const isoMatch = system.city.match(/, ([A-Z]{2})$/);
					if (isoMatch) {
						var emojiFlag = EmojiFlags.countryCode(isoMatch[1]);
						if (emojiFlag) {
							system.emoji = emojiFlag.emoji;
						}
					}
				});
				navigator.geolocation.watchPosition((position) => {
					const {latitude, longitude, accuracy} = position.coords;
					const latLon = [latitude, longitude];
					this.setState({
						currentPosition: latLon,
						positionAccuracy: accuracy
					});
					if (!this.state.centerPosition && accuracy < POSITION_THRESHOLD_METERS) {
						const nearbySystems = geo.nearby(latitude, longitude, systems);
						const selectedSystemId = localStorage.getItem('system');
						const selectedSystem = nearbySystems.find((system) => {
							system.nearby = system.distance < NEARBY_SYSTEM_METERS;
							return system.nearby && selectedSystemId === system.id;
						});
						this.setState({systems: nearbySystems, currentSystem: selectedSystem, centerPosition: latLon});
						if (selectedSystem) {
							this.selectSystem(selectedSystem);
						}
					}
				}, (error) => {
					switch (error.code) {
					case error.PERMISSION_DENIED:
						alert("Please enable access to your device's location.");
						break;
					case error.POSITION_UNAVAILABLE:
						alert("Location information is unavailable.");
						break;
					case error.TIMEOUT:
						alert("Geolocation timed out.");
						break;
					case error.UNKNOWN_ERROR:
					default:
						alert("Unknown geolocation error: " + error.message);
						break;
					}
				}, {
					enableHighAccuracy: true,
					maximumAge: 30000,
					timeout: 27000
				});
			})
			.catch((error) =>{
				alert(error);
			});
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
	}

	render() {
		const {classes} = this.props;
		const {currentPosition, positionAccuracy, centerPosition} = this.state;
		const hue = 46;
		const mainColor = hcl(hue, 100, 58).toString();
		let content = null;
		let zoomLevel = 15;
		let markers = [];
		let destination = "";
		if (this.state.currentSystem) {
			if (this.state.currentSystem.info) {
				destination = this.state.currentSystem.destination || "";
				const locations = this._joinStatuses();
				if (this.state.displayMode==='trip') {
					content = <StationTripList
						stations={locations}
						mainColor={mainColor}
						onCenter={this.setCenter}
						destination={destination}
						onDestination={this.setDestination}
					/>
				} else {
					content = <StationList
						stations={locations}
						mainColor={mainColor}
						onCenter={this.setCenter}
					/>
				}
				markers = locations.map((location) => {
					return <StationMarker key={location.id} station={location} mainColor={mainColor} hue={hue} onFavorite={this.setFavorite} onLabel={this.setLabel} />;
				});
			} else {
				content = (<div>Loading System...</div>);
			}
		}else if (this.state.systems) {
			zoomLevel = 10;
			content = this.state.systems.map((system) => {
				return <SystemListItem key={system.id} system={system} onSystemSelect={this.selectSystem} onCenter={this.setCenter} />
			});
			markers = this.state.systems.map((system) => {
				return <SystemMarker key={system.id} system={system} mainColor={mainColor} />
			});
		}else {
			content = <div>Loading...</div>
		}
		const attribution = "fsdf";
		const header = "head";
		return (
			<div className={classes.container}>
				<div className={classes.map}>
					<Map className={classes.leafletMap} center={centerPosition} zoom={zoomLevel}>
						<TileLayer
							url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
							attribution={attribution}
						/>
						<ScaleControl />
						<YouAreHereMarker key='here'
							positionAccuracy={positionAccuracy}
							currentPosition={currentPosition}
						/>
						{markers}
					</Map>
				</div>
				<div className={classes.content}>
					<div className={classes.header}>
						<div className={classes.appName}>thin-gbfs</div>
						<div className={classes.controls}>
						<button onClick={this.setCenter}>Center</button>
						<button onClick={this.clearSystem}>Systems</button>
						<select value={this.state.displayMode} onChange={this.setDisplayMode}>
							<option value="all">All</option>
							<option value="bike">Bikes</option>
							<option value="dock">Docks</option>
							<option value="trip">Trip</option>
						</select>
						</div>
					</div>
					<div className={classes.scroll}>
						{content}
					</div>
				</div>
			</div>);
	}
}

export default injectSheet(styles)(App);
