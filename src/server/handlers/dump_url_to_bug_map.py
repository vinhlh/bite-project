#!/usr/bin/python2.4
# Copyright 2010 Google Inc. All Rights Reserved.

"""Dump UrlToBugMap data in JSON format."""




# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import simplejson

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from models import url_bug_map


class DumpUrlToBugMapHandler(webapp.RequestHandler):
  def get(self):
    query = url_bug_map.UrlBugMap.all()
    all_url_bug_maps = [urlbugmap for urlbugmap in query.fetch(limit=10000)]
    self.response.out.write(simplejson.dumps(all_url_bug_maps))
    self.response.headers['Content-Type'] = 'application/json'


application = webapp.WSGIApplication([
    ('/dump_url_to_bug_map', DumpUrlToBugMapHandler),
    ])


def main():
  run_wsgi_app(application)

if __name__ == '__main__':
  main()
