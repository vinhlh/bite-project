#!/usr/bin/env python
#
# Copyright 2011 MiuMeet AG.
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


from google.appengine.api import namespace_manager
from google.appengine.api import urlfetch
from google.appengine.api import users
from google.appengine.ext import db

from third_party.prodeagle import config

class AuthKey(db.Model):  
  secret = db.StringProperty()

def getKeySecret(handler, update_auth=None):
  namespace = namespace_manager.get_namespace()
  try:
    namespace_manager.set_namespace(config.NAMESPACE)
    key = AuthKey.get_by_key_name("master")
    if update_auth:
      if not key or key.secret != update_auth:
        try:
          fetch = urlfetch.fetch("%s/auth/?site=%s&auth=%s" %
                                 (config.SECURE_HOST,
                                  handler.request.headers["Host"],
                                  update_auth))
        except:
          return
        if fetch.status_code == 200 and fetch.content == "OK":
          key = AuthKey(key_name="master")
          key.secret = update_auth
          try:
            key.put()
          except:
            pass
    if key:
      return key.secret
  finally:
    namespace_manager.set_namespace(namespace)

def isProdEagle(handler):
  possible_auth = handler.request.get("auth")
  if possible_auth:
    secret = getKeySecret(handler, possible_auth)
    if secret == possible_auth:
      return True
  if "X-Appengine-Queuename" in handler.request.headers:
    return True
  return False

def isAdministrator(handler):
  user = users.get_current_user()
  if not user:
    handler.redirect(users.create_login_url(handler.request.url))
    return False
  elif users.is_current_user_admin():
    return True
  else:
    handler.response.out.write(
        ("Please login with an administrator account. "
         "<a href='%s'>Logout</a>") %
         users.create_logout_url(handler.request.url))
    return False

def addUser(handler, email):
  if isAdministrator(handler):
    secret = getKeySecret(handler)
    if not secret:
      handler.response.out.write(
        "ProdEagle hasn't set your secret yet. Please visit prodeagle.com " +
        "and register your website.")
      return
    type = "administrator"
    if handler.request.get("viewer"):
      type = "viewer"
    handler.redirect(str("%s/auth/?site=%s&auth=%s&%s=%s" %
                  (config.SECURE_HOST,
                   handler.request.headers["Host"],
                   secret, type, email)))
  
