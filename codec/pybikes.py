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

def _fetch_system_info(url):
    url = "%s%s" % (API_ROOT,url)
    result = urlfetch.fetch(url, validate_certificate=True)
    if result.status_code != 200:
        return None
    return json.loads(result.content)

# NOTE: use status ttl for station ttl since they are in the same file
# otherwise the info fetch would lead to stale status fetches
@cache(ttl=STATION_STATUS_TTL)
def fetch_system_info(url):
    return _fetch_system_info(url)

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
            try:
                if "gbfs_href" not in network:
                    logging.info("Processing %s" % network['name'])
                    recent_ts = 0
                    stations = []
                    station_info = _fetch_system_info(network['href'])
                    for station in station_info['network']['stations']:
                        ts = self._decode_timestamp(station['timestamp'])
                        if ts > recent_ts:
                            recent_ts = ts
                        stations.append(SystemInfoElement(
                            id=station['id'],
                            name=station['name'],
                            lat=station['latitude'],
                            lon=station['longitude']
                        ))
                    city = 'Unknown'
                    if 'city' in network['location']:
                        city = network['location']['city']
                    if 'country' in network['location']:
                        city = "%s, %s" % (city, network['location']['country'])
                    network['system_info'] = {"name": network['name'], "stations": CompactElement.of(stations), "regions":[]}
                    r = BikeNetwork(
                     id= "pybikes_%s" % network['id'],
                     name=network['name'],
                     codec=PyBikesCodec.NAME,
                     config=network,
                     city=city,
                     lat=network['location']['latitude'],
                     lon=network['location']['longitude'],
                     last_updated=recent_ts)
                    entities.append(r)
                    time.sleep(1)
            except Exception as e:
                logging.error("failed to load %s: %s", network['id'], e)
                time.sleep(1)
        return entities
    
    def get_info(self, system):
        return system.config['system_info']
    
    def _decode_timestamp(self, ts):
        fmt = "%Y-%m-%dT%H:%M:%SZ"
        if '.' in ts:
            fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
        ts2 = datetime.datetime.strptime(ts, fmt)
        return calendar.timegm(ts2.utctimetuple())

    def get_status(self, system):
        response_json = fetch_system_info(system.config['href'])
        station_statuses = []
        for station in response_json['network']['stations']:
            ts = self._decode_timestamp(station['timestamp'])
            station_statuses.append(SystemStatusElement(
                id=station['id'],
                bikes=station['free_bikes'] or 0,
                docks=station['empty_slots'] or 0,
                mod=ts
            ))
        out = {"statuses": CompactElement.of(station_statuses), "alerts":[], 'bikes':[]}
        return out