#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Tests model and associated logic."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import sha

from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.ext import deferred

from models.compat import browser as compat_browser
from models.compat import result as compat_result
from models.compat import run as compat_run
from models.compat import run_site_map


class Test(db.Model):
  """Tracks assignments of sites to users."""
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  start_url = db.LinkProperty(required=False)
  steps = db.TextProperty(required=False)
  run = db.ReferenceProperty(
      required=True,
      reference_class=compat_run.CompatRun,
      collection_name='tests')
  browser_version = db.ReferenceProperty(
      required=True,
      reference_class=compat_browser.BrowserVersion,
      collection_name='tests')
  mapping = db.ReferenceProperty(
      required=False,
      reference_class=run_site_map.RunSiteMap,
      collection_name='tests')
  result = db.ReferenceProperty(
      required=False,
      reference_class=compat_result.Result,
      collection_name='test')
  assignment = db.ReferenceProperty(required=False)


def GetTestKeyName(start_url, steps, browser_version,
                   run, mapping):
  """Returns a str used to uniquely identify a test.

  Args:
    start_url: Start url (if any) this test needs to start at.
    steps: Verification steps that need to be performed on a given site.
    browser_version: BrowserVersion object this test is associated with.
    run: Run the test is associated with.
    mapping: RunSiteMap object this test is associated with.

  Returns:
    A str that can be used to uniquely identify a given tester.
  """
  mapping_id = ''
  if mapping:
    mapping_id = str(mapping.key().id_or_name())
  # TODO(alexto): Use dictionary substitution.
  return ('Test_%s' %
          sha.sha('%s_%s_%s_%s_%s' %
                  (start_url,
                   steps,
                   str(browser_version.key().id_or_name()),
                   str(run.key().id_or_name()),
                   mapping_id)).hexdigest())


def AddTest(start_url, steps, browser_version, run,
            mapping=None):
  """Returns a str used to uniquely identify a test.

  Args:
    start_url: Start url (if any) this test needs to start at.
    steps: Verification steps that need to be performed on a given site.
    browser_version: BrowserVersion object this test is associated with.
    run: Run the test is associated with.
    mapping: RunSiteMap object this test is associated with.

  Returns:
    A Test object.
  """
  key_name = GetTestKeyName(start_url=start_url,
                            steps=steps,
                            browser_version=browser_version,
                            run=run,
                            mapping=mapping)
  test = Test.get_or_insert(key_name=key_name,
                            start_url=start_url,
                            steps=steps,
                            run=run,
                            browser_version=browser_version,
                            mapping=mapping)
  return test


def _FetchAll(q):
  """Gets all entities from the datastore."""
  results = []
  curr_result = q.fetch(9999)
  cursor = q.cursor()
  while curr_result:
    results.extend(curr_result)
    q = q.with_cursor(cursor)
    curr_result = q.fetch(9999)
    cursor = q.cursor()
  return results


def GetTestsForBrowser(browser_version, keys_only=False):
  """Gets all tests associated with the given browser version."""
  q = Test.all(keys_only=keys_only)
  q.filter('browser_version = ', browser_version)
  return _FetchAll(q)


def GetTestsRemainingForBrowser(browser_version, keys_only=False):
  """Gets all tests remaining to execute for the given browser version."""
  q = Test.all(keys_only=keys_only)
  q.filter('browser_version = ', browser_version)
  q.filter('result = ', None)
  q.filter('assignment = ', None)
  q.order('modified')
  return _FetchAll(q)


def GetTestsRemainingFroRunAndBrowser(
    run, browser_version, keys_only=False):
  """Gets all tests remaining to execute for the given browser and run."""
  q = Test.all(keys_only=keys_only)
  q.filter('run = ', run)
  q.filter('browser_version = ', browser_version)
  q.filter('result = ', None)
  q.filter('assignment = ', None)
  q.order('modified')
  return _FetchAll(q)


def SetAssignment(key, assignment):
  """Sets the test assignment info."""

  def _Txn():
    test = Test.get(key)
    test.assignment = assignment
    test.put()
    return test
  return db.run_in_transaction(_Txn)


def SetResult(key, result):
  """Sets the result for the given test."""

  def _Txn():
    test = Test.get(key)
    test.result = result
    test.put()
    return test
  test = db.run_in_transaction(_Txn)
  return test


def AddTestsForBrowserVersion(browser_version):
  """Adds a map of all known tests and the specified browser version."""
  deferred.defer(SpawnAddTestsForMappings,
                 browser_version=browser_version,
                 _queue='tests-queue')


def SpawnAddTestsForMappings(browser_version):
  """Fan-out operation to map tests with the given browser version."""
  mappings = run_site_map.GetMappings()
  for mapping in mappings:
    deferred.defer(AddTestForMapping,
                   mapping=mapping,
                   browser_version=browser_version,
                   _queue='tests-queue')


def AddTestForMapping(mapping, browser_version):
  """Maps all tests in the given run to the specified browser version."""
  # TODO(alexto): Make queue names constants.
  deferred.defer(AddTest,
                 start_url=mapping.site.url,
                 steps=mapping.verification.steps,
                 browser_version=browser_version,
                 run=mapping.run,
                 mapping=mapping,
                 _queue='tests-queue')


def AddTestForAllBrowserVersions(mapping):
  """Adds tests for the given RunSiteMap across all browser versions."""
  browser_versions = compat_browser.GetBrowserVersions()
  AddTestForBrowserVersions(mapping, browser_versions)


def AddTestForBrowserVersions(mapping, browser_versions):
  """Adds tests for the given RunSiteMap the list of browser versions."""
  for browser_version in browser_versions:
    deferred.defer(AddTestForMapping,
                   mapping=mapping,
                   browser_version=browser_version,
                   _queue='tests-queue')
