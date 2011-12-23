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

"""Bite home handler."""

__author__ = 'phu@google.com (Po Hu)'

import logging
import os
import sys
import webapp2

from google.appengine.api import users
from handlers import base


class Error(Exception):
  pass


class BiteHomeHandler(base.BaseHandler):
  """The default home handler for BITE server."""

  def get(self):
    self.post()

  def post(self):
    user = users.get_current_user()

    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    self.RenderTemplate('base.html', {})


class AutomateHandler(base.BaseHandler):
  """The handler for automating rpf."""

  def get(self):
    self.post()

  def post(self):
    self.RenderTemplate('base.html', {})


app = webapp2.WSGIApplication(
    [('/home', BiteHomeHandler),
     ('/automateRpf', AutomateHandler)],
    debug=True)
