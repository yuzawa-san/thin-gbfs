import React from 'react';
import { CircleMarker, Tooltip, Popup, Marker, FeatureGroup } from 'react-leaflet';
import { hcl } from 'd3-color';
import { DivIcon } from 'leaflet'
import PointsLabel from '../PointsLabel';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { FAVORITE_EMOJI, UNFAVORITE_EMOJI, STATION_EMOJI_CODES, NAV_EMOJI, emojiString } from '../../emoji';

const styles = {
	stationLabel: {
		fontSize: '16px',
		padding: '1px !important',
		lineHeight: '16px'
	},
	icon: {
		fontSize: '1.5em'
	},
	ptsIcon: {
		fontSize: '8px',
		lineHeight: '10px',
		paddingTop: '1px',
		fontFamily: 'sans-serif',
		textAlign: 'center',
		whiteSpace: 'nowrap'
	},
	ptsIconInner: {
		'&:before': {
			content: '""',
			width: '6px',
			height: '7px',
			display: 'inline-block',
			backgroundSize: 'contain',
			backgroundPosition: 'center',
			backgroundRepeat: 'no-repeat',
			verticalAlign: 'middle',
			paddingRight: '1px'
		}
	},
	ptsPick: {
		color: 'white',
		'&:before': {
			backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0zMCAtMzUgNjAgNzAiPjxnIHRyYW5zZm9ybT0icm90YXRlKDE4MCkiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNIDAgLTM1IEwgMTAgLTM1IEwgMTAgMCBMIDMwIDAgTCAwIDM1IEwgLTMwIDAgTCAtMTAgMCBMIC0xMCAtMzUgTCAwIC0zNSIvPjwvZz48L3N2Zz4=")'
		}
	},
	ptsDrop: {
		color: 'black',
		'&:before': {
			backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0zMCAtMzUgNjAgNzAiPjxnPjxwYXRoIGQ9Ik0gMCAtMzUgTCAxMCAtMzUgTCAxMCAwIEwgMzAgMCBMIDAgMzUgTCAtMzAgMCBMIC0xMCAwIEwgLTEwIC0zNSBMIDAgLTM1Ii8+PC9nPjwvc3ZnPg==")'
		}
	}
};

class StationMarker extends React.Component {
	shouldComponentUpdate(nextProps, nextState) {
		const { favorite, label, status, active } = this.props.station;
		const newStation = nextProps.station;
		const newStatus = newStation.status;
		if (status.pct !== newStatus.pct || status.pts !== newStatus.pts) {
			return true;
		}
		if (active !== newStation.active) {
			return true;
		}
		if (favorite !== newStation.favorite) {
			return true;
		}
		if (label !== newStation.label) {
			return true;
		}
		return false;
	}

	render(){
		const radius = 10;
		const { station, theme, classes } = this.props;
		const { hue, palette } = theme;
		const mainColor = palette.primary.main;
		const { isBike, coords, favorite, label, status, name } = station;
		if (isBike) {
			return (<CircleMarker
				center={coords}
				radius={3}
				weight={0}
				fillColor={mainColor}
				fillOpacity={1.0}>
				<Tooltip>
					{name}
				</Tooltip>
			</CircleMarker>);
		}
		const {pts, pct, docks, bikes} = status;
		const fillColor = isNaN(pct) ? "#999" : hcl(hue, 100 * pct, (100 - pct * 42)).toString();
		const opacity = station.active ? 1.0 : 0.2;
		let pointsMarker = null;
		if (pts) {
			const innerClass = (pts < 0) ? classes.ptsPick : classes.ptsDrop;
			const realPts = Math.abs(pts);
			const icon = new DivIcon({
				className: 'points-xsxs',
				html: `<div class="${classes.ptsIcon}"><span class="${classes.ptsIconInner} ${innerClass}">${realPts}</span></div>`
			});
			pointsMarker = (<Marker
				position={coords}
				interactive={false}
				icon={icon}
				opacity={opacity}
				/>);
		}
		let labelTooltip = null;
		if (label) {
			labelTooltip = (<Tooltip
				pane="overlayPane"
				permanent={true}
				offset={[-(radius + 2), 0]}
				direction="left"
				className={classes.stationLabel}>
				{emojiString(label)}
			</Tooltip>);
		}
		const labelOptions = STATION_EMOJI_CODES.map((code) => {
			return (<option key={code} value={code}>
				{emojiString(code)}
			</option>);
		});
		const info = `${bikes||0} bikes, ${docks||0} docks`;
		const navLink = `https://www.google.com/maps/dir/?api=1&travelmode=bicycling&destination=${coords[0]},${coords[1]}`;
		return (
			<FeatureGroup>
				<CircleMarker
					center={coords}
					radius={radius}
					pathOptions={{
						weight: 2,
						fillColor,
						fillOpacity: opacity,
						color: mainColor,
						opacity
					}}>
					{labelTooltip}
				</CircleMarker>
				<Popup offset={[0, -radius]}>
					<strong>
						{name}
					</strong>
					<br/>
					{info}
					<PointsLabel prefix=", " pts={pts}/>
					<br/>
					Label:
					<select className={classes.icon} onChange={this.setLabel} value={label||""} style={{marginLeft:"5px"}}>
						<option value="">
							none
						</option>
						{labelOptions}
					</select>
					<button onClick={this.toggleFavorite} className={classes.icon} style={{marginLeft:"5px"}}>
						{favorite?UNFAVORITE_EMOJI:FAVORITE_EMOJI}
					</button>
					<a href={navLink} target="blank">
						<button className={classes.icon} style={{marginLeft:"5px"}}>
							{NAV_EMOJI}
						</button>
					</a>
				</Popup>
				{pointsMarker}
			</FeatureGroup>
		);
	}
	toggleFavorite = () => {
		const {station, onSetFavorite} = this.props;
		onSetFavorite(station.id, !station.favorite);
	}
	setLabel = (e) => {
		const {station, onSetLabel} = this.props;
		onSetLabel(station.id, e.target.value);
	}
}

export default withTheme(withStyles(styles)(StationMarker));