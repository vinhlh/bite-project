#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Gets the bugs associated with a given URL.

Called by the clients to retrieve the list of bugs known for a given URL.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import sys

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from handlers import base
from models import bugs
from models import url_bug_map
from utils import url_util


class BugsForUrlHandler(base.BaseHandler):
  """Handles GET request to the '/get_bugs_for_url' URI.

  Attributes:
    _retrieve_method: Method used to retrieve the list of bugs for a given URL.
    DEFAULT_MAX_RESULTS: Static int used to limit the amount of bugs retrieved
        for a given URL if no max_results is specified in the request.
  """

  DEFAULT_MAX_RESULTS = 1000

  def __init__(self, retrieve_method=url_bug_map.GetBugsForUrl):
    """Instantiate a BugsForUrlHandler handler.

    The construct's argument allows the injection of retrieve methods
    for targeting non-default bug databases and testing purposes.

    Args:
      retrieve_method: Test-hook parameter used to overload the function used
          to retrieve the list of bugs for a given URL.
    """
    self._retrieve_method = retrieve_method

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Retrieves up to max_results bugs for the given target_url.

    Attributes:
      target_url: Required URL for which we want to retrieve bugs.
      max_results: Optional int specifying the maximum results to retrieve.
      status: Status of the bugs to retrieve.

    Returns:
      A list of JSON-encoded bugs.
    """
    target_url = self.GetRequiredParameter('target_url')
    state = self.GetOptionalParameter('state', None)
    status = self.GetOptionalParameter('status', None)
    # Retrieve the list of bugs.
    bugs_list = self._retrieve_method(
        target_url, BugsForUrlHandler.DEFAULT_MAX_RESULTS, state, status)

    # JSON-encode the response and send it to the client.
    result = bugs.JsonEncode(bugs_list)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(result)


class GetBugHandler(base.BaseHandler):
  """Handles GET request to the '/bugs/get' URI.

  Attributes:
    _query_method: Method used to query the list of bugs for a given ID.
  """

  def __init__(self, query_method=bugs.GetBugsById):
    """Init the GetBugHandler handler.

    Args:
      query_method: A method to list of bugs for a given ID.
    """
    self._query_method = query_method

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Gets a list of bugs based on the id, project, and provider passed in.

    Attributes:
      bug_id: The ID of the bug to fetch
      provider: The provider of the bug.
      status: Status of the bugs to retrieve.

    Returns:
      A list of JSON-encoded bugs.
    """
    bug_id = self.GetRequiredParameter('id')
    provider = self.GetRequiredParameter('provider')
    project = self.GetOptionalParameter('project')

    issues = self._query_method(bug_id, provider=provider, project=project)
    results = bugs.JsonEncode(issues)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(results)


def CacheKey(url, max_results, state, status):
  """Calculates the cache key for the given combination of parameters."""
  return ('GetUrl_max_results_%d_state_%s_status_%s_urlhash_%s'
          % (max_results, state, status, url_util.HashUrl(url)))


application = webapp.WSGIApplication(
    [('/get_bugs_for_url', BugsForUrlHandler),
     ('/bugs/get', GetBugHandler)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
