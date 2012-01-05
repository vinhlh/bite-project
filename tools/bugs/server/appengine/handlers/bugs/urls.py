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

"""Get a set of bugs based on url."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

import webapp2

from bugs import kind
from bugs.handlers.bugs import base
from bugs.models.url_bug_map import get_bugs


class Error(base.Error):
  pass


class UrlsHandler(base.BugsHandler):
  """Get bug entries based on url."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Get bugs for the given urls.

    Raises:
      Error: Raised upon failure.
    """
    try:
      data = self.GetData(kind.Kind.URLS)
      mappings = get_bugs.GetBugs(data['urls'])
      self.WriteResponse({'kind': kind.Kind.URL_BUG_MAP, 'mappings': mappings})
    except get_bugs.Error, e:
      raise Error('Failed to retrieve bugs for Url to Bug map: %s\n' % e,
                  code=400)
    except base.Error, e:
      raise Error(e)


routes = [
  webapp2.Route(r'/bugs/urls', handler=UrlsHandler, name='bugs_urls',
                methods=['POST'])
]
app = webapp2.WSGIApplication(routes, debug=True)

