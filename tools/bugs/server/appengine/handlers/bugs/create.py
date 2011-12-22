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

"""Create a new bug entry."""


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
from bugs.models.bugs import create


class InvalidJson(base.Error):
  """Raised if an error occurs processing input data."""

  def __init__(self):
    msg = 'Creating new bug failed due to invalid json data.'
    base.Error.__init__(self, msg=msg)


class CreationError(base.Error):
  """Raised if an error occurs creating a new bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class CreateHandler(base.BugsHandler):
  """Create a new bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Create a new bug entry with the given data."""
    data_json_str = self.GetRequiredParameter('data_json_str')
    if not data_json_str:
      data = {}
    else:
      try:
        data = json.loads(data_json_str)
      except (ValueError, TypeError, OverflowError):
        raise InvalidJson

    try:
      id = create.Create(data)
    except create.Error:
      raise CreationError('Failed to create a new bug.')

    self.response.code = 200
    self.response.out.write(json.dumps({'id': id}))


routes = [
  webapp2.Route(r'/bugs', handler=CreateHandler, name='bugs_create',
                methods=['POST'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)
