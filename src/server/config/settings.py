#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Common settings for the AppEngine front-end."""

__author__ = 'michaelwill@google.com (Michael Williamson)'

import os

try:
  PORT = os.environ['SERVER_PORT']
  SERVER_NAME = os.environ['SERVER_NAME']
except KeyError:
  # Both of these environment variables are not defined in unit
  # tests, so we set them to something reasonable.
  PORT = '8080'
  SERVER_NAME = 'localhost'

if PORT:
  HOST_NAME_AND_PORT = '%s:%s' % (SERVER_NAME, PORT)
else:
  HOST_NAME_AND_PORT = SERVER_NAME


STORAGE_GMAIL_ACCOUNT = 'bite.storage@gmail.com'
