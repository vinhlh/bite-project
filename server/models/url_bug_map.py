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

"""Model to store URL to Bugs associations.

Each bug is associated with one or more URLs. Each association is stored
as a separate entry in the UrlBugMap table.

Attributes:
  _MAX_RESULTS_CAP: Private static constant used used to cap the amount of
      results a clients can request.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import logging
import re
from google.appengine.ext import db

from models import bugs
from models import bugs_util
from models import test_cycle
from models import test_cycle_user
from utils import encoding_util
from utils import url_util


_MAX_RESULTS_CAP = 500


class UrlPosition(object):
  TITLE = 1
  MAIN = 2
  COMMENTS = 3
  OTHER = 0


class UrlBugMap(db.Model):
  """Represents a relationship between a URL and a Bug.

   There are 3 fields a typical query will try to search on:
   url, hostname, path, and status. These properties are stored as
   indexed properties to speed up searches.
  """
  # Indices:
  url = db.StringProperty(required=True)
  hostname = db.StringProperty(required=False)
  path = db.StringProperty(required=False)
  status = db.StringProperty(required=False)
  state = db.StringProperty(required=False,
                            choices=(bugs_util.ACTIVE,
                                     bugs_util.RESOLVED,
                                     bugs_util.CLOSED,
                                     bugs_util.UNKNOWN))
  provider = db.StringProperty(required=False)
  # Non-indexed information.
  bug = db.ReferenceProperty(reference_class=bugs.Bug,
                            collection_name='bug_urls')
  last_update = db.StringProperty(required=True)
  position = db.IntegerProperty(required=False, default=UrlPosition.OTHER,
                                choices=(UrlPosition.TITLE,
                                         UrlPosition.MAIN,
                                         UrlPosition.COMMENTS,
                                         UrlPosition.OTHER))
  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)

  # Test cycle is the differentiates various test runs.
  test_cycle = db.ReferenceProperty(reference_class=test_cycle.TestCycle,
                                    collection_name='testcycle_urls')
  author = db.StringProperty(required=False)
  author_id = db.StringProperty(required=False)


def TruncateStr(text, max_len=500):
  """Truncates strings to the specified maximum length or 500.

  Args:
    text: Text to truncate if longer than max_len.
    max_len: Maximum length of the string returned by the function.

  Returns:
    A string with max_len or less letters on it.
  """
  if len(text) > max_len:
    logging.warning(
        'Text length of %d is greater than the max length allowed. '
        'Truncating to a length of %d. Text: %s', len(text), max_len, text)
  return text[:max_len]


def StoreUrlBugMapping(target_url, bug, position=UrlPosition.OTHER):
  """Stores a new URL to bug mapping into the Datastore.

  Args:
    target_url: Fully qualified URL of the page associated with the given Bug.
    bug: Bug object containing the details of an issue.
    position: Position of the URL inside of the bug report.

  Returns:
    The newly created entry.
  """
  url = target_url
  hostname = ''
  path = ''
  urlnorm = url_util.NormalizeUrl(target_url)
  if urlnorm:
    url = urlnorm.url
    hostname = urlnorm.hostname
    path = urlnorm.path
  else:
    logging.exception('URL normalization failed, converting to ASCII: %s',
                      target_url)
    url = target_url

  lowered = bug.status.lower()
  url = encoding_util.EncodeToAscii(url)
  hostname = encoding_util.EncodeToAscii(hostname)
  path = encoding_util.EncodeToAscii(path)

  url_bug = UrlBugMap(url=TruncateStr(url),
                      hostname=TruncateStr(hostname),
                      path=TruncateStr(path),
                      status=lowered,
                      state=bugs_util.StateFromStatus(
                          lowered, bug.provider),
                      provider=bug.provider,
                      bug=bug,
                      last_update=bug.last_update,
                      position=position,
                      test_cycle=bug.test_cycle,
                      author=bug.author,
                      author_id=bug.author_id)
  url_bug.put()
  return url_bug


def CacheKey(state, status, urlkey):
  """Calculates the cache key for the given combination of parameters."""
  return 'GetBugs_state_%s_status_%s_key_%s' % (state, status, urlkey)


def GetCacheKeys(urlnorm, state, status):
  """Calculates the cache keys for the given combination of parameters."""
  urls = [re.sub('https?://', '', urlnorm.url)]
  url = urlnorm.hostname + urlnorm.path
  if not url in urls:
    urls.push(url)

  url = urlnorm.hostname
  if not url in urls:
    urls.push(url)

  return [(url, CacheKey(state, status, url_util.HashUrl(url))) for url in urls]


def GetBugsForUrlUserIsAuthorized(
    url, user, max_results, state, status):
    GetBugsForUrl(url, user, max_results, state, status,
                  enforce_cycle_scoping=True)


def GetBugsForUrl(
    url, user, max_results, state, status, enforce_cycle_scoping=False):
  """Retrieves a list of bugs for a given URL up to the specified amount.

  Args:
    url: Str containing information about the target URL.
    max_results: Maximum number of bugs to return.
    state: State of the bugs to retrieve. If no value is specified,
       the list of bugs returned will not be filtered based on state.
    status: Status of the bugs to retrieve.
        If no value is specified, the list of
        bugs returned will not be filtered based on status.

  Returns:
    A list of known bugs for the specified URL.
  """
  urlnorm = url_util.NormalizeUrl(url)
  if not urlnorm:
    logging.error('Unable to normalize URL.')
    return []

  limit = _MAX_RESULTS_CAP
  if max_results < limit:
    limit = max_results

  cycles = test_cycle_user.GetTestCyclesForUser(user)
  if enforce_cycle_scoping and not cycles:
    # Nothing to do, user is not authorized to see bugs.
    return []

  queries = GetQueriesForUrl(urlnorm, state, status, cycles)
  results = []
  results_dict = {}
  for (key, query) in queries:
    mappings = query.fetch(limit)
    if mappings:
      keys = []
      for curr in mappings:
        curr_key = UrlBugMap.bug.get_value_for_datastore(curr)
        key_name = str(curr_key)
        logging.info('Considering key: %s', key_name)
        if key_name in results_dict:
          continue
        results_dict[key_name] = True
        keys.append(curr_key)
      if keys:
        result = db.get(keys)
        result = [r for r in result if r]
        results.append([key, result])

  # Nothing found, return an empty list.
  return results


def GetQueriesForUrl(urlnorm, state, status, cycles=None):
  """Retrieves a list of queries to try for a given URL.

  Each query represents a possible way to find matches, each one has different
  relevancy implications:
     query[0] = Does a full URL match (considered the most relevant).
     query[1] = Does a hostname + path match.
     query[2] = Does a hostname match (considered the least relevant).

  Args:
    urlnorm: NormalizUrlResult object.
    state: State to filter on. If set to None,
        bugs will not be filtered based on state.
    status: Status to filter on. If set to None,
        bugs will not be filtered based on status.

  Returns:
    A list containing Query objects.
  """
  url_no_schema = re.sub('^https?://', '', urlnorm.url)
  hostname_path = urlnorm.hostname + urlnorm.path

  url_query = UrlBugMap.all().filter('url = ', TruncateStr(urlnorm.url))
  url_query_tuple = (urlnorm.url, url_query)

  hostname_path_query =  UrlBugMap.all()
  hostname_path_query = hostname_path_query.filter(
    'hostname = ', TruncateStr(urlnorm.hostname))
  hostname_path_query = hostname_path_query.filter(
    'path = ', TruncateStr(urlnorm.path))
  hostname_path_tuple = (hostname_path, hostname_path_query)

  hostname_query = UrlBugMap.all().filter(
    'hostname = ', TruncateStr(urlnorm.hostname))
  hostname_tuple = (urlnorm.hostname, hostname_query)

  queries = []
  if url_no_schema == hostname_path:
    if urlnorm.path:
      queries.append(hostname_path_tuple)
    queries.append(hostname_tuple)
  elif hostname_path == urlnorm.hostname:
    queries.append(url_tuple)
    queries.append(hostname_tuple)
  else:
    queries.append(url_tuple)
    queries.append(hostname_path_tuple)
    queries.append(hostname_tuple)

  queries = [(k, q.order('-last_update')) for (k, q) in queries]
  
  if cycles:
    queries = [(k, q.filter('test_cycle in ', cycles)) for (k, q) in queries]

  # If states is specified, filter results to query bug matching it's value.
  if state:
    queries = [(k, q.filter('state = ', state.lower())) for (k, q) in queries]
  if status:
    queries = [(k, q.filter('status = ', status.lower())) for (k, q) in queries]
  return queries


def DeleteAllMappingsForBug(bug):
  """Deletes all mappings for the specified bug.

  Args:
    bug: The target bug to delete the bugs from.

  Returns:
    The total amount of mappings deleted.
  """
  total_deleted = 0
  query = bug.bug_urls
  mappings = query.fetch(_MAX_RESULTS_CAP)
  while mappings:
    total_deleted += len(mappings)
    db.delete(mappings)
    mappings = query.fetch(_MAX_RESULTS_CAP)
  return total_deleted


def DeleteBugAndMappings(bug_id, project, provider):
  """Delete bug and all mappings assiciated with that bug.

  Args:
    key_name: The key name of the bug.

  Returns:
    The total amount of mappings deleted.
  """
  mappings_deleted = 0
  bug = bugs.GetBug(bug_id, project, provider)
  if bug:
    mappings_deleted = DeleteAllMappingsForBug(bug)
    bug.delete()
  return mappings_deleted

