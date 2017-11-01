from md5 import md5
import json
from google.appengine.api import urlfetch
from google.appengine.api import memcache

def url_key(url):
    return md5(url).hexdigest()

def cache(some_function):

    def wrapper(url, ttl):
        key = url_key(url)
        value = memcache.get(key)
        if value is None:
            value = some_function(url)
            try:
                added = memcache.add(key, json.dumps(value,separators=(',', ':')), ttl)
                if not added:
                    logging.error('Memcache set failed.')
            except ValueError:
                logging.error('Memcache set failed - data larger than 1MB')
            return value
        return json.loads(value)

    return wrapper

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