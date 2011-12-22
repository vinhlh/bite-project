#!/usr/bin/python2.7
#
# Copyright 2011 Google Inc. All Rights Reserved.
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

"""Retrieve all bugs and their details."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import json
import webapp2

from bugs.handlers.bugs import base
from bugs.models.bugs import all


class AllError(base.Error):
  """Raised if an error occurs getting all bugs."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class BadBugError(base.Error):
  """Raised if an error occurs converting a bug object to a json string."""

  def __init__(self):
    msg = ('Get all bugs failed due to failure to convert bug object to JSON '
           'string while processing set of bugs.')
    base.Error.__init__(self, msg=msg)


class AllHandler(base.BugsHandler):
  """Retrieves all bugs."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Retrieve the details for all bug entries."""
    try:
      data = all.All()
    except all.Error:
      raise AllError('')

    try:
      data_str = json.dumps(data)
    except (ValueError, TypeError, OverflowError):
      raise BadBugError

    self.response.code = 200
    self.response.out.write(json.dumps({'data_json_str': data_str}))


routes = [
  webapp2.Route(r'/bugs/all', handler=AllHandler, name='bugs_all',
                methods=['GET'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)
