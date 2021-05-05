import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { MapContainer, TileLayer, ScaleControl, useMap } from 'react-leaflet';
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
		overflow: 'auto',
		'-webkit-overflow-scrolling': 'touch'
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

function MapViewportUpdater({ center, zoom }) {
	const map = useMap();
	map.setView(center, zoom);
	return null;
}

class MapViewport extends React.Component {
	shouldComponentUpdate(nextProps, nextState) {
		const { center, zoom } = this.props;
		const nextCenter = nextProps.center;
		const nextZoom = nextProps.zoom;
		return (center != nextCenter || zoom != nextZoom);
	}

	render() {
		const {center, zoom} = this.props;
		return (
			<MapViewportUpdater center={center} zoom={zoom} />
		);
	}
}

class SplitView extends React.Component {
	render() {
		const {classes, currentPosition, markers, attribution, children, viewport} = this.props;
		let effectiveAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>';
		if (attribution) {
			effectiveAttribution = `${effectiveAttribution} | ${attribution}`;
		}
		return (
			<div className={classes.container}>
				<div className={classes.map}>
					<MapContainer
						className={classes.leafletMap}
						animate={false}>
						<MapViewport
							center={viewport.center}
							zoom={viewport.zoom} />
						<TileLayer
							url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
							attribution={effectiveAttribution}
						/>
						<ScaleControl position='topright' />
						<YouAreHereMarker position={currentPosition} />
						{markers}
					</MapContainer>
				</div>
				<div className={classes.content}>
					{children}
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(SplitView);