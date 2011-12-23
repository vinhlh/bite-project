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


"""Interface for managing tools used by the build system."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging
import os
import subprocess


class ToolError(Exception):
  """Thrown when an error happens while using a tool."""
  pass


class Tool(object):
  """The base class for tools used within the build system."""

  # Public Functions
  @staticmethod
  def Execute(params, location=None):
    """Executes the tool with the given parameters.

    Args:
      params: Arguments supplied to the tool. (list of strings)
      location: Optional location to search for the tool. (string)
    """
    logging.error('Tool.Execute is not defined.')
    raise ToolError

  @staticmethod
  def Install(location=None):
    """Install the tool.

    Install the tool.

    Args:
      location: Optional location to search for the tool. (string)
    """
    logging.error('Tool.Install is not defined.')
    raise ToolError

  @staticmethod
  def IsInstalled(location=None):
    """Determine if the tool is installed.

    Args:
      location: Optional location to search for the tool. (string)

    Returns:
      Whether or not the tool is installed.
    """
    logging.error('Tool.IsInstalled is not defined.')
    raise ToolError

  @staticmethod
  def Uninstall(location=None):
    """Uninstall the tool.

    Args:
      location: Optional location to search for the tool. (string)
    """
    loggin.error('Uninstall not defined.')
    raise ToolError

  # Protected Helper Functions
  @staticmethod
  def _Execute(executable, params, location, help):
    """Executes the given tool with the given parameters.

    Args:
      executable: The name of the executable. (string)
      params: Arguments supplied to the compiler. (list of strings)
      location: Optional location to search for the tool. (string or None)
      help: Help message to be displayed upon error. (string)

    Raises:
      ToolError: Execution fails.
    """
    executable = Tool._GetExecutable(executable, location)
    if not executable:
      logging.error('Execution failed; %s not installed.' % executable)
      print(help)
      raise ToolError

    command = '%s %s' % (executable, ' '.join(params))
    try:
      Tool._ExecuteCommand(command)
    except ToolError:
      logging.error('%s failed to execute:\n    %s.' % (executable, command))
      raise ToolError

  @staticmethod
  def _ExecuteCommand(command):
    """Execute the given command and return the output.

    Args:
      command: The command to execute. (string)

    Raises:
      ToolError: If the execution results are not zero.
    """
    print('Running command: %s' % command)
    process = subprocess.Popen(command.split(' '),
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    results = process.communicate()
    if process.returncode:
      logging.error(results[1])
      raise ToolError

  @staticmethod
  def _GetExecutable(executable, location=None):
    """Returns the path to the given executable or None if it is not found.

    This algorithm provides a reasonably accurate determination of whether or
    not the given executable is on the machine and can be used without knowing
    its full path.  An optional path can be added to the search.  The algorithm
    returns the path or None.

    Args:
      executable: The name of the executable (no path info).(string)
      location: Optional location to search for the tool. (string)

    Returns:
      The path to the executable or None. (string)
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

  @staticmethod
  def _Install(executable, location, is_installed, help):
    """OS specific and not supported, will give a message to help the user.

    Args:
      executable: The name of the executable. (string)
      location: Optional location to search for the tool. (string or None)
      is_installed: Function called to determine if the executable is
          installed. (function)
      help: Help message to be displayed upon error. (string)

    Raises:
      ToolError: Install fails.
    """
    if not is_installed(location):
      logging.error('Unable to install %s.' % executable)
      print(help)
      raise ToolError

  @staticmethod
  def _Uninstall(executable, location, is_installed):
    """Uninstalls svn.

    Args:
      executable: The name of the executable. (string)
      location: Optional location to search for the tool. (string or None)
      is_installed: Function called to determine if the executable is
          installed. (function)

    Raises:
      ToolError: Fails to uninstall svn.
    """
    if is_installed(location):
      logging.error('Unable to uninstall %s.' % executable)
      raise ToolError


if __name__ == '__main__':
  pass

