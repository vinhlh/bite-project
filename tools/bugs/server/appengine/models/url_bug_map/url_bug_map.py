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

"""Model to store URL to Bug associations.

Each bug is associated with one or more URLs. Each association is stored
as a separate entry in the UrlBugMap table.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import logging
import re
from google.appengine.ext import db

from bugs.models.bugs import bug
from utils import encoding_util
from utils import url_util


class UrlPosition(object):
  """Used to prioritize a bugs returned from the UrlBugMap.

  Used tp determine the origin of the url from within a bug retrieved by the
  crawler.  The origin/position determines the priority of the bug relative to
  the other positions.
  """
  TITLE = 1
  MAIN = 2
  COMMENTS = 3
  OTHER = 0


class CreateError(Exception):
  pass


class InvalidIdError(Exception):
  pass


class UpdateError(Exception):
  pass


class UrlBugMap(db.Model):
  """Represents a relationship between a URL and a Bug.

  There are 3 fields a typical query will try to search on:
  url, hostname, path, and status. These properties are stored as
  indexed properties to speed up searches.

  Attributes:
    url: The url associated with the bug, truncated for a string property for
        indexing purposes.
    hostname: The hostname of the url, truncated for a string property for
        indexing purposes.
    path: The path of the url, truncated for a string property for indexing
        purposes.
    state: The bug state, replicated here to enable query sorting.
    bug: Reference to the bug associated with the url.
    position: The position within the provider's bug's details and provides
        relevance information for quering.
    added: When the model was first created.
  """
  # Indices:
  url = db.StringProperty(required=True)
  hostname = db.StringProperty(required=False, default='')
  path = db.StringProperty(required=False, default='')

  state = db.StringProperty(required=True,
                            choices=(bug.State.ACTIVE,
                                     bug.State.RESOLVED,
                                     bug.State.CLOSED,
                                     bug.State.UNKNOWN))
  last_update = db.StringProperty(required=False)

  # Non-indexed information.
  bug = db.ReferenceProperty(required=True, reference_class=bug.Bug,
                             collection_name='bug_urls')
  position = db.IntegerProperty(required=True,
                                choices=(UrlPosition.TITLE,
                                         UrlPosition.MAIN,
                                         UrlPosition.COMMENTS,
                                         UrlPosition.OTHER))

  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)


def Create(bug, position=UrlPosition.OTHER):
  """Stores a new URL to bug mapping into the Datastore.

  Args:
    bug: The bug to index. (bug.Bug)
    position: The position the url was found with the bug details from the
        provider. (UrlPosition)
  Returns:
    The newly created mapping or None if no mapping exists. (UrlBugMap or None)
  Raises:
    CreateError: Raised if something goes wrong while creating a new bug.
  """
  bug_id = 'no-id'
  try:
    bug_id = bug.key().id()

    url = bug.url
    if not url:
      return None

    url_components = PrepareUrl(url)
    mapping = UrlBugMap(bug=bug,
                        url=url_components['url'],
                        hostname=url_components['hostname'],
                        path=url_components['path'],
                        position=position,
                        state=bug.state)
    if bug.last_update:
      mapping.last_update = bug.last_update

    logging.info('Adding mapping for bug: %s', bug_id)
    logging.info('URL: %s', url_components['url'])
    logging.info('Hostname: %s', url_components['hostname'])
    logging.info('Path: %s', url_components['path'])

    mapping.put()
  except Exception, e:
    logging.error('url_bug_map.Create: Exception while creating mapping for '
                  'bug [id=%s]: %s' % (bug_id, e))
    raise CreateError('Failed to create mapping for bug [id=%s].\n' % bug_id)

  return mapping


def Delete(id):
  """Deletes the mapping specified by the given id.

  Args:
    id: The id of the mapping to retrieve. (integer)
  """
  mapping = UrlBugMap.get_by_id(id)
  if mapping:
    mapping.delete()


def Get(id):
  """Returns the mapping specified by the given id.

  Args:
    id: The id of the mapping to retrieve. (integer)
  Returns:
    Returns the UrlBugMap model object. (UrlBugMap)
  Raises:
    InvalidIdError: Raised if the id does not match a stored mapping.
  """
  try:
    mapping = UrlBugMap.get_by_id(id)
    if not mapping:
      raise InvalidIdError
  except (db.Error, InvalidIdError), e:
    logging.error('url_bug_map.Get: Exception while retrieving mapping [id=%s]'
                  ': %s' % (id, e))
    raise InvalidIdError
  return mapping


def PrepareUrl(url):
  """Return the processed full url and its hostname and path.

  The url is processed to extract its hostname and path.  Then all three are
  ASCII encoded and truncated to 500 characters to fit within a
  db.StringProperty; for indexing purposes TextProperty is not indexable.  The
  function returns a dictionary of three processed values.

  Args:
    url: The url to process. (string)
  Returns:
    A dictionary containing values for processed url, hostname, and path.  If
    the url doesn't contain one of the components it will be assigned the
    empty string. ({url: string, hostname: string, path: string})
  """
  # Successful NormalizeUrl already encodes each entry to ascii.
  # TODO (jason.stredwick): Determine the necessity of EncodeToAscii and
  # the potential of defaulting to not encoding and encoding upon
  # exception as was done prior.
  urlnorm = url_util.NormalizeUrl(url)
  # 500 character restriction; StringProperty limit.
  if urlnorm:
    return {'url': urlnorm.url[:500],
            'hostname': urlnorm.hostname[:500] or '',
            'path': urlnorm.path[:500] or ''}
  else:
    logging.exception('URL normalization failed, converting to ASCII: %s',
                      url)
    return {'url': encoding_util.EncodeToAscii(url)[:500],
            'hostname': '',
            'path': ''}
