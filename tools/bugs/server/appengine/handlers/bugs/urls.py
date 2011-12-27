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

"""Get a set of bugs based on url.

Handler output is defined by the function:

    get_bugs.GetBugsByUrls
"""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

import json
import logging
import webapp2

from bugs.handlers.bugs import base
from bugs.models.url_bug_map import get_bugs


class BadBugError(base.Error):
  """Raised if an error occurs converting a bug object to a json string."""

  def __init__(self):
    msg = ('Get all bugs based on url failed due to failure to convert bug '
           'object to JSON string while processing set of bugs.')
    base.Error.__init__(self, msg=msg)


class InvalidJson(base.Error):
  """Raised if an error occurs processing input data."""

  def __init__(self):
    msg = 'Getting all bugs based on url failed due to invalid json data.'
    base.Error.__init__(self, msg=msg)


class UrlsError(base.Error):
  """Raised if an error occurs getting all bugs based on url."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class UrlsHandler(base.BugsHandler):
  """Get bug entries based on url."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Get bugs."""
    data_json_str = self.GetRequiredParameter('data_json_str')
    if not data_json_str:
      data = {}
    else:
      try:
        data = json.loads(data_json_str)
      except (ValueError, TypeError, OverflowError):
        raise InvalidJson

    try:
      data = get_bugs.GetBugs(data)
    except get_bugs.Error, e:
      raise UrlsError('Failed to retrieve bugs for the given urls: %s' % e)

    try:
      data_str = json.dumps(data)
    except (ValueError, TypeError, OverflowError):
      raise BadBugError

    self.response.code = 200
    self.response.out.write(data_str)


routes = [
  webapp2.Route(r'/bugs/urls', handler=UrlsHandler, name='bugs_urls',
                methods=['POST'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

