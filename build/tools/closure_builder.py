#!/usr/bin/python
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

"""Controls the closure-builder dependency."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jasonstredwick@google.com (Jason Stredwick)')


import logging
import os
import shutil
import sys
import urllib
import zipfile

from builddefs.tools import base
from builddefs.tools import svn


BUILDER_JAR_NAME = 'builder.jar'
BUILDER_PATH_NAME = 'closure-builder'
BUILDER_URL = ('https://closure-builder.googlecode.com/files/'
                'builder-latest.zip')
BUILDER_ZIP_NAME = 'closure.zip'
LIBRARY_PATH_NAME = 'closure-library'
LIBRARY_URL = 'https://closure-library.googlecode.com/svn/trunk/'


class ClosureBuilderError(base.ToolError):
  """Thrown when an error happens related to the closure builder."""
  pass


class ClosureBuilder(base.Tool):
  """Control the closure builder dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes the closure-builder with the given parameters.

    Args:
      params: Arguments supplied to the builder. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureBuilderError: Execution fails.
    """
    if not ClosureBuilder.IsInstalled(location):
      logging.error('Compile failed; closure-builder not installed.')
      raise ClosureBuilderError

    location = location or ''
    builder_path = os.path.join(location, BUILDER_PATH_NAME)
    builder_jar = os.path.join(builder_path, BUILDER_JAR_NAME)
    library_path = os.path.join(builder_path, LIBRARY_PATH_NAME)
    builder = os.path.join(library_path, 'closure', 'bin', 'build',
                           'closurebuilder.py')
    params.append('--root=%s' % library_path)
    params.append('--builder_jar=%s' % builder_jar)
    command = ' '.join([sys.executable, builder] + params)

    try:
      base.Tool._ExecuteCommand(command)
    except base.ToolError:
      logging.error('closure-builder failed to execute:\n    %s.' % command)
      raise ClosureBuilderError

  @staticmethod
  def Install(location=None):
    """Install the closure builder.

    Installation of the closure builder includes the checkout of the builder
    and library from their svn repositories.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureBuilderError: Setup fails.
    """
    if not os.path.isdir(location):
      logging.error('Invalid location given for installing the '
                    'closure-builder.')
      raise ClosureBuilderError
    elif ClosureBuilder.IsInstalled(location):
      return

    # Create the directory structure for the closure builder.
    builder_path = os.path.join(location, BUILDER_PATH_NAME)
    os.makedirs(builder_path)

    # Checkout the closure library
    library_path = os.path.join(builder_path, LIBRARY_PATH_NAME)
    params = ['checkout', LIBRARY_URL, library_path]
    try:
      svn.Svn.Execute(params, location)
      if not os.path.isdir(library_path):
        raise ClosureBuilderError
    except (ClosureBuilderError, svn.SvnError):
      shutil.rmtree(builder_path)
      logging.error('Could not check out the closure library from %s.' %
                    LIBRARY_URL)
      raise ClosureBuilderError

    # Download and extract the closure builder.
    builder_jar = os.path.join(builder_path, BUILDER_JAR_NAME)
    builder_zip = os.path.join(builder_path, BUILDER_ZIP_NAME)
    builder_zipfile = None
    try:
      urllib.urlretrieve(BUILDER_URL, builder_zip)
      builder_zipfile = zipfile.ZipFile(builder_zip)
      builder_zipfile.extract(BUILDER_JAR_NAME, builder_path)
      if not os.path.isfile(builder_jar):
        raise ClosureBuilderError('closure-builder.jar could not be found '
                                   'after download and extraction.')
    except (IOError, urllib.ContentTooShortError, RuntimeError,
            ClosureBuilderError), e:
      shutil.rmtree(builder_path)
      logging.error('Failed to download and extract the closure-builder with '
                    'error: %s' % e)
      raise ClosureBuilderError
    finally:
      if os.path.isfile(builder_zip):
        os.remove(builder_zip)
      if builder_zipfile:
        builder_zipfile.close()

  @staticmethod
  def IsInstalled(location=None):
    """Determine if the closure builder is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not the closure library and builder are installed.
    """
    location = location or ''
    return os.path.isdir(os.path.join(location, BUILDER_PATH_NAME))

  @staticmethod
  def Uninstall(location=None):
    """Removes the closure builder.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureBuilderError: Fails to remove the closure-builder subtree.
    """
    if ClosureBuilder.IsInstalled(location):
      try:
        shutil.rmtree(os.path.join(location, BUILDER_PATH_NAME))
      except OSError, e:
        logging.error('Failed to remove the closure builder: %s.' % e)
        raise ClosureBuilderError


if __name__ == '__main__':
  pass

