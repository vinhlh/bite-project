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

"""Model for bug data.

Bug is a model for crawled bug information stored in AppEngine's Datastore.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import json
import logging
from google.appengine.ext import db

from models import bugs_util
from models import test_cycle
from utils import encoding_util
from utils import url_util


class InvalidProvider(Exception):
  """Thrown when the caller uses an invalid bug provider."""
  pass


class Bug(db.Model):
  """Models a Bug stored in AppEngine's Datastore.

  After crawling the bug information, relevant bug data is stored in the Bug
  model and one or more association is created in the UrlToBugMap model.

  The bug data stored is normalized to contain some basic fields
  (eg. id, title, domain, etc.), to facilitate its retrieval.

  Attributes:
    bug_id: The ID of the bug in the source (original) bug database.
    title: The bug's title.
    summary: The bug's summary.
    priority: The bug's priority.
    project: Name of the project this bug is associated with.
    provider: Source provider of the bug information.
    author: The user who first reported tihs bug.
    author_url: URL to the profile of the bug's author
    status: Status of the bug (eg. active, fixed, closed) when it
        was crawled.
    details_link: Link to the bug details on the original source.
    reported_on: The date the bug was first opened.
    last_update: Date the bug was last updated in the original bug database.
    last_updater: The last user to update the bug.
    last_updater_url: URL to the profile of the last user to update the bug.
    target_element: When specified, describes an element on the page the bug
         is associated with.
    screenshot: Url to an associated screenshot.
    has_screenshot: Whether a screenshot is attached.
    has_recording: True, if the bug has recorded script attached.
    recording_link: Link to recorded script.
  """
  bug_id = db.StringProperty(required=False)
  title = db.StringProperty(required=True)
  summary = db.TextProperty(required=False)
  priority = db.StringProperty(required=False, default='2')
  project = db.StringProperty(required=True)
  provider = db.StringProperty(required=False)
  author = db.StringProperty(required=False)
  author_id = db.StringProperty(required=False)
  author_url = db.StringProperty(required=False, default='')
  status = db.StringProperty(required=True)
  state = db.StringProperty(required=True,
                            choices=(bugs_util.ACTIVE,
                                     bugs_util.RESOLVED,
                                     bugs_util.CLOSED,
                                     bugs_util.UNKNOWN))
  details_link = db.StringProperty(required=False)
  reported_on = db.StringProperty(required=False)
  last_update = db.StringProperty(required=True)
  last_updater = db.StringProperty(required=False)
  last_updater_url = db.StringProperty(required=False, default='')
  has_target_element = db.BooleanProperty(required=False, default=False)
  target_element = db.TextProperty(required=False)
  has_screenshot = db.BooleanProperty(required=False, default=False)
  screenshot = db.StringProperty(required=False, default='')
  has_recording = db.BooleanProperty(required=False, default=False)
  recording_link = db.TextProperty(required=False, default='')

  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  
  # Test cycle is the differentiates various test runs.
  test_cycle = db.ReferenceProperty(reference_class=test_cycle.TestCycle,
                                    collection_name='testcycle_bugs')
  expected = db.TextProperty(required=False)
  result = db.TextProperty(required=False)


class BugEncoder(json.JSONEncoder):
  """Encoder that knows how to encode Bugs objects."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def default(self, obj):
    """Overrides the default JSONEncoder.

    Args:
      obj: Object to serialize.

    Returns:
      A serializable representation of the Object.
    """
    if isinstance(obj, Bug):
      return {'key': obj.key().id(),
              'id': obj.bug_id,
              'title': obj.title,
              'summary': obj.summary,
              'priority': obj.priority,
              'project': obj.project,
              'provider': obj.provider,
              'status': obj.status,
              'author': obj.author,
              'author_url': obj.author_url,
              'state': obj.state,
              'details_link': obj.details_link,
              'reported_on': obj.reported_on,
              'last_update': obj.last_update,
              'last_updater': obj.last_updater,
              'last_updater_url': obj.last_updater_url,
              'target_element': obj.target_element,
              'has_target_element': obj.has_target_element,
              'screenshot': obj.screenshot,
              'has_screenshot': obj.has_screenshot,
              'has_recording': obj.has_recording,
              'recording_link': obj.recording_link}
    else:
      return json.JSONEncoder.default(self, obj)


