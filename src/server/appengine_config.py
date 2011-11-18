#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.
#

"""Appengine configuration options."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

try:
  from google.appengine.ext.appstats import recording
except:
  pass


# Disable 'Import not at top of file' and
# 'Import not at top of file' lint errors.
# pylint: disable-msg=C6204,C6409
def webapp_add_wsgi_middleware(app):
  """Adds support for Appstats, the appengine RPC instrumentation service."""
  app = recording.appstats_wsgi_middleware(app)
  return app

