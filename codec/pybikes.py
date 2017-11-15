from codec import BikeNetworkCodec
from google.appengine.api import urlfetch
import csv
import logging
import json
import time
from StringIO import StringIO
from models import BikeNetwork
from caching import cache, STATION_STATUS_TTL
from models import SystemInfoElement, SystemStatusElement, CompactElement
import datetime
import calendar

API_ROOT = "http://api.citybik.es"

# NOTE: use status ttl for station ttl since they are in the same file
# otherwise the info fetch would lead to stale status fetches
@cache(ttl=STATION_STATUS_TTL)
def fetch_system_info(url):
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
        response_json = fetch_system_info(system.config['href'])
        stations = []
        for station in response_json['network']['stations']:
            stations.append(SystemInfoElement(
                id=station['id'],
                name=station['name'],
                lat=station['latitude'],
                lon=station['longitude']
            ))
        out = {"name": system.name, "stations": CompactElement.of(stations), "regions":[]}
        return out
    
    def get_status(self, system):
        response_json = fetch_system_info(system.config['href'])
        station_statuses = []
        for station in response_json['network']['stations']:
            ts = station['timestamp']
            fmt = "%Y-%m-%dT%H:%M:%SZ"
            if '.' in ts:
                fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
            ts = datetime.datetime.strptime(ts, fmt)
            ts = calendar.timegm(ts.utctimetuple())
            station_statuses.append(SystemStatusElement(
                id=station['id'],
                bikes=station['free_bikes'],
                docks=station['empty_slots'],
                mod=ts
            ))
        out = {"statuses": CompactElement.of(station_statuses), "alerts":[], 'bikes':[]}
        return out