def Store(bug_id, title, summary, priority, project, provider, status, author, author_id,
          details_link, reported_on, last_update, last_updater,
          target_element='', screenshot='', recording_link='',
          cycle=None, expected=None, result=None):

  """Creates or updates a bug into the Datastore.

  Creates a bug with the given properties into the datastore. If there is
  already a bug that shares the same bug_id and project name, the bug
  information is simply updated.

  Args:
    bug_id: The ID of the bug in the source (original) bug database.
    title: The bug's title.
    summary: The bug's summary.
    priority: The bug's priority.
    project: Name of the project this bug is associated with.
    provider: Source provider of the bug information.
    status: Status of the bug (eg. Active, Fixed, Closed) when it
        was crawled.
    author: The author of the bug.
    details_link: Link to the bug details on the original source.
    reported_on: The date the bug was first opened.
    last_update: Date the bug was last updated in the original bug
        database.
    last_updater: The last user to update the bug.
    target_element: Optional str describing a specific element on the page
        the bug is associated with.
    screenshot: Optional str url to an associated screenshot.
    recording_link: Optional link to recorded steps.

  Returns:
    The newly created entry.
  """
  logging.info('Status: %s', status)
  status = status.lower()
  state = bugs_util.StateFromStatus(status, provider)
  last_updater_url = bugs_util.GetUserLink(provider, last_updater)
  bug = None

  if bug_id:
    # Check if bug is already in the cache, in which case, we just update it.
    bug = GetBug(bug_id, project, provider)

  title = encoding_util.EncodeToAscii(title)
  summary = encoding_util.EncodeToAscii(summary)
  expected = encoding_util.EncodeToAscii(expected)
  result = encoding_util.EncodeToAscii(result)
  author = encoding_util.EncodeToAscii(author)
  if bug:
    bug.title = title
    bug.summary = summary
    bug.priority = priority
    bug.status = status
    bug.state = state
    bug.details_link = details_link
    bug.last_update = last_update
    bug.last_updater = last_updater
    bug.last_updater_url = last_updater_url
    bug.target_element = target_element
    bug.has_target_element = bool(target_element)
    bug.screenshot = screenshot
    bug.has_screenshot = bool(screenshot)
    bug.test_cycle = cycle
    bug.expected = expected
    bug.result = result
  else:
    bug = Bug(bug_id=bug_id,
              title=title,
              summary=summary,
              priority=priority,
              project=project,
              provider=provider,
              status=status,
              author=author,
              author_id=author_id,
              author_url=bugs_util.GetUserLink(provider, author),
              state=state,
              details_link=details_link,
              reported_on=reported_on,
              last_update=last_update,
              last_updater=last_updater,
              last_updater_url=last_updater_url,
              target_element=target_element,
              has_target_element=bool(target_element),
              screenshot=screenshot,
              has_screenshot=bool(screenshot),
              recording_link=recording_link,
              has_recording=bool(recording_link),
              test_cycle=cycle,
              expected=expected,
              result=result)
  bug.put()
  return bug


def GetBugsById(bug_id, project=None, provider=None,
                query_method=Bug.all, limit=1000):
  """Retrieves a list of bugs from the datastore based on ID.

  Args:
    bug_id: The Id of the bug to retrieve.
    project: The project of the bug.
    provider: The provider of the bug.
    query_method: The method that returns instance of db.Query(Bug).
    limit: The maximum number of results to return.

  Returns:
    A list of bugs matching the ID passed in.
  """
  query = query_method()
  query.filter('bug_id =', bug_id)
  if project:
    query.filter('project =', project)
  if provider:
    query.filter('provider =', provider)
  return query.fetch(limit=limit)


def GetBug(bug_id, project, provider, keys_only=False):
  """Retrieves a bug from either memcache or the Datastore.

  Args:
    bug_id: Id of bug to retrieve.
    project: Project of bug in question.
    provider: Source provider of the bug information.
    keys_only: Whether the query should return full entities or just keys.

  Returns:
    Bug object if one exists with the specified id and project
    combination or None.
  """
  query = Bugs.all(keys_only=keys_only).filter('bug_id =', bug_id)
  return query.filter('project =', project).provider('provider =', provider).get()


def GetBugByKey(key_name):
  """Retrieves a bug from the Datastore.

  Args:
    key_name: The key name of the bug.

  Returns:
    Bug object with the given key_name or None.
  """
  return Bug.get_by_id(int(key_name))


def UpdateTargetElement(key_name, target_element):
  """Update the target element information on the specified bug.

  Args:
    key_name: Key name of the bug to update.
    target_element: Str describing a specific element on the page
        the bug is associated with.

  Returns:
    Bug object with the updated target_element information.
  """
  bug = GetBugByKey(key_name)
  bug.target_element = target_element
  bug.has_target_element = bool(target_element)
  bug.put()
  return bug


def UpdateRecording(key_name, recording_link):
  """Update the specified bug with the link to recorded steps.

  Args:
    key_name: Key name of the bug to update.
    recording_link: Link to recorded steps.

  Returns:
    Bug object with the updated recording link.
  """
  bug = GetBugByKey(key_name)
  bug.recording_link = recording_link
  bug.has_recording = bool(recording_link)
  bug.put()
  return bug


def UpdateStatus(key_name, status):
  """Update the status/state of the specified bug.

  Args:
    key_name: Key name of the bug to update.
    status: A string containing the new status of the bug.

  Returns:
    Bug object with the updated target_element information.
  """
  bug = GetBugByKey(key_name)
  bug.status = status
  bug.state = bugs_util.StateFromStatus(status, bug.provider)
  bug.put()
  return bug


def JsonEncode(bugs):
  """JSON encode the given bugs list.

  Args:
    bugs: A list of Bugs.

  Returns:
    JSON encoded str representation of the list.
  """
  return json.dumps(bugs, cls=BugEncoder)
