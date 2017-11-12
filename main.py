import webapp2
import logging
from models import BikeNetwork
import json
import time
from google.appengine.ext.webapp import template
from google.appengine.ext import ndb
from google.appengine.api import urlfetch
from codec.gbfs import GbfsCodec
from codec.pybikes import PyBikesCodec
from models import PrettyFloat
from http import RestHandler

STATION_INFO_TTL = 86400
ALERTS_TTL = 600
STATION_STATUS_TTL = 20

CODECS = {
    GbfsCodec.NAME: GbfsCodec(),
    PyBikesCodec.NAME: PyBikesCodec()
}

class LicenseHandler(RestHandler):
    def get(self):
        payload= template.render('LICENSE',{})
        self.text_response(payload,ttl=0,etag=True)
        
class MainPage(RestHandler):
    def get(self):
        payload= template.render('index.html',{})
        self.html_response(payload,ttl=0,etag=True)

class OverviewPage(RestHandler):
    def get(self):
        payload= template.render('overview.html',{})
        self.html_response(payload,ttl=0,etag=True)

class TileHandler(RestHandler):
    def get(self,basemap,z,y,x):
        #url = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/%s/%s/%s" % (z,y,x)
        url = "http://cartodb-basemaps-a.global.ssl.fastly.net/light_all/%s/%s/%s.png" % (z,x,y)
        result = urlfetch.fetch(url, validate_certificate=True)
        if result.status_code != 200:
            self.response_error()
            return 
        self.png_response(result.content, ttl=3600, etag=True)

class BikeNetworkStatusApi(RestHandler):
    def get(self,system_id):
        system = BikeNetwork.get_by_id(system_id)
        if not system:
            self.response_error()
            return
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = 'public,max-age=%d' % STATION_STATUS_TTL
        out = CODECS[system.codec].get_status(system)
        self.json_response(out,ttl=STATION_STATUS_TTL,etag=True)

class BikeNetworkInfoApi(RestHandler):
    def get(self,system_id):
        system = BikeNetwork.get_by_id(system_id)
        if not system:
            self.response_error()
            return
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = 'public,max-age=%d' % STATION_INFO_TTL
        out = CODECS[system.codec].get_info(system)
        self.json_response(out,ttl=STATION_INFO_TTL,etag=True)

class BikeNetworkListApi(RestHandler):
    def get(self):
        out = []
        for system in BikeNetwork.query().fetch():
            out.append([system.key.id(), system.name, PrettyFloat(system.lat), PrettyFloat(system.lon)])
        out.sort(key=lambda x: x[0])
        if not out:
            self.response_error()
            return
        self.json_response([["id","name","lat","lon"]] + out,ttl=STATION_INFO_TTL,etag=True)

class UpdateSystemsHandler(webapp2.RequestHandler):
    def get(self):
        entities = []
        for codec_name, codec in CODECS.items():
            logging.info("Refreshing %s..." % codec_name)
            try:
                entities += codec.load()
            except Exception as e:
                logging.error("failed to load %s: %s", codec_name, e)
                time.sleep(5)
        
        ndb.delete_multi(
            BikeNetwork.query().fetch(keys_only=True)
        )
        ndb.put_multi(entities)

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/overview', OverviewPage),
    ('/systems/([^/]+)/info', BikeNetworkInfoApi),
    ('/systems/([^/]+)/status', BikeNetworkStatusApi),
    ('/systems', BikeNetworkListApi),
    ('/LICENSE', LicenseHandler),
    ('/load', UpdateSystemsHandler),
    ('/tile/([^/]+)/([0-9]+)/([0-9]+)/([0-9]+)', TileHandler),
], debug=True)
