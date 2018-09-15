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

def process_station_info(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return []
    response_json = json.loads(result.content)
    stations = response_json['data']['stations']
    out = []
    for station in stations:
        element = SystemInfoElement(
            id=station['station_id'],
            name=station['name'],
            lat=station['lat'],
            lon=station['lon'],
        )
        if 'region_id' in station:
            element.region = station['region_id']
        if station['lat'] and station['lon']:
            out.append(element)
    return out

def process_system_info(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    return response_json['data']['url']

def process_regions(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    out = []
    for region in response_json['data']['regions']:
        name = "unknown"
        if "name" in region:
            name = region['name']
        if "region_name" in region:
            name = region['region_name']
        out.append(RegionListElement(id=region['region_id'],name=name))
    return out
    
@cache(ttl=STATION_STATUS_TTL)
def process_free_bikes(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    out = []
    for bike in response_json['data']['bikes']:
        if bike['is_reserved'] == 0 and bike['is_disabled'] == 0:
            out.append(SystemInfoElement(id=bike['bike_id'],name=bike['name'],lat=bike['lat'],lon=bike['lon']))
    return out

@cache(ttl=ALERTS_TTL)
def process_alerts(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    return response_json['data']['alerts']

def process_citibike_status():
    url = "https://layer.bicyclesharing.net/map/v1/nyc/stations"
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return {}
    response_json = json.loads(result.content)
    out = []
    for feature in response_json['features']:
        station = feature['properties']
        bikes = 0
        docks = 0
        if station['installed']:
            if station['renting']:
                bikes = station['bikes_available']
            if station['returning']:
                docks = station['docks_available']
        point_action = station.get('bike_angels_action', None)
        point_value = station.get('bike_angels_points', 0)
        if point_action == 'take':
            pts = -point_value
        elif point_action == 'give':
            pts = point_value
        else:
            pts = None
        out.append(SystemStatusElement(
            id=station['station_id'],
            bikes=bikes,
            docks=docks,
            mod=station['last_reported'],
            pts=pts))
    return out

def _process_station_status(url):
    if "citibike" in url:
        return process_citibike_status()
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    stations = response_json['data']['stations']
    out = []
    for station in stations:
        bikes = 0
        docks = 0
        if station['is_installed'] > 0:
            if station['is_renting'] == 1:
                bikes = station['num_bikes_available']
            if station['is_returning'] == 1:
                docks = station['num_docks_available']
        mod = station['last_reported']
        if mod > 10000000000:
            mod = mod / 1000
        out.append(SystemStatusElement(id=station['station_id'],bikes=bikes,docks=docks,mod=mod))
    return out

@cache(ttl=STATION_STATUS_TTL)
def process_station_status(url):
    return _process_station_status(url)


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
        for line in reader:
            for attempt in range(3):
                name = line['Name']
                logging.info("Processing %s, attempt %d" % (name,attempt))
                try:
                    url = line['Auto-Discovery URL']
                    result = urlfetch.fetch(url, validate_certificate=True)
                    if result.status_code != 200:
                        logging.error("failed to autodiscovery url for %s" % name)
                        continue
                    response_json = json.loads(result.content)
                    config = {}
                    for feed in response_json['data']['en']['feeds']:
                        config[feed['name']] = feed['url']
                    city = "%s, %s" % (line['Location'], line['Country Code'])
                    stations = process_station_info(config['station_information'])
                    regions = []
                    if 'system_regions' in config:
                        regions = process_regions(config['system_regions'])
                    avg_lat = 0
                    avg_lon = 0
                    station_count = 0
                    for station in stations:
                        avg_lat += station.lat
                        avg_lon += station.lon
                        station_count += 1
                    if station_count > 0:
                        avg_lat = avg_lat / station_count
                        avg_lon = avg_lon / station_count
                    recent_ts = 0
                    url = process_system_info(config['system_information'])
                    station_statuses = _process_station_status(config['station_status'])
                    for station in station_statuses:
                        ts = station.mod
                        if ts > recent_ts:
                            recent_ts = ts
                    config['system_info'] = {
                        "name": name,
                        "url": url,
                        "stations": CompactElement.of(stations),
                        "regions":CompactElement.of(regions)
                    }
                    r = BikeNetwork(
                        id= "gbfs_%s" % line['System ID'],
                        codec=GbfsCodec.NAME,
                        name=name,
                        city=city,
                        config=config,
                        lat=avg_lat,
                        lon=avg_lon,
                        last_updated=recent_ts)
                    entities.append(r)
                    break
                except Exception as e:
                    logging.exception("failed to load %s: %s", name, e)
                    time.sleep(1)
        return entities
    
    def get_info(self, system):
        return system.config['system_info']
    
    def get_status(self, system):
        status_header = [["id","bikes","docks","mod","pts"]]
        station_statuses = process_station_status(system.config['station_status'])
        alerts = []
        if 'system_alerts' in system.config:
            alerts = process_alerts(system.config['system_alerts'])
        bikes = []
        if 'free_bike_status' in system.config:
            bikes = process_free_bikes(system.config['free_bike_status'])
        return {"statuses": CompactElement.of(station_statuses), "alerts": alerts, 'bikes': CompactElement.of(bikes)}