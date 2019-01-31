import React from 'react';
import { CircleMarker, Tooltip, Popup, Marker, FeatureGroup } from 'react-leaflet';
import { hcl } from 'd3-color';
import { DivIcon } from 'leaflet'
import PointsLabel from '../PointsLabel';
import L from 'leaflet';
import injectSheet from 'react-jss';
import { FAVORITE_EMOJI, UNFAVORITE_EMOJI, STATION_EMOJI_CODES, emojiString } from '../../emoji';

const styles = {
	stationLabel: {
		'font-size': '16px',
		padding: '1px !important',
		'line-height': '16px'
	},
	icon: {
		'font-size': '1.5em'
	},
	ptsIcon: {
		'font-size': '8px',
		'line-height': '10px',
		'padding-top': '1px',
		'font-family': 'sans-serif',
		'text-align': 'center',
		'white-space': 'nowrap'
	},
	ptsIconInner: {
		'&:before': {
			content: '""',
			width: '6px',
			height: '7px',
			display: 'inline-block',
			'background-size': 'contain',
			'background-position': 'center',
			'background-repeat': 'no-repeat',
			'vertical-align': 'middle',
			'padding-right': '1px'
		}
	},
	ptsPick: {
		color: 'white',
		'&:before': {
			'background-image': 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0zMCAtMzUgNjAgNzAiPjxnIHRyYW5zZm9ybT0icm90YXRlKDE4MCkiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNIDAgLTM1IEwgMTAgLTM1IEwgMTAgMCBMIDMwIDAgTCAwIDM1IEwgLTMwIDAgTCAtMTAgMCBMIC0xMCAtMzUgTCAwIC0zNSIvPjwvZz48L3N2Zz4=")'
		}
	},
	ptsDrop: {
		color: 'black',
		'&:before': {
			'background-image': 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0zMCAtMzUgNjAgNzAiPjxnPjxwYXRoIGQ9Ik0gMCAtMzUgTCAxMCAtMzUgTCAxMCAwIEwgMzAgMCBMIDAgMzUgTCAtMzAgMCBMIC0xMCAwIEwgLTEwIC0zNSBMIDAgLTM1Ii8+PC9nPjwvc3ZnPg==")'
		}
	}
};

class StationMarker extends React.Component {
	constructor(props){
		super(props);
		this.icon = new DivIcon({
			className: 'points-xsxs'
		});
	}

	render(){
		const radius = 10
		const { station, mainColor, hue, classes } = this.props;
		const { isBike, coords, emoji, isFavorite, label, status, name } = station;
		if (isBike) {
			return <CircleMarker
				center={coords}
				radius={3}
				weight={0}
				fillColor={mainColor}
				fillOpacity={1.0}>
				<Tooltip>
					{name}
				</Tooltip>
			</CircleMarker>;
		}
		const {pts, pct, docks, bikes} = status;
		const fillColor = isNaN(pct) ? "#999" : hcl(hue, 100 * pct, (100 - pct * 42)).toString();
		const opacity = station.active ? 1.0 : 0.2;
		let pointsMarker = "";
		if (pts) {
			const innerClass = (pts < 0) ? classes.ptsPick : classes.ptsDrop;
			const realPts = Math.abs(pts);
			L.setOptions(this.icon, {
				html: `<div class="${classes.ptsIcon}"><span class="${classes.ptsIconInner} ${innerClass}">${realPts}</span></div>` 
			});
			pointsMarker = (<Marker
				position={coords}
				interactive={false}
				icon={this.icon}
				opacity={opacity}
				/>);
		}
		let labelTooltip = "";
		if (label) {
			labelTooltip = (<Tooltip
				pane="overlayPane"
				permanent={true}
				offset={[-(radius + 2), 0]}
				direction="left"
				className={classes.stationLabel}>
				{emoji}
			</Tooltip>);
		}
		const labelOptions = STATION_EMOJI_CODES.map((code) => {
			return <option key={code} value={code}>{emojiString(code)}</option>
		})
		return (
			<FeatureGroup>
				<CircleMarker
					center={coords}
					radius={radius}
					weight={2}
					fillColor={fillColor}
					fillOpacity={opacity}
					color={mainColor}
					opacity={opacity}>
					{labelTooltip}
				</CircleMarker>
				<Popup offset={[0, -radius]}>
					<strong>{name}</strong> <button onClick={this.toggleFavorite} className={classes.icon}>{isFavorite?UNFAVORITE_EMOJI:FAVORITE_EMOJI}</button><br/>
					{bikes||0} bikes, {docks||0} docks
					<PointsLabel prefix=", " pts={pts}/><br/>
					Label: <select className={classes.icon} onChange={this.setLabel} value={label||""}>
						<option value="">none</option>
						{labelOptions}
					</select>
				</Popup>
				{pointsMarker}
			</FeatureGroup>
		);
	}
	toggleFavorite = () => {
		const {station, onFavorite} = this.props;
		onFavorite(station.id, !station.isFavorite);
	}
	setLabel = (e) => {
		const {station, onLabel} = this.props;
		onLabel(station.id, e.target.value);
	}
}

export default injectSheet(styles)(StationMarker);