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


"""Controls the svn dependency."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging

from builddefs.tools import base


COMMAND = 'svn'
HELP = '\n'.join([('svn not installed.  Please install a command line tool '
                   'from'),
                  '    http://subversion.apache.org/packages.html',
                  '    Win32Svn (recommended for Windows'])


class SvnError(base.ToolError):
  """Thrown when an error happens related to svn."""
  pass


class Svn(base.Tool):
  """Control the svn dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes svn with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      SvnError: Execution fails.
    """
    try:
      base.Tool._Execute(COMMAND, params, location, HELP)
    except base.ToolError:
      raise SvnError

  @staticmethod
  def Install(location=None):
    """OS specific and not supported, will give a message to help the user.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      SvnError: Install fails.
    """
    try:
      base.Tool._Install(COMMAND, location, Svn.IsInstalled, HELP)
    except base.ToolError:
      raise SvnError

  @staticmethod
  def IsInstalled(location=None):
    """Determine if svn is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not svn is installed.
    """
    return not not base.Tool._GetExecutable(COMMAND, location)

  @staticmethod
  def Uninstall(location=None):
    """Uninstalls svn.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      SvnError: Fails to uninstall svn.
    """
    try:
      base.Tool._Uninstall(COMMAND, location, Svn.IsInstalled)
    except base.ToolError:
      raise SvnError


if __name__ == '__main__':
  pass

