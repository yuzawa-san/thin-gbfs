import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { withTheme } from '@material-ui/core/styles';

const SystemMarker = (props) => {
	const {system, theme} = props;
	const {lat, lon, city, emoji, name} = system;
	const mainColor = theme.palette.primary.main;
	return (<CircleMarker
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
			<strong>
				{city} {emoji || ""}
			</strong>
			<br/>
			{name}
		</Tooltip>
	</CircleMarker>);
}

export default withTheme(SystemMarker);