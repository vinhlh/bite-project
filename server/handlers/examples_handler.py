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

"""The examples handler."""

__author__ = 'phu@google.com (Po Hu)'

import os
import sys
import webapp2
from google.appengine.api import users
from common.handlers import base


class Error(Exception):
  pass


class ExamplesHandler(base.BaseHandler):
  """The examples handler."""

  def get(self):
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    self.RenderTemplate('examples.html', {})


app = webapp2.WSGIApplication(
    [('/examples', ExamplesHandler)],
    debug=True)

