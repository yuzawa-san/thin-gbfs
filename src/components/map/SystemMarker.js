import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';

export default function SystemMarker(props){
	const {system, mainColor} = props;
	const {lat, lon, city, emoji, name} = system;
	return <CircleMarker
		center={[lat, lon]}
		radius={10}
		weight={1}
		dashArray="2, 2"
		lineCap="butt"
		fillColor={mainColor}
		fillOpacity={0.3}
		color={mainColor}
		opacity={1.0}>
		<Tooltip>
			<strong>{city} {emoji || ""}</strong>
			<br/>
			{name}
		</Tooltip>
	</CircleMarker>;
}