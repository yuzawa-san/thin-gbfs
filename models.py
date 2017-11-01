
from google.appengine.ext import ndb

class GbfsSystem(ndb.Model):
    name = ndb.StringProperty()
    urls = ndb.JsonProperty()
    lat = ndb.FloatProperty()
    lon = ndb.FloatProperty()