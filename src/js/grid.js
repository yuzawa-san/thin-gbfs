import geo from './geo.js';
function TinyGridLayer(map, opts){
    var Grid = L.GridLayer.extend({
        createTile: function(coords) {
            var tile = document.createElement('canvas');
            var tileSize = this.getTileSize();
            tile.setAttribute('width', tileSize.x);
            tile.setAttribute('height', tileSize.y);
            tile.setAttribute("data-z", coords.z);

            var y = map.getSize().y / 2;
            var tileMeters = geo.EARTH_EQUATORIAL_CIRCUMFERENCE_METERS * Math.abs(Math.cos(map.getCenter().lat * Math.PI / 180)) / Math.pow(2, coords.z + 8);
            var spacing = geo.useImperialUnits() ? 91.44 : 100;
            var jump = Math.round(spacing / tileMeters);

            var ctx = tile.getContext('2d');
            ctx.fillStyle = '#eee';
            ctx.fillRect(0, 0, tileSize.x, tileSize.y);
            if (coords.z < 12) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = "black";
                ctx.fillText('grid not available', 0, 15);
                ctx.fillText('at this zoom level', 15, 30);
                return tile;
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = "white";
            ctx.beginPath();
            for (var x = 0; x < tileSize.x; x++) {
                if ((coords.x * tileSize.x + x) % jump == 0) {
                    ctx.moveTo(x + 0.5, 0);
                    ctx.lineTo(x + 0.5, tileSize.y);
                }
            }
            for (var y = 0; y < tileSize.y; y++) {
                if ((coords.y * tileSize.y + y) % jump == 0) {
                    ctx.moveTo(0, y + 0.5);
                    ctx.lineTo(tileSize.x, y + 0.5);
                }
            }
            ctx.stroke();
            return tile;
        }
    });
    return new Grid(opts);
}

export
default TinyGridLayer;
