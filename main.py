import webapp2
import logging
from models import BikeNetwork, BikeNetworkList
import json
import time
from google.appengine.ext.webapp import template
from google.appengine.ext import ndb
from google.appengine.api import urlfetch
from codec.codec import STALE_SYSTEM_SECONDS
from codec.gbfs import GbfsCodec
from codec.pybikes import PyBikesCodec
from models import SystemListElement, CompactElement
from http import RestHandler
from google.appengine.api import memcache
from caching import http_cached, http_purge, STATION_STATUS_TTL, STATION_INFO_TTL

CODECS = {
    GbfsCodec.NAME: GbfsCodec(),
    PyBikesCodec.NAME: PyBikesCodec()
}

class MainPage(RestHandler):
    @http_cached(etag=True)
    def get(self):
        payload= template.render('oldui/dist/index.html',{})
        self.html_response(payload)

class ServiceWorker(RestHandler):
    def get(self):
        payload= template.render('oldui/dist/sw.js',{})
        self.js_response(payload)

class OverviewPage(RestHandler):
    @http_cached(etag=True)
    def get(self):
        payload= template.render('oldui/src/html/overview.html',{})
        self.html_response(payload)

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
        out = BikeNetworkList.get_by_id("all")
        if not out:
            self.response_error()
            return
        self.json_response(out.networks)

class UpdateSystemsHandler(webapp2.RequestHandler):
    def get(self):
        entities = []
        for codec_name, codec in CODECS.items():
            logging.info("Refreshing %s..." % codec_name)
            try:
                codec_entities = codec.load()
                for entity in codec_entities:
                    delta = time.time() - entity.last_updated
                    if delta < STALE_SYSTEM_SECONDS:
                        entities.append(entity)
                    else:
                        logging.info("Out of date '%s': %d seconds" % (entity.key.id(), delta))
            except Exception as e:
                logging.error("failed to load %s: %s", codec_name, e)
                time.sleep(5)
        
        ndb.delete_multi(
            BikeNetwork.query().fetch(keys_only=True)
        )
        ndb.put_multi(entities)
        out = []
        for system in entities:
            http_purge("/systems/%s/info" % system.key.id())
            out.append(SystemListElement(system))
        networks = BikeNetworkList(id="all",networks=CompactElement.of(out))
        networks.put()
        http_purge("/systems")

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/sw.js', ServiceWorker),
    ('/overview', OverviewPage),
    ('/systems/([^/]+)/info', BikeNetworkInfoApi),
    ('/systems/([^/]+)/status', BikeNetworkStatusApi),
    ('/systems', BikeNetworkListApi),
    ('/load', UpdateSystemsHandler),
], debug=True)