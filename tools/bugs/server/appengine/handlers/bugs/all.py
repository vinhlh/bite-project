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

"""Retrieve all bugs and their details."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


import webapp2

from bugs.handlers.bugs import base
from bugs.models.bugs import all


class AllError(base.Error):
  """Raised if an error occurs getting all bugs."""

  def __init__(self, msg):
    base.Error.__init__(self, msg=msg)


class AllHandler(base.BugsHandler):
  """Retrieves all bugs."""

  def Get(self):
    """Retrieve the details for all bug entries."""
    try:
      data = all.All()
    except all.Error:
      raise AllError('')

    self.WriteResponse(data)


routes = [
  webapp2.Route(r'/bugs/all', handler=AllHandler, name='bugs_all',
                methods=['GET'], schemes=['https'])
]
app = webapp2.WSGIApplication(routes, debug=True)

