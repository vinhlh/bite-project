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

import webapp2

from bugs.handlers.bugs import base
from bugs.models.url_bug_map import get_bugs


class UrlsError(base.Error):
  """Raised if an error occurs getting all bugs based on url."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class UrlsHandler(base.BugsHandler):
  """Get bug entries based on url."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Get bugs.

    Returns:
      Data to send to the caller. (dict)

    Raises:
      UrlsError
      base.InvalidJson: Raised if the data fails to be JSON parsed/stringified.
      base.MissingDataError: Raised if data is not present.
    """
    data = self.GetData()

    try:
      data = get_bugs.GetBugs(data)
    except get_bugs.Error, e:
      raise UrlsError('Failed to retrieve bugs for the given urls: %s' % e)

    self.WriteResponse(data)


routes = [
  webapp2.Route(r'/bugs/urls', handler=UrlsHandler, name='bugs_urls',
                methods=['POST'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

