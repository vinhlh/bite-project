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


"""Controls the soy compiler dependency."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jasonstredwick@google.com (Jason Stredwick)')


import logging
import os
import shutil
import sys
import urllib
import zipfile

import base
import java


COMPILER_JAR_NAME = 'SoyToJsSrcCompiler.jar'
COMPILER_PATH_NAME = 'soy-compiler'
COMPILER_URL = ('https://closure-templates.googlecode.com/files/'
                'closure-templates-for-javascript-latest.zip')
COMPILER_ZIP_NAME = 'soy.zip'
UTIL_NAME = 'soyutils_usegoog.js'


class SoyToJsCompilerError(base.ToolError):
  """Thrown when an error happens related to the soy compiler."""
  pass


class SoyToJsCompiler(base.Tool):
  """Control the soy compiler dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes the soy compiler with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      SoyToJsCompilerError: Execution fails.
    """
    if not SoyToJsCompiler.IsInstalled(location):
      logging.error('Compile failed; soy compiler not installed.')
      raise SoyToJsCompilerError

    location = location or ''
    compiler_path = os.path.join(location, COMPILER_PATH_NAME)
    compiler_jar = os.path.join(compiler_path, COMPILER_JAR_NAME)

    params = [('-jar %s' % compiler_jar)] + params

    try:
      java.Java.Execute(params, location)
    except base.ToolError:
      logging.error('soy compiler failed to execute.')
      raise SoyToJsCompilerError

  @staticmethod
  def Install(location=None):
    """Install the soy compiler.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      SoyToJsCompilerError: Setup fails.
    """
    if not os.path.isdir(location):
      logging.error('Invalid location given for installing the '
                    'soy compiler.')
      raise SoyToJsCompilerError
    elif SoyToJsCompiler.IsInstalled(location):
      return

    # Create the directory structure for the soy compiler.
    compiler_path = os.path.join(location, COMPILER_PATH_NAME)
    os.makedirs(compiler_path)

    # Download and extract that soy compiler and util file.
    compiler_jar = os.path.join(compiler_path, COMPILER_JAR_NAME)
    compiler_zip = os.path.join(compiler_path, COMPILER_ZIP_NAME)
    compiler_zipfile = None
    util_file = os.path.join(compiler_path, UTIL_NAME)
    try:
      urllib.urlretrieve(COMPILER_URL, compiler_zip)  # Retrieve compiler zip.

      # Extract specific files from compiler zip.
      compiler_zipfile = zipfile.ZipFile(compiler_zip)
      compiler_zipfile.extract(COMPILER_JAR_NAME, compiler_path)
      compiler_zipfile.extract(UTIL_NAME, compiler_path)

      if not os.path.isfile(compiler_jar) or not os.path.isfile(util_file):
        raise SoyToJsCompilerError('soy compiler and util could not be found '
                                   'after download and extraction.')
    except (IOError, urllib.ContentTooShortError, RuntimeError,
            SoyToJsCompilerError), e:
      shutil.rmtree(compiler_path)
      logging.error('Failed to download and extract the soy compiler and data '
                    'with error: %s' % e)
      raise SoyToJsCompilerError
    finally:
      if os.path.isfile(compiler_zip):
        os.remove(compiler_zip)
      if compiler_zipfile:
        compiler_zipfile.close()

  @staticmethod
  def IsInstalled(location=None):
    """Determine if the soy compiler is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not the soy data and compiler are installed.
    """
    location = location or ''
    return os.path.isdir(os.path.join(location, COMPILER_PATH_NAME))

  @staticmethod
  def Uninstall(location=None):
    """Removes the soy compiler.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      SoyToJsCompilerError: Fails to remove the soy compiler subtree.
    """
    if SoyToJsCompiler.IsInstalled(location):
      try:
        shutil.rmtree(os.path.join(location, COMPILER_PATH_NAME))
      except OSError, e:
        logging.error('Failed to remove the soy compiler: %s.' % e)
        raise SoyToJsCompilerError
