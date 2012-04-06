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


"""The build system required dependencies."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import shutil
import urllib
import urllib2
import zipfile

import paths
import tools
import utils


ACE = 'ace'
ATOMS = 'selenium-atoms-lib'
CLOSURE_COMPILER = 'closure-compiler'
CLOSURE_LIB = 'closure-library'
CLOSURE_SOY_COMPILER = 'closure-soy-compiler'
GDATA = 'gdata'
MRTASKMAN = 'mrtaskman'
URLNORM = 'urlnorm'

COMMAND = 'command'
FUNCTION = 'function'
ROOT = 'root'
URL = 'url'

SOY_LIB = 'soy-library'

# Define dependencies that are checkout from various repositories.
def CreateDeps():
  """Generate minimal dependency information.

  The object returns path references relative to the root dependency folder.

  Returns:
    An object containing the minimal set of dependencies. (dict)
  """
  git = tools.GetExecutable(tools.TOOLS[tools.GIT][tools.COMMAND])
  hg = tools.GetExecutable(tools.TOOLS[tools.MERCURIAL][tools.COMMAND])
  svn = tools.GetExecutable(tools.TOOLS[tools.SVN][tools.COMMAND])

  root = paths.DEPS_ROOT

  return {
    ACE: {
      ROOT: os.path.join(root, 'ace'),
      URL: 'git://github.com/ajaxorg/ace.git',
      COMMAND: git + ' clone %s %s'
    },

    ATOMS: {
      ROOT: os.path.join(root, 'selenium-atoms-lib'),
      URL: 'http://selenium.googlecode.com/svn/trunk/javascript/atoms',
      COMMAND: svn + ' checkout %s %s'
    },

    CLOSURE_COMPILER: {
      ROOT: os.path.join(root, 'closure', 'compiler.jar'),
      URL: 'http://closure-compiler.googlecode.com/files/compiler-latest.zip',
      COMMAND: None,
      FUNCTION: _InstallClosureCompiler
    },

    CLOSURE_LIB: {
      ROOT: os.path.join(root, 'closure', 'closure-library'),
      URL: 'http://closure-library.googlecode.com/svn/trunk/',
      COMMAND: svn + ' checkout %s %s'
    },

    CLOSURE_SOY_COMPILER: {
      ROOT: os.path.join(root, 'closure', 'SoyToJsSrcCompiler.jar'),
      URL: ('http://closure-templates.googlecode.com/files/'
            'closure-templates-for-javascript-latest.zip'),
      COMMAND: None,
      FUNCTION: _InstallSoyCompiler
    },

    GDATA: {
      ROOT: os.path.join(root, 'gdata-python-client'),
      URL: 'http://code.google.com/p/gdata-python-client/',
      COMMAND: hg + ' clone %s %s'
    },

    URLNORM: {
      ROOT: os.path.join(root, 'urlnorm'),
      URL: 'git://gist.github.com/246089.git',
      COMMAND: git + ' clone %s %s'
    },

    MRTASKMAN: {
      ROOT: os.path.join(root, 'mrtaskman'),
      URL: 'http://code.google.com/p/mrtaskman',
      COMMAND: git + ' clone %s %s'
    }
  }


def VerifyAndDownload(deps, verbose, location=None):
  """Checks if the given dependencies are installed and downloads them if not.

  Args:
    deps: A dictionary of dependencies whose location is relative to the
        dependency root folder. (dict)
    verbose: Whether or not to print verbose output. (boolean)
    location: An optional location to place the root dependency folder.
        (string or None)
  Returns:
    Whether or not all the dependencies are installed. (boolean)
  """
  verified = True

  if verbose:
    print 'Verifying required dependencies are present and download if not ...'

  for key in deps:
    dep_loc = deps[key][ROOT]
    if location:
      dep_loc = os.path.join(location, dep_loc)

    if not os.path.exists(dep_loc):
      print '[FAILED]  Missing %s; attempting to download ...' % key

      url = deps[key][URL]
      command = deps[key][COMMAND]

      if command:
        success = _Download(command, url, dep_loc)
      elif deps[key][FUNCTION]:
        f = deps[key][FUNCTION]
        success = f(url, dep_loc)
      else:
        continue

      if success:
        print '[SUCCESS] Download of %s complete.' % key
      else:
        verified = False
        print '\n'.join(['[FAILED]  Could not download %s from' % key,
                         '    %s' % url])

  if verbose and verified:
    print '[SUCCESS] All dependencies are present'

  return verified


def GetSoyLibraryPath(deps):
  soy_compiler = deps[CLOSURE_SOY_COMPILER][ROOT]
  (root_loc, _) = os.path.split(soy_compiler) # Remove compiler's name
  return os.path.join(root_loc, SOY_LIB)


def _Download(command, url, location):
  """Download dependency using the given command from the url to location.

  This function does not handle corrupt downloads.
  """
  try:
    utils.ExecuteCommand(command % (url, location))
    if not os.path.exists(location):
      return False
    return True
  except Exception:
    if os.path.exists(location):
      shutil.rmtree(location)


def _InstallClosureCompiler(url, location):
  try:
    (root_loc, _) = os.path.split(location) # Remove compiler's name
    if not os.path.exists(root_loc):
      os.makedirs(root_loc)

    # Verify that the url target exists.
    urllib2.urlopen(url)

    (compiler_zip, _) = urllib.urlretrieve(url)
    compiler_zipfile = zipfile.ZipFile(compiler_zip)
    (path, name) = os.path.split(location)
    compiler_zipfile.extract(name, path)
    if not os.path.exists(location):
      return False

    return True
  except Exception:
    if os.path.exists(location):
      shutil.rmtree(location)
    return False


def _InstallSoyCompiler(url, location):
  try:
    (root_loc, name) = os.path.split(location) # Remove compiler's name
    if not os.path.exists(root_loc):
      os.makedirs(root_loc)

    lib_loc = os.path.join(root_loc, SOY_LIB)
    if not os.path.exists(lib_loc):
      os.makedirs(lib_loc)

    lib = os.path.join(lib_loc, 'soyutils_usegoog.js')

    # Verify that the url target exists.
    urllib2.urlopen(url)

    (soy_compiler_zip, _) = urllib.urlretrieve(url)
    soy_compiler_zipfile = zipfile.ZipFile(soy_compiler_zip)
    soy_compiler_zipfile.extract(name, root_loc)
    soy_compiler_zipfile.extract('soyutils_usegoog.js', lib_loc)
    if (not os.path.exists(location) or not os.path.exists(lib)):
      raise Exception

    return True
  except Exception:
    if os.path.exists(location):
      shutil.rmtree(location)
    if os.path.exists(lib):
      shutil.rmtree(lib)
    return False
