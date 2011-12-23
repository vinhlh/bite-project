#!/usr/bin/python
#
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

"""Displays the home page for the HUD project.

Primarily used to provide content to users navigating directly to the HUD's
homepage (eg. via the browser).
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import os
import sys
import webapp2

from google.appengine.api import users

from handlers import base
from models import counter


class HomeRequestHandler(base.BaseHandler):
  """Home page request handler.

  Main page accessed by users navigating to the project's home page.
  The Home request handler is in charge of serving the HUD's homepage. This
  page is used by human users to navigate the list of crawled bugs, trigger a
  manual crawl, or add/remove bug databases from the crawling queue.
  """

  def GetUserInfo(self):
    user = users.get_current_user()
    if user:
      return {'isSigned': True,
              'email': user.email(),
              'signOut': ''}
    else:
      return {'isSigned': False,
              'signIn': ''}

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Handles the GET request for the home page."""
    env = os.environ
    self.RenderTemplate('landing.html',
                        {'user': self.GetUserInfo()})

app = webapp2.WSGIApplication(
    [('/', HomeRequestHandler)],
    debug=True)
