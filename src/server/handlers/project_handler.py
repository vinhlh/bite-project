#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Bite project handler."""

__author__ = 'phu@google.com (Po Hu)'
__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

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

import simplejson
import urllib

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
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


application = webapp.WSGIApplication(
    [('/project/add', AddProjectHandler),
     ('/project/update', UpdateProjectHandler),
     ('/project/delete', DeleteProjectHandler),
     ('/project/get', GetProjectHandler),
     ('/project/get_default', GetDefaultProjectHandler),
     ('/project/list', ListProjectHandler)],
    debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()

