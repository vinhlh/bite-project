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

"""Site Compatibility handlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import json
import re
import sys
import webapp2

from google.appengine.api import memcache
from google.appengine.api import users

from common.handlers import base
from models.compat import admins
from models.compat import assignment
from models.compat import browser as compat_browser
from models.compat import result as compat_result
from models.compat import run as compat_run
from models.compat import run_site_map
from models.compat import run_tester_map
from models.compat import site as compat_site
from models.compat import tester
from models.compat import verification


JSON_CONTENT_TYPE = 'application/json'


# Extracts the OS, OS version, webkit version, and chrome version from the
# user agent string. User agent strings looks like this:
#    Windows: Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/532.5
#            (KHTML, like Gecko) Chrome/4.1.249.1064 Safari/532.5
#    Linux:   Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/533.4
#            (KHTML, like Gecko) Chrome/5.0.375.29 Safari/533.4
#    Mac:     Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; en-US)
#             AppleWebKit/533.4 (KHTML, like Gecko)
#             Chrome/5.0.375.38 Safari/533.4
_EXTRACT_VERSION_RE = re.compile(
    '\((?P<platform>.*); .; (?P<platform_version>.*); (?P<locale>..-..)\) .+'
    'webkit/(?P<webkit_version>[\d\.]+) .+ chrome/(?P<chrome_version>[\d\.]+) ')


def GetBrowserInfo(user_agent):
  """Extracts browser version information from the supplied string.

  Args:
    user_agent: User agent string.

  Returns:
     A dict with the relevant browser version information, including
     platform, platform_version, locale, webkit_version, and chrome_version.
  """
  result = _EXTRACT_VERSION_RE.search(user_agent.lower())
  if not result:
    return None

  return result.groupdict()


class SiteCompatHandler(base.BaseHandler):
  """Base handler for the Site Compatibility handlers."""

  def IsCurrentUserSuperAdmin(self):
    """Wheter the current user is a site-wide admin."""
    return users.is_current_user_admin()

  def IsCurrentUserAnAdmin(self):
    """Whether the current user is an admin."""
    return (self.IsCurrentUserSuperAdmin() or
            admins.IsAdmin(users.get_current_user().email()))

  def IsCurrentUserAnActiveTester(self):
    """Whet er the current user is an active tester."""
    return (self.IsCurrentUserAnAdmin() or
            tester.IsActive(users.get_current_user().email()))

  def GetUserInfo(self):
    """Gets user information used by the django template."""
    user = users.get_current_user()
    return {'email': user.email(),
            'signOut': users.create_logout_url(self.request.url),
            'isAdmin': self.IsCurrentUserAnAdmin(),
            'isTester': self.IsCurrentUserAnActiveTester()}

  def GetBrowserVersion(self):
    """Gets the BrowserVersion that match the user-agent information."""
    browser_info = GetBrowserInfo(self.request.headers['user-agent'])
    if not browser_info:
      return None

    return assignment.GetBrowserVersion(
        platform=browser_info['platform'],
        platform_version=browser_info['platform_version'],
        webkit_version=browser_info['webkit_version'],
        chrome_version=browser_info['chrome_version'],
        locale=browser_info['locale'])

# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class RunsHandler(SiteCompatHandler):
  """Handler used to manage the Site Compatibility runs."""

  def get(self):
    self.RenderTemplate('site_compat.html',
                        {'view': 'runs',
                         'user': self.GetUserInfo()})

  def post(self):
    name = self.GetRequiredParameter('name')
    description = self.GetRequiredParameter('description')
    key_name = self.GetOptionalParameter('id', None)
    if key_name:
      compat_run.Update(
          key_name=key_name, name=name, description=description)
    else:
      assignment.AddRun(name=name, description=description)
    self.get()


class RunsVisibilityHandler(SiteCompatHandler):
  """Handler used to manage the visibility of a run."""

  def get(self):
    self.post()

  def post(self):
    key_name = self.GetRequiredParameter('id')
    hide = self.GetRequiredParameter('hide')
    if hide.lower() == 'true':
      compat_run.SetVisibility(key_name=key_name, hidden=True)
    else:
      compat_run.SetVisibility(key_name=key_name, hidden=False)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class VerificationsHandler(SiteCompatHandler):
  """Handler used to manage the Site Compatibility verification steps."""

  def get(self):
    """Gets the verifications view."""
    self.RenderTemplate('site_compat.html',
                        {'view': 'verifications',
                         'user': self.GetUserInfo()})

  def post(self):
    """Adds a new verification."""
    name = self.GetRequiredParameter('name')
    description = self.GetRequiredParameter('description')
    steps = self.GetRequiredParameter('steps')
    key_name = self.GetOptionalParameter('id')
    if key_name:
      verification.Update(key_name=key_name,
                          name=name,
                          description=description,
                          steps=steps)
    else:
      verification.AddVerificationSteps(name=name,
                                        description=description,
                                        steps=steps)
    self.get()


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class VerificationsVisibilityHandler(SiteCompatHandler):
  """Handler used to manage the visibility of verification steps."""

  def get(self):
    self.post()

  def post(self):
    key_name = self.GetRequiredParameter('id')
    hide = self.GetRequiredParameter('hide')
    if hide.lower() == 'true':
      verification.SetVisibility(key_name=key_name, hidden=True)
    else:
      verification.SetVisibility(key_name=key_name, hidden=False)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class SitesHandler(SiteCompatHandler):
  """Handler used to manage the Site Compatibility sites."""

  def get(self):
    self.RenderTemplate('site_compat.html',
                        {'view': 'sites',
                         'user': self.GetUserInfo()})

  def post(self):
    url = self.GetRequiredParameter('url')
    key_name = self.GetOptionalParameter('id')
    if key_name:
      compat_site.Update(key_name=key_name, url=url)
    else:
      compat_site.AddSite(url=url)
    self.get()


class SitesVisibilityHandler(SiteCompatHandler):
  """Handler used to manage the visibility of a site."""

  def get(self):
    self.post()

  def post(self):
    key_name = self.GetRequiredParameter('id')
    hide = self.GetRequiredParameter('hide')
    if hide.lower() == 'true':
      compat_site.SetVisibility(key_name=key_name, hidden=True)
    else:
      compat_site.SetVisibility(key_name=key_name, hidden=False)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class MappingsHandler(SiteCompatHandler):
  """Handler used to manage the Site Compatibility mappings."""

  def get(self):
    """Gets the mappings view."""
    runs = compat_run.GetRuns(source=compat_run.Sources.LOCAL)
    sites = compat_site.GetSites()
    verifications = verification.GetVerificationSteps()
    last_added = {'run': self.GetOptionalParameter('run'),
                  'site': self.GetOptionalParameter('site'),
                  'verification': self.GetOptionalParameter('verification')}

    selected_browsers = self.request.get_all('version')

    def _GetBrowserDetails(browser):
      name = ('Chrome: %s, Webkit: %s, Locale: %s, Platform: %s' %
              (browser.chrome_version, browser.webkit_version,
               browser.user_locale, browser.platform_version))
      key = browser.key().id_or_name()
      return {'id': key,
              'name': name,
              'selected': key in selected_browsers}
    browsers_list = compat_browser.GetBrowserVersions(reverse=True)
    browsers = map(_GetBrowserDetails, browsers_list)

    self.RenderTemplate('site_compat.html',
                        {'view': 'mappings',
                         'runs': runs,
                         'sites': sites,
                         'verifications': verifications,
                         'user': self.GetUserInfo(),
                         'last_added': last_added,
                         'browsers': browsers})

  def post(self):
    """Adds a new mapping."""
    run_key_name = self.GetRequiredParameter('run')
    site_key_name = self.GetRequiredParameter('site')
    verification_key_name = self.GetRequiredParameter('verification')
    apply_to = self.GetRequiredParameter('apply')

    selected_run = compat_run.GetRunByKeyName(run_key_name)
    selected_site = compat_site.GetSiteByKeyName(site_key_name)
    selected_verification = verification.GetVerificationStepsByKeyName(
        verification_key_name)
    all = False
    browsers = None
    # TODO(alexto): Change these to constants.
    if apply_to == 'futureAndPast':
      all = True
    elif apply_to == 'futureAndSelected':
      browser_keys = self.request.get_all('version')
      if browser_keys:
        browsers = compat_browser.GetBrowserVersionsByKeyName(browser_keys)

    assignment.AddMapping(
        run=selected_run,
        site=selected_site,
        verification=selected_verification,
        apply_to_all_versions=all,
        browser_versions=browsers)
    self.get()


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class ResultsHandler(SiteCompatHandler):
  """Handler used to view the Results submitted by a given user."""

  def get(self):
    self.RenderTemplate('site_compat.html',
                        {'view': 'my_results',
                         'user': self.GetUserInfo()})


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class TesterMapHandler(SiteCompatHandler):
  """Handler used to manage the user subscriptions to runs."""

  def get(self):
    """Gets the tester-run mappings view."""
    self.RenderTemplate('site_compat.html',
                        {'view': 'tester_map',
                         'user': self.GetUserInfo()})

  def post(self):
    """Adds a new tester-run mapping."""
    user = users.get_current_user()
    run_key_name = self.GetOptionalParameter('joinRun', None)
    if run_key_name:
      run_tester_map.AddMapping(
          run=compat_run.GetRunByKeyName(run_key_name), user=user)
    else:
      run_key_name = self.GetRequiredParameter('leaveRun')
      run_tester_map.RemoveMapping(
          run=compat_run.GetRunByKeyName(run_key_name), user=user)
    self.get()


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class TesterTestsHandler(SiteCompatHandler):
  """Handler used to manage sites assigned (tests sites) to the current user."""

  def get(self):
    """Gets the test assignment view."""
    user = users.get_current_user()
    version = self.GetBrowserVersion()
    assign = assignment.GetOrAssignTest(
        user=user, browser_version=version)
    test_data = None
    if assign:
      test = assign.test
      test_data = {'key': assign.key().name(),
                   'run_name': test.run.name,
                   'url': test.start_url,
                   'steps': test.steps}
    self.RenderTemplate('site_compat.html',
                        {'view': 'tester_test',
                         'test': test_data,
                         'user': self.GetUserInfo()})

  def post(self):
    """Updates the test assignment for the given user."""
    skipped = self.GetOptionalParameter('skip')
    if skipped:
      assignment.SkipAssignment(
          user=users.get_current_user(),
          browser_version=self.GetBrowserVersion(),
          assignment=assignment.GetAssignmentByKeyName(skipped))
    else:
      succeed = True
      key_name = self.GetOptionalParameter('passResult')
      if not key_name:
        succeed = False
        key_name = self.GetRequiredParameter('failResult')

      comment = self.GetOptionalParameter('comment_' + key_name, None)
      if not comment:
        comment = self.GetOptionalParameter('comment', '')

      bugs = self.GetOptionalParameter('bugs_' + key_name, None)
      if not bugs:
        bugs = self.GetOptionalParameter('bugs', '')

      assignment.LogResult(
          user=users.get_current_user(),
          assignment=assignment.GetAssignmentByKeyName(key_name),
          browser_version=self.GetBrowserVersion(),
          succeed=succeed,
          comment=comment,
          bugs=bugs)

    self.get()


_NO_USER_RESPONSE = json.dumps({'user': None, 'test': None})


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class MyTestsHandler(SiteCompatHandler):
  """Handler called by the client to get the test site assigned to the user."""

  def get(self):
    """Entry point for the client (extension) to fetch test data."""
    response = _NO_USER_RESPONSE
    user = users.get_current_user()
    if user:
      test_data = None
      assign = assignment.GetOrAssignTest(
          user=user, browser_version=self.GetBrowserVersion())
      if assign:
        test = assign.test
        test_data = {'test_id': assign.key().name(),
                     'test_url': test.start_url,
                     'verification_steps': test.steps}
      response = json.dumps(
          {'user': user.email(),
           'test': test_data})

    self.response.headers['Content-Type'] = JSON_CONTENT_TYPE
    self.response.out.write(response)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class AllResultsHandler(SiteCompatHandler):
  """Handler used to view a summary of all results submitted."""

  def get(self):
    """Show the all results summary page."""
    self.RenderTemplate('site_compat.html',
                        {'view': 'all_results',
                         'user': self.GetUserInfo()})


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class StatsHandler(SiteCompatHandler):
  """Handler used to fetch stats data by the client.

  When called with scope set, the returned JSON string is the stats for the
  current user. When scope is not set, the JSON data represent the status of
  the most recent BrowserVersions.
  """

  def get(self):
    """Gets stats data."""
    scope = self.GetOptionalParameter('scope', None)
    result = None
    if scope:
      result = self.GetPersonalStats()
    else:
      stats_key = 'SiteCompat_TopLevelStats'
      result = memcache.get(stats_key)
      if not result:
        result = self.GetTopLevelStats()
        memcache.set(stats_key, result, 1800)  # Cache for 30 mins.
    self.response.headers['Content-Type'] = JSON_CONTENT_TYPE
    self.response.out.write(json.dumps(result))

  def GetPersonalStats(self):
    """Gets a list of results submitted by the current user.

    Returns:
        A list of tuples. A tuple in the returned list follows this format:
        (run_name, site_url, chrome_version, platform, platform_version,
        webkit_version, succeed, created)
    """
    results = compat_result.GetResultsForUser(users.get_current_user())
    if not results:
      return None

    def _GetDetails(result):
      test = result.test.get()
      start_url = test.start_url
      curr_run = test.run
      browser = result.browser_version
      return (curr_run.name, start_url, browser.chrome_version,
              browser.platform, browser.platform_version,
              browser.webkit_version, result.succeed, result.bugs,
              result.comment, result.created.ctime())

    return map(_GetDetails, results)

  def GetTopLevelStats(self):
    """Gets a list of results stats submitted for recent chrome versions.

    Returns:
        A list of tuples. A tuple in the returned list follows this format:
        (chrome_version, (total_results, passed, failed, remaining))
    """
    versions_table = {}
    versions = compat_browser.GetBrowserVersions()
    for version in versions:
      results = compat_result.GetResultsForBrowserVersion(version)
      total = len(results)
      passed = len([result for result in results if result.succeed])
      failed = total - passed
      remaining = len(assignment.GetTestsRemainingForBrowser(version))
      chrome_version = version.chrome_version
      if chrome_version in versions_table:
        current = versions_table[chrome_version]
        total += current[0]
        passed += current[1]
        failed += current[2]
        remaining += current[3]
      versions_table[chrome_version] = (total, passed, failed, remaining)

    keys = sorted(versions_table.keys())

    def _GetVals(key):
      return (key, versions_table[key])

    return map(_GetVals, keys)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class RedirectHandler(SiteCompatHandler):
  """Handler used to capture stats about user navigation to tests."""

  def get(self):
    assign = assignment.GetAssignmentByKeyName(
        self.GetRequiredParameter('test_id'))
    if assign:
      assignment.IncrementNavigationData(assign)
      self.redirect(assign.run_site_map.site.url)
    else:
      self.response.out.write('Invalid test_id')


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class ListHandler(SiteCompatHandler):
  """Handler to list JSON data to the site compat management pages."""

  def get(self):
    """Gets data for the list specified by the "type" parameter."""
    requested_list = self.GetRequiredParameter('type')
    response = None
    if requested_list == 'suites':
      runs = compat_run.GetRuns()
      response = [{'id': run.key().id_or_name(),
                   'name': run.name,
                   'description': run.description}
                  for run in runs]
    elif requested_list == 'sites':
      sites = compat_site.GetSites()
      response = [{'id': site.key().id_or_name(),
                   'url': site.url}
                  for site in sites]
    elif requested_list == 'verifications':
      verifications = verification.GetVerificationSteps()
      response = [{'id': v.key().id_or_name(),
                   'name': v.name,
                   'description': v.description,
                   'steps': v.steps}
                  for v in verifications]
    elif requested_list == 'run_mappings':
      mappings = run_site_map.GetMappings()

      response = [{'id': m.key().id_or_name(),
                   'run': m.run.name,
                   'verification': m.verification.name,
                   'url': m.site.url}
                  for m in mappings]
    elif requested_list == 'testers':
      testers = tester.GetTesters()
      response = [{'email': t.email,
                   'active': t.active}
                  for t in testers]
    elif requested_list == 'subscriptions':
      user = users.get_current_user()
      available_runs = compat_run.GetRuns()
      tester_mappings = run_tester_map.GetMappingsForTester(user)
      tester_runs = [mapping.run.key().name() for mapping in tester_mappings]
      response = [{'id': r.key().name(),
                   'name': r.name,
                   'description': r.description,
                   'isSubscribed': bool(r.key().name() in tester_runs)}
                  for r in available_runs]

    self.response.headers['Content-Type'] = JSON_CONTENT_TYPE
    self.response.out.write(json.dumps(response))


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class AdminsHandler(SiteCompatHandler):
  """Handler to add or remove admins to the site compat area."""

  def get(self):
    """Redirects to the post method."""
    self.post()

  def post(self):
    """Adds, remove, or updates and admin."""
    action = self.GetRequiredParameter('action')
    email = self.GetRequiredParameter('email')
    if action == 'add':
      admins.AddAdmin(email)
    elif action == 'remove':
      admins.DeleteAdmin(email)
    elif action == 'activate':
      admins.SetActive(email, True)


# Disable 'Invalid method name' lint error.
# pylint: disable-msg=C6409
class TestersHandler(SiteCompatHandler):
  """Handler to add or remove testers to the site compat area."""

  def get(self):
    testers = tester.GetTesters()
    self.RenderTemplate('site_compat.html',
                        {'view': 'tester',
                         'user': self.GetUserInfo(),
                         'testers': testers})

  def post(self):
    email = self.GetRequiredParameter('email')
    active = self.GetRequiredParameter('active')
    if active.lower() == 'true':
      tester.AddOrUpdate(email, True)
    else:
      tester.AddOrUpdate(email, False)


app = webapp2.WSGIApplication(
    [('/get_my_compat_test', MyTestsHandler),
     ('/compat/test', TesterTestsHandler),
     ('/compat/subscriptions', TesterMapHandler),
     ('/compat/my_results', ResultsHandler),
     ('/compat/all_results', AllResultsHandler),
     ('/compat/stats', StatsHandler),
     ('/compat/runs', RunsHandler),
     ('/compat/runs_visibility', RunsVisibilityHandler),
     ('/compat/verifications', VerificationsHandler),
     ('/compat/verifications_visibility', VerificationsVisibilityHandler),
     ('/compat/sites', SitesHandler),
     ('/compat/sites_visibility', SitesVisibilityHandler),
     ('/compat/mappings', MappingsHandler),
     ('/compat/redirect', RedirectHandler),
     ('/compat/list', ListHandler),
     ('/compat/admins', AdminsHandler),
     ('/compat/tester', TestersHandler)],
    debug=True)
