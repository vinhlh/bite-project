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

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

import logging
import webapp2

from bugs import kind
from bugs.models.bugs import bug
from bugs.providers import services
from common.handlers import base


class Error(base.Error):
  pass


class CreateHandler(base.BaseHandler):
  """Create a new bug entry."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Create a new bug entry with the given data.

    Raises:
      Error: Raised if the data fails to be JSON parsed/stringified or is not
          present.
    """
    logging.info('New bug handler; bugs.handlers.bugs.create.CreateHandler')

    # TODO (jason.stredwick): Figure out the correct failure strategy if a new
    # bug is created but either the url/bug mapping or pusher fails.
    try:
      data = self.GetData(kind.Kind.BUG)
      bug_model = bug.Create(data)
      id = bug_model.key().id()
      services.Index(id)
      services.Push(id)
      self.WriteResponse({'kind': kind.Kind.ID, 'id': id})
    except bug.CreateError, e:
      raise Error('Failed to create a new bug.\n%s\n' % e, code=400)
    except services.PushError:
      raise Error('Failed to push new bug [id=%s].\n' % id, code=400)
    except services.IndexError:
      raise Error('Failed to create index for new bug [id=%s].\n' % id,
                  code=400)
    except base.Error, e:
      raise Error(e)


routes = [
  webapp2.Route(r'/bugs', handler=CreateHandler, name='bugs_create',
                methods=['POST'])
]
app = webapp2.WSGIApplication(routes, debug=True)

