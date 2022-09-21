from codec import BikeNetworkCodec
from google.appengine.api import urlfetch
import csv
import logging
import json
import time
from StringIO import StringIO
from models import BikeNetwork
from caching import cache, STATION_STATUS_TTL, STATION_INFO_TTL, ALERTS_TTL
from models import SystemInfoElement, SystemStatusElement, RegionListElement, CompactElement

# motivate provides point information via their own API id's
# maybe one day the point information will be in the station_status.json
MOTIVATE_IDS = {
    "gbfs_NYC": "nyc",
    "gbfs_bluebikes": "bos", 
    "gbfs_cabi": "wdc",
    "gbfs_BA": "fgb"
}

def process_motivate_stations(motivate_id):
    url = "https://layer.bicyclesharing.net/map/v1/%s/map-inventory" % motivate_id
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    out = []
    for feature in response_json['features']:
        geometry = feature.get('geometry', {})
        properties = feature.get('properties', {})
        station = properties.get('station')
        if geometry.get('type') == 'Point' and station:
            pt = geometry.get('coordinates', [0,0])
            el = SystemInfoElement(
                id=station['id'],
                name=station['name'],
                lat=pt[1],
                lon=pt[0],
            )
            out.append(el)
    return out

def process_station_info(url, system_id):
    if not url:
        return []
    if system_id in MOTIVATE_IDS:
        return process_motivate_stations(MOTIVATE_IDS[system_id])
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    stations = response_json.get('data',{}).get('stations',[])
    out = []
    for station in stations:
        if not (station['lat'] and station['lon']):
            continue
        element = SystemInfoElement(
            id=station['station_id'],
            name=station['name'],
            lat=station['lat'],
            lon=station['lon'],
        )
        if 'region_id' in station:
            element.region = station['region_id']
        out.append(element)
    return out

def process_system_info(url):
    if not url:
        return {}
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return {}
    response_json = json.loads(result.content)
    return response_json['data']

def process_regions(url):
    if not url:
        return []
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    out = []
    if type(response_json['data']) is list:
        region_list = response_json['data']
    else:
        region_list = response_json['data']['regions']
    for region in region_list:
        name = "unknown"
        if "name" in region:
            name = region['name']
        if "region_name" in region:
            name = region['region_name']
        out.append(RegionListElement(id=region['region_id'],name=name))
    return out
    
