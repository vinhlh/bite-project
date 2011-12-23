#!/usr/bin/python
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

"""Tester management."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import logging
import webapp2

from handlers import base
from models import test_cycle_user


class TestersHandler(base.BaseHandler):
  """Handles requrest to get known testers."""

  def get(self):
    testers = test_cycle_user.GetTesters()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(test_cycle_user.JsonEncode(testers))


class TestersCycleHandler(base.BaseHandler):
  """Handles requests to get testers in a given cycle."""
  
  def get(self, cycle_key):
    testers = test_cycle_user.FetchTestersForCycle(cycle_key)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(test_cycle_user.JsonEncode(testers))
    
    
app = webapp2.WSGIApplication(
    [('/testers', TestersHandler),
     ('/testers/all', TestersHandler),
     ('/cycle/(\w+)/testers', TestersCycleHandler),
     ('/cycle/(\w+)/testers/all', TestersCycleHandler)],
    debug=True)
