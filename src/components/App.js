import React from 'react';
import Nav from './Nav';
import pivot from '../pivot';
import geo from '../geo';
import SystemsView from './SystemsView';
import SystemView from './SystemView';
import EmojiFlags from 'emoji-flags';
import ProgressView from './ProgressView';
import ErrorView from './ErrorView';


const POSITION_THRESHOLD_METERS = 300;
const NEARBY_SYSTEM_METERS = 25000;
const DIFFERENT_POSITIONS_METERS = 50;
const ZOOM_SYSTEM_LIST = 10;
const ZOOM_SYSTEM = 15;


export default class App extends React.Component {
	state = {};
	
	componentWillUnmount() {
		navigator.geolocation.clearWatch(this.navWatch);
	}
	
	differentPositions(old, newer) {
		return geo.delta(old.coords.latitude, old.coords.longitude, newer.coords.latitude, newer.coords.longitude).distance > DIFFERENT_POSITIONS_METERS;
	}
	
	componentDidMount(){
		return fetch("/systems")
			.then((response) => response.json())
			.then((responseJson) => {
				const systems = pivot(responseJson);
				this.navWatch = navigator.geolocation.watchPosition((position) => {
					const { recentPosition } = this.state;
					const {latitude, longitude, accuracy} = position.coords;
					const latLon = [latitude, longitude];
					if (recentPosition) {
						const newState = {
							currentPosition: position,
						}
						if(this.differentPositions(recentPosition, position)) {
							newState.recentPosition = position;
						}
						this.setState(newState);
					} else if ( accuracy < POSITION_THRESHOLD_METERS) {
						const nearbySystems = geo.nearby(latitude, longitude, systems);
						nearbySystems.forEach((system) => {
							// TODO: move emoji logic into that class
							const isoMatch = system.city.match(/, ([A-Z]{2})$/);
							if (isoMatch) {
								var emojiFlag = EmojiFlags.countryCode(isoMatch[1]);
								if (emojiFlag) {
									system.emoji = emojiFlag.emoji;
								}
							}
							system.nearby = system.distance < NEARBY_SYSTEM_METERS;
						});
						const selectedSystemId = localStorage.getItem('system');
						const selectedSystem = nearbySystems.find((system) => {
							return system.nearby && selectedSystemId === system.id;
						});
						this.setState({
							currentPosition: position,
							recentPosition: position,
							systems: nearbySystems,
							currentSystem: selectedSystem,
							viewport: {
								center: latLon,
								zoom: selectedSystem ? ZOOM_SYSTEM : ZOOM_SYSTEM_LIST
							}
						});
					}
				}, (error) => {
					let message;
					switch (error.code) {
					case error.PERMISSION_DENIED:
						message = "Please enable access to your device's location.";
						break;
					case error.POSITION_UNAVAILABLE:
						message = "Location information is unavailable.";
						break;
					case error.TIMEOUT:
						message = "Geolocation timed out.";
						break;
					case error.UNKNOWN_ERROR:
					default:
						message = "Unknown geolocation error: " + error.message;
						break;
					}
					this.setState({
						error: message
					});
				}, {
					enableHighAccuracy: true,
					maximumAge: 30000
				});
			})
			.catch((error) =>{
				console.error(error);
				this.setState({
					error: error
				});
			});
	}
	
	
	setSystem = (system) => {
		let newCenter = [system.lat, system.lon];
		if (system.nearby) {
			localStorage.setItem("system", system.id);
			newCenter = geo.positionToLatLon(this.state.currentPosition);
		}
		this.setState({
			currentSystem: system,
			viewport: {
				center: newCenter,
				zoom: ZOOM_SYSTEM
			}
		});
	}
	
	// blow away system, so system selector will reappear
	clearSystem = () => {
		this.setState({
			currentSystem: undefined,
			viewport: {
				center: geo.positionToLatLon(this.state.currentPosition),
				zoom: ZOOM_SYSTEM_LIST
			}
		});
	}
	
	// the center to the a location
	setCenter = (e, newCenter) => {
		const {currentPosition, viewport} = this.state;
		if (!newCenter) {
			newCenter = geo.positionToLatLon(currentPosition);
		}
		this.setState({ viewport: {
			center: newCenter,
			zoom: viewport.zoom
		}});
	}
	
	render() {
		const {systems, viewport, currentSystem, currentPosition, recentPosition, error} = this.state;
		let content = "";
		let title = "";
		if (systems) {
			if (currentSystem) {
				title = currentSystem.name;
				content = (
					<SystemView
						currentSystem={currentSystem}
						recentPosition={recentPosition}
						currentPosition={currentPosition}
						viewport={viewport}
						onSetCenter={this.setCenter} />
				);
			} else {
				title = "System List";
				content = (
					<SystemsView
						systems={systems}
						currentPosition={currentPosition}
						viewport={viewport}
						onSetSystem={this.setSystem}
						onSetCenter={this.setCenter} />
				);
			}
		} else if (error) {
			title = "Error";
			content = (<ErrorView error={error}/>);
		} else {
			title = "Loading...";
			content = (<ProgressView/>);
		}
		
		return (
			<Nav
				title={title}
				onClearSystem={this.clearSystem}
				onSetCenter={this.setCenter}>
				{content}
			</Nav>
		);
	}
}