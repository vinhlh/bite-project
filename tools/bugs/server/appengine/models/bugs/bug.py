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

"""Model for bug data.

Bug is a model of BITE bug data."""

__author__ = ('alexto@google.com (Alexis O. Torres)'
              'jason.stredwick@gmail.com (Jason Stredwick)')

import logging

from google.appengine.ext import db

from models import bugs_util


# Bug providers.
class Provider(object):
  DATASTORE = 'datastore'
  ISSUETRACKER = 'issuetracker'


# Allowed bug states.
class State(object):
  ACTIVE = 'active'
  CLOSED = 'closed'
  RESOLVED = 'resolved'
  UNKNOWN = 'unknown'


class CreateError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class InvalidKeyError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class UpdateError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class Bug(db.Model):
  """Models a Bug stored in AppEngine's Datastore.

  This data may be a reduced form of the bug's details as stored in the
  provider's database.

  Attributes:
    title: The bug's title.
    status: Status of the bug (eg. active, fixed, closed) when it
        was crawled.
    state: The current state of the bug; i.e. resolved, closed, or active.
    url: The url of the page the bug was filed against.
    summary: The bug's summary.
    added: When this instance of the bug was added to the BITE datastore.
    modified: When this instance of the bug was last modified in the BITE
        datastore.
    provider: Source provider of the bug information.
    bug_id: The ID of the bug within the provider's bug database.
    author: The user who first reported this bug; from provider.
    author_id: Identifies the user in the provider backend.
    reported_on: The date the bug was first opened; from provider.
    last_update: Date the bug was last updated; from provider.
    last_updater: The last user to update the bug; from provider.
    project: Name of the project this bug is associated with.
    priority: The bug's priority.
    details_link: A url/link to the bug in the provider's database.
    has_target_element: Whether or not a target element is attached.
    target_element: When specified, describes an element on the page the bug
         is associated with.
    has_screenshot: Whether a screenshot is attached.
    screenshot: Url to an associated screenshot.
    has_recording: True, if the bug has recorded script attached.
    recording_link: Link to recorded script.
  """
  # Bug Details
  title = db.StringProperty(required=False)
  status = db.StringProperty(required=False)
  state = db.StringProperty(required=False, default=State.UNKNOWN,
                            choices=(State.ACTIVE, State.RESOLVED,
                                     State.CLOSED, State.UNKNOWN))
  url = db.StringProperty(required=False, multiline=True, default='')
  summary = db.TextProperty(required=False)
  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)

  # Provider Related Details
  provider = db.StringProperty(required=False, default=Provider.DATASTORE,
                               choices=(Provider.DATASTORE,
                                        Provider.ISSUETRACKER))
  bug_id = db.StringProperty(required=False)
  author = db.StringProperty(required=False)
  author_id = db.StringProperty(required=False)
  reported_on = db.StringProperty(required=False)
  last_update = db.StringProperty(required=False)
  last_updater = db.StringProperty(required=False)
  project = db.StringProperty(required=False)
  priority = db.StringProperty(required=False)
  details_link = db.StringProperty(required=False)

  # Attachments
  has_target_element = db.BooleanProperty(required=False, default=False)
  target_element = db.TextProperty(required=False, default='')
  has_screenshot = db.BooleanProperty(required=False, default=False)
  screenshot = db.TextProperty(required=False, default='')
  has_recording = db.BooleanProperty(required=False, default=False)
  recording_link = db.TextProperty(required=False, default='')

  def ToDict(self):
    """Returns the object form of this model plus its id.

    Ignores the following properties:
      added, modified

    Returns:
      The bug details as an object. (dict)
    """
    return {'key': self.key().id(),
            'title': self.title,
            'status': self.status,
            'state': self.state,
            'url': self.url,
            'summary': self.summary,
            'provider': self.provider,
            # TODO (jason.stredwick): Id for historical reasons; update.
            'id': self.bug_id,
            'author': self.author,
            'author_id': self.author_id,
            'reported_on': self.reported_on,
            'last_update': self.last_update,
            'last_updater': self.last_updater,
            'project': self.project,
            'priority': self.priority,
            'details_link': self.details_link,
            'has_target_element': self.has_target_element,
            'target_element': self.target_element,
            'has_screenshot': self.has_screenshot,
            'screenshot': self.screenshot,
            'has_recording': self.has_recording,
            'recording_link': self.recording_link}

  def Patch(self, obj):
    """Patch/update the model with data from the given object.

    For each property in the model, check if that property exists in the given
    data.  If it exists then update the value for that property for the value
    in the given data.  All properties in the given data will be ignored if
    that property does not exist in the model.

    Properties ignored by the patcher (that also exist in the model):
      added, modified, has_target_element, has_screenshot, has_recording

    Args:
      obj: The data to use to patch the model. (dict)

    Raise:
      db.Error: Raised if there is an error assigning the value from the given
          data to model.
      TypeError: Raised if the given object is not an object.
    """
    # Bug details
    if 'title' in obj:
      self.title = obj['title']
    if 'status' in obj:
      self.status = obj['status']
    if 'state' in obj:
      self.state = obj['state']
    if 'url' in obj:
      self.url = obj['url']
    if 'summary' in obj:
      self.summary = obj['summary']
    if 'added' in obj:
      self.added = obj['added']
    if 'modified' in obj:
      self.modified = obj['modified']

    # Provide details
    if 'provider' in obj:
      self.provider = obj['provider']
    # TODO (jason.stredwick): Id for historical reasons; update.
    if 'id' in obj:
      self.bug_id = obj['id']
    if 'author' in obj:
      self.author = obj['author']
    if 'author_id' in obj:
      self.author_id = obj['author_id']
    if 'reported_on' in obj:
      self.reported_on = obj['reported_on']
    if 'last_update' in obj:
      self.last_update = obj['last_update']
    if 'last_updater' in obj:
      self.last_updater = obj['last_updater']
    if 'project' in obj:
      self.project = obj['project']
    if 'priority' in obj:
      self.priority = obj['priority']
    if 'details_link' in obj:
      self.details_link = obj['details_link']

    # Attachments
    if 'target_element' in obj:
      self.target_element = obj['target_element']
      if obj['target_element']:
        self.has_target_element = True
      else:
        self.has_target_element = False
    if 'screenshot' in obj:
      self.screenshot = obj['screenshot']
      if obj['screenshot']:
        self.has_screenshot = True
      else:
        self.has_screenshot = False
    if 'recording_link' in obj:
      self.recording_link = obj['recording_link']
      if obj['recording_link']:
        self.has_recording = True
      else:
        self.has_recording = False

    self.__Verify()

  def __Verify(self):
    """Determines if the bug is valid.

    Raises:
      db.Error: Raised if any bug property is invalid.
    """
    if not self.title:
      raise db.Error


