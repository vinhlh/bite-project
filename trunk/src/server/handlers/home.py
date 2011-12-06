#!/usr/bin/python2.4
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

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import os
import sys

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

# NOTE: We have to import these functions directly because a bug
# in the AppEngine environment prevents us from importing the name
# "login_handler".
from handlers.login_handler import GetLoginUrl
from handlers.login_handler import GetLogoutUrl
from handlers import base
from models import counter
from models.compat import admins
from models.compat import tester


class GetLatestHandler(base.BaseHandler):
  """Gets the latest BITE lite extension version."""

  # TODO(ralphj): Add a parameter for the type of channel being requested,
  # such as /get_latest_extension?channel=beta. Then pass this into the
  # thanks.html template and have it direct to the appropriate page.

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    user = users.get_current_user()
    if user and (tester.IsActive(user.email()) or
                 admins.IsAdmin(user.email()) or
                 users.is_current_user_admin()):
      counter.Increment('downloads')
      self.RenderTemplate('thanks.html', {})
    else:
      self.redirect('/request_compat_access')


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
              'signOut': GetLogoutUrl()}
    else:
      return {'isSigned': False,
              'signIn': GetLoginUrl()}

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Handles the GET request for the home page."""
    env = os.environ
    is_trusted = (env.has_key('TRUSTED_IP_REQUEST')
                  and env['TRUSTED_IP_REQUEST'] == '1')
    self.RenderTemplate('landing.html',
                        {'user': self.GetUserInfo(),
                         'is_trusted': is_trusted})


application = webapp.WSGIApplication(
    [('/', HomeRequestHandler),
     ('/get_latest_extension', GetLatestHandler)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
