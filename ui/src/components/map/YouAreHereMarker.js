import React from 'react';
import { Circle, Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet'
import L from 'leaflet';


export default class YouAreHereMarker extends React.Component {
	constructor(props){
		super(props);
		this.icon = new DivIcon({
			className: 'me-icon'
		});
	}

	render(){
		const { positionAccuracy, currentPosition } = this.props;
		// L.setOptions(this.icon, {
		// 	html: "x"
		// });
		return (
			<React.Fragment>
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
					icon={this.icon}>
				</Marker>
			</React.Fragment>
		);
	}
}