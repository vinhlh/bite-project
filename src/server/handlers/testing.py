#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Testing handlers for the HUD project.

Used to expose some of the server internal contructs to facilitate manual
testing and debugging.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import sys

from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from handlers import base


class FlushCacheHandler(base.BaseHandler):
  """Flushes memcache."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    result = memcache.flush_all()
    self.response.out.write('Flush success status: <b>%s</b>' % result)


application = webapp.WSGIApplication(
    [('/testing/flush_cache', FlushCacheHandler)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
