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

"""Handles storing and retrieving test cases.

Note, an oddity in this implementation is that we don't store
pure test code.  Instead, we store json blobs which are defined
by the client.  This is left over from the old WTF API, but it
would require a complete client rewrite to make it more
explicit.
"""

__author__ = 'michaelwill@google.com (Michael Williamson)'

import logging
import json
import webapp2

from common.handlers import base
from models import storage
from models import storage_project
from utils import zip_util


class Error(Exception):
  pass


class DuplicatedNameError(Error):
  """Duplicated name."""


class AddPreexistingDocsMetadata(base.BaseHandler):
  """Legacy handler for adding metadata for tests already in docs.

  This handler should only be used when there already exists
  a test object stored in Google Docs, and the metadata on
  the bite server needs to be synchronized.
  """

  def post(self):
    resource_id = self.GetRequiredParameter('resource_id')
    resource_url = self.GetRequiredParameter('resource_url')
    test_name = self.GetRequiredParameter('test_name')
    project = self.GetRequiredParameter('project')
    wtf_id = self.GetOptionalParameter('wtf_id', '')

    preexisting_metadata = storage.FetchByDocsResourceId(resource_id)
    if preexisting_metadata:
      logging.info('Found a preexisting test with resource_id %s.'
                   ' Not doing anything.',
                   resource_id)
      return

    storage.AddPreexisting(
        project, test_name, resource_url, resource_id, wtf_id)


class GetAllTestNamesAndIds(base.BaseHandler):
  """Handler to retrieve a list of all the test names and their ids."""

  def get(self):
    project_name = self.GetRequiredParameter('project')

    metadatas = storage.FetchByProject(project_name)
    tests = []
    for metadata in metadatas:
      test_data = {
        'test_name': metadata.test_name,
        'test': metadata.test,
        'id': metadata.id
      }
      tests.append(test_data)

    self.response.out.write(json.dumps(tests))


class GetTestAsJson(base.BaseHandler):
  """Returns one test object in a json bundle."""

  def get(self):
    test_id = self.GetRequiredParameter('id')
    test_metadata = storage.FetchById(test_id)
    if not test_metadata:
      logging.info('Test with id %s not found.', test_id)
      self.error(400)
      return

    file_text = test_metadata.GetText()
    json_obj = json.loads(file_text)

    response = []
    json_obj['projectname'] = test_metadata.project

    # TODO(michaelwill): This should really only be returning one item.
    # It returns a list because the WTF legacy API returned a list.
    response.append({'id': test_id, 'json': json.dumps(json_obj)})
    self.response.out.write(json.dumps(response))


class DeleteTest(base.BaseHandler):
  """Deletes a test object."""

  def get(self):
    self.post()

  def post(self):
    test_id_str = self.GetRequiredParameter('ids')
    test_ids = json.loads(test_id_str)
    instances = storage.FetchByIds(test_ids)
    if instances:
      storage.DeleteMetadata(instances)
    storage.DeleteAllStepsByScriptIds(test_ids)
    self.response.out.write('delete successfully.')


class UpdateTest(base.BaseHandler):
  """Updates a test object."""

  def post(self):
    test_id = self.GetRequiredParameter('id')
    test = self.GetRequiredParameter('json')
    project = self.GetRequiredParameter('project')
    js_files = self.GetOptionalParameter('jsFiles')

    if js_files:
      js_files = json.loads(js_files)

    test_metadata = storage.FetchById(test_id)
    if not test_metadata:
      self.error(400)
      return

    json_obj = json.loads(test)
    new_test_name = json_obj['name']
    storage_project.UpdateProject(project, {'js_files': js_files})
    test_metadata.Update(project, new_test_name, test)


class SaveTest(base.BaseHandler):
  """Saves a new test object to the storage backend."""

  def post(self):
    json_str = self.GetRequiredParameter('json')
    project = self.GetRequiredParameter('project')
    js_files = self.GetOptionalParameter('jsFiles')

    if js_files:
      js_files = json.loads(js_files)

    json_obj = json.loads(json_str)
    new_test_name = json_obj['name']

    if storage.FetchByProjectAndTestName(project, new_test_name):
      raise DuplicatedNameError('The name exists, please provide a new name.')

    storage_project.UpdateProject(project, {'js_files': js_files})
    storage_instance = storage.Save(project, new_test_name, json_str)

    # TODO(michaelwill): This weird id string is left over from the
    # legacy WTF system.  Change to a proper json response.
    self.response.out.write('id=' + storage_instance.id)


