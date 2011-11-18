#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Result model and associated logic.

Result stores information about a pass/fail result for
a given browser/run combination.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db

from models.compat import browser
from models.compat import run_site_map


class Result(db.Model):
  """Tracks results submitted by users for a given run and browser."""
  user = db.UserProperty(required=True, auto_current_user_add=True)
  mapping = db.ReferenceProperty(
      required=False, reference_class=run_site_map.RunSiteMap)
  browser_version = db.ReferenceProperty(
      required=True, reference_class=browser.BrowserVersion)
  assigned = db.DateTimeProperty(required=False)
  first_visit = db.DateTimeProperty(required=False)
  last_visit = db.DateTimeProperty(required=False)
  visits = db.IntegerProperty(required=False)
  succeed = db.BooleanProperty(required=True)
  comment = db.StringProperty(required=False, default='')
  bugs = db.StringProperty(required=False, default='')
  created = db.DateTimeProperty(required=True, auto_now_add=True)


def AddResult(user, mapping, browser_version, succeed,
              assigned, first_visit, last_visit, visits,
              comment='', bugs=''):
  """Adds a new result."""
  result = Result(user=user,
                  mapping=mapping,
                  browser_version=browser_version,
                  assigned=assigned,
                  first_visit=first_visit,
                  last_visit=last_visit,
                  visits=visits,
                  succeed=succeed,
                  comment=comment,
                  bugs=bugs)
  result.put()
  return result


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
                           Result.browser_version)


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


def GetResultsForUser(user, prefetch_ref_properties=True):
  """Returns an iterator of results submitted by a given user."""
  q = Result.all().filter('user = ', user).order('-created')
  return _FetchAll(q, prefetch_ref_properties)


def GetResultsForBrowserVersion(browser_version, keys_only=False,
                                prefetch_ref_properties=True):
  """Returns all results submitted for a given browser version."""
  q = Result.all(keys_only=keys_only)
  q.filter('browser_version = ', browser_version)
  return _FetchAll(q, prefetch_ref_properties)


def GetResultsQuery(keys_only=False):
  """Returns an iterator for the Results model."""
  return Result.all(keys_only=keys_only)
