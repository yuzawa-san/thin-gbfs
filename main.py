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
from models import SystemListElement, CompactElement
from http import RestHandler
from google.appengine.api import memcache
from caching import http_cached, STATION_STATUS_TTL, STATION_INFO_TTL

CODECS = {
    GbfsCodec.NAME: GbfsCodec(),
    PyBikesCodec.NAME: PyBikesCodec()
}

class LicenseHandler(RestHandler):
    @http_cached(etag=True)
    def get(self):
        payload= template.render('LICENSE',{})
        self.html_response(payload)
        
class MainPage(RestHandler):
    @http_cached(etag=True)
    def get(self):
        payload= template.render('src/html/index.html',{})
        self.html_response(payload)

class OverviewPage(RestHandler):
    @http_cached(etag=True)
    def get(self):
        payload= template.render('src/html/overview.html',{})
        self.html_response(payload)

class TileHandler(RestHandler):
    @http_cached(etag=True,ttl=3600)
    def get(self,basemap,z,y,x):
        #url = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/%s/%s/%s" % (z,y,x)
        url = "http://cartodb-basemaps-a.global.ssl.fastly.net/light_all/%s/%s/%s.png" % (z,x,y)
        result = urlfetch.fetch(url, validate_certificate=True)
        if result.status_code != 200:
            self.response_error()
            return 
        self.png_response(result.content)

class BikeNetworkStatusApi(RestHandler):
    @http_cached(etag=True,ttl=STATION_STATUS_TTL)
    def get(self,system_id):
        system = BikeNetwork.get_by_id(system_id)
        if not system:
            self.response_error()
            return
        out = CODECS[system.codec].get_status(system)
        self.json_response(out)

class BikeNetworkInfoApi(RestHandler):
    @http_cached(etag=True,ttl=STATION_INFO_TTL)
    def get(self,system_id):
        system = BikeNetwork.get_by_id(system_id)
        if not system:
            self.response_error()
            return
        out = CODECS[system.codec].get_info(system)
        self.json_response(out)

class BikeNetworkListApi(RestHandler):
    @http_cached(etag=True,ttl=STATION_INFO_TTL)
    def get(self):
        out = [SystemListElement(system) for system in BikeNetwork.query().fetch()]
        if not out:
            self.response_error()
            return
        self.json_response(CompactElement.of(out))

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