class SaveZipFile(base.BaseHandler):
  """Convert an RPF project's exported tests into a zip file."""

  def post(self):
    """Given a set of files as a json string and saves to db.

    Raises:
      TypeError: Unsupported key type; json.
      OverflowError: Circular reference; json.
      ValueError: Invalid value, out of range; json.
      zip_util.BadInput: Raised for bad inputs supplied to zip_util functions.
    """
    json_string = self.GetRequiredParameter('json')
    logging.info(json_string)
    key = storage.SaveZipData(json_string)
    self.response.out.write(key)


class GetZipFile(base.BaseHandler):
  """Convert an RPF project's exported tests into a zip file."""
  def get(self):
    self.post()

  def post(self):
    """Returns a zip file based on the given key string."""
    key_string = self.GetRequiredParameter('key')
    logging.info(key_string)

    zip = storage.LoadZipByKeyStr(key_string)
    title, contents = zip_util.JsonStringToZip(zip.json_str)
    zip.delete()
    disposition = 'attachment; filename="' + title + '"'
    self.response.headers['Content-Type'] = 'application/zip'
    self.response.headers['Content-Disposition'] = str(disposition)
    self.response.out.write(contents)


class GetProject(base.BaseHandler):
  """Gets project data and returns it to the requester."""

  def post(self):
    """Given project data, save it to db."""
    name = self.GetRequiredParameter('name')

    metadatas = storage.FetchByProject(name)
    tests = []
    for metadata in metadatas:
      test_data = {
        'test_name': metadata.test_name,
        'test': metadata.test,
        'id': metadata.id
      }
      tests.append(test_data)

    project = storage_project.GetProjectObject(name)
    if project is None:
      # No project entry exists for the given name, but check if there are
      # tests associated with the name.
      if len(tests) > 0:
        # There are tests so create a new project entry for the given name.
        project = storage_project.GetOrInsertProject(name)
        if project is None:
          self.error(400)
          return

    data = {
      'project_details': project,
      'tests': tests
    }

    try:
      self.response.out.write(json.dumps(data))
    except (TypeError, OverflowError, ValueError):
      self.error(400)


class SaveProject(base.BaseHandler):
  """Saves project data."""

  def post(self):
    """Given project data, save it to db."""
    name = self.GetRequiredParameter('name')
    data_string = self.GetRequiredParameter('data')

    try:
      data = json.loads(data_string)
    except (TypeError, OverflowError, ValueError):
      # TODO(jasonstredwick): Change from error codes to an error response.
      self.error(400)
      return

    project = storage_project.UpdateProject(name, data)
    if project is None:
      self.error(400)
    else:
      self.response.out.write('success')


class GetProjectNames(base.BaseHandler):
  """Gets the project names.

  Returns:
    Returns the project names.
  """

  def get(self):
    self.post()

  def post(self):
    """Returns the project names."""
    names = storage_project.GetProjectNames()
    self.response.out.write(json.dumps(names))


class AddScreenshots(base.BaseHandler):
  """Adds the screenshots."""

  def get(self):
    self.post()

  def post(self):
    """Adds the screenshots to a script."""
    test_id = self.GetRequiredParameter('id')
    steps = self.GetRequiredParameter('steps')
    storage.DeleteAllSteps(test_id)
    steps = json.loads(steps)
    for index in steps:
      storage.AddNewScriptStep(
          test_id, steps[index]['index'], steps[index]['data'])


class GetScreenshots(base.BaseHandler):
  """Gets the screenshots of a given script."""

  def get(self):
    self.post()

  def post(self):
    """Returns the screenshots of a script."""
    test_id = self.GetRequiredParameter('id')
    steps = storage.GetAllSteps(test_id)
    rtn_obj = {}
    for step in steps:
      rtn_obj[step.step_index] = {}
      rtn_obj[step.step_index]['index'] = step.step_index
      rtn_obj[step.step_index]['id'] = step.script_id
      rtn_obj[step.step_index]['data'] = step.image_url
    self.response.out.write(json.dumps(rtn_obj))


app = webapp2.WSGIApplication(
    [('/storage/add_test_metadata', AddPreexistingDocsMetadata),
     ('/storage/getalltestsasjson', GetAllTestNamesAndIds),
     ('/storage/gettestasjson', GetTestAsJson),
     ('/storage/updatetest', UpdateTest),
     ('/storage/addtest', SaveTest),
     ('/storage/savezip', SaveZipFile),
     ('/storage/getzip', GetZipFile),
     ('/storage/deletetest', DeleteTest),
     ('/storage/getproject', GetProject),
     ('/storage/saveproject', SaveProject),
     ('/storage/getprojectnames', GetProjectNames),
     ('/storage/addscreenshots', AddScreenshots),
     ('/storage/getscreenshots', GetScreenshots)
    ])
