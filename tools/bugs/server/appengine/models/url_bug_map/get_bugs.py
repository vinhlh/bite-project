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
import json

from google.appengine.ext import db

from bugs import kind
from bugs.models.url_bug_map import url_bug_map
from bugs.models.bugs import bug
from util import model_to_dict


_MAX_RESULTS_CAP = 500


class Error(Exception):
  pass


def GetBugs(urls, limit=_MAX_RESULTS_CAP):
  """Returns a list of objects containing the mapping of url to bugs.

  TODO (jason.stredwick): Change the URL_BUG_MAP kind to isolate the break
  down of the url into components into a single result for a given url.

  Args:
    urls: A list or urls used to retrieve bugs. ([string])
    limit: The max number of results to fetch. (integer)
  Returns:
    An object. ([{url: string, [kind.Kind.BUG]}])
  Raises:
    Error: Raised if an error occurs accessing bug references.
  """
  if limit > _MAX_RESULTS_CAP:
    limit = _MAX_RESULTS_CAP

  results = []
  # For each url create a relevance mapping to related bugs.
  for url in urls:
    url_components = url_bug_map.PrepareUrl(url)

    results_dict = {} # Track which bugs have already been added.
    queries = GetQueriesForUrl(url_components)
    for (key, query) in queries:
      if not query:
        results.append({'url': key, 'bugs': []})
        continue

      mappings = query.fetch(limit)
      if not mappings:
        results.append({'url': key, 'bugs': []})
        continue

      result = []
      keys = []
      for mapping in mappings:
        try:
          bug_key = mapping.bug.key()
          id = bug_key.id()
        except Exception, e:
          raise Error(e)

        if id in results_dict:
          continue
        results_dict[id] = True
        keys.append(bug_key)

      if keys:
        try:
          result = db.get(keys)
        except Exception, e:
          raise Error(e)
        result = [model_to_dict.ModelToDict(r) for r in result if r]
        for r in result:
          r['kind'] = kind.Kind.BUG

      results.append({'url': key, 'bugs': result})

  return results


def GetQueriesForUrl(url_components):
  """Retrieves a list of queries to try for a given URL.

  Each query represents a possible way to find matches, each one has different
  relevancy implications:
     query[0] = Does a full URL match (considered the most relevant).
     query[1] = Does a hostname + path match.
     query[2] = Does a hostname match (considered the least relevant).

  Args:
    url_components: NormalizUrlResult object.
  Returns:
    A list containing Query objects.
  """
  url = url_components['url']
  hostname = url_components['hostname']
  path = url_components['path']

  url_no_schema = re.sub('^https?://', '', url)
  hostname_path = hostname + path

  url_query = (url, url_bug_map.UrlBugMap.all().filter('url = ', url))
  hostname_path_query = (hostname + path, url_bug_map.UrlBugMap.all()
                                          .filter('hostname = ', hostname)
                                          .filter('path = ', path))
  hostname_query = (hostname, url_bug_map.UrlBugMap.all()
                              .filter('hostname = ', hostname))

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

  queries = [(k, q.order('-last_update')) for (k, q) in queries if q]
  # TODO (jason.stredwick): Add back in state filtering later.  It requires the
  # passing of filter data with the request.
  # If states is specified, filter results to query bug matching it's value.
  #queries = [(k, q.filter('state = ', state.lower()))
  #           for (k, q) in queries if q]
  return queries
