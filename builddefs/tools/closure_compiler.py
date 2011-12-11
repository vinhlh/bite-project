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

"""Controls the closure-compiler dependency."""

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


COMPILER_JAR_NAME = 'compiler.jar'
COMPILER_PATH_NAME = 'closure-compiler'
COMPILER_URL = ('https://closure-compiler.googlecode.com/files/'
                'compiler-latest.zip')
COMPILER_ZIP_NAME = 'closure.zip'
LIBRARY_PATH_NAME = 'closure-library'
LIBRARY_URL = 'https://closure-library.googlecode.com/svn/trunk/'


class ClosureCompilerError(base.ToolError):
  """Thrown when an error happens related to the closure compiler."""
  pass


class ClosureCompiler(base.Tool):
  """Control the closure compiler dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes the closure-compiler with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureCompilerError: Execution fails.
    """
    if not ClosureCompiler.IsInstalled(location):
      logging.error('Compile failed; closure-compiler not installed.')
      raise ClosureCompilerError

    location = location or ''
    compiler_path = os.path.join(location, COMPILER_PATH_NAME)
    compiler_jar = os.path.join(compiler_path, COMPILER_JAR_NAME)
    library_path = os.path.join(compiler_path, LIBRARY_PATH_NAME)
    builder = os.path.join(library_path, 'closure', 'bin', 'build',
                           'closurebuilder.py')
    params.append('--root=%s' % library_path)
    params.append('--compiler_jar=%s' % compiler_jar)
    command = ' '.join([sys.executable, builder] + params)

    try:
      base.Tool._ExecuteCommand(command)
    except base.ToolError:
      logging.error('closure-compiler failed to execute:\n    %s.' % command)
      raise ClosureCompilerError

  @staticmethod
  def Install(location=None):
    """Install the closure compiler.

    Installation of the closure compiler includes the checkout of the compiler
    and library from their svn repositories.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureCompilerError: Setup fails.
    """
    if not os.path.isdir(location):
      logging.error('Invalid location given for installing the '
                    'closure-compiler.')
      raise ClosureCompilerError
    elif ClosureCompiler.IsInstalled(location):
      return

    # Create the directory structure for the closure compiler.
    compiler_path = os.path.join(location, COMPILER_PATH_NAME)
    os.makedirs(compiler_path)

    # Checkout the closure library
    library_path = os.path.join(compiler_path, LIBRARY_PATH_NAME)
    params = ['checkout', LIBRARY_URL, library_path]
    try:
      svn.Svn.Execute(params, location)
      if not os.path.isdir(library_path):
        raise ClosureCompilerError
    except (ClosureCompilerError, svn.SvnError):
      shutil.rmtree(compiler_path)
      logging.error('Could not check out the closure library from %s.' %
                    LIBRARY_URL)
      raise ClosureCompilerError

    # Download and extract the closure compiler.
    compiler_jar = os.path.join(compiler_path, COMPILER_JAR_NAME)
    compiler_zip = os.path.join(compiler_path, COMPILER_ZIP_NAME)
    compiler_zipfile = None
    try:
      urllib.urlretrieve(COMPILER_URL, compiler_zip)
      compiler_zipfile = zipfile.ZipFile(compiler_zip)
      compiler_zipfile.extract(COMPILER_JAR_NAME, compiler_path)
      if not os.path.isfile(compiler_jar):
        raise ClosureCompilerError('closure-compiler.jar could not be found '
                                   'after download and extraction.')
    except (IOError, urllib.ContentTooShortError, RuntimeError,
            ClosureCompilerError), e:
      shutil.rmtree(compiler_path)
      logging.error('Failed to download and extract the closure-compiler with '
                    'error: %s' % e)
      raise ClosureCompilerError
    finally:
      if os.path.isfile(compiler_zip):
        os.remove(compiler_zip)
      if compiler_zipfile:
        compiler_zipfile.close()

  @staticmethod
  def IsInstalled(location=None):
    """Determine if the closure compiler is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not the closure library and compiler are installed.
    """
    location = location or ''
    return os.path.isdir(os.path.join(location, COMPILER_PATH_NAME))

  @staticmethod
  def Uninstall(location=None):
    """Removes the closure compiler.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      ClosureCompilerError: Fails to remove the closure-compiler subtree.
    """
    if ClosureCompiler.IsInstalled(location):
      try:
        shutil.rmtree(os.path.join(location, COMPILER_PATH_NAME))
      except OSError, e:
        logging.error('Failed to remove the closure compiler: %s.' % e)
        raise ClosureCompilerError


if __name__ == '__main__':
  pass

