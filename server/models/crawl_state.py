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

"""Preserves the state of a crawl in the datastore.

CrawlState: Models the state of a crawl in AppEngine's datastore.
GetLastCrawlResults(): Retrieves the last crawl state saved for a given
    project.
StoreCrawlState(): Stores the specified state into the datastore.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import logging

from google.appengine.ext import db


class CrawlState(db.Model):
  """Represents the state of a crawl.

  A crawl is said to go from start_index to end_index, those indexes map to
  bug ID's from the original bug db.

  Attributes:
    provider: Str name of the bugs provider.
    project_name: Str name of the project crawled.
    start_index: ID of the bug where the crawl started as an int.
    end_index: ID of the last bug crawled (inclusive) as an int.
    total_imported: Number of bugs indexed and stored into the
        datastore as an int.
    last_modified: Optional Date the crawl state was saved. When not provided,
                   the field is automatically set by the datastore to Now.
  """
  # Indices:
  provider = db.StringProperty(required=True)
  project_name = db.StringProperty(required=True)
  last_modified = db.DateTimeProperty(auto_now=True)
  # Non-indexed information about a crawl state:
  start_index = db.IntegerProperty(required=True)
  end_index = db.IntegerProperty(required=True)
  total_imported = db.IntegerProperty(required=True)


def GetLastCrawlResults(provider, project_name, model=CrawlState):
  """Gets the last crawled state for the specified project.

  Args:
    provider: Str name of the bugs provider.
    project_name: Str name of the project.
    model: Used as a test hook for mocking the CrawlState object.

  Returns:
    The last CrawlState stored in the datastore for the specified project,
    or None if no results have been stored for the specifed project.
  """
  logging.debug('Getting last crawl results for %s, project: %s .',
                provider, project_name)
  # Fetch the status of the last crawl (if any).
  last_crawl_query = model.all().order('-last_modified')
  last_crawl_query.filter('provider =  ', provider)
  last_crawl_query.filter('project_name = ', project_name)
  last_crawl = last_crawl_query.get()
  if last_crawl:
    logging.debug('Last crawl results found. start_index: %d, end_index: %d, '
                  'last_modified: %s, total_imported: %d .',
                  last_crawl.start_index, last_crawl.end_index,
                  last_crawl.last_modified, last_crawl.total_imported)
  else:
    logging.debug('Last crawl results NOT found.')
  return last_crawl


def StoreCrawlResults(provider, project_name, start_index, end_index,
                      total_imported=0, model=CrawlState, _db=db):
  """Creates, puts and returns a CrawlState object with the given params.

  Args:
    provider: Str name of the bugs provider.
    project_name: Str name of the project crawled.
    start_index: ID of the bug where the crawl started as an int.
    end_index: ID of the last bug crawled as an int.
    total_imported: Number of bugs indexed and stored into the
        datastore as an int.
    model: Used as a test hook for mocking the CrawlState object.
    _db: Used as a test hook for mocking the db module.

  Returns:
    The CrawlState object with the stored information.
  """

  def txn():
    logging.debug('Storing last crawl state: start_index: %d, end_index: %d, '
                  'total_imported: %d, provider: %s provider, '
                  'project_name: %s.',
                  start_index, end_index,
                  total_imported, provider,
                  project_name)
    last_crawl = model(provider=provider,
                       project_name=project_name,
                       start_index=int(start_index),
                       end_index=int(end_index),
                       total_imported=int(total_imported))
    last_crawl.put()
    return last_crawl

  return _db.run_in_transaction(txn)
