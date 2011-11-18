#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""CompatRun model and associated logic.

CompatRun stores information about a compatibility run. A run
is the top most grouping for compatibility tests.It might contains
one or more Sites to be verified.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db


class Sources:
  """Runs sources."""
  LOCAL = 'local'

class CompatRun(db.Model):
  """Tracks the compatibility runs available."""
  name = db.StringProperty(required=True)
  description = db.StringProperty(required=True)
  hidden = db.BooleanProperty(required=False, default=False)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  modified_by = db.UserProperty(required=False, auto_current_user=True)
  source = db.StringProperty(required=False, default=Sources.LOCAL)
  project_id = db.StringProperty(required=False, default=None)
  project_name = db.StringProperty(required=False, default=None)
  labels = db.StringProperty(required=False, default=None)


def GetRunKeyName(name):
  """Returns a str used to uniquely identify a run."""
  return 'Run_%s' % name


def AddRun(name, description='', source='local', project_id=None,
           project_name=None, labels=None):
  """Adds a run with the specified name and description."""

  def _Txn():
    run = CompatRun(key_name=GetRunKeyName(name),
                    name=name,
                    description=description,
                    source=source,
                    project_id=project_id,
                    project_name=project_name,
                    labels=labels)
    run.put()
    return run
  return db.run_in_transaction(_Txn)


def GetRunByKeyName(key_name):
  """Gets the run with the specified key name."""
  return CompatRun.get_by_key_name(key_name)


def GetRuns(exclude_hidden=True, source=None):
  """Returns an iterator for the CompatRun model."""
  q = CompatRun.all()
  if exclude_hidden:
    q.filter('hidden = ', False)
  if source:
    q.filter('source = ', source)
  runs = []
  results = q.fetch(9999)
  cursor = q.cursor()
  while results:
    runs.extend(results)
    q = q.with_cursor(cursor)
    results = q.fetch(9999)
    cursor = q.cursor()
  return runs


def Update(key_name, name, description):
  """Updates the run specified by the given key_name."""

  def _Txn():
    run = GetRunByKeyName(key_name)
    run.name = name
    run.description = description
    run.put()
    return run
  return db.run_in_transaction(_Txn)


def SetVisibility(key_name, hidden):
  """Sets the visibility of the mapping."""

  def _Txn():
    run = GetRunByKeyName(key_name)
    run.hidden = hidden
    run.put()
    return run
  return db.run_in_transaction(_Txn)
