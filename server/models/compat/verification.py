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

"""VerificationSteps model and associated logic.

VerificationSteps stores information about the verification steps that need
to be performed on a given site during a compatibility run.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db


class VerificationSteps(db.Model):
  """Tracks verification steps."""
  name = db.StringProperty(required=True)
  description = db.StringProperty(required=False)
  steps = db.TextProperty(required=True)
  hidden = db.BooleanProperty(required=False, default=False)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  modified_by = db.UserProperty(required=False, auto_current_user=True)


def GetVerificationStepsKeyName(name):
  """Returns a str used to uniquely identify a verification steps."""
  return 'VerificationSteps_' + name


def AddVerificationSteps(name, steps, description=''):
  """Adds the verification steps with the specified properties."""
  verification = VerificationSteps(key_name=GetVerificationStepsKeyName(name),
                                   name=name,
                                   description=description,
                                   steps=steps)
  verification.put()
  return verification


def GetVerificationStepsByKeyName(key_name):
  """Gets the verification steps with the specified key name."""
  return VerificationSteps.get_by_key_name(key_name)


def GetVerificationSteps(exclude_hidden=True):
  """Returns an iterator for the VerificationSteps model."""
  q = VerificationSteps.all()
  if exclude_hidden:
    q.filter('hidden = ', False)

  verifications = []
  results = q.fetch(9999)
  cursor = q.cursor()
  while results:
    verifications.extend(results)
    q = q.with_cursor(cursor)
    results = q.fetch(9999)
    cursor = q.cursor()

  return verifications


def Update(key_name, name, description, steps):
  """Updates the administrator with the specified key name."""

  def _Txn():
    verification = VerificationSteps.get_by_key_name(key_name)
    verification.name = name
    verification.description = description
    verification.steps = steps
    verification.put()
    return verification
  return db.run_in_transaction(_Txn)


def SetVisibility(key_name, hidden):
  """Sets the visibility of the administrator with the specified key name."""

  def _Txn():
    verification = VerificationSteps.get_by_key_name(key_name)
    verification.hidden = hidden
    verification.put()
    return verification
  return db.run_in_transaction(_Txn)