@cache(ttl=STATION_STATUS_TTL)
def _process_free_bikes(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    out = []
    for bike in response_json['data']['bikes']:
        if bike.get('is_reserved',0) == 0 and bike.get('is_disabled',0) == 0 and 'lat' in bike and 'lon' in bike:
            out.append(SystemInfoElement(
                id=bike['bike_id'],
                name=bike.get('name','Bike'),
                lat=bike['lat'],
                lon=bike['lon']
            ))
    return out

def process_free_bikes(url):
    if not url:
        return []
    return _process_free_bikes(url)

@cache(ttl=ALERTS_TTL)
def _process_alerts(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    return response_json['data']['alerts']

def process_alerts(url):
    if not url:
        return []
    return _process_alerts(url)

def process_motivate_status(motivate_id):
    url = "https://layer.bicyclesharing.net/map/v1/%s/map-inventory" % motivate_id
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    out = []
    for feature in response_json['features']:
        properties = feature.get('properties', {})
        station = properties.get('station')
        if not station:
            continue
        bikes = 0
        docks = 0
        if station['installed']:
            if station['renting']:
                bikes = station['bikes_available'] - station.get('ebikes_available', 0)
            if station['returning']:
                docks = station['docks_available']
        point_action = properties.get('bike_angels_action', None)
        point_value = properties.get('bike_angels_points', 0)
        if point_action == 'take':
            pts = -point_value
        elif point_action == 'give':
            pts = point_value
        else:
            pts = None
        out.append(SystemStatusElement(
            id=station['id'],
            bikes=bikes,
            docks=docks,
            mod=station['last_reported'],
            pts=pts))
    return out

@cache(ttl=STATION_STATUS_TTL)
def _process_station_status(url, system_id):
    if system_id in MOTIVATE_IDS:
        return process_motivate_status(MOTIVATE_IDS[system_id])
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    stations = response_json.get('data',{}).get('stations',[])
    out = []
    for station in stations:
        bikes = 0
        docks = 0
        if station['is_installed'] > 0:
            if station['is_renting'] == 1:
                bikes = station.get('num_bikes_available',0)
            if station['is_returning'] == 1:
                docks = station.get('num_docks_available',0)
        mod = int(station['last_reported'])
        if mod > 10000000000:
            mod = mod / 1000
        out.append(SystemStatusElement(id=station['station_id'],bikes=bikes,docks=docks,mod=mod))
    return out

def process_station_status(url, system_id):
    if not url:
        return []
    return _process_station_status(url, system_id)


class GbfsCodec(BikeNetworkCodec):
    NAME = "gbfs"
    def load(self):
        url = "https://raw.githubusercontent.com/NABSA/gbfs/master/systems.csv"
        result = urlfetch.fetch(url, validate_certificate=True)
        if result.status_code != 200:
            return []
        buffer = StringIO(result.content)
        
        reader = csv.DictReader(buffer)
        entities = []
        system_ids = set()
        system_ids_duplicates = set()
        lines = []
        for line in reader:
            lines.append(line)
            system_id = "gbfs_%s" % line['System ID']
            if system_id in system_ids:
                system_ids_duplicates.add(system_id)
            system_ids.add(system_id)
        for line in lines:
            for attempt in range(1):
                name = line['Name']
                country = line.get('Country Code')
                if not country in ("US","DE","CH","FR","GB"):
                    continue
                logging.info("Processing %s, attempt %d" % (name,attempt))
                try:
                    url = line['Auto-Discovery URL']
                    result = urlfetch.fetch(url, validate_certificate=True)
                    if result.status_code != 200:
                        logging.error("failed to load autodiscovery url for %s" % name)
                        continue
                    response_json = json.loads(result.content)
                    config = {}
                    lang = 'en'
                    if lang not in response_json['data']:
                        lang = response_json['data'].keys()[0]
                    for feed in response_json['data'][lang]['feeds']:
                        config[feed['name'].replace('.json','')] = feed['url']
                    city = "%s, %s" % (line['Location'], line['Country Code'])
                    sys_info = process_system_info(config['system_information'])
                    system_id = "gbfs_%s" % sys_info.get("system_id", line['System ID'])
                    if system_id in system_ids_duplicates:
                        system_id = "%s_%s" % (system_id, name)
                    stations = process_station_info(config.get('station_information'), system_id)
                    regions = process_regions(config.get('system_regions'))
                    bikes = process_free_bikes(config.get('free_bike_status'))
                    avg_lat = 0
                    avg_lon = 0
                    loc_count = 0
                    for station in stations:
                        avg_lat += station.lat
                        avg_lon += station.lon
                        loc_count += 1
                    for bike in bikes:
                        avg_lat += bike.lat
                        avg_lon += bike.lon
                        loc_count += 1
                    if loc_count > 0:
                        avg_lat = avg_lat / loc_count
                        avg_lon = avg_lon / loc_count
                    recent_ts = 0
                    station_statuses = process_station_status(config.get('station_status'), system_id)
                    for station in station_statuses:
                        ts = station.mod
                        if ts > recent_ts:
                            recent_ts = ts
                    full_name = sys_info.get("name") or name
                    config['system_info'] = {
                        "name": full_name,
                        "url": sys_info.get("url"),
                        "stations": CompactElement.of(stations),
                        "regions":CompactElement.of(regions)
                    }
                    r = BikeNetwork(
                        id=system_id,
                        codec=GbfsCodec.NAME,
                        name=full_name,
                        city=city,
                        config=config,
                        lat=round(avg_lat, 2),
                        lon=round(avg_lon, 2),
                        last_updated=recent_ts)
                    entities.append(r)
                    break
                except TypeError as e:
                    logging.exception("malformed load %s: %s", name, e)
                    break
                except KeyError as e:
                    logging.exception("malformed load %s: %s", name, e)
                    break
                except Exception as e:
                    logging.exception("failed to load %s: %s", name, e)
                    time.sleep(1)
        return entities
    
    def get_info(self, system):
        return system.config['system_info']
    
    def get_status(self, system):
        status_header = [["id","bikes","docks","mod","pts"]]
        station_statuses = process_station_status(system.config.get('station_status'), system.key.id())
        alerts = process_alerts(system.config.get('system_alerts'))
        bikes = process_free_bikes(system.config.get('free_bike_status'))
        return {"statuses": CompactElement.of(station_statuses), "alerts": alerts, 'bikes': CompactElement.of(bikes)}