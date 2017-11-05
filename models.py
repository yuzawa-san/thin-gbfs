
from google.appengine.ext import ndb

class PrettyFloat(float):
    def __repr__(self):
        return '%.4f' % self

class BikeNetwork(ndb.Model):
    name = ndb.StringProperty()
    codec = ndb.StringProperty()
    config = ndb.JsonProperty()
    lat = ndb.FloatProperty()
    lon = ndb.FloatProperty()