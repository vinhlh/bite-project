# Copyright 2011 Google Inc. All Rights Reserved.
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

"""Retrieve bugs based on url from mapping functionality.

The retrieval returns the following data

    [[url, [bug*]]+]

url associated with a set of bugs.  The url can be a full url, domain, domain +
path, etc.
bug is the entire details of a given bug.

The data returned will be a list containing all the given urls and
componentized versions of those urls.  Each url will be broken into the
following:

    full url, url_domain + url_path, url_domain

Each component will contain all the bugs that contain those components.

Attributes:
  _MAX_RESULTS_CAP: Private static constant used used to cap the amount of
      results a clients can request.
"""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


import logging
import re

from google.appengine.ext import db

from bugs.models.url_bug_map import url_bug_map
from bugs.models.url_bug_map.url_bug_map import UrlBugMap
from bugs.models.bugs import bug
from utils import encoding_util
from utils import url_util


_MAX_RESULTS_CAP = 500


class Error(Exception):
  """Raised if an exception occurs while retrieving all bugs by url."""
  pass


def GetBugs(urls):
  """Returns a list of objects containing the mapping of url to bugs.

  Args:
    urls: A list or urls used to retrieve bugs. (list of string)

  Returns:
    A list of objects {'url': string, 'bugs': list bugs.models.bugs.bug.Bug}.
    (list of objects)
  """
  limit = _MAX_RESULTS_CAP
  results = []
  for url in urls:
    urlnorm = url_util.NormalizeUrl(url)
    if not urlnorm:
      logging.error('Unable to normalize URL.')
      urlnorm = {url: encoding_util.EncodeToAscii(url), hostname: '', path: ''}

    results_dict = {}
    queries = GetQueriesForUrl(urlnorm)
    for (key, query) in queries:
      result = []

      if query:
        mappings = query.fetch(limit)
        if mappings:
          keys = []
          for mapping in mappings:
            bug_key = mapping.bug.key()
            id = bug_key.id()
            if id in results_dict:
              continue
            results_dict[id] = True
            keys.append(bug_key)

          if keys:
            result = db.get(keys)
            result = [r.ToDict() for r in result if r]

      results.append({'url': key, 'bugs': result})

  return results


def GetQueriesForUrl(urlnorm): #, state, status):
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
  url = urlnorm.url[:500]
  hostname = urlnorm.hostname[:500]
  path = urlnorm.path[:500]

  url_no_schema = re.sub('^https?://', '', url)
  hostname_path = hostname + path

  url_query = (url, UrlBugMap.all().filter('url = ', url))
  hostname_path_query = (hostname_path, UrlBugMap.all().filter(
      'hostname = ', hostname).filter('path = ', path))
  hostname_query = (hostname, UrlBugMap.all().filter('hostname = ', hostname))

  queries = []
  # This does not make sense to me.  What if the url is only a schemeless
  # hostname + path?  Why wouldn't one also search for url?
  # TODO (jasonstredwick): Figure out purpose and reinstate if necessary.
  #if url_no_schema == hostname_path:
  #  if path:
  #    queries.append(hostname_path_query)
  #  queries.append(hostname_query)
  #el
  if hostname_path == hostname: # If no path then do query on it.
    queries.append(url_query)
    queries.append((hostname_path, None))
    queries.append(hostname_query)
  else:
    queries.append(url_query)
    queries.append(hostname_path_query)
    queries.append(hostname_query)

  # TODO (jason.stredwick): Reinstate these if sorting/filtering after query
  # is not sufficient.
  #queries = [(k, q.order('-last_update')) for (k, q) in queries]
  # If states is specified, filter results to query bug matching it's value.
  #if state:
  #  queries = [(k, q.filter('state = ', state.lower())) for (k, q) in queries]
  #if status:
  #  queries = [(k, q.filter('status = ', status.lower())) for (k, q) in queries]
  return queries
