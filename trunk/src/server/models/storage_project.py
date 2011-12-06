#!/usr/bin/python2.4
#
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

"""Describes metadata for the rpf project storage back-end.

We currently use Google Docs as a storage back-end, but
this should be easy to change in the future.
"""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

import logging
import simplejson

from google.appengine.ext import db


class StorageProjectMetadata(db.Model):
  """Stores metadata associated with persistent rpf project objects.

  Attributes:
    name: A string representing the name of the project.
    page_map: A long json string containing an encoded mapping of url patterns
      matched to names.
    java_package_path: The Java package path. (string)
  """

  # Project specific information
  name = db.StringProperty(required=True)
  page_map = db.TextProperty(required=False, default='{}')
  params = db.TextProperty(required=False, default='{}')

  # Translation configuration data
  #   Java
  java_package_path = db.StringProperty(required=False, default='')


def GetOrInsertProject(name):
  """Gets or inserts a project object.

  Args:
    name: A string representing the name of a project and its key.

  Returns:
    Newly created/existing StorageProjectMetadata object, or None if name is
    invalid or the instance was not able to be created.
  """
  if name is None:
    return None

  project = StorageProjectMetadata.get_by_key_name(name)
  if project is None:
    project = StorageProjectMetadata(key_name=name, name=name)
    if project is None:
      return None
    project.put()

  return project


def GetProjectJson(name):
  """Gets project object and returns it in json form.

  Args:
    name: A string representing the name of a project and its key.

  Returns:
    A string form of the object in JSON, or None upon failure to create a new
    object.
  """
  obj = GetProjectObject(name)
  if obj is None:
    return None

  try:
    return simplejson.dumps(obj)
  except simplejson.JSONDecodeError:
    return None


def GetJsFiles(project):
  """Gets the JS files associated with a project."""
  files = []
  js_files = project.jsfile_set.get() or {}
  if isinstance(js_files, JsFile):
    js_files = [js_files]

  for js_file in js_files:
    files.append({'name': js_file.name,
                  'code': js_file.code})
  return files


def GetProjectObject(name):
  """Gets an object representation of the specified project.

  Args:
    name: A string representing the name of a project and its key.

  Returns:
    The object form of the entry or None if the project does not exist.
  """
  project = StorageProjectMetadata.get_by_key_name(name)
  if project is None:
    return None

  obj = {
    'name': project.name,
    'page_map': project.page_map,
    'params': project.params,
    'js_files': GetJsFiles(project),
    'java_package_path': project.java_package_path
  }

  return obj


def UpdateProject(name, data):
  """Updates a project's data.

  Args:
    name: A string representing the name of the project and its key.
    data: An object containing the values to update within the project details.
      Note that any given attribute is optional.

  Returns:
    Returns the project that was updated or None if no project was updated.
  """
  project = GetOrInsertProject(name)
  if project is None:
    return None

  if 'page_map' in data and data['page_map']:
    project.page_map = data['page_map']
  if 'java_package_path' in data:
    project.java_package_path = data['java_package_path'] or ''
  if 'params' in data and data['params']:
    project.params = data['params']
  if 'js_files' in data and data['js_files'] is not None:
    DeleteFiles(project)
    SaveFiles(project, data['js_files'])

  project.put()

  return project


def GetProjectNames():
  """Gets the project names."""
  projects = StorageProjectMetadata.all()
  return [project.name for project in projects]


class JsFile(db.Model):
  """Stores the JS file associated with a project.

  Attributes:
    name: The JS file name.
    code: The JS code.
  """

  name = db.StringProperty(required=True)
  code = db.TextProperty(required=False, default='')
  project = db.ReferenceProperty(StorageProjectMetadata)


def SaveFiles(project, files):
  """Saves the JS files associated with the given project."""
  entities = []
  for file in files:
    entity = JsFile(name=file['name'],
                    code=file['code'],
                    project=project)
    entities.append(entity)
  db.put(entities)


def DeleteFiles(project):
  """Removes the files associated with the given project."""
  js_files = project.jsfile_set.get()
  if js_files:
    db.delete(js_files)

