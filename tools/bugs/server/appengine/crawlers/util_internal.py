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

"""Utilities used by crawlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'


import logging

from google.appengine.api import memcache
from google.appengine.ext import deferred
from google.appengine.runtime import DeadlineExceededError

from crawlers import _client
from crawlers import crawler_util
from models import bugs
from models import bugs_util
from models import url_bug_map
from utils import target_element_util
from utils import url_util


def SeenRecently(bug):
  """Keeps track if a bug has already been seen, if so, returns True."""
  key_name = 'BuganizerSeenRecently_%s_%s' % (
      bug.bugId, str(bug.modifiedDate))
  if memcache.get(key_name):
    logging.debug('Issue has been seen recently. key: %s', key_name)
    return True
  else:
    logging.debug('Recent issue. key: %s', key_name)
    memcache.set(key_name, True, 432000)  # Expires in 5 days (in seconds).
    return False


def StartFindingRecentIssues(project_name, minutes):
  """Starts crawling for recent updates."""
   = _client.GetProjectClient(project_name)
  issues = .GetBugsModifiedSinceNMinutes(minutes)
  new_updates = []
  for issue in issues:
    if not SeenRecently(issue):
      new_updates.append(issue)

  if new_updates:
    deferred.defer(SpawnDetailsCrawlersBuganizer,
                   new_updates,
                   project_name,
                   _queue='find-bugs-queue')
  logging.debug('Done crawling for updates. '
                'Total updates: %d, already seen: %d',
                len(issues), len(issues) - len(new_updates))


def SpawnDetailsCrawlersBuganizer(recent_issues, project_name,
                                  skip_recent_check=False):
  """Queues the tasks to do the actual crawling for recent updates."""
  count = 0
  try:
    for issue in recent_issues:
      bug_id = issue.bugId
      logging.info('Adding crawler to the queue for issue_id %s, project: %s.',
                   bug_id, project_name)
      bug = bugs.GetBug(bug_id=bug_id, project=project_name,
                        provider=bugs_util.BUGANIZER)
      if bug:
        if not skip_recent_check and str(bug.last_update) == issue.modifiedDate:
          logging.info('Bug %s is up-to-date.', bug.key().id_or_name())
          count += 1
          continue
        else:
          logging.info('Bug %s needs to be updated.', bug.key().id_or_name())
      else:
        logging.info('Bug %s seems to be a new issue.', bug_id)
      deferred.defer(ExtractDetailsCrawlerBuganizer, project_name, issue,
                     _queue='find-bugs-queue')
      count += 1
  except DeadlineExceededError:
    remaining = recent_issues[count:]
    deferred.defer(SpawnDetailsCrawlersBuganizer, remaining, project_name)
    deferred.PermanentTaskFailure(
        'Deadline exceeded, started a new SpanwDetailsCrawler'
        ' for the remaining %d urls.' % len(remaining))
    return


def ExtractDetailsCrawlerBuganizer(project_name, bug):
  """Extract useful information for a given bug."""
  logging.debug('Scraping details for bug %s in project %s.',
                bug.bugId, project_name)
  urls = [(u, url_bug_map.UrlPosition.TITLE)
          for u in url_util.ExtractUrls(bug.summary)]
  urls.extend([(u, url_bug_map.UrlPosition.MAIN)
               for u in url_util.ExtractUrls(
                   str(bug.notes).replace('\n', ' '))])
  last_updater = bug.reporter

  if not urls:
    logging.info('Nothing to do, no URLs found for bug %s in project %s.',
                 bug.bugId, project_name)
    return

  logging.debug('URLs found: %s', str(urls))
  target = target_element_util.ExtractTargetElement(str(bug.notes))
  logging.debug('Target information extracted for bug: %s, '
                'target_element: %s', bug.bugId, target)
  status = bug.status.lower()
  note = bug.notes[0].encode('ascii', 'ignore')

  crawler_util.QueueStoreBug(
      bug_id=bug.bugId,
      title=bug.summary,
      summary=note[:crawler_util.SUMMARY_LIMIT],
      # Priority is in the form of P2.
      priority=bug.priority[1:],
      project_name=project_name,
      provider=bugs_util.BUGANIZER,
      # Special case status since it can be None.
      status=status,
      author=bug.reporter,
      details_link=('issue?id=' + str(bug.bugId)),
      reported_on=str(bug.createdDate),
      last_update=str(bug.modifiedDate),
      last_updater=last_updater,
      target_element=target,
      urls=urls)
