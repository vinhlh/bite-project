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
  TITLE = 1
  MAIN = 2
  COMMENTS = 3
  OTHER = 0


class CreateError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class InvalidKeyError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class UpdateError(Exception):
  """Raised if the given key does not match a stored model."""
  pass


class UrlBugMap(db.Model):
  """Represents a relationship between a URL and a Bug.

   There are 3 fields a typical query will try to search on:
   url, hostname, path, and status. These properties are stored as
   indexed properties to speed up searches.
  """
  # Indices:
  url = db.StringProperty(required=False)
  hostname = db.StringProperty(required=False)
  path = db.StringProperty(required=False)

  # Non-indexed information.
  bug = db.ReferenceProperty(required=False, reference_class=bug.Bug,
                             collection_name='bug_urls')
  position = db.IntegerProperty(required=False, default=UrlPosition.OTHER,
                                choices=(UrlPosition.TITLE,
                                         UrlPosition.MAIN,
                                         UrlPosition.COMMENTS,
                                         UrlPosition.OTHER))

  # Tracks when an entry is added and modified.
  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)

  def Patch(self, bug):
    """Update the mapping's data to the given bug.

    Args:
      bug: A bug.Bug model object. (bug.Bug)

    Returns:
      Whether or not the given bug has a mapping available. (boolean)
    """
    if not bug.url:
      return False

    url = bug.url
    # Successful NormalizeUrl already encodes each entry to ascii.
    # TODO (jason.stredwick): Determine the necessity of EncodeToAscii and
    # the potential of defaulting to not encoding and encoding upon
    # exception as was done prior.
    urlnorm = url_util.NormalizeUrl(url)
    # 500 character restriction; StringProperty limit.
    if urlnorm:
      self.url = urlnorm.url[:500]
      self.hostname = urlnorm.hostname[:500]
      self.path = urlnorm.path[:500]
    else:
      logging.exception('URL normalization failed, converting to ASCII: %s',
                        url)
      self.url = encoding_util.EncodeToAscii(url)[:500]
      self.hostname = ''
      self.path = ''
    self.bug = bug

    logging.info('Adding mapping for bug: %s', bug.key().id())
    logging.info('URL: %s', self.url)
    logging.info('Hostname: %s', self.hostname)
    logging.info('Path %s', self.path)

    return True


def Create(bug):
  """Stores a new URL to bug mapping into the Datastore.

  Args:
    bug: A bug.Bug model object. (bug.Bug)

  Returns:
    The key to the newly created mapping or None if no mapping exists.
    (integrer or None)

  Raises:
    CreateError: Raised if something goes wrong while creating a new bug.
  """
  try:
    mapping = UrlBugMap()
    if not mapping.Patch(bug):
      return None
    key = mapping.put().id()
  except (TypeError, db.Error), e:
    logging.error('url_bug_map.Create: Exception while creating mapping with '
                  'bug id %s: %s' % (bug.key().id(), e))
    raise CreateError
  return key


def Delete(key):
  """Deletes the mapping specified by the given key.

  Args:
    key: The key of the mapping to retrieve. (integer)
  """
  mapping = UrlBugMap.get_by_id(key)
  if mapping:
    mapping.delete()


def Get(key):
  """Returns the mapping specified by the given key.

  Args:
    key: The key of the mapping to retrieve. (integer)

  Returns:
    Returns the UrlBugMap model object. (UrlBugMap)

  Raises:
    InvalidKeyError: Raised if the key does not match a stored mapping.
  """
  try:
    mapping = UrlBugMap.get_by_id(key)
    if not mapping:
      raise InvalidKeyError
  except (db.Error, InvalidKeyError), e:
    logging.error('url_bug_map.Get: Exception while retrieving mapping (%s): '
                  '%s' % (key, e))
    raise InvalidKeyError
  return mapping


# TODO (jason.stredwick): I don't think update should be a valid options,
# reconsider and delete if necessary.
def Update(key, bug):
  """Update the mapping specified by the given key with the given data.

  Args:
    key: The key of the bug to update. (integer)
    bug: A bug.Bug model object. (bug.Bug)

  Returns:
    Return the key of the mapping updated or None if a mapping no longer
    exists. (integer or None)

  Raises:
    InvalidKeyError: Raised if the key does match a stored mapping.
    UpdateError: Raised if there was an error updating the mapping.
  """
  try:
    mapping = UrlBugMap.get_by_id(key)
    if not mapping:
      raise InvalidKeyError
  except (db.Error, InvalidKeyError), e:
    logging.error('url_bug_map.Update: Invalid key (%s): %s' % (key, e))
    raise InvalidKeyError

  try:
    if not mapping.Patch(bug):
      Delete(key)
      return None
    mapping.put()
  except (TypeError, db.Error), e:
    logging.error('url_bug_map.Update: Exception while updating mapping (%s) '
                  'to new bug with key (%s): (%s): %s.' %
                  (key, bug.key().id(), e))
    raise UpdateError

  return key
