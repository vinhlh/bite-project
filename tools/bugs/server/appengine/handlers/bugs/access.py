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

"""Access a bug entry; get/update."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import json
import logging
import webapp2

from bugs.handlers.bugs import base
from bugs.models.bugs import get
from bugs.models.bugs import update


class BadBugError(base.Error):
  """Raised if an error occurs converting a bug object to a json string."""

  def __init__(self, id):
    msg = ('Get bug (%s) failed due to failure to convert bug object to JSON '
           'string.' % id)
    base.Error.__init__(self, msg=msg)


class GetError(base.Error):
  """Raised if an error occurs getting a bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class InvalidJson(base.Error):
  """Raised if an error occurs processing input data."""

  def __init__(self, id):
    msg = 'Updating bug (%s) failed due to invalid json data.' % id
    base.Error.__init__(self, msg=msg)


class UpdateError(base.Error):
  """Raised if an error occurs updating a bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class AccessHandler(base.BugsHandler):
  """Access a bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def put(self, id):
    """Update a bug entry with the given data using the given id."""
    data_json_str = self.GetRequiredParameter('data_json_str')
    if not data_json_str:
      data = {}
    else:
      try:
        data = json.loads(data_json_str)
      except (ValueError, TypeError, OverflowError):
        raise InvalidJson(id)

    id = int(id)
    try:
      update.Update(id, data)
    except update.InvalidIdError:
      raise UpdateError('Id (%s) did not match any stored bugs.' % id)
    except update.UpdateError:
      raise UpdateError('An error occurred trying to update bug (id=%s).' % id)

    self.response.code = 200
    self.response.out.write(json.dumps({'id': id}))

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self, id):
    """Get a bug entry using the given id.

    Args:
      id: The id of the bug to retrieve. (integer)

    Raises:
      GetError: No bug for the given id was found.
      BadBugError: Unable to convert bug details to a JSON string.
    """
    id = int(id)
    logging.info('access.get: id = %s' % id)
    try:
      data = get.Get(id)
      logging.info('Got bug')
    except get.Error:
      raise GetError('Failed to find bug for the given id (%s).' % id)

    try:
      data_str = json.dumps(data)
      logging.info('json string for bug: %s' % data_str)
    except (ValueError, TypeError, OverflowError):
      raise BadBugError(id)

    self.response.code = 200
    self.response.out.write(json.dumps({'data_json_str': data_str}))


routes = [
  webapp2.Route(r'/bugs/<id:\d+>', handler=AccessHandler, name='bugs_access',
                methods=['GET', 'PUT'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)
