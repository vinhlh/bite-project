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

"""Handles storing and serving screenshots."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
# Disable 'Statement before imports'
# pylint: disable-msg=C6205
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import simplejson

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from handlers import base
from models import screenshots
from utils import screenshots_util


class UploadHandler(base.BaseHandler):
  """Class for handling uploads."""

  def post(self):
    """Handles uploading a new screenshot."""
    # Required params.
    data = self.GetRequiredParameter('screenshot_data')
    source = self.GetRequiredParameter('source')
    project = self.GetRequiredParameter('project')
    # Optional params.
    source_id = self.GetOptionalParameter('source_id', '')
    caption = self.GetOptionalParameter('caption', None)
    details = self.GetOptionalParameter('details', None)
    labels = self.GetOptionalParameter('labels', None)
    if labels:
      # If present, labels is a JSON encoded list of strings,
      # decode it.
      labels = simplejson.loads(labels)

    screenshot = screenshots.Add(data=data, source=source, source_id=source_id,
                                 project=project, caption=caption,
                                 details=details, labels=labels)

    screenshot_id = screenshot.key().id()
    screenshot_url = screenshots_util.RetrievalUrl(
        self.request.url, screenshot_id)
    self.response.out.write(
        simplejson.dumps({'id': screenshot_id, 'url': screenshot_url}))


class GetHandler(base.BaseHandler):
  """Class for handling fetching a screenshot."""

  def get(self):
    """Handles retrieving an existing screenshot."""
    screenshot_id = self.GetRequiredParameter('id')
    screenshot = screenshots.GetById(screenshot_id=screenshot_id)
    if not screenshot:
      self.error(400)
      return

    self.response.headers['Content-Type'] = 'image/png'
    self.response.out.write(screenshot.data)


class SearchHandler(base.BaseHandler):
  """Class for handling searching for a screenshot."""

  def get(self):
    """Handler retrieving a list of screenshots."""
    # Required params.
    source = self.GetRequiredParameter('source')
    # Optional params.
    source_id = self.GetOptionalParameter('source_id', None)
    project = self.GetOptionalParameter('project', None)
    limit = int(self.GetOptionalParameter('max', screenshots.DEFAULT_LIMIT))

    matches = screenshots.GetScreenshots(source=source,
                                         source_id=source_id,
                                         project=project,
                                         limit=limit)
    request_url = self.request.url
    result = [screenshots_util.RetrievalUrl(request_url, curr.key().id())
              for curr in matches]
    self.response.out.write(simplejson.dumps(result))


application = webapp.WSGIApplication(
    [('/screenshots/upload', UploadHandler),
     ('/screenshots/fetch', GetHandler),
     ('/screenshots/search', SearchHandler)
    ], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
