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

import webapp2

from bugs.handlers.bugs import base
from bugs.models.bugs import get
from bugs.models.bugs import update


class GetError(base.Error):
  """Raised if an error occurs getting a bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class UpdateError(base.Error):
  """Raised if an error occurs updating a bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class AccessHandler(base.BugsHandler):
  """Access a bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def put(self, key):
    """Update a bug entry with the given data using the given key.

    Args:
      key: The key for the bug to retrieve. (integer)

    Raises:
      UpdateError: Failed to update the bug.
      base.InvalidJson: Raised if the data fails to be JSON parsed/stringified.
      base.MissingDataError: Raised if data is not present.
    """
    key = int(key)
    data = self.GetData()

    try:
      update.Update(key, data)
      # TODO (jason.stredwick): Add in deletion of UrlBugMaps and add in new
      # ones.
    except update.InvalidKeyError:
      raise UpdateError('Key (%s) did not match any stored bugs.' % key)
    except update.UpdateError:
      raise UpdateError('An error occurred trying to update bug (key=%s).' %
                        key)

    self.WriteResponse({'key': key})

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self, key):
    """Get a bug entry using the given key.

    Args:
      key: The key for the bug to retrieve. (integer)

    Raises:
      GetError: No bug for the given key was found.
      BadBugError: Unable to convert bug details to a JSON string.
      base.InvalidJson: Raised if the data fails to be JSON parsed/stringified.
    """
    key = int(key)

    try:
      data = get.Get(key)
    except get.InvalidKeyError:
      raise GetError('Failed to find bug for the given key (%s).' % key)

    self.WriteResponse(data)


routes = [
  webapp2.Route(r'/bugs/<key:\d+>', handler=AccessHandler, name='bugs_access',
                methods=['GET', 'PUT'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

