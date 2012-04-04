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


"""Controls the git dependency."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging

import base


COMMAND = 'git'
HELP = '\n'.join([('git not installed.  Please install a command line tool '
                   'from'),
                  '    http://git-scm.com/download',
                  '    msysGit (recommended for Windows'])


class GitError(base.ToolError):
  """Thrown when an error happens related to git."""
  pass


class Git(base.Tool):
  """Control the git dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes git with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      GitError: Execution fails.
    """
    try:
      base.Tool._Execute(COMMAND, params, location, HELP)
    except base.ToolError:
      raise GitError

  @staticmethod
  def Install(location=None):
    """OS specific and not supported, will give a message to help the user.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      GitError: Install fails.
    """
    try:
      base.Tool._Install(COMMAND, location, Git.IsInstalled, HELP)
    except base.ToolError:
      raise GitError

  @staticmethod
  def IsInstalled(location=None):
    """Determine if git is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not git is installed.
    """
    return not not base.Tool._GetExecutable(COMMAND, location)

  @staticmethod
  def Uninstall(location=None):
    """Uninstalls git.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      GitError: Fails to uninstall git.
    """
    try:
      base.Tool._Uninstall(COMMAND, location, Git.IsInstalled)
    except base.ToolError:
      raise GitError


if __name__ == '__main__':
  git = Git()
  print git.IsInstalled()
