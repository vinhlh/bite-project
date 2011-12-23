# Copyright 2010 Google Inc. All Rights Reserved.
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

"""Gets the bugs associated with a given URL.

Called by the clients to retrieve the list of bugs known for a given URL.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'


import sys
import webapp2

from google.appengine.api import users

from handlers import base
from models import bugs
from models import url_bug_map
from utils import url_util


class BugsForUrlHandler(base.BaseHandler):
  """Handles GET request to the '/get_bugs_for_url' URI.

  Attributes:
    _retrieve_method: Method used to retrieve the list of bugs for a given URL.
    DEFAULT_MAX_RESULTS: Static int used to limit the amount of bugs retrieved
        for a given URL if no max_results is specified in the request.
  """

  DEFAULT_MAX_RESULTS = 1000

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Retrieves up to max_results bugs for the given target_url.

    Attributes:
      target_url: Required URL for which we want to retrieve bugs.
      max_results: Optional int specifying the maximum results to retrieve.
      status: Status of the bugs to retrieve.

    Returns:
      A list of JSON-encoded bugs.
    """
    current_user = users.get_current_user()
    user_email = None
    if current_user:
      user_email = current_user.email()

    if users.is_current_user_admin():
      # If current user is an admin allow the overriding of the user_email.
      user_email = self.GetOptionalParameter('user', user_email)

    target_url = self.GetRequiredParameter('target_url')
    state = self.GetOptionalParameter('state', None)
    status = self.GetOptionalParameter('status', None)
    max_results = self.GetOptionalIntParameter(
        'max_results', BugsForUrlHandler.DEFAULT_MAX_RESULTS)
    
    # Retrieve the list of bugs.
    bugs_list = url_bug_map.GetBugsForUrl(
        target_url, user_email, max_results, state, status)

    # JSON-encode the response and send it to the client.
    result = bugs.JsonEncode(bugs_list)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(result)

app = webapp2.WSGIApplication(
    [('/get_bugs_for_url', BugsForUrlHandler)],
    debug=True)
