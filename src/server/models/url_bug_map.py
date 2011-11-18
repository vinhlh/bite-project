#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

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
  bug = db.ReferenceProperty(reference_class=bugs.Bug)
  last_update = db.StringProperty(required=True)
  position = db.IntegerProperty(required=False, default=UrlPosition.OTHER,
                                choices=(UrlPosition.TITLE,
                                         UrlPosition.MAIN,
                                         UrlPosition.COMMENTS,
                                         UrlPosition.OTHER))
  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)


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
    logging.info('Using normalized URL.')
    url = urlnorm.url
    hostname = urlnorm.hostname
    path = urlnorm.path
  else:
    logging.exception('URL normalization failed, converting to ASCII: %s',
                      target_url)
    url = url_util.EncodeToAscii(target_url)
  logging.info('Adding mapping between bug: %s', bug.key().id_or_name())
  logging.info('Hostname: %s', hostname)
  logging.info('Path %s', path)
  logging.info('URL: %s', url)

  lowered = bug.status.lower()
  try:
    url_bug = UrlBugMap(url=TruncateStr(url),
                        hostname=TruncateStr(hostname),
                        path=TruncateStr(path),
                        status=lowered,
                        state=bugs_util.StateFromStatus(
                            lowered, bug.provider),
                        provider=bug.provider,
                        bug=bug,
                        last_update=bug.last_update,
                        position=position)
    url_bug.put()
  except UnicodeDecodeError, e:
    logging.error('Failed to put bug, try encode to ascii first. Error: %s',
                  e)
    url = url_util.EncodeToAscii(url)
    hostname = url_util.EncodeToAscii(hostname)
    path = url_util.EncodeToAscii(path)
    logging.debug('New values: hostname: %s, path: %s, url: %s',
                  hostname, path, url)
    url_bug = UrlBugMap(url=TruncateStr(url),
                        hostname=TruncateStr(hostname),
                        path=TruncateStr(path),
                        status=lowered,
                        state=bugs_util.StateFromStatus(
                            lowered, bug.provider),
                        provider=bug.provider,
                        bug=bug,
                        last_update=bug.last_update,
                        position=position)
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


def GetBugsForUrl(
    url, max_results, state, status):
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
  logging.debug('Get bugs for url: %s', url)
  urlnorm = url_util.NormalizeUrl(url)
  if not urlnorm:
    logging.error('Unable to normalize URL.')
    return []

  limit = _MAX_RESULTS_CAP
  if max_results < limit:
    limit = max_results

  queries = GetQueriesForUrl(urlnorm, state, status)
  results = []
  results_dict = {}
  for (key, query) in queries:
    mappings = query.fetch(limit)
    if mappings:
      keys = []
      for curr in mappings:
        curr_key = UrlBugMap.bug.get_value_for_datastore(curr)
        key_name = str(curr_key.name())
        logging.debug('Key name: %s', key_name)
        if key_name in results_dict:
          logging.debug('Key already seen, skipping.')
          continue
        results_dict[key_name] = True
        keys.append(curr_key)
      if keys:
        result = db.get(keys)
        result = [r for r in result if r]
        results.append([key, result])

  # Nothing found, return an empty list.
  return results


def GetQueriesForUrl(urlnorm, state, status):
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

  url_query = (
      urlnorm.url,
      UrlBugMap.all().filter('url = ', TruncateStr(urlnorm.url)))
  hostname_path_query = (
      hostname_path,
      UrlBugMap.all().filter(
          'hostname = ', TruncateStr(urlnorm.hostname)).filter(
              'path = ', TruncateStr(urlnorm.path)))
  hostname_query = (
      urlnorm.hostname,
      UrlBugMap.all().filter('hostname = ', TruncateStr(urlnorm.hostname)))

  queries = []
  if url_no_schema == hostname_path:
    if urlnorm.path:
      queries.append(hostname_path_query)
    queries.append(hostname_query)
  elif hostname_path == urlnorm.hostname:
    queries.append(url_query)
    queries.append(hostname_query)
  else:
    queries.append(url_query)
    queries.append(hostname_path_query)
    queries.append(hostname_query)

  queries = [(k, q.order('-last_update')) for (k, q) in queries]
  # If states is specified, filter results to query bug matching it's value.
  if state:
    queries = [(k, q.filter('state = ', state.lower())) for (k, q) in queries]
  if status:
    queries = [(k, q.filter('status = ', status.lower())) for (k, q) in queries]
  return queries


def DeleteAllMappingsForBug(key_name):
  """Deletes all mappings for the specified bug.

  Args:
    key_name: The key name of the bug.

  Returns:
    The total amount of mappings deleted.
  """
  total_deleted = 0
  bug = bugs.GetBugByKey(key_name)
  query = UrlBugMap.all(keys_only=True).filter('bug = ', bug)
  mappings = query.fetch(_MAX_RESULTS_CAP)
  while mappings:
    total_deleted += len(mappings)
    db.delete(mappings)
    mappings = query.fetch(_MAX_RESULTS_CAP)

  logging.info(
      'DeleteAllMappingsForBug: total mappings deleted for bug %s: %d.',
      key_name, total_deleted)
  return total_deleted


def DeleteBugAndMappings(key_name):
  """Delete bug and all mappings assiciated with that bug.

  Args:
    key_name: The key name of the bug.

  Returns:
    The total amount of mappings deleted.
  """
  mappings_deleted = DeleteAllMappingsForBug(key_name)

  bug = bugs.GetBugByKey(key_name)
  if bug:
    bug.delete()
  return mappings_deleted
