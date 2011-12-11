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

"""Crawls bugs on a project.

Called periodically to fetch new bugs on a project or do a full
bug DB re-scan.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, OK to pass.

import logging
import re
import sys
import gdata
import gdata.client
import gdata.projecthosting
import gdata.projecthosting.client

from google.appengine.api import memcache
from google.appengine.api.labs import taskqueue
from google.appengine.ext import deferred
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from crawlers import crawler_util
from handlers import base
from models import bugs_util
from models import crawl_state


# Regex to extract issue Ids from a bulk update operation.
_ISSUES_FROM_BULK_UPDATE_REGEX = re.compile(
    'issue (\d+):')


class RecrawlProjectWorker(base.BaseHandler):
  """Worker handler to crawl all bugs in a project."""

  def get(self):
    """Redirect get() request to post() to facilitate testing."""
    self.post()

  def post(self):
    """Starts crawling."""
    project_name = self.GetRequiredParameter('project_name')
    start_index = self.GetOptionalParameter('start_index', None)
    if not start_index:
      last = crawl_state.GetLastCrawlResults(bugs_util.ISSUETRACKER,
                                             project_name)
      start_index = last.end_index
    else:
      start_index = int(start_index)
    max_results = 25
    query = gdata.projecthosting.client.Query(
        start_index=start_index, max_results=max_results)
    phclient = gdata.projecthosting.client.ProjectHostingClient()
    try:
      issues = phclient.get_issues(project_name, query=query)
    except gdata.client.Error, e:
      retries = int(self.request.headers.get('X-AppEngine-TaskRetryCount', 0))
      if retries < 4:
        logging.warning('Retry crawling, retries is less than 5, '
                        'current retries:  %s, start_index: %d',
                        retries, start_index)
        raise  # Re-raise, so that the task is re-tried.
      else:
        # Skip current, try at start_index + 1.
        logging.warning('Skipping current index, start_index: %d', start_index)
        taskqueue.add(url='/tasks/crawl/issuetracker/recrawl_project',
                      params={'project_name': project_name,
                              'start_index': start_index + 1})
        return
    (new_updates, total, unused_seen) = GetNewUpdates(issues, True)
    if not new_updates:
      crawl_state.StoreCrawlResults(
          bugs_util.ISSUETRACKER, project_name,
          start_index, start_index, 0)
      self.response.out.write('Done.')
      return  # Reached the end of the crawl.
    deferred.defer(crawler_util.SpawnDetailsCrawlersIssueTracker,
                   new_updates, project_name, True)
    crawl_state.StoreCrawlResults(
        bugs_util.ISSUETRACKER, project_name, start_index,
        start_index + total, len(new_updates))
    # Don't overwelm the provider, throttle to once per second.
    taskqueue.add(url='/tasks/crawl/issuetracker/recrawl_project',
                  params={'project_name': project_name},
                  countdown=1)
    self.response.out.write('start_index: %d, end_index: %d, total: %d'
                            % (start_index,
                               start_index + total,
                               total))


class CrawlRecentUpdatesWorker(base.BaseHandler):
  """Worker handler retrieve recent bug changes."""

  def get(self):
    """Redirect get() request to post() to facilitate testing."""
    self.post()

  def post(self):
    """Starts crawling for recent updates."""
    project_name = self.GetRequiredParameter('project_name')
    max_results = self.GetOptionalParameter('max_results', 1000)
    gdclient = gdata.client.GDClient()
    issues = None
    count = 1
    while not issues:
      try:
        curr_max_results = int(int(max_results)/count)
        logging.debug('Fetching %s issues.', curr_max_results)
        issues = gdclient.get_feed(
            GetUpdatesUrl(project_name, curr_max_results))
      except SyntaxError, e:
        count *= 2
        new_max_results = int(int(max_results)/count)
        logging.error(
            'Failed to fetch issues feed. Try smaller mount: %d. Error: %s',
            new_max_results, str(e))
        if new_max_results == 0:
          logging.error('Max results reached 0, terminating.')
          return

    (new_updates, total, seen) = GetNewUpdates(issues)
    deferred.defer(crawler_util.SpawnDetailsCrawlersIssueTracker,
                   new_updates, project_name)

    end_msg = ('Done crawling for updates.'
               'Total updates: %d, already seen: %d'
               %(total, seen))
    logging.debug(end_msg)
    self.response.out.write(end_msg)


def GetNewUpdates(issues, skip_recent_check=False):
  """Extract new issue from the issues feed."""
  namespace = '%s/' % issues.id.text
  results = []
  total = 0
  seen = 0
  for issue in issues.entry:
    if issue.id.text.find('bulk') > 0:
      content_text = issue.content.text
      updated = issue.updated.text
      logging.debug('Found a bulk operation, updated: %s content: %s.',
                    updated, content_text)
      issue_ids = _ISSUES_FROM_BULK_UPDATE_REGEX.findall(content_text)
      logging.debug('Issue Ids found: %s', issue_ids)
      total += len(issue_ids)
      not_seen = [{'id': curr_id,
                   'updated': updated}
                  for curr_id in issue_ids
                  if skip_recent_check or not SeenRecently(
                      '%s_%s_%s' % (namespace, curr_id, updated))]
      seen += len(issue_ids) - len(not_seen)
      results.extend(not_seen)
    elif skip_recent_check or not SeenRecently(issue.id.text):
      total += 1
      results.append({'id': issue.id.text.replace(namespace, ''),
                      'updated': issue.updated.text})
    else:
      total += 1
      seen += 1
  return (results, total, seen)


def SeenRecently(text_id):
  """Keeps track if a bug has already been seen, if so, returns True."""
  key_name = 'IssuesSeenRecently_%s' % text_id
  if memcache.get(key_name):
    logging.debug('Issue has been seen recently. ID: %s', text_id)
    return True
  else:
    logging.debug('Recent issue. ID: %s', text_id)
    memcache.set(key_name, True, 432000)  # Expires in 5 days (in seconds).
    return False


def GetUpdatesUrl(project_name, max_results=1000):
  """Construct the URL to the issues updates for the given project."""
  return ('http://code.google.com/feeds/p/%s'
          '/issueupdates/basic?max-results=%d' %
          (project_name, max_results))


application = webapp.WSGIApplication(
    [('/tasks/crawl/issuetracker/crawl_recent_updates',
      CrawlRecentUpdatesWorker),
     ('/tasks/crawl/issuetracker/recrawl_project',
      RecrawlProjectWorker)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
