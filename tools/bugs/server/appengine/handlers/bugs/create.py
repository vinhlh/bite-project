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


import webapp2

from bugs.handlers.bugs import base
from bugs.models.bugs import create
from bugs.models.url_bug_map import create as url_bug_map_create


class CreationError(base.Error):
  """Raised if an error occurs creating a new bug."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class CreateHandler(base.BugsHandler):
  """Create a new bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Create a new bug entry with the given data.

    Raises:
      CreationError: Raised if creation fails.
      base.InvalidJson: Raised if the data fails to be JSON parsed/stringified.
      base.MissingDataError: Raised if data is not present.
    """
    data = self.GetData()

    try:
      key = create.Create(data)
      mapping_key = url_bug_map_create.Create(key)
      # TODO (jason.stredwick): Code to push bug to provider goes here. Adding
      # to the datastore should also be part of this process.  When it is
      # remove code in bugs.models.bugs.bug.Create to set the datastore
      # bug id to the key, and let this process do it instead.
    except create.Error:
      raise CreationError('Failed to create a new bug.')

    self.WriteResponse({'key': key})


routes = [
  webapp2.Route(r'/bugs', handler=CreateHandler, name='bugs_create',
                methods=['POST'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

