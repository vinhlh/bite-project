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

"""Bite event handler."""

__author__ = 'phu@google.com (Po Hu)'

import webapp2

from handlers import base
from handlers import common_util
from models import bite_event
from utils import basic_util


class Error(Exception):
  pass


class ShowEventsHandler(base.BaseHandler):
  """The handler for showing the Bite events."""

  def get(self):
    self.post()

  def post(self):
    """Shows the Bite suites info."""
    project_name = self.GetOptionalParameter('projectName', '')
    data = bite_event.GetEventsData(common_util.GetEventData,
                                    project_name)
    self.response.out.write(
        basic_util.DumpJsonStr({'details': data}))


app = webapp2.WSGIApplication(
    [('/event/show_all', ShowEventsHandler)],
    debug=True)

