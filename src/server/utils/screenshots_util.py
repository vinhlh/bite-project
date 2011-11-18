#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Screenstho utilities."""

__author__ = 'alexto@google.com (Alexis O. Torres)'


import base64

from utils import url_util


# Path to the get screenshots API.
GET_PATH = '/screenshots/fetch'


def RetrievalUrl(request_url, screenshot_id):
  """Returns URL to fetch a screenshot by id."""
  base_url = url_util.GetBaseUrl(request_url)
  return base_url + GET_PATH + '?id=' + str(screenshot_id)


def DecodeBase64PNG(data):
  prefix = 'data:image/png;base64,'
  content = data[len(prefix):]
  return base64.b64decode(content)
