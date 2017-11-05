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
import datetime
import calendar

API_ROOT = "http://api.citybik.es"

STATION_INFO_TTL = 86400
ALERTS_TTL = 600
STATION_STATUS_TTL = 20

@cache
def process_station_info(url):
    url = "%s%s" % (API_ROOT,url)
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    return json.loads(result.content)

class PyBikesCodec(BikeNetworkCodec):
    NAME = "pybikes"
    def load(self):
        url = "%s/v2/networks" % API_ROOT
        result = urlfetch.fetch(url)
        if result.status_code != 200:
            return []
        data = json.loads(result.content)
        entities = []
        for network in data['networks']:
            if "gbfs_href" not in network:
                logging.info("Processing %s" % network['name'])
                r = BikeNetwork(
                 id= "pybikes_%s" % network['id'],
                 name=network['name'],
                 codec=PyBikesCodec.NAME,
                 config=network,
                 lat=network['location']['latitude'],
                 lon=network['location']['longitude'])
                entities.append(r)
        return entities
    
    def get_info(self, system):
        out = [["id","name","lat","lon","region"]]
        response_json = process_station_info(system.config['href'], STATION_INFO_TTL)
        stations = []
        for station in response_json['network']['stations']:
            stations.append([
                station['id'],
                station['name'],
                PrettyFloat(station['latitude']),
                PrettyFloat(station['longitude']),
                0
            ])
        stations.sort(key=lambda x: x[0])
        out = {"name": system.name, "stations": out + stations, "regions":[]}
        return out
    
    def get_status(self, system):
        response_json = process_station_info(system.config['href'], STATION_STATUS_TTL)
        status_header = [["id","bikes","docks","mod"]]
        station_statuses = []
        for station in response_json['network']['stations']:
            ts = station['timestamp']
            fmt = "%Y-%m-%dT%H:%M:%SZ"
            if '.' in ts:
                fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
            ts = datetime.datetime.strptime(ts, fmt)
            ts = calendar.timegm(ts.utctimetuple())
            station_statuses.append([station['id'],station['free_bikes'],station['empty_slots'],ts])
        out = {"statuses": (status_header + station_statuses), "alerts":[], 'bikes':[]}
        return out