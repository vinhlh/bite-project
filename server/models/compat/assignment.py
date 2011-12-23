#!/usr/bin/python
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

"""Assignment model and associated logic.

Assignment stores information about run-site-maps assignment
to individual users (a.k.a. testers).
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'


from datetime import datetime

from google.appengine.api import memcache
from google.appengine.ext import db

from models.compat import browser
from models.compat import result as compat_result
from models.compat import run as compat_run
from models.compat import run_site_map as compat_run_site_map
from models.compat import run_tester_map
from models.compat import tests


class Assignment(db.Model):
  """Tracks assignments of sites to users."""
  run_site_map = db.ReferenceProperty(
      required=False, reference_class=compat_run_site_map.RunSiteMap)
  user = db.UserProperty(required=True)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  first_visit = db.DateTimeProperty(required=False)
  last_visit = db.DateTimeProperty(required=False)
  visits = db.IntegerProperty(required=False, default=0)
  browser_version = db.ReferenceProperty(
      browser.BrowserVersion, required=True)
  test = db.ReferenceProperty(required=True,
                              reference_class=tests.Test)


def IncrementNavigationData(assignment):
  """Increment navigation made by a user to his/her assigned test."""
  now = datetime.now()
  assignment.last_visit = now
  if not assignment.first_visit:
    assignment.first_visit = now
  assignment.visits += 1
  assignment.put()


def GetAssignmentForTesterKeyName(user):
  """Returns a str used to uniquely identify an assignment."""
  return 'Assignment_%s' % str(user.user_id())


def GetAssignmentForTesterKey(user):
  """Returns Key object used to uniquely identify a browser."""
  return db.Key.from_path('Assignment', GetAssignmentForTesterKeyName(user))


def GetAssignmentByKeyName(key_name):
  """Gets the assignment with the specified key name."""
  return Assignment.get_by_key_name(key_name)


def GetAssignmentForTester(user):
  """Gets the Assignment for the given user if any."""
  key_name = GetAssignmentForTesterKeyName(user)
  assignment = memcache.get(key_name)
  if not assignment:
    assignment = Assignment.get_by_key_name(key_name)
    memcache.set(key_name, assignment)
  return assignment


def GetOrAssignTest(user, browser_version):
  """Gets or assign a mapping to the given user."""
  assignment = GetAssignmentForTester(user)
  if not assignment:
    assignment = AssignTest(user=user, browser_version=browser_version)
  return assignment


def AssignTest(user, browser_version):
  """Assigns a mapping to the given user."""
  tester_mappings = run_tester_map.GetMappingsForTester(user)
  for tester_mapping in tester_mappings:
    run = tester_mapping.run
    tests_remaining = GetTestsRemainingForRun(run, browser_version)
    if tests_remaining:
      test = tests_remaining[0]
      key_name = GetAssignmentForTesterKeyName(user)
      assignment = Assignment(key_name=key_name,
                              run_site_map=test.mapping,
                              user=user,
                              browser_version=browser_version,
                              test=test)
      assignment.put()
      tests.SetAssignment(test.key(), assignment=assignment)
      return assignment
  return None


def LogResult(user, assignment, browser_version, succeed, comment, bugs):
  """Commits the result for the given mapping and removes the assignment."""
  result = compat_result.AddResult(user=user,
                                   mapping=assignment.run_site_map,
                                   browser_version=browser_version,
                                   succeed=succeed,
                                   assigned=assignment.created,
                                   first_visit=assignment.first_visit,
                                   last_visit=assignment.last_visit,
                                   visits=assignment.visits,
                                   comment=comment,
                                   bugs=bugs)
  test_key = assignment.test.key()
  tests.SetAssignment(test_key, assignment=None)
  tests.SetResult(test_key, result=result)
  # Remove assignment from the given user.
  RemoveAssignment(assignment)
  return result


def RemoveAssignment(assignment):
  """Remove test to user mapping."""
  # Remove assignment from the given user.
  memcache.delete(assignment.key().name())
  return assignment.delete()


def SkipAssignment(user, browser_version, assignment):
  """Tries to get a new mapping for the user, if more are available."""
  RemoveAssignment(assignment=assignment)
  return AssignTest(user=user, browser_version=browser_version)


def GetTestsRemainingForRun(run, browser_version):
  """Returns a list of mappings with no corresponding results."""
  return tests.GetTestsRemainingFroRunAndBrowser(
      run, browser_version)


def GetTestsRemainingForBrowser(browser_version):
  """Returns a list of mappings with no result across all runs."""
  return tests.GetTestsRemainingForBrowser(browser_version)


def AddMapping(run, site, verification, apply_to_all_versions=False,
               browser_versions=None):
  """Adds a new relationship between the a run, site, and verification."""
  mapping = compat_run_site_map.AddMapping(run=run,
                                           site=site,
                                           verification=verification)
  if apply_to_all_versions:
    tests.AddTestForAllBrowserVersions(mapping)
  elif browser_versions:
    tests.AddTestForBrowserVersions(mapping, browser_versions)
  return mapping


def AddRun(name, description, source='local', project_id=None,
           project_name=None, labels=None):
  """Adds a new run."""
  run = compat_run.AddRun(name=name,
                          description=description,
                          source=source,
                          project_id=project_id,
                          project_name=project_name,
                          labels=labels)
  return run


def GetBrowserVersion(platform, platform_version,
                      webkit_version, chrome_version, locale):
  """Gets the BrowserVersion for the given parameter combination.

  If the browser is not a known version (presumably a new build),
  then the new version is store and tests are created for all mappings
  present at that moment.

  Args:
    platform: str with the name of the OS.
    platform_version:  str with the Platform version string.
    webkit_version: str with the WebKit version number.
    chrome_version: str with the Chrome version number.
    locale: str with the user agent language.

  Returns:
    A BrowserVersion object.
  """
  version = browser.GetBrowserVersion(platform=platform,
                                      platform_version=platform_version,
                                      webkit_version=webkit_version,
                                      chrome_version=chrome_version,
                                      locale=locale)
  if not version:
    version = browser.GetOrInsertBrowserVersion(
        platform=platform,
        platform_version=platform_version,
        webkit_version=webkit_version,
        chrome_version=chrome_version,
        locale=locale)
    # Create tests for this new browser version.
    tests.AddTestsForBrowserVersion(version)
  return version
