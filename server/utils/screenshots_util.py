#!/usr/bin/python
#
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
