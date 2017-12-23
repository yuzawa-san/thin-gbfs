import webapp2
import json
import hashlib

# encode floats to 4 places
json.encoder.FLOAT_REPR = lambda f: ("%.4f" % f)
json.encoder.c_make_encoder = None

class RestHandler(webapp2.RequestHandler):
    
    def html_response(self, payload):
        self.response.headers['Content-Type'] = 'text/html'
        self.response.write(payload)
    
    def png_response(self, payload):
        self.response.headers['Content-Type'] = 'image/png'
        self.response.write(payload)
    
    def text_response(self, payload):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write(payload)
    
    def json_response(self, obj):
        payload = json.dumps(obj,separators=(',', ':'))
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(payload)
    
    def response_error(self):
        self.response.headers['Cache-Control'] = 'public,max-age=0'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps({"error":"not_found"}))
        self.response.set_status(404)