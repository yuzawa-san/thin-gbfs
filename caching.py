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