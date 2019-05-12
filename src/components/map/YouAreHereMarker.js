import React from 'react';
import { Circle, Marker, FeatureGroup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import geo from '../../geo';

const DOT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#00ccff" stroke="#007BFF" stroke-width="5"/></svg>';
const ARROW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="you-are-here"><path fill="#007BFF" d="M 10,0 L 20,20 L 10,14 L 0,20" /></svg>';
export default class YouAreHereMarker extends React.Component {
	constructor(props){
		super(props);
		this.state = {};
		this.dotIcon = new DivIcon({
			className: 'me-icon',
			iconSize: [20, 20],
			iconAnchor: [10, 10],
			html: DOT_SVG
		});
		this.arrowIcon = new DivIcon({
			className: 'me-icon',
			iconSize: [20, 20],
			iconAnchor: [10, 10],
			html: ARROW_SVG
		});
	}
	
	componentDidMount() {
		this.lastUpdated = 0;
		window.addEventListener('deviceorientation', (event) => {
			if(event.webkitCompassHeading) {
				const now = Date.now();
				if((now - this.lastUpdated) > 500) {
					this.setState({
						arrow: true,
						heading: event.webkitCompassHeading
					});
					this.lastUpdated = now;
				}
			}
		});
	}

	render(){
		const { position } = this.props;
		if (!position){
			return null;
		}
		const { heading, arrow } = this.state;
		const latLon = geo.positionToLatLon(position);
		let style = null;
		let icon = this.dotIcon;
		if (arrow) {
			icon = this.arrowIcon;
			style = `.you-are-here {transform:rotate(${heading}deg);}`;
		}
		return (
			<FeatureGroup>
				<style>
					{style}
				</style>
				<Circle
					radius={position.coords.accuracy}
					center={latLon}
					opacity={0.3}
					weight={1}
					interactive={false}
					fillColor="#00ccff"
					color="#007BFF"
				/>
				<Marker
					position={latLon}
					interactive={false}
					icon={icon}>
				</Marker>
			</FeatureGroup>
		);
	}
}