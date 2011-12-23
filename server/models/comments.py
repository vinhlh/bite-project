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

"""Model for bug comments."""

__author__ = 'alexis.torres@gmail.com (Alexis O. Torres)'

from google.appengine.ext import db

from models import bugs


class Comment(db.Model):
  """Models a bug comment stored in AppEngine's Datastore."""
  message = db.TextProperty(required=True)
  bug = db.ReferenceProperty(reference_class=bugs.Bug,
                             collection_name='bug_comments')
  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)


def AddComment(bug_key, message):
  """Adds a new comment."""
  bug = bugs.GetBugByKey(bug_key)
  comment = Comment(message=message, bug=bug)
  comment.put()
  return comment

