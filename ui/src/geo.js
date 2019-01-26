var languages = navigator.languages || [];
var imperialUnits = languages.indexOf("en-US") >= 0;
var geo = {
    EARTH_EQUATORIAL_CIRCUMFERENCE_METERS: 40075016.686,
    EARTH_RADIUS_METERS: 6371000.2161,
    useImperialUnits: function() {
        return imperialUnits;
    },
    nearby: function(lat, lon, items, count) {
        var nearestStations = [];
        for (var i in items) {
            var item = items[i];
            var delta = this.delta(lat, lon, item.lat, item.lon);
            item.distance = delta.distance;
            item.bearing = delta.bearing;
            nearestStations.push(item);
        }
        nearestStations.sort(function(a, b) {
            return a.distance - b.distance;
        });
        if (count) {
            nearestStations = nearestStations.slice(0, count);
        }
        return nearestStations;
    },
    closest: function(lat, lon, items) {
        return this.nearby(lat, lon, items)[0];
    },
    delta: function(lat1, lon1, lat2, lon2) {
        var dLat = this._toRad(lat2 - lat1); // this._toRad below
        var dLon = this._toRad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = this.EARTH_RADIUS_METERS * c; // Distance in meters
        var y = Math.sin(dLon) * Math.cos(this._toRad(lat2));
        var x = Math.cos(this._toRad(lat1)) * Math.sin(this._toRad(lat2)) - Math.sin(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * Math.cos(dLon);
        var brng = this._toDeg(Math.atan2(y, x));
        var b = ((brng + 360) % 360);
        return {
            distance: d,
            bearing: b
        };

    },
    getDistanceString: function(meters) {
        var distance;
        if (imperialUnits) {
            var miles = meters / 1609.34;
            if (miles < 0.189) {
                distance = Math.round(miles * 5280) + "ft";
            } else {
                distance = miles.toFixed(1) + "mi";
            }
        } else {
            if (meters < 500) {
                distance = Math.round(meters) + "m";
            } else {
                distance = (meters / 1e3).toFixed(1) + "km";
            }
        }
        return distance;
    },
    _toRad: function(deg) {
        return deg * Math.PI / 180;
    },
    _toDeg: function(rad) {
        return rad * 180 / Math.PI;
    },
    cardinalDirection: function(angle) {
        //easy to customize by changing the number of directions you have 
        var directions = 8;

        var degree = 360 / directions;
        angle = angle + degree / 2;

        if (angle >= 0 * degree && angle < 1 * degree) return "N";
        if (angle >= 1 * degree && angle < 2 * degree) return "NE";
        if (angle >= 2 * degree && angle < 3 * degree) return "E";
        if (angle >= 3 * degree && angle < 4 * degree) return "SE";
        if (angle >= 4 * degree && angle < 5 * degree) return "S";
        if (angle >= 5 * degree && angle < 6 * degree) return "SW";
        if (angle >= 6 * degree && angle < 7 * degree) return "W";
        if (angle >= 7 * degree && angle < 8 * degree) return "NW";
        //Should never happen: 
        return "N";
    }
};

export
default geo;