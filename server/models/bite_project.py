#!/usr/bin/python2.4
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

"""BITE Project model.

Bite Project model is used to differ projects, which is created by
a lead.
"""

__author__ = 'phu@google.com (Po Hu)'
__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

import simplejson

from google.appengine.ext import db
from models import model_helper


class Error(Exception):
  pass


class MissingProjectNameError(Error):
  """Missing the project name."""


class DuplicatedProjectNameError(Error):
  """Has the project name existing."""


class NoProjectFoundError(Error):
  """A project with the given name was not found."""


class BiteProject(db.Model):
  """Contains project related info."""
  # General information
  name = db.StringProperty(required=False, default='')
  description = db.TextProperty(required=False, default='')
  emails = db.StringListProperty(default=[])

  # Creation Information
  visible = db.BooleanProperty(required=False, default=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  created_time = db.DateTimeProperty(required=False, auto_now_add=True)
  last_modified_time = db.DateTimeProperty(required=False, auto_now=True)
  last_modified_by = db.UserProperty(required=False, auto_current_user=True)

  # External affiliations
  provider = db.StringProperty(required=False)
  provider_info = db.StringProperty(required=False, default='')

  # Run settings
  worker_mode_token = db.StringProperty(required=False, default='')
  start_url_replacement = db.StringProperty(required=False, default='')
  line_timeout_limit = db.IntegerProperty(required=False, default=15)
  max_runs_per_test = db.IntegerProperty(required=False, default=5)
  test_case_line_length = db.IntegerProperty(required=False, default=80)
  save_screen_shot = db.BooleanProperty(required=False, default=True)


def _LookupProject(name):
  """Retrieve a project database entry."""
  if not name:
    raise MissingProjectNameError('There is no project name defined.')

  project = BiteProject.get_by_key_name(name)
  if not project:
    raise NoProjectFoundError(''.join(['Project (', name, ') not found.']))

  return project


def AddProject(name, data):
  """Adds a project."""
  if not name:
    raise MissingProjectNameError('There is no project name defined.')

  if BiteProject.get_by_key_name(name):
    raise DuplicatedProjectNameError('Duplicated project name error.')

  # Assume name is ascii.
  project = BiteProject.get_or_insert(key_name=str(name), name=name)
  if data:
    data_obj = simplejson.loads(data)
    model_helper.Update(project, data_obj, exclude=['name'])
    project.put()

  return project


def GetAllProjects():
  """Returns a list of all the BiteProject entities."""
  return BiteProject.all()


def GetDefaultProject():
  """Return a project in the default state."""
  return BiteProject()


def GetProject(name):
  """Get a project."""
  return _LookupProject(name)


def ListProjects():
  """List all projects."""
  query = BiteProject.all(keys_only=True)
  keys = [result.name() for result in query]
  return simplejson.dumps(keys)


def DeleteProject(name):
  """Delete a project."""
  _LookupProject(name).delete()


def UpdateProject(name, data):
  """Update a project."""
  project = _LookupProject(name)

  if data:
    data_obj = simplejson.loads(data)
    model_helper.Update(project, data_obj, exclude=['name'])
    project.put()

  return project
