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

"""Representation of an Event and related functionality."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

from google.appengine.ext import db

import logging


class Error(Exception):
  pass
class ServerEventError(Error):
  pass
class ClientEventError(Error):
  pass


EVENT_TYPES = [
    'STARTUP',
    'SHUTDOWN',
    'RECOVERABLE_FAILURE',
    'UNRECOVERABLE_FAILURE',
    'OFFLINE',
    'RESUME',
    'SERVER_ERROR',
    'CLIENT_ERROR'
]


EVENT_SEVERITY = [
    'DEBUG', 'INFO', 'WARNING', 'ERROR', 'FATAL'
]


class Event(db.Model):
  """MrTaskman's representation of an Event."""
  worker_name = db.StringProperty(required=True)
  event_type = db.StringProperty(required=True, choices=EVENT_TYPES)
  event_severity = db.StringProperty(required=True, choices=EVENT_SEVERITY)
  event_name = db.StringProperty(required=True)
  created = db.DateTimeProperty(auto_now_add=True)

  worker_version = db.StringProperty()
  event_info = db.TextProperty()  # Long text description of event.
  task_id = db.IntegerProperty()
  task_info = db.TextProperty()


# TODO(jeff.carollo): Extract into common library somewhere
# along with ClientError and ServerError types.
def CheckRequiredProperty(model_name, model, prop_name):
  """Raises a ClientEventError if model[prop_name] equates to False."""
  if not model.get(prop_name, None):
    raise ClientEventError('%s is a required %s field.' % (
                               prop_name, model_name))


def AddOptionalModelStrProperty(model, src, prop):
  val = src.get(prop, None)
  if val:
    if not isinstance(val, basestring):
      raise ClientEventError('%s must be a string type.', prop)
    try:
      setattr(model, prop, val)
    except Exception, e:
      raise ClientEventError('%s is invalid. %s', prop, e)


def AddOptionalModelIntProperty(model, src, prop):
  val = src.get(prop, None)
  if val:
    if not isinstance(val, int):
      try:
        val = int(val)
      except TypeError:
        raise ClientEventError('%s must be an int or int-convertible.', prop)
    try:
      setattr(model, prop, val)
    except Exception, e:
      raise ClientEventError('%s is invalid. %s', prop, e)


def CreateEvent(event):
  """Creates an Event from the given event dictionary and stores it."""
  CheckRequiredProperty('Event', event, 'worker_name')
  CheckRequiredProperty('Event', event, 'event_type')
  CheckRequiredProperty('Event', event, 'event_severity')
  CheckRequiredProperty('Event', event, 'event_name')

  e = Event(worker_name=event['worker_name'],
            event_type=event['event_type'],
            event_severity=event['event_severity'],
            event_name=event['event_name'])

  AddOptionalModelStrProperty(e, event, 'worker_version')
  AddOptionalModelStrProperty(e, event, 'event_info')
  AddOptionalModelIntProperty(e, event, 'task_id')
  AddOptionalModelStrProperty(e, event, 'task_info')

  if db.put(e):
    return e


def GetEventById(event_id):
  """Gets a single Event with given integer event_id."""
  event_key = db.Key.from_path('Event', event_id)
  return db.get(event_key)


def DeleteEventById(event_id):
  """Deletes a single Event with given integer event_id."""
  event_key = db.Key.from_path('Event', event_id)
  try:
    db.delete(event_key)
  except db.Error, e:
    logging.exception(e)
    return False
  return True


def GetEventList():
  """Returns all Events in a list."""
  return Event.all().order('-__key__').fetch(1000)
