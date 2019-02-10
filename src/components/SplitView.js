import React from 'react';
import injectSheet from 'react-jss';
import { Map, TileLayer, ScaleControl } from 'react-leaflet';
import YouAreHereMarker from './map/YouAreHereMarker';


const styles = {
	container: {
		width: '100%',
		height: '100%'
	},
	map: {
		width: '100%',
		height: '50%',
		boxShadow: 'black 0px 0px 5px',
	},
	leafletMap: {
		width: '100%',
		height: '100%'
	},
	content: {
		width: '100%',
		height: '50%',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'auto'
	},
	"@media screen and (min-width: 700px)": {
		container: {
			display: 'flex'
		},
		map: {
			height: '100%',
			flex: '1',
			boxShadow: 'none',
			borderRight: '1px solid black'
		},
		content: {
			height: '100%',
			flex: 'initial',
			width: '350px'
		}
	}
};

class SplitView extends React.Component {
	render() {
		const {classes, currentPosition, markers, attribution, children, onViewportChanged, viewport} = this.props;
		let effectiveAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>';
		if (attribution) {
			effectiveAttribution = `${effectiveAttribution} | ${attribution}`;
		}
		return (
			<div className={classes.container}>
				<div className={classes.map}>
					<Map
						className={classes.leafletMap}
						animate={false}
						onViewportChanged={onViewportChanged}
						viewport={viewport}>
						<TileLayer
							url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
							attribution={effectiveAttribution }
						/>
						<ScaleControl position='topright' />
						<YouAreHereMarker position={currentPosition} />
						{markers}
					</Map>
				</div>
				<div className={classes.content}>
					{children}
				</div>
			</div>
		);
	}
}

export default injectSheet(styles)(SplitView);