import webapp2
import logging
from models import GbfsSystem
import json
import caching
import csv
import time
import hashlib
from StringIO import StringIO
from google.appengine.ext.webapp import template
from google.appengine.ext import ndb
from google.appengine.api import urlfetch
from google.appengine.api import taskqueue

STATION_INFO_TTL = 86400
ALERTS_TTL = 600
STATION_STATUS_TTL = 20

class PrettyFloat(float):
    def __repr__(self):
        return '%.4f' % self

class RestHandler(webapp2.RequestHandler):
    def get_etag(self):
        request_etag = None
        if 'If-None-Match' in self.request.headers:
            request_etag = self.request.headers['If-None-Match']
            if request_etag.startswith('"') and request_etag.endswith('"'):
                request_etag = request_etag[1:-1]
        return request_etag
    
    def html_response(self, payload, ttl=0, etag=False):
        self.response.headers['Content-Type'] = 'text/html'
        self.cached_response(payload, ttl, etag)
    
    def json_response(self, obj, ttl=0, etag=False):
        payload = json.dumps(obj,separators=(',', ':'))
        self.response.headers['Content-Type'] = 'application/json'
        self.cached_response(payload, ttl, etag)
    
    def cached_response(self, payload, ttl=0, etag=False):
        self.response.headers['Cache-Control'] = 'public,max-age=%d' % ttl
        if etag:
            response_etag = hashlib.md5(payload).hexdigest()
            self.response.headers['ETag'] = '"%s"' % response_etag
            request_etag = None
            if 'If-None-Match' in self.request.headers:
                request_etag = self.request.headers['If-None-Match']
                if request_etag.startswith('"') and request_etag.endswith('"'):
                    request_etag = request_etag[1:-1]
            if request_etag is not None and request_etag == response_etag:
                self.response.status_int = 304
                self.response.status_message = "Not Modified"
                self.response.status = "304 Not Modified"
                return
        self.response.write(payload)
    
    def response_error(self):
        self.response.headers['Cache-Control'] = 'public,max-age=0'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps({"error":"not_found"}))
        self.response.set_status(404)

class MainPage(RestHandler):
    def get(self):
        payload= template.render('index.html',{'ttl':STATION_STATUS_TTL+10})
        self.html_response(payload,ttl=0,etag=True)

class GbfsSystemStatusApi(RestHandler):
    def get(self,system_id):
        system = GbfsSystem.get_by_id(system_id)
        if not system:
            self.response_error()
            return
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = 'public,max-age=%d' % STATION_STATUS_TTL
        status_header = [["id","bikes","docks","mod"]]
        station_statuses = caching.process_station_status(system.urls['station_status'], STATION_STATUS_TTL)
        out = {"statuses": (status_header + station_statuses), "alerts":[], 'bikes':[]}
        if 'system_alerts' in system.urls:
            out['alerts'] = caching.process_alerts(system.urls['system_alerts'], ALERTS_TTL)
        if 'free_bike_status' in system.urls:
            bikes = caching.process_free_bikes(system.urls['free_bike_status'], STATION_STATUS_TTL)
            for bike in bikes:
                bike[2] = PrettyFloat(bike[2])
                bike[3] = PrettyFloat(bike[3])
            out['bikes'] = [['id','name','lat','lon']] + bikes
        self.json_response(out,ttl=STATION_STATUS_TTL)

class GbfsSystemInfoApi(RestHandler):
    def get(self,system_id):
        system = GbfsSystem.get_by_id(system_id)
        if not system:
            self.self.response_error()
            return
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = 'public,max-age=%d' % STATION_INFO_TTL
        stations = [["id","name","lat","lon","region"]]
        station_info = caching.process_station_info(system.urls['station_information'], STATION_INFO_TTL)
        for station in station_info:
            station[2] = PrettyFloat(station[2])
            station[3] = PrettyFloat(station[3])
            stations.append(station)
        out = {"name": system.name, "stations": stations, "regions":[]}
        if 'system_regions' in system.urls:
            out['regions'] = [["id","name"]] + caching.process_regions(system.urls['system_regions'], STATION_INFO_TTL)
        self.json_response(out,ttl=STATION_INFO_TTL,etag=True)

class GbfsSystemListApi(RestHandler):
    def get(self):
        out = []
        for system in GbfsSystem.query().fetch():
            out.append([system.key.id(), system.name, PrettyFloat(system.lat), PrettyFloat(system.lon)])
        out.sort(key=lambda x: x[0])
        self.json_response([["id","name","lat","lon"]] + out,ttl=STATION_INFO_TTL,etag=True)

class UpdateSystemsHandler(webapp2.RequestHandler):
    def get(self):
        logging.info("Refreshing GBFS Systems...")
        ndb.delete_multi(
            GbfsSystem.query().fetch(keys_only=True)
        )
        
        url = "https://raw.githubusercontent.com/NABSA/gbfs/master/systems.csv"
        result = urlfetch.fetch(url)
        if result.status_code != 200:
            return
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
                    urls = {}
                    for feed in response_json['data']['en']['feeds']:
                        urls[feed['name']] = feed['url']
                    
                    station_info_url = urls['station_information']
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
                    r = GbfsSystem(
                        id=line['System ID'],
                        name=name,
                        urls=urls,
                        lat=avg_lat,
                        lon=avg_lon)
                    entities.append(r)
                    break
                except Exception as e:
                    logging.error("failed to load %s: %s", name, e)
                    time.sleep(5)
        ndb.delete_multi(
            GbfsSystem.query().fetch(keys_only=True)
        )
        ndb.put_multi(entities)

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/systems/(\w+)/info', GbfsSystemInfoApi),
    ('/systems/(\w+)/status', GbfsSystemStatusApi),
    ('/systems', GbfsSystemListApi),
    ('/load', UpdateSystemsHandler),
], debug=True)
