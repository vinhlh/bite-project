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

"""Test cycle management."""

__author__ = 'alexis.torres@gmail.com (Alexis O. Torres)'

import logging
import webapp2

from handlers import base
from models import test_cycle

class TestCyclesHandler(base.BaseHandler):
  """Handles managing of cycles."""

  def get(self):
    cycles = test_cycle.FetchTestCycles()    
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(test_cycle.JsonEncode(cycles))

app = webapp2.WSGIApplication(
    [('/cycles', TestCyclesHandler),
     ('/cycles/all', TestCyclesHandler)],
    debug=True)

