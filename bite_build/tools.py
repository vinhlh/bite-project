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


"""The build system required tools."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os


GIT = 'git'
JAVA = 'java'
MERCURIAL = 'mercurial'
SVN = 'svn'

COMMAND = 'command'
MSG = 'msg'

TOOLS = {
  GIT: {
    COMMAND: 'git',
    MSG: '\n'.join([('git not installed.  Please install a command line tool '
                     'from'),
                    '    http://git-scm.com/download',
                    '    msysGit (recommended for Windows'])
  },

  JAVA: {
    COMMAND: 'java',
    MSG: '\n'.join(['java JRE 1.6+ not installed.  Please install JRE from',
                    ('    http://www.oracle.com/technetwork/java/javase/'
                     'downloads/index.html')])
  },

  MERCURIAL: {
    COMMAND: 'hg',
    MSG: '\n'.join([('hg (Mercurial) not installed.  Please install the '
                     'command line tool from:'),
                    '    http://mercurial.selenic.com/downloads/',
                    ('    Mercurial 2.0 MSI Installer (recommended for '
                     'Windows)')])
  },

  SVN: {
    COMMAND: 'svn',
    MSG: '\n'.join([('svn not installed.  Please install the command line tool'
                     ' from'),
                    '    http://subversion.apache.org/packages.html',
                    '    Win32Svn (recommended for Windows'])
  }
}


def Verify(tools, verbose):
  verified = True

  if verbose:
    print 'Verifying required tools are present ...'

  for key in tools:
    command = tools[key][COMMAND]
    has_tool = GetExecutable(command)
    if not has_tool:
      verified = False
      print '[FAILED]  Missing required tool %s' % key
      print tools[key][MSG]

  if verbose and verified:
    print '[SUCCESS] All tools are present'

  return verified


def GetExecutable(executable, location=None):
  """Returns the path to the given executable or None if it is not found.

  This algorithm provides a reasonably accurate determination of whether or
  not the given executable is on the machine and can be used without knowing
  its full path.  An optional path can be added to the search.  The algorithm
  returns the path or None.

  Args:
    executable: The name of the executable (no path info). (string)
    location: Optional location to search for the tool. (string)

  Returns:
    The path to the executable or None. (string or None)
  """
  extensions = os.environ.get('PATHEXT', '').split(os.pathsep)
  paths = os.environ.get('PATH', '').split(os.pathsep)
  if location:
    paths.append(location)

  # Loop over every combination of path and file extension.
  for extension in extensions:
    for path in paths:
      full_path = os.path.join(path, '%s%s' % (executable, extension))
      if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
        return full_path

  return None
