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

"""Utilities used by crawlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'


import logging
from os import environ

import gdata
import gdata.client
import gdata.projecthosting
import gdata.projecthosting.client

from google.appengine.ext import deferred
from google.appengine.runtime import DeadlineExceededError

from models import bugs
from models import bugs_util
from models import screenshots
from models import test_cycle
from models import test_cycle_user
from models import url_bug_map
from utils import target_element_util
from utils import screenshots_util
from utils import url_util


# Used to control the max amount of retries a Task should be retried.
_MAX_RETRIES = 5

# Maximum length of an issue summary to store.
SUMMARY_LIMIT = 150


class BugCrawlerError(Exception):
  """Generic error thrown when something goes wrong while craling bugs."""
  pass


def ExtractIssueTrackerBugId(issue):
  """Extract the bug id from a GData bug object."""
  return issue.id.text.split('/')[-1]


def SpawnDetailsCrawlersIssueTracker(recent_issues, project_name,
                                     skip_recent_check=False):
  """Queues the tasks to do the actual crawling for recent updates."""
  count = 0
  try:
    for issue in recent_issues:
      bug_id = issue['id']
      logging.info('Adding crawler to the queue for issue_id %s, project: %s.',
                   bug_id, project_name)
      end = bug_id.find('/')
      if end > 0:
        bug_id = bug_id[0:end]

      bug = bugs.GetBug(bug_id=bug_id, project=project_name,
                        provider=bugs_util.Provider.ISSUETRACKER)
      if bug:
        if  not skip_recent_check and bug.last_update == issue['updated']:
          logging.info('Bug %s is up-to-date.', bug.key().id_or_name())
          count += 1
          continue
        else:
          logging.info('Bug %s needs to be updated.', bug.key().id_or_name())
      else:
        logging.info('Bug %s seems to be a new issue.', bug_id)
      deferred.defer(ExtractDetailsCrawlerIssueTracker, project_name, bug_id,
                     _queue='find-bugs-queue')
      count += 1
  except DeadlineExceededError:
    remaining = recent_issues[count:]
    deferred.defer(SpawnDetailsCrawlersIssueTracker, remaining, project_name)
    deferred.PermanentTaskFailure(
        'Deadline exceeded, started a new SpawnDetailsCrawler'
        ' for the remaining %d urls.' % len(remaining))
    return


def ExtractDetailsCrawlerIssueTracker(project_name, bug_id):
  """Extract useful information for a given bug."""
  logging.debug('Scraping details for bug %s in project %s.',
                bug_id, project_name)
  phclient = gdata.projecthosting.client.ProjectHostingClient()
  try:
    query = gdata.projecthosting.client.Query(issue_id=bug_id)
    feed = phclient.get_issues(project_name, query=query)
  except gdata.client.RequestError, e:
    if ('HTTP_X_APPENGINE_TASKRETRYCOUNT' in environ and
        int(environ['HTTP_X_APPENGINE_TASKRETRYCOUNT']) < _MAX_RETRIES):
      if e.status == 403:  # Skip 403 (Unautorized)errors.
        logging.info('Unautorized to access this issue, skipping: %s, %s',
                     bug_id, project_name)

        # Nuke cache data for private bugs.
        url_bug_map.DeleteBugAndMappings(
            bug_id, project_name, bugs_util.Provider.ISSUETRACKER)
        return
      else:
        raise BugCrawlerError(
            'Error while trying to get details for %s. Error %s' %
            (str(bug_id), str(e)))
    else:
      raise deferred.PermanentTaskFailure(
          'Error hit too many times, aborting '
          'extracting details for bug %s on project %s. Error: %s' %
          (str(bug_id), str(project_name), str(e)))

  if not feed or not feed.entry:
    raise deferred.PermanentTaskFailure(
        'Failed to fetch full details for bug %s', bug_id)

  entry = feed.entry[0]
  urls = []
  if entry.title.text:
    urls = [(u, url_bug_map.UrlPosition.TITLE)
            for u in url_util.ExtractUrls(entry.title.text)]
  if entry.content.text:
    urls.extend([(u, url_bug_map.UrlPosition.MAIN)
                 for u in url_util.ExtractUrls(entry.content.text)])

  comments = GetComments(project_name, bug_id, phclient)
  comments_text = GetTextInComments(comments)
  if comments_text:
    urls.extend([(u, url_bug_map.UrlPosition.COMMENTS)
                 for u in url_util.ExtractUrls(comments_text)])

  last_updater = GetLastUpdater(comments, FindAuthor(entry))
  if not urls:
    logging.info('Nothing to do, no URLs found for bug %s in project %s.',
                 bug_id, project_name)
    return
  logging.debug('URLs found: %s', str(urls))

  target = (target_element_util.ExtractTargetElement(comments_text) or
            target_element_util.ExtractTargetElement(entry.content.text))
  logging.debug('Target information extracted for bug: %s, '
                'target_element: %s', bug_id, target)

  if entry.status and entry.status.text:  # Status is None sometimes.
    status = entry.status.text
  else:
    logging.warning('Status was not found, setting to unknown.')
    status = 'unknown'
  QueueStoreBug(bug_id=bug_id,
                title=entry.title.text,
                summary=entry.content.text[:SUMMARY_LIMIT],
                priority=FindPriority(entry),
                project_name=project_name,
                provider=bugs_util.Provider.ISSUETRACKER,
                # Special case status since it can be None.
                status=status,
                author=FindAuthor(entry),
                details_link=entry.GetAlternateLink().href,
                reported_on=entry.published.text,
                last_update=entry.updated.text,
                last_updater=last_updater,
                target_element=target,
                urls=urls)


def GetComments(project_name, bug_id, phclient=None):
  """Fetches the comments for a specified issue.

  Args:
    project_name: The name of the project (ie chromium)
    bug_id: The ID of the bug to fetch comments for.
    phclient: Project Hosting client to use.

  Returns:
    A list of CommentEntry instances.
  """
  # Comments needs to be fetched separately.
  if not phclient:
    phclient = gdata.projecthosting.client.ProjectHostingClient()
  comments = []
  try:
    comments = phclient.get_comments(project_name, bug_id)
    comments = comments.entry
  except gdata.client.RequestError, e:
    logging.exception('Error while getting the comments for %s. Error %s',
                      bug_id, e)
  return comments


def GetTextInComments(comments):
  """Gets the comments for the given issue id as a list of text fields.

  Args:
    comments:  A list of CommentEntry instances.

  Returns:
    String of the attached.
  """
  comments_text = [c.content.text for c in comments if c.content.text]
  return ' '.join(comments_text)


def GetLastUpdater(comments, author):
  """Get the last author to update this bug.

  Args:
    comments:  A list of CommentEntry instances.
    author: The default last_updater if one isn't found.

  Returns:
    A string containing the alias of the last updater for this bug.
  """
  last_updater = author
  for comment in comments:
    if comment.author:
      last_updater = comment.author[0].name.text
  return last_updater


def FindPriority(bug_entry):
  """Finds and returns the priority of a provided bug entry.

  Args:
    bug_entry: The provided bug, a IssueEntry instance.

  Returns:
    A string containg the priority of the bug ("1", "2", etc...)
  """
  priority = ''
  for label in bug_entry.label:
    if label.text.lower().startswith('pri-'):
      priority = label.text[4:]
  return priority


def FindAuthor(bug_entry):
  """Finds and returns the author of a provided bug entry."""
  author = ''
  if bug_entry.author:
    author = bug_entry.author[0].name.text
  return author


def QueueStoreBug(bug_id, title, summary, priority,
                  project_name, provider, status, author,
                  details_link, reported_on, last_update,
                  last_updater, target_element, urls, recording_link='',
                  cycle_id=None, expected=None, result=None, author_id='',
                  screenshot=None):
  """Adds a task to updates or create a Bug."""
  deferred.defer(StoreBug,
                 bug_id=bug_id,
                 title=title,
                 summary=summary,
                 priority=priority,
                 project_name=project_name,
                 provider=provider,
                 status=status,
                 author=author,
                 author_id=author_id,
                 details_link=details_link,
                 reported_on=reported_on,
                 last_update=last_update,
                 last_updater=last_updater,
                 target_element=target_element,
                 urls=urls,
                 recording_link=recording_link,
                 cycle_id=cycle_id,
                 expected=expected,
                 result=result,
                 screenshot=screenshot,
                 _queue='store-bug-queue')


def  StoreBug(bug_id,  title, summary,  priority,  project_name,  provider,
  status,  author,  details_link, reported_on,  last_update, last_updater,
  target_element='',  screenshot=None, urls=None,  recording_link='',
  cycle_id=None, expected=None,  result=None, author_id=''):
  """Updates  or create  a Bug."""
  screenshot_link = ''
  if screenshot:
    # Store the screenshot data and get the link.
    new_screenshot = screenshots.Add(
        data=screenshots_util.DecodeBase64PNG(screenshot),
        source=provider, project=project)
    screenshot_link = screenshots_util.RetrievalUrl(
        self.request.url, new_screenshot.key().id())

  if cycle_id:
    cycle = test_cycle.AddTestCycle(provider, project_name, cycle_id)

  if not urls:
    urls  = [(u, url_bug_map.UrlPosition.TITLE) for u in url_util.ExtractUrls(title)]
    expected =  expected or ''
    result = result or ''
    text = summary + ' ' + expected + ' ' + result
    urls.extend([(u, url_bug_map.UrlPosition.TITLE)
      for u in url_util.ExtractUrls(text)])
  logging.info(urls)
  urls = urls or [] # Set  default url list to have only one empty string
  bug = bugs.Store(
    bug_id=str(bug_id),
    title=title,
    summary=summary,
    priority=priority,
    project=project_name,
    provider=provider,
    status=status,
    author=author,
    author_id=author_id,
    details_link=details_link,
    reported_on=reported_on,
    last_update=last_update,
    last_updater=last_updater,
    target_element=target_element,
    screenshot=screenshot_link,
    recording_link=recording_link,
    cycle=cycle,
    expected=expected,
    result=result)

  if cycle:
    test_cycle_user.AddTestCycleUser(author, cycle)

  # TODO(alexto): Do the deletion first in a separate queue, then
  # add the bug-URL mappings to avoid timeouts. For now, this works
  # since the timeout causes the task to re-execute.
  logging.debug('Deleting all existing bug mappings')
  deleted = url_bug_map.DeleteAllMappingsForBug(bug)
  logging.debug('Mappings deleted: %d', deleted)

  if len(urls) > 0:
    # NOTE: This is an optimization,
    # list comprehension loop is faster than a FOR loop.
    # pylint: disable-msg=W0104
    # pylint: disable-msg=W0106
    [deferred.defer(UpdateUrlBugMappings,
                    bug_key=bug.key().id(),
                    url=url,
                    position=position,
                    _queue='urls-map-queue')
     for (url, position) in urls]

def UpdateUrlBugMappings(bug_key, url, position):
  """Updates or creates a Bug-URL mapping."""
  url_bug_map.StoreUrlBugMapping(target_url=url,
                                 bug=bugs.GetBugByKey(bug_key),
                                 position=position)
