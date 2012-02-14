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

"""Describes metadata for the test storage back-end.

We currently use Google Docs as a storage back-end, but
this should be easy to change in the future.
"""

__author__ = 'michaelwill@google.com (Michael Williamson)'

import json
import logging
import re
import uuid
from google.appengine.ext import db
from config import settings


DEFAULT_NUMBER_PER_BATCH = 500


# In the bite test code, any references to legacy wtf ids have
# been replaced with the string 'legacy-<id>'.
# The most common occurrence of this was where a test
# case had a 'call()' statement
# defined inline.  This is a regular expression to
# determine if the id passed to an AppEngine handler
# is a legacy id or not.
LEGACY_ID_REGEX = re.compile(r'legacy-([0-9]+)')


class StorageMetadata(db.Model):
  """Stores metadata associated with persistent bite text objects."""

  # An id that is independent of the AppEngine datastore.
  # When switching out the storage model, be sure to keep
  # this field the same, as it may be referenced in
  # the test code.
  id = db.StringProperty(required=True)

  # TODO(michaelwill): Ideally this would be
  # a reference property to our project model,
  # but at the moment, our project implementation
  # is not ready for prime time.
  project = db.StringProperty(required=True)

  # There are still certain situations where having
  # the old legacy wtf id around is useful, but new
  # tests should not set this property.
  legacy_wtf_id = db.StringProperty()

  test = db.TextProperty(required=False)

  docs_resource_url = db.StringProperty(required=False)
  docs_resource_id = db.StringProperty(required=False)
  test_name = db.StringProperty(required=True)

  def GetText(self):
    """Retrieves the active revision text blob for this storage entity."""
    return self._GetActiveTestVersion()

  def _GetActiveTestVersion(self):
    """Gets the active test version."""
    result = ''
    if self.test:
      test = json.loads(self.test)
      result = test['active']
    return result

  def Update(self, new_project, new_name, new_contents):
    """Updates the metadata and Google Docs using a transaction."""
    db.run_in_transaction(self._UpdateTransaction,
                          new_project, new_name, new_contents)

  def _UpdateTransaction(self, new_project, new_name, new_contents):
    """This transaction ensures the metadata and Google Docs are in sync."""
    self.project = new_project
    self.test_name = new_name
    self.test = self._UpdateTestMetadata(new_contents)
    self.put()

  def _UpdateTestMetadata(self, new_contents):
    """Updates the test metadata stored."""
    result = ''
    if self.test:
      cur_test = json.loads(self.test)
      cur_test['backup2'] = cur_test['backup1']
      cur_test['backup1'] = cur_test['active']
      cur_test['active'] = new_contents
      result = json.dumps(cur_test)
    return result


class ZipData(db.Model):
  """Stores the zip string data."""
  json_str = db.TextProperty(required=True)


def SaveZipData(json_str):
  """Saves the zip data to db."""
  zip = ZipData(json_str=json_str)
  return str(zip.put())


def LoadZipByKeyStr(key_str):
  """Load the zip data by key string."""
  return ZipData.get(db.Key(key_str))


def GetTestString(contents):
  """Gets the test contents to be saved in the metadata."""
  return json.dumps(
      {'active': contents,
       'backup1': '',
       'backup2': ''});


def Save(project, new_test_name, contents):
  """Saves both new metadata and a new docs object."""
  return db.run_in_transaction(
      _SaveTransaction, project, new_test_name, contents)


def _SaveTransaction(project, new_test_name, contents):
  """Carries out the actual save operation, retrying if necessary."""
  storage_metadata = StorageMetadata(
      id=GetUniqueId(),
      project=project,
      docs_resource_url='',
      docs_resource_id='',
      test_name=new_test_name,
      test=GetTestString(contents))
  storage_metadata.put()
  return storage_metadata


def FetchById(id_string):
  """Fetches a storage metadata instance by its id field.

  This function also supports passing a legacy wtf id,
  identified by a 'legacy-' tag in front of the numerical
  id.  If a legacy id is detected, we query using that instead
  of the normal storage id.

  Args:
    id_string: Either a pure numerical id string, or one prefixed
        with the string 'legacy-'.
  Returns:
    The corresponding StorageMetadata instance or None if no
    instance is found for the given id.
  """
  q = StorageMetadata.all()
  match = LEGACY_ID_REGEX.search(id_string)
  if match:
    legacy_id = match.group(1)
    q.filter('legacy_wtf_id = ', legacy_id)
  else:
    q.filter('id = ', id_string)
  return q.get()


def FetchByIds(ids):
  """Fetches the metadata instances by ids."""
  metadata = []
  for id in ids:
    metadata.append(FetchById(id))
  return metadata


def DeleteMetadata(instances):
  """Deletes all of the metadata."""

  def BatchDelete(instances):
    db.delete(instances)

  while instances:
    if len(instances) <= DEFAULT_NUMBER_PER_BATCH:
      BatchDelete(instances)
      del instances
      break
    else:
      BatchDelete(instances[:DEFAULT_NUMBER_PER_BATCH])
      del instances[:DEFAULT_NUMBER_PER_BATCH]


def FetchByDocsResourceId(resource_id):
  """Fetchs a storage metadata instance by its docs resource id."""
  q = StorageMetadata.all()
  q.filter('docs_resource_id = ', resource_id)
  return q.get()


def FetchByProjectAndTestName(project_name, test_name):
  """Fetches the first test with the given name."""
  q = StorageMetadata.all()
  q.filter('project = ', project_name)
  q.filter('test_name = ', test_name)
  return q.get()


def FetchByProject(project_name):
  """Fetches a list of metadata objects by their project."""
  q = StorageMetadata.all()
  q.filter('project = ', project_name)
  response_objects = []
  for storage_metadata in q:
    response_objects.append(storage_metadata)

  return response_objects


def AddPreexisting(project, test_name, resource_url, resource_id,
                   legacy_wtf_id=None):
  """Adds the metadata for a storage instance that already exists in Docs."""
  metadata = StorageMetadata(
      id=GetUniqueId(),
      project=project, test_name=test_name, docs_resource_url=resource_url,
      docs_resource_id=resource_id, legacy_wtf_id=legacy_wtf_id)
  metadata.put()
  return metadata


def GetUniqueId():
  """Returns a unique 128 bit identifier as a string."""
  return str(uuid.uuid4())
