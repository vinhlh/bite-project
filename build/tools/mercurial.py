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


"""Controls the Mercurial dependency."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging

import base


COMMAND = 'hg'
HELP = '\n'.join([('hg (Mercurial) not installed.  Please install the command '
                   'line tool from:'),
                  '    http://mercurial.selenic.com/downloads/',
                  '    Mercurial 2.0 MSI Installer (recommended for Windows'])


class MercurialError(base.ToolError):
  """Thrown when an error happens related to Mercurial."""
  pass


class Mercurial(base.Tool):
  """Control the Mercurial dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes Mercurial with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      MercurialError: Execution fails.
    """
    try:
      base.Tool._Execute(COMMAND, params, location, HELP)
    except base.ToolError:
      raise MercurialError

  @staticmethod
  def Install(location=None):
    """OS specific and not supported, will give a message to help the user.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      MercurialError: Install fails.
    """
    try:
      base.Tool._Install(COMMAND, location, Mercurial.IsInstalled, HELP)
    except base.ToolError:
      raise MercurialError

  @staticmethod
  def IsInstalled(location=None):
    """Determine if Mercurial is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not Mercurial is installed. (boolean)
    """
    return not not base.Tool._GetExecutable(COMMAND, location)

  @staticmethod
  def Uninstall(location=None):
    """Uninstalls Mercurial.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      MercurialError: Fails to uninstall Mercurial.
    """
    try:
      base.Tool._Uninstall(COMMAND, location, Mercurial.IsInstalled)
    except base.ToolError:
      raise MercurialError