def Create(data):
  """Create a new bug entry.

  Args:
    data: An object used to create a new model. (dict)

  Returns:
    Return the key for the new model. (integer)

  Raises:
    CreateError: Raised if something goes wrong while creating a new bug.
  """
  try:
    bug = Bug()
    bug.Patch(data)
    key = bug.put().id()

    if bug.provider == Provider.DATASTORE:
      bug.bug_id = str(key)
      key = bug.put().id()
  except (TypeError, db.Error), e:
    logging.error('bug.Create: Exception while creating bug: %s' % e)
    raise CreateError
  return key


def Get(key):
  """Returns the bug details for the given key.

  Args:
    key: The key of the bug to retrieve. (integer)

  Returns:
    Returns the bug details as an object. (dict)

  Raises:
    InvalidKeyError: Raised if the key does not match a stored bug.
  """
  try:
    bug = Bug.get_by_id(key)
    if not bug:
      raise InvalidKeyError
  except (db.Error, InvalidKeyError), e:
    logging.error('bug.Get: Exception while retrieving bug (%s): %s' %
                  (key, e))
    raise InvalidKeyError
  return bug.ToDict()


def Update(key, data):
  """Update the bug specified by the given key with the given data.

  Args:
    key: The key of the bug to update. (integer)
    data: An object used to update the model details. (dict)

  Returns:
    Return the key of the bug updated. (integer)

  Raises:
    InvalidKeyError: Raised if the key does match a stored bug.
    UpdateError: Raised if there was an error updating the bug.
  """
  try:
    bug = Bug.get_by_id(key)
    if not bug:
      raise InvalidKeyError
  except (db.Error, InvalidKeyError), e:
    logging.error('bug.Update: Invalid key (%s): %s' % (key, e))
    raise InvalidKeyError

  try:
    bug.Patch(data)
    bug.put()
  except (TypeError, db.Error), e:
    tempdata = data
    if 'screenshot' in tempdata:
      del tempdata['screenshot']
    logging.error('bug.Update: Exception while updating bug (%s): %s.  Given '
                  'data of %s' % (key, e, tempdata))
    raise UpdateError

