#!/usr/bin/python2.4
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

"""Screenshots captures model.

Used to store screnshots captured while logging a bug or during
an automation run.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'


from google.appengine.ext import db


DEFAULT_LIMIT = 10


class Screenshot(db.Model):
  """Stores a screenshot."""
  data = db.BlobProperty(required=True)
  source = db.StringProperty(required=True)
  source_id = db.StringProperty(required=False)
  project = db.StringProperty(required=False)
  reported_by = db.UserProperty(required=False, auto_current_user_add=True)
  reported_date = db.DateTimeProperty(required=False, auto_now_add=True)
  modified_by = db.UserProperty(required=False, auto_current_user_add=True)
  modified_date = db.DateTimeProperty(required=False, auto_now=True)
  caption = db.StringProperty(required=False)
  details = db.TextProperty(required=False)
  labels = db.StringListProperty()


def Add(data, source, source_id='', project='',
        caption=None, details=None, labels=None):
  """Adds a new screenshot entry.

  Args:
    data: The screenshot data to store.
    source: The source name, should be one of the types in the Sources class.
    source_id: ID of the artifact (test, bug, automation, etc.) the screenshot
        is associated with.
    project: Project the screenshot is associated with.
    caption: Caption string.
    details: More detailed string about the screenshot.
    labels: List of strings used to label the screenshot.

  Returns:
    The model object for the new screenshot.
  """

  def _Transaction():
    labels_list = []
    if labels:
      labels_list = labels
    screenshot = Screenshot(data=db.Blob(data),
                            source=source,
                            source_id=source_id,
                            project=project,
                            caption=caption,
                            details=details,
                            labels=labels_list)
    screenshot.put()
    return screenshot
  return db.run_in_transaction(_Transaction)


def GetById(screenshot_id):
  """Gets a screenshot by ID."""
  return Screenshot.get_by_id(int(screenshot_id))


def GetScreenshots(source, source_id=None, project=None,
                   limit=DEFAULT_LIMIT):
  query = Screenshot.all().filter('source=', source)
  if source_id:
    query.filter('source_id=', source_id)
  if project:
    query.filter('project=', project)
  return query.fetch(limit)
