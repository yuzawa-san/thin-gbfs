
# do not ingest systems whose station statuses have not been updated in a long time (7 days)
# they will not be ingested
STALE_SYSTEM_SECONDS = 7*86400

class BikeNetworkCodec(object):
    def load(self):
        pass
    
    def get_info(self, network):
        pass
    
    def get_status(self, network):
        pass