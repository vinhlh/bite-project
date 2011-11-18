#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Bite home handler."""

__author__ = 'phu@google.com (Po Hu)'

#Import not at top
#pylint: disable-msg=C6204
#Statement before imports
#pylint: disable-msg=C6205
#Invalid method name
#pylint: disable-msg=C6409
try:
  import auto_import_fixer
except ImportError:
  pass

import logging
import os
import sys

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from handlers import base


class Error(Exception):
  pass


class BiteHomeHandler(base.BaseHandler):
  """The default home handler for BITE server."""

  def get(self):
    self.post()

  def post(self):
    user = users.get_current_user()

    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    self.RenderTemplate('base.html', {})


application = webapp.WSGIApplication(
    [('/home', BiteHomeHandler)],
    debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
