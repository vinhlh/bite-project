#!/usr/bin/python2.4
#
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

"""Bite test handler."""

__author__ = 'phu@google.com (Po Hu)'

#Import not at top
#pylint: disable-msg=C6204
#Statement before imports
#pylint: disable-msg=C6205
#Invalid method name
#pylint: disable-msg=C6409
try:
  import auto_import_fixer
except ImportError:
  pass
import logging
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from handlers import base
from handlers import common_util
from utils import basic_util


class Error(Exception):
  pass


class FetchTestsHandler(base.BaseHandler):
  """The handler for fetching tests based on labels or project name."""

  def get(self):
    self.post()

  def post(self):
    """Fetches tests from tests deposit."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    source = self.GetRequiredParameter('source')
    project = self.GetOptionalParameter('project', '')
    project_id = self.GetOptionalParameter('projectId', '')
    labels_str = self.GetOptionalParameter('labels', '')
    test_info_list = []

    self.response.out.write(
        basic_util.DumpJsonStr({'tests': test_info_list}))


class LoadProjectsHandler(base.BaseHandler):
  """The handler for loading projects from tests depot."""

  def get(self):
    self.post()

  def post(self):
    """Loads the projects."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    source = self.GetRequiredParameter('source')
    project_info_list = []
    self.response.out.write(
        basic_util.DumpJsonStr(project_info_list))


application = webapp.WSGIApplication(
    [('/tests/fetch', FetchTestsHandler),
     ('/tests/load_projects', LoadProjectsHandler)],
    debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
