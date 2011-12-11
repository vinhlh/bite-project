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

"""Controls the java dependency."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging

from builddefs.tools import base


COMMAND = 'java'
HELP = '\n'.join(['svn not installed.  Please install the JDK from',
                  ('    http://www.oracle.com/technetwork/java/javase/'
                   'downloads/index.html')])


class JavaError(base.ToolError):
  """Thrown when an error happens related to java."""
  pass


class Java(base.Tool):
  """Control the java dependency."""

  @staticmethod
  def Execute(params, location=None):
    """Executes java with the given parameters.

    Args:
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string)

    Raises:
      JavaError: Execution fails.
    """
    try:
      base.Tool._Execute(COMMAND, params, location, HELP)
    except base.ToolError:
      raise JavaError

  @staticmethod
  def Install(location=None):
    """OS specific and not supported, will give a message to help the user.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      JavaError: Install fails.
    """
    try:
      base.Tool._Install(COMMAND, location, Java.IsInstalled, HELP)
    except base.ToolError:
      raise JavaError

  @staticmethod
  def IsInstalled(location=None):
    """Determine if java is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not java is installed.
    """
    return not not base.Tool._GetExecutable(COMMAND, location)

  @staticmethod
  def Uninstall(location=None):
    """Uninstalls java.

    Args:
      location: Optional location to search for the tool. (string)

    Raises:
      JavaError: Fails to uninstall java.
    """
    try:
      base.Tool._Uninstall(COMMAND, location, Java.IsInstalled)
    except base.ToolError:
      raise JavaError


if __name__ == '__main__':
  pass

