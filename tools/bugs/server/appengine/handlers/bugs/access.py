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

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

import logging
import webapp2

from bugs import kind
from bugs.handlers.bugs import base
from bugs.models.bugs import bug
from util import model_to_dict


class Error(base.Error):
  pass


class AccessHandler(base.BugsHandler):
  """Access a bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def put(self, id):
    """Update a bug entry with the given data using the given id.

    Args:
      id: The id for the bug to retrieve. (integer)
    Raises:
      Error: Something went wrong processing the request/response or performing
          the update.
    """
    logging.info('Update bug handler; bugs.handlers.access.AccessHandler')

    id = int(id)

    try:
      data = self.GetData(kind.Kind.BUG)
      bug_model = bug.Get(id)
      bug.Update(bug_model, data)
      # TODO (jason.stredwick): Add in deletion of UrlBugMaps and add in new
      # ones.
    except bug.InvalidIdError:
      raise Error('Failed to find bug [id=%s].' % id, code=400)
    except bug.UpdateError, e:
      raise Error('Update bug [id=%s] failed. Exception: %s' % (id, e),
                  code=400)
    except base.Error, e:
      raise Error(e)

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self, id):
    """Get a bug entry using the given id.

    Args:
      id: The id for the bug to retrieve. (integer)
    Raises:
      Error: The id did not match a stored bug.
    """
    logging.info('Update bug handler; bugs.handlers.access.AccessHandler')

    id = int(id)

    try:
      bug_model = bug.Get(id)
      response = model_to_dict.ModelToDict(bug_model)
      response['kind'] = kind.Kind.BUG
      self.WriteResponse(bug_model)
    except bug.InvalidIdError:
      raise Error('Failed to find bug [id=%s].' % id, code=400)
    except base.Error, e:
      raise Error(e)


routes = [
  webapp2.Route(r'/bugs/<id:\d+>', handler=AccessHandler, name='bugs_access',
                methods=['GET', 'PUT'])
]
app = webapp2.WSGIApplication(routes, debug=True)

