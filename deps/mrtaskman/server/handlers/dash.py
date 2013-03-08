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

"""Handlers for the MrTaskman Tasks API."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import datetime
import json
import logging
import urllib
import webapp2

from google.appengine.ext.webapp import template

from models import tasks
from models import packages
from util import model_to_dict

# Old Devices IDs.
#  'SH0CJLV00997',
#  '3233A90D16A800EC',
#  '328C000600000001',
#  '902a6d03',
#  'LGOTMSae4105e',
#  '0146A14C1001800C',
#  'HT16RS015741',
#  'TA08200CI0',
#  '4342354131485A483144',
#  '388920443A07097',
#  '304D191A2004639E',
DEVICES = [
  'Amazon Kindle Fire',
  'Galaxy Nexus',
  'Google Nexus S',
  'HTC Thunderbolt',
  'LG Nitro HD',
  'Motorola Droid X2',
  'Samsung Galaxy S II',
  'Samsung Galaxy Tab',
  'Samsung Galaxy Tab 8.9',
  'Sony Ericson Xperia PLAY 4G',
  'T-Mobile MyTouch 3G',
  'macos',
]


class DashHandler(webapp2.RequestHandler):
  """A dashboard for MrTaskman."""
  def get(self):
    args = {
      'devices': DEVICES
    }
    self.response.out.write(template.render('handlers/dash.html', args))


class ExecutorDashHandler(webapp2.RequestHandler):
  """A dashboard for MrTaskman."""
  def get(self, executor):
    executor = urllib.unquote(executor)
    backlog = tasks.GetByExecutor(executor, limit=5000, keys_only=True)
    oldest = tasks.GetOldestTaskForCapability(executor)
    recently_finished = tasks.GetRecentlyFinishedTasks(executor, 20)
    current = tasks.GetCurrentTask(executor)

    passes = 0
    for finished in recently_finished:
      if finished.outcome == tasks.TaskOutcomes.SUCCESS:
        passes += 1
      finished.id = finished.key().id()
    pass_rate = 0.0
    if len(recently_finished) > 0:
      pass_rate = 100.0 * float(passes) / float(len(recently_finished))

    if oldest:
      oldest.id = oldest.key().id()
    if current:
      current.id = current.key().id()

    args = {
      'executor': executor,
      'pass_rate': pass_rate,
      'backlog': len(backlog),
      'oldest': oldest,
      'current': current,
      'recently_finished': recently_finished,
    }

    self.response.out.write(
        template.render('handlers/executor_dash.html', args))


app = webapp2.WSGIApplication([
    ('/dash', DashHandler),
    ('/dash/(.+)', ExecutorDashHandler),
    ], debug=True)
