#!/usr/bin/python2.4
# Copyright 2010 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Dump UrlToBugMap data in JSON format."""




# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import json

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from models import url_bug_map


class DumpUrlToBugMapHandler(webapp.RequestHandler):
  def get(self):
    query = url_bug_map.UrlBugMap.all()
    all_url_bug_maps = [urlbugmap for urlbugmap in query.fetch(limit=10000)]
    self.response.out.write(json.dumps(all_url_bug_maps))
    self.response.headers['Content-Type'] = 'application/json'


application = webapp.WSGIApplication([
    ('/dump_url_to_bug_map', DumpUrlToBugMapHandler),
    ])


def main():
  run_wsgi_app(application)

if __name__ == '__main__':
  main()
