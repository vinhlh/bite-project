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

"""RunSiteMap model and associated logic.

RunSiteMap stores the relationship between a CompatRun, Site,
and VerificationSteps. It keeps tracks of the sites that need
to be tested for a particular run. This information can be used
to also answer which sites remain to be tested for a
particular run and/or browser version.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db

from models.compat import run as compat_run
from models.compat import site as compat_site
from models.compat import verification as compat_verification


class RunSiteMap(db.Model):
  """Tracks the relationship between a Run, Site and VerificationSteps."""
  run = db.ReferenceProperty(compat_run.CompatRun)
  site = db.ReferenceProperty(compat_site.Site)
  verification = db.ReferenceProperty(compat_verification.VerificationSteps)
  hidden = db.BooleanProperty(required=False, default=False)


def GetMappingKeyName(run, site, verification):
  """Returns a str used to uniquely identify a mapping."""
  return 'RunSiteMap_%s_%s_%s' % (run.key().name(),
                                  site.key().name(),
                                  verification.key().name())


def AddMapping(run, site, verification):
  """Adds a new relationship between the a run, site, and verification."""

  def _Txn():
    mapping = RunSiteMap(
        key_name=GetMappingKeyName(run, site, verification),
        run=run,
        site=site,
        verification=verification)
    mapping.put()
    return mapping

  return db.run_in_transaction(_Txn)


def GetMappingByKeyName(key_name):
  """Returns a str used to uniquely identify a mapping."""
  return RunSiteMap.get_by_key_name(key_name)


def _PrefetchRefprops(entities, *props):
  """Pre-fetches reference properties on the given list of entities."""
  fields = [(entity, prop) for entity in entities for prop in props]
  ref_keys = [prop.get_value_for_datastore(x) for x, prop in fields]
  ref_entities = dict((x.key(), x) for x in db.get(set(ref_keys)))
  for (entity, prop), ref_key in zip(fields, ref_keys):
    prop.__set__(entity, ref_entities[ref_key])
  return entities


def PrefetchRefProps(entities):
  """Pre-fetches reference properties on the given list of entities."""
  return _PrefetchRefprops(entities,
                           RunSiteMap.run,
                           RunSiteMap.site,
                           RunSiteMap.verification)


def _FetchAll(q, prefetch_ref_properties):
  """Gets all entities from the datastore."""
  results = []
  curr_result = q.fetch(9999)
  cursor = q.cursor()
  while curr_result:
    results.extend(curr_result)
    q = q.with_cursor(cursor)
    curr_result = q.fetch(9999)
    cursor = q.cursor()
  if prefetch_ref_properties:
    return PrefetchRefProps(results)
  else:
    return results


def GetMappings(exclude_hidden=True, prefetch_ref_properties=True):
  """Returns an iterator for the RunSiteMap model."""
  q = RunSiteMap.all()
  if exclude_hidden:
    q.filter('hidden = ', False)
  return _FetchAll(q, prefetch_ref_properties)


def GetMappingsForRun(run, prefetch_ref_properties=True):
  """Returns a list of mappings associated with a given run."""
  q = RunSiteMap.all().filter('run = ', run)
  return _FetchAll(q, prefetch_ref_properties)


def SetVisibility(key_name, hidden):
  """Sets the visibility of the mapping."""

  def _Txn():
    mapping = RunSiteMap.get_by_key_name(key_name)
    mapping.hidden = hidden
    mapping.put()
    return mapping
  return db.run_in_transaction(_Txn)
