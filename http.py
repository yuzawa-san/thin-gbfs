import webapp2
import json
import hashlib

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
    
    def text_response(self, payload, ttl=0, etag=False):
        self.response.headers['Content-Type'] = 'text/plain'
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