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

"""Admin model and associated logic.

Admin stores information necessary to manage
access to administrative tasks for site compatibility.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db


class Admin(db.Model):
  """Tracks admins by email."""
  email = db.StringProperty(required=True)
  active = db.BooleanProperty(required=True, default=True)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  modified_by = db.UserProperty(required=False, auto_current_user=True)


def GetAdminKeyName(email):
  """Returns a str used to uniquely identify an administrator.

  Args:
    email: str user email.

  Returns:
    A str that can be used to uniquely identify a given administrator.
  """
  return 'Admin_' + email.lower()


def GetAdminKey(email):
  """Returns the unique db.Key object for the given email.

  Args:
    email: str user email.

  Returns:
    A Key object.
  """
  return db.Key.from_path('Admin', GetAdminKeyName(email))


def GetAdmin(email):
  """Returns the Admin object for the given email.

  Args:
    email: str user email.

  Returns:
    An Admin object if an administrator with the given email exists, or None.
  """
  return db.get(GetAdminKey(email))


def AddAdmin(email):
  """Adds a admin with the specified email.

  Args:
    email: str user email.

  Returns:
    An Admin object.
  """
  admin = Admin.get_or_insert(key_name=GetAdminKeyName(email),
                              email=email.lower())
  return admin


def DeleteAdmin(email):
  """Sets the admin as inactive.

  Args:
    email: str user email.
  """
  SetActive(email, False)


def SetActive(email, is_active):
  """Sets the admin as inactive.

  Args:
    email: str user email.
    is_active: Whether the user is an active admin or not.

  Returns:
    An updated Admin object or None.
  """

  def _Txn():
    admin = GetAdmin(email)
    if admin:
      admin.active = is_active
      admin.put()
    return admin

  return db.run_in_transaction(_Txn)


def IsAdmin(email):
  """Returns whether the given email belongs to an admin.

  Args:
    email: str user email.

  Returns:
    Whether the specified email belongs to an administrator of the
    site compat areas.
  """

  admin = GetAdmin(email)
  if admin:
    return admin.active
  else:
    return False
