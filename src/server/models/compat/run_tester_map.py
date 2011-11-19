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

"""RunTesterMap model and related logic.

RunTesterMap stores the relationship between a CompatRun
and a User. It tracks the runs a user is subscribed to.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.api import memcache
from google.appengine.ext import db
from models.compat import run as compat_run


class RunTesterMap(db.Model):
  """Tracks the relationship between a CompatRun and a User."""
  run = db.ReferenceProperty(compat_run.CompatRun)
  user = db.UserProperty(required=True)


def GetMappingKeyName(run, user):
  """Returns a str used to uniquely identify a mapping."""
  return 'RunTesterMap_%s_%s' % (run.key().name(), str(user.user_id()))


def GetMappingKey(run, user):
  """Returns the unique db.Key object for the given a run and user."""
  return db.Key.from_path('RunTesterMap', GetMappingKeyName(run, user))


def AddMapping(run, user):
  """Adds a new mapping between a given run and a user."""

  def _Txn():
    mapping = RunTesterMap(key_name=GetMappingKeyName(run, user),
                           user=user, run=run)
    mapping.put()
    # Update memcache mappings for user.
    memcache.delete(GetMappingsForTesterKeyName(user))
    return mapping
  return db.run_in_transaction(_Txn)


def RemoveMapping(run, user):
  """Removes given mapping between run and user."""

  def _Txn():
    db.delete(GetMappingKey(run, user))
    # Invalidate memcache mappings for user.
    memcache.delete(GetMappingsForTesterKeyName(user))

  db.run_in_transaction(_Txn)


def GetMappingsForTesterKeyName(user):
  """Returns a str used to uniquely identify mappings for a given user.."""
  return 'RunTesterMap_Tester_%s' % str(user.user_id())


def _PrefetchRefprops(entities, *props):
  """Prefetches reference properties on the given list of entities."""
  fields = [(entity, prop) for entity in entities for prop in props]
  ref_keys = [prop.get_value_for_datastore(x) for x, prop in fields]
  ref_entities = dict((x.key(), x) for x in db.get(set(ref_keys)))
  for (entity, prop), ref_key in zip(fields, ref_keys):
    prop.__set__(entity, ref_entities[ref_key])
  return entities


def GetMappingsForTester(user, prefetch_ref_properties=True):
  """Returns a list of mappings associated with the given user.."""
  cache_key = GetMappingsForTesterKeyName(user)
  mappings = None  #memcache.get(cache_key)
  if mappings is None:
    runs = compat_run.GetRuns()
    keys = [GetMappingKey(run, user) for run in runs]
    mappings = RunTesterMap.get(keys)
    if mappings:
      # Remove keys not found, eg. [None, None, None] -> []
      mappings = filter(lambda item: item is not None, mappings)
    memcache.set(cache_key, mappings)
  if prefetch_ref_properties:
    return _PrefetchRefprops(mappings, RunTesterMap.run)
  else:
    return mappings
