from codec import BikeNetworkCodec
from google.appengine.api import urlfetch
import csv
import logging
import json
import time
from StringIO import StringIO
from models import BikeNetwork
from caching import cache
from models import PrettyFloat


STATION_INFO_TTL = 86400
ALERTS_TTL = 600
STATION_STATUS_TTL = 20

@cache
def process_station_info(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    stations = response_json['data']['stations']
    out = []
    for station in stations:
        region_id = 0
        if 'region_id' in station:
            region_id = station['region_id']
        out.append([
            station['station_id'],
            station['name'],
            station['lat'],
            station['lon'],
            region_id
        ])
    out.sort(key=lambda x: x[0])
    return out

@cache
def process_points(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return {}
    response_json = json.loads(result.content)
    out = {}
    for station,pts in response_json['stations'].items():
        out[station] = pts
    return out

@cache
def process_regions(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    out = []
    for region in response_json['data']['regions']:
        out.append([region['region_id'],region['name']])
    out.sort(key=lambda x: x[0])
    return out
    
@cache
def process_free_bikes(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    out = []
    for bike in response_json['data']['bikes']:
        if bike['is_reserved'] == 0 and bike['is_disabled'] == 0:
            out.append([bike['bike_id'],bike['name'],bike['lat'],bike['lon']])
    return out

@cache
def process_alerts(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    return response_json['data']['alerts']

@cache
def process_station_status(url):
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    response_json = json.loads(result.content)
    stations = response_json['data']['stations']
    out = []
    for station in stations:
        if station['is_installed'] > 0:
            bikes = station['num_bikes_available']
            if station['is_renting'] == 0:
                bikes = 0
            docks = station['num_docks_available']
            if station['is_returning'] == 0:
                docks = 0
            out.append([station['station_id'],bikes,docks,station['last_reported']])
    return out


class GbfsCodec(BikeNetworkCodec):
    NAME = "gbfs"
    def load(self):
        url = "https://raw.githubusercontent.com/NABSA/gbfs/master/systems.csv"
        result = urlfetch.fetch(url)
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
                    
                    station_info_url = config['station_information']
                    result = urlfetch.fetch(station_info_url, validate_certificate=True)
                    if result.status_code != 200:
                        logging.error("failed to station info url for %s" % name)
                        continue
                    response_json = json.loads(result.content)
                    stations = response_json['data']['stations']
                    avg_lat = 0
                    avg_lon = 0
                    for station in stations:
                        avg_lat += station['lat']
                        avg_lon += station['lon']
                    station_count = len(stations)
                    if station_count > 0:
                        avg_lat = avg_lat / station_count
                        avg_lon = avg_lon / station_count
                    r = BikeNetwork(
                        id= "gbfs_%s" % line['System ID'],
                        codec=GbfsCodec.NAME,
                        name=name,
                        config=config,
                        lat=avg_lat,
                        lon=avg_lon)
                    entities.append(r)
                    break
                except Exception as e:
                    logging.error("failed to load %s: %s", name, e)
                    time.sleep(5)
        return entities
    
    def get_info(self, system):
        stations = [["id","name","lat","lon","region"]]
        station_info = process_station_info(system.config['station_information'], STATION_INFO_TTL)
        for station in station_info:
            station[2] = PrettyFloat(station[2])
            station[3] = PrettyFloat(station[3])
            stations.append(station)
        out = {"name": system.name, "stations": stations, "regions":[]}
        if 'system_regions' in system.config:
            out['regions'] = [["id","name"]] + process_regions(system.config['system_regions'], STATION_INFO_TTL)
        return out
    
    def get_status(self, system):
        status_header = [["id","bikes","docks","mod","pts"]]
        station_statuses = process_station_status(system.config['station_status'], STATION_STATUS_TTL)
        if "citibike" in system.config['station_status']:
            points = process_points("https://bikeangels-api.citibikenyc.com/bikeangels/v1/scores",ALERTS_TTL)
            for station_status in station_statuses:
                station_id = station_status[0]
                if station_id in points:
                    station_status.append(points[station_id])
        out = {"statuses": (status_header + station_statuses), "alerts":[], 'bikes':[]}
        if 'system_alerts' in system.config:
            out['alerts'] = process_alerts(system.config['system_alerts'], ALERTS_TTL)
        if 'free_bike_status' in system.config:
            bikes = process_free_bikes(system.config['free_bike_status'], STATION_STATUS_TTL)
            for bike in bikes:
                bike[2] = PrettyFloat(bike[2])
                bike[3] = PrettyFloat(bike[3])
            out['bikes'] = [['id','name','lat','lon']] + bikes
        return out