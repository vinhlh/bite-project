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

"""Handles login for users."""

__author__ = 'michaelwill@google.com (Michael Williamson)'

# For these gdata imports to work on AppEngine, each has to be imported
# individually...e.g. below you need both atom and atom.url.
# Be careful when changing.
import atom
import atom.url
import gdata
import gdata.client
import gdata.gauth
import json
import webapp2

from google.appengine.api import users

from config import settings
from common.handlers import base

SCOPES = [
    'http://docs.google.com/feeds/',
    'https://docs.google.com/feeds/',
    'http://code.google.com/feeds/issues'
    ]


def GetLoginUrl():
  """Returns a login url that will complete all the necessary gdata checks."""
  return users.create_login_url('/check_gdata_login_status')


def GetLogoutUrl():
  """Returns a logout url."""
  return users.create_logout_url('/')


class SessionTokenSaver(base.BaseHandler):
  def get(self):
    # Here the user_email is required because it's assumed we set the
    # parameter earlier in the process we use for checking gdata access.
    user_email = self.request.get('user')
    if not user_email:
      self.error(400)
      return
    tmp_token = gdata.gauth.AuthSubToken.from_url(self.request.url)
    client = gdata.client.GDClient()
    session_token = client.UpgradeToken(tmp_token)
    gdata.gauth.AeSave(session_token, user_email)
    self.redirect('/')


class CheckGdataLoginStatus(base.BaseHandler):
  """Checks that the user has granted gdata access to this app."""

  def GetAuthSubUrl(self, user_email):
    """Generates an auth sub url to use to redirect the user.

    This url will send the user to the docs page to grant the app access,
    and it contains an embedded url that docs can use to re-redirect the
    user once access has been granted.  For more info, see

    Returns:
      A url string.
    """
    params = {
        'user': user_email
        }
    next_url = atom.url.Url(protocol='http', host=settings.HOST_NAME_AND_PORT,
                            path='/gdata_session_token_saver', params=params)
    scopes = SCOPES
    secure = False  # Set secure=True to request a secure AuthSub token.
    session = True
    return str(gdata.gauth.generate_auth_sub_url(
        next_url.to_string(), scopes, secure=secure,
        session=session))

  def get(self):
    # This is an optional parameter.  Sometimes it's convenient to
    # be able to manually specify the user to check the gdata login
    # status for.
    user_email = self.request.get('user')
    if not user_email:
      user_email = users.get_current_user().email()

    gdata_token = gdata.gauth.AeLoad(user_email)
    if not gdata_token:
      url = self.GetAuthSubUrl(user_email)
      self.redirect(url)
      return
    else:
      self.redirect('/')


class CheckLoginStatus(base.BaseHandler):
  """Checks the login status of a user."""

  def get(self):
    user = users.get_current_user();
    if user:
      response = {
          'loggedIn': True,
          'user': user.email(),
          'url': GetLogoutUrl()
          }
    else:
      response = {
          'loggedIn': False,
          'url': GetLoginUrl()
          }
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(response))


app = webapp2.WSGIApplication(
    [('/check_login_status', CheckLoginStatus),
     ('/check_gdata_login_status', CheckGdataLoginStatus),
     ('/gdata_session_token_saver', SessionTokenSaver),
    ])
