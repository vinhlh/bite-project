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

"""Bite project handler."""

__author__ = 'phu@google.com (Po Hu)'
__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import json
import urllib
import webapp2

from handlers import base
from models import bite_project
from models import model_helper


class Error(Exception):
  """General exception."""
  pass


class AddProjectHandler(base.BaseHandler):
  """The handler for adding a Bite project."""

  def get(self):
    self.post()

  def post(self):
    name = self.GetRequiredParameter('name')
    data = self.GetOptionalParameter('data', '')
    data = urllib.unquote(data)
    project = bite_project.AddProject(name, data)
    self.response.out.write(model_helper.ToJson(project))


class UpdateProjectHandler(base.BaseHandler):
  """The handler for updating a Bite project."""

  def get(self):
    self.post()

  def post(self):
    name = self.GetRequiredParameter('name')
    data = self.GetOptionalParameter('data', '')
    data = urllib.unquote(data)
    project = bite_project.UpdateProject(name, data)
    self.response.out.write(model_helper.ToJson(project))


class DeleteProjectHandler(base.BaseHandler):
  """The handler for removing a Bite project."""

  def get(self):
    self.post()

  def post(self):
    name = self.GetRequiredParameter('name')
    bite_project.DeleteProject(name)


class GetDefaultProjectHandler(base.BaseHandler):
  """The handler for getting a Bite project."""

  def get(self):
    self.post()

  def post(self):
    project = bite_project.GetDefaultProject()
    self.response.out.write(model_helper.ToJson(project))


class GetProjectHandler(base.BaseHandler):
  """The handler for getting a Bite project."""

  def get(self):
    self.post()

  def post(self):
    name = self.GetRequiredParameter('name')
    project = bite_project.GetProject(name)
    self.response.out.write(model_helper.ToJson(project))


class ListProjectHandler(base.BaseHandler):
  """The handler for getting a list of Bite projects."""

  def get(self):
    self.post()

  def post(self):
    self.response.out.write(bite_project.ListProjects())


app = webapp2.WSGIApplication(
    [('/project/add', AddProjectHandler),
     ('/project/update', UpdateProjectHandler),
     ('/project/delete', DeleteProjectHandler),
     ('/project/get', GetProjectHandler),
     ('/project/get_default', GetDefaultProjectHandler),
     ('/project/list', ListProjectHandler)],
    debug=True)

