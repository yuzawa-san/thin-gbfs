from google.appengine.ext import ndb

class CompactElement(object):
    def __init__(self, header, id):
        self.header = header
        self.id = id

    @staticmethod
    def of(items):
        if not items:
            return []
        items.sort(key=lambda x: x.id)
        return [items[0].header] + [item.row() for item in items]

class RegionListElement(CompactElement):
    def __init__(self, id=None, name=None):
        super(RegionListElement, self).__init__(("id","name"), id)
        self.name = name

    def row(self):
        return [self.id, self.name]

class SystemListElement(CompactElement):
    def __init__(self, bike_network):
        super(SystemListElement, self).__init__(("id","name","lat","lon","city"), bike_network.key.id())
        self.name = bike_network.name
        self.lat = float(bike_network.lat)
        self.lon = float(bike_network.lon)
        self.city = bike_network.city

    def row(self):
        return [self.id, self.name, self.lat, self.lon, self.city]

class SystemInfoElement(CompactElement):
    def __init__(self, id=None, name=None, lat=0.0, lon=0.0, region=None):
        super(SystemInfoElement, self).__init__(("id","name","lat","lon","region"),id)
        self.id = id
        self.name = name
        self.lat = float(lat)
        self.lon = float(lon)
        self.region = region

    def row(self):
        out = [self.id, self.name, self.lat, self.lon]
        if self.region:
            out.append(self.region)
        return out

class SystemStatusElement(CompactElement):
    def __init__(self, id=None, bikes=0, docks=0, mod=0, pts=None):
        super(SystemStatusElement, self).__init__(("id","bikes","docks","mod","pts"),id)
        self.bikes = bikes
        self.docks = docks
        self.mod = mod
        self.pts = pts
        
    def row(self):
        out = [self.id, self.bikes, self.docks, self.mod]
        if self.pts:
            out.append(self.pts)
        return out

class BikeNetwork(ndb.Model):
    name = ndb.StringProperty()
    city = ndb.StringProperty()
    codec = ndb.StringProperty()
    config = ndb.JsonProperty()
    lat = ndb.FloatProperty()
    lon = ndb.FloatProperty()
    last_updated = ndb.IntegerProperty()
    
class BikeNetworkList(ndb.Model):
    networks = ndb.JsonProperty()