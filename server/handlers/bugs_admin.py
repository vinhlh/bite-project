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

__author__ = 'alexis.torres@gmail.com (Alexis O. Torres)'

import logging
import sys
import urllib
import webapp2

from crawlers import crawler_util
from handlers import base
from models import bugs
from models import bugs_util
from models import screenshots
from utils import screenshots_util

class ImportBug(base.BaseHandler):
  """Handles adding bugs by an admin."""

  def post(self):
    bug_id = self.GetRequiredParameter('id')
    title = self.GetRequiredParameter('title')
    cycle_id = self.GetRequiredParameter('test_cycle')
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    version = self.GetRequiredParameter('version')
    title =self.GetRequiredParameter('title')
    summary = self.GetRequiredParameter('summary')
    priority = self.GetRequiredParameter('priority')
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    author = self.GetRequiredParameter('author')
    author_id = self.GetRequiredParameter('author_id')
    status = self.GetRequiredParameter('status')
    reported_on = self.GetRequiredParameter('reported_on')
    last_update = self.GetRequiredParameter('last_update')
    last_updater = self.GetRequiredParameter('last_updater')
    expected = self.GetRequiredParameter('expected')
    result = self.GetRequiredParameter('result')
    
    crawler_util.QueueStoreBug(bug_id=bug_id,
                          title=title,
                          summary=summary,
                          priority=priority,
                          project_name=project,
                          provider=provider,
                          status=status,
                          author=author,
                          details_link='http://www.utest.com/bugs/%s' % bug_id,
                          reported_on=reported_on,
                          last_update=last_update,
                          last_updater=author,
                          target_element=None,
                          urls=None,
                          cycle_id=cycle_id,
                          expected=expected,
                          result=result)


app = webapp2.WSGIApplication([('/admin/bugs', ImportBug)],
                              debug=True)

