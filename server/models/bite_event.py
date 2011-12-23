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

"""Bite Event model is used to log activities performed."""

__author__ = 'phu@google.com (Po Hu)'

# Import not at top
#pylint: disable-msg=C6204
from google.appengine.ext import db

DEFAULT_MAX_EVENTS = 10000

class Error(Exception):
  pass


class EventActions(object):
  """The actions that performed for an entity object."""
  CREATE = 'create'
  MODIFY = 'modify'
  PASS = 'pass'
  FAIL = 'fail'
  START = 'start'
  SCHEDULE = 'schedule'
  DELETE = 'delete'
  COMPLETE = 'complete'


class EventTypes(object):
  """The entity object types."""
  PROJECT = 'project'
  SUITE = 'suite'
  RUN = 'run'
  RUN_TEMPLATE = 'run_template'
  SCHEDULE = 'schedule'
  SET = 'set'


class BiteEvent(db.Model):
  """Contains event related info."""
  host = db.ReferenceProperty(required=False)
  name = db.StringProperty(required=False)
  project = db.StringProperty(required=False)
  labels = db.StringListProperty(default=None)
  action = db.StringProperty(
      required=False,
      choices=(EventActions.CREATE,
               EventActions.MODIFY,
               EventActions.PASS,
               EventActions.FAIL,
               EventActions.START,
               EventActions.SCHEDULE,
               EventActions.DELETE,
               EventActions.COMPLETE))
  log = db.StringProperty(required=False)
  event_type = db.StringProperty(
      choices=(EventTypes.PROJECT,
               EventTypes.SUITE,
               EventTypes.RUN,
               EventTypes.RUN_TEMPLATE,
               EventTypes.SCHEDULE,
               EventTypes.SET),
      required=False)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  created_time = db.DateTimeProperty(required=False, auto_now_add=True)


def AddEvent(host=None, action='', log='', event_type='',
             name='', labels=None, project=''):
  """Adds an event."""
  # Assume name is ascii.
  labels = labels or []

  def Add():
    event = BiteEvent(host=host, action=action, log=log,
                      event_type=event_type,
                      name=name, labels=labels,
                      project=project)
    event.put()
  return db.run_in_transaction(Add)


def GetAllEvents(limit=DEFAULT_MAX_EVENTS, project_name=''):
  """Gets all the events."""
  results = BiteEvent.all().order('-created_time')
  if project_name:
    results.filter('project =', project_name)
  return results.fetch(limit)


def GetEventsData(get_event_func, project_name):
  """Gets events data."""
  events_data = []
  events = GetAllEvents(10, project_name)
  for event in events:
    temp_data = get_event_func(event)
    if temp_data:
      events_data.append(temp_data)
  return events_data

