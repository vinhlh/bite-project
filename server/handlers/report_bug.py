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

"""Bug reporting handlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import datetime
import json
import logging
import sys
import urllib
import webapp2

from google.appengine.api import users

from crawlers import crawler_util
from handlers import base
from models import bugs
from models import bugs_util
from models import comments
from models import url_bug_map
from utils import url_util


class Error(Exception):
  pass


class UnrecognizedProvider(Error):
  pass


class UnrecognizedBindingAction(Error):
  pass

class CreateBugHandler(base.BaseHandler):
  """Handles the creation of a new bug."""

  def post(self):
    current_user = users.get_current_user()
    user_name = current_user.nickname()
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    screenshot_link = ''
    screenshot = self.GetOptionalParameter('screenshot', None)
    title = self.GetRequiredParameter('title')
    url = self.GetOptionalParameter('url', '')
    summary = self.GetOptionalParameter('repro', '')
    expected = self.GetOptionalParameter('expected', '')
    result = self.GetOptionalParameter('result', '')
    url = self.GetRequiredParameter('url')
    cycle_id = self.GetRequiredParameter('test_cycle')

    bug_id = ''
    priority = ''
    details_link = ''
    report_date = str(datetime.datetime.now())
    target_element = self.GetOptionalParameter('target_element', '')
    recording_link = self.GetOptionalParameter('recording_link', '')
    urls = [(url, url_bug_map.UrlPosition.MAIN)]
    priority = ''
    status = 'unconfirmed'

    crawler_util.QueueStoreBug(bug_id=bug_id,
                               title=title,
                               summary=summary,
                               priority=priority,
                               project_name=project,
                               provider=provider,
                               status=status,
                               author=user_name,
                               details_link=details_link,
                               reported_on=report_date,
                               last_update=report_date,
                               last_updater=user_name,
                               target_element=target_element,
                               urls=urls,
                               recording_link=recording_link,
                               cycle_id=cycle_id,
                               screenshot=screenshot,
                               expected=expected,
                               result=result)

class UpdateStatusHandler(base.BaseHandler):
  """Handles updating the status of bugs in Issue Tracker."""

  def post(self):
    comment = self.GetRequiredParameter('comment')
    status = self.GetOptionalParameter('status')
    issue_key = self.GetRequiredParameter('key')
    if status:
      bugs.UpdateStatus(issue_key, status)

    if comment:
      comments.AddComment(issue_key, comment)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps({'success': True}))

class BindingActions(object):
  """Holds the valid actions during binding operations."""
  UPDATE = 'update'
  CLEAR = 'clear'


class UpdateBindingHandler(base.BaseHandler):
  """Handles updating the binding of bugs to controls."""

  def post(self):
    issue_key = self.GetRequiredParameter('key')
    action = self.GetRequiredParameter('action')
    target_element = ''
    if action == BindingActions.UPDATE:
      target_element = self.GetRequiredParameter('target_element')
    elif not action == BindingActions.CLEAR:
      raise UnrecognizedBindingAction('Action: ' + action)

    logging.info('Updating target_element of bug %s, target_element: %s',
                 issue_key, target_element)
    bugs.UpdateTargetElement(issue_key, target_element)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps({'success': True}))


class UpdateRecordingHandler(base.BaseHandler):
  """Handles adding recording to the bug."""

  def post(self):
    issue_key = self.GetRequiredParameter('key')
    action = self.GetRequiredParameter('action')
    recording_link = self.GetRequiredParameter('recording_link')
    logging.info('Update recording link of bug %s, recording_link: %s',
                 issue_key, recording_link)
    bugs.UpdateRecording(issue_key, recording_link)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps({'success': True}))


app = webapp2.WSGIApplication(
    [('/bugs', CreateBugHandler),
     ('/bugs/new', CreateBugHandler),
     ('/bugs/update_binding', UpdateBindingHandler),
     ('/bugs/update_recording', UpdateRecordingHandler),
     ('/bugs/update_status', UpdateStatusHandler)],
    debug=True)
