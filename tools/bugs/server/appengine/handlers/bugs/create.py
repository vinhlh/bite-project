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
from bugs.providers import services


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

    # TODO (jason.stredwick): Figure out the correct failure strategy if a new
    # bug is created but either the url/bug mapping or pusher fails.
    try:
      key = create.Create(data)
      services.Index(key)
      services.Push(key)
    except create.Error:
      raise CreationError('Failed to create a new bug.')
    except services.PushError:
      raise CreationError('Failed to push the new bug.')
    except services.IndexError:
      raise CreationError('Failed to create index for the new bug.')

    self.WriteResponse({'key': key})


routes = [
  webapp2.Route(r'/bugs', handler=CreateHandler, name='bugs_create',
                methods=['POST'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

