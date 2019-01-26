import React from 'react';
import { Circle, Marker, FeatureGroup } from 'react-leaflet';
import { DivIcon } from 'leaflet'
import L from 'leaflet';

const DOT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#00ccff" stroke="#007BFF" stroke-width="5"/></svg>';
const ARROW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="me-arrow"><path fill="#007BFF" d="M 10,0 L 20,20 L 10,14 L 0,20" /></svg>';
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
		console.log(document.getElementById("xxx"))
	}
	
	componentDidMount() {
		window.addEventListener('deviceorientation', (event) => {
			if(event.webkitCompassHeading) {
				this.setState({
					arrow: true,
					heading: event.webkitCompassHeading
				});
			}
		});
	}

	render(){
		const { positionAccuracy, currentPosition } = this.props;
		if (!currentPosition) {
		    return null;
		}
		const { heading, arrow } = this.state;
		let icon = this.dotIcon;
		let rotationCss = '';
		if (arrow) {
			icon = this.arrowIcon;
			rotationCss = `.me-arrow {transform:rotate(${heading}deg);}`
		}
		// L.setOptions(this.icon, {
		// 	html: "x"
		// });
		return (
			<FeatureGroup>
				<style>
				{rotationCss}
				</style>
				<Circle
					radius={positionAccuracy}
					center={currentPosition}
					opacity={0.3}
					weight={1}
					interactive={false}
					fillColor="#00ccff"
					color="#007BFF"
				/>
				<Marker
					position={currentPosition}
					interactive={false}
					icon={icon}>
				</Marker>
			</FeatureGroup>
		);
	}
}