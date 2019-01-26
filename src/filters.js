export const DISPLAY_MODE_BIKES = 'bike';
export const DISPLAY_MODE_DOCKS = 'dock';
export const FILTER_BIKES = (station) => {
	return station.isBike || station.status.pct > 0.05;
};
export const FILTER_DOCKS = (station) => {
	return !station.isBike && station.status.pct < 0.95;
};
export const FILTER_ALL = (station) => {
	return !isNaN(station.status.pct);
};
export const getFilter = (displayMode) => {
	if (displayMode === DISPLAY_MODE_BIKES) {
		return FILTER_BIKES;
	}
	if (displayMode === DISPLAY_MODE_DOCKS) {
		return FILTER_DOCKS;
	}
	return FILTER_ALL;
}