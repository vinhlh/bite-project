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

"""Tester model and associated logic.

Tester stores information necessary to manage
access to the test features of the site compatibility.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import re

from google.appengine.ext import db


class Tester(db.Model):
  """Tracks testers by email."""
  email = db.StringProperty(required=True)
  active = db.BooleanProperty(required=True, default=True)
  created = db.DateTimeProperty(required=True, auto_now_add=True)
  created_by = db.UserProperty(required=True, auto_current_user_add=True)
  modified = db.DateTimeProperty(required=True, auto_now=True)
  modified_by = db.UserProperty(required=True, auto_current_user=True)


def GetKeyName(email):
  """Returns a str used to uniquely identify a tester.

  Args:
    email: str user email.

  Returns:
    A str that can be used to uniquely identify a given tester.
  """
  return 'Tester_' + email.lower()


def GetKey(email):
  """Returns the unique db.Key object for the given email.

  Args:
    email: str user email.

  Returns:
    A Key object.
  """
  return db.Key.from_path('Tester', GetKeyName(email))


def Get(email):
  """Returns the Tester object for the given email.

  Args:
    email: str user email.

  Returns:
    Tester object if a tester with the given email exists, or None.
  """
  return db.get(GetKey(email))


def Add(email):
  """Adds a tester with the specified email.

  Args:
    email: str user email.

  Returns:
    A Tester object.
  """
  tester = Tester(key_name=GetKeyName(email),
                  email=email)
  tester.put()
  return tester


def AddOrUpdate(email, is_active):
  """Adds or updates the tester with the specified email."""

  tester = Tester.get_or_insert(key_name=GetKeyName(email),
                                email=email)
  tester.active = is_active
  return tester


def SetActive(email, is_active):
  """Sets the active field of the tester with the given email.

  Args:
    email: str user email.
    is_active: whether the user is active or not.

  Returns:
    An updated Tester object if a tester with the given email exits, or None.
  """

  def _Txn():
    tester = Tester.get_by_key_name(GetKeyName(email))
    if tester:
      tester.active = is_active
      tester.put()
    return tester

  return db.run_in_transaction(_Txn)


def IsActive(email):
  """Returns whether the tester with the given email is active."""
  tester = Tester.get_by_key_name(GetKeyName(email))
  if tester:
    return tester.active
  elif email and re.search('@(.+\.)?google.com$', email, flags=re.IGNORECASE):
    # Automatically grant Googlers access.
    Add(email)
    return True
  return False


def GetTesters():
  """Returns an iterator to the Tester model."""
  testers = []
  q = Tester.all()
  results = q.fetch(9999)
  cursor = q.cursor()
  while results:
    testers.extend(results)
    q = q.with_cursor(cursor)
    results = q.fetch(9999)
    cursor = q.cursor()
  return testers
