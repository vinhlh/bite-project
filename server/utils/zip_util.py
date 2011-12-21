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

"""Handles conversion of data into a string representing a zip file."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

import StringIO
import zipfile
import json


class BadInput(Exception):
  """Thrown for bad function input."""


def JsonStringToZip(data):
  """A utility that takes a json string and converts it into a zip file string.

  Parses the given json string into an object and sends it to the conversion
  function to generate a string form of a zip file.

  Args:
    data: A string hold a json representation of the data to be zipped.

  Returns:
    A tuple of (zip file title, zip file embedded in a string).

  Raises:
    BadInput: Raised by ObjToZip.
  """
  try:
    obj = json.loads(data)
  except (ValueError, OverflowError, TypeError):
    raise BadInput('Invalid data received.')

  return ObjToZip(obj)


def ObjToZip(data):
  """Convert an object of file related information into a zip file.

  Args:
    data: An object containing the information related to the files to be
      zipped.  The format is {'title': string, 'files': {filename: contents} }
      where filename and contents are strings.  Title is required, but files
      is optional.  Files can also be an empty object.

  Returns:
    A tuple of (zip file title, zip file embedded in a string).

  Raises:
    BadInput: Raised if data is not a valid object or has an incorrect
      structure.
  """
  # Process archive title; i.e. archive file name.
  files = None
  title = 'untitled.zip'

  try:
    # Throws exception if data is not an object.
    if 'title' in data:
      title = data['title'] or title

    # This will raise and exception if title is not a string.
    if not title.endswith('.zip'):
      title += '.zip'

    # Throws exception if data is not an object.
    if 'files' in data:
      # Throws exception if data['files'] is not iteratable.
      files = data['files'].iteritems()

  except Exception:
    raise BadInput('Invalid data received.')

  # Create zip file.
  output = StringIO.StringIO()
  zip_file = zipfile.ZipFile(output, 'w')
  if files:
    # Add each file in data['files'] to the zip file where filename (n) is
    # mapped to the file content string (s) within the archive.
    # Note: n and c must be converted or UnicodeError will be raised.
    [zip_file.writestr(n.encode('utf-8'), c.encode('utf-8')) for n, c in files]
  zip_file.close()

  return (title, output.getvalue())

