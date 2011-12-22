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


"""The build system root.

Main handles processing of the command line and maps commands to functionality.
"""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


from build import build
from build import clean


class Error(Exception):
  """Handles errors when processing input arguments."""
  pass


class HelpBinding(object):
  """A functor that defines a mapping of a function and its first parameter.

  Attributes:
    param1: The first parameter in the functor. (dict)
  """
  def __init__(self, obj, func):
    """Constructs a new functor.

    Args:
      obj: The object to use for the first parameter in the functor. (dict)
      func: The function to map the parameter to when called. (function)
    """
    self.param1 = obj
    self.func = func

  def Exec(self):
    """Executes the mapped function with the given parameter."""
    self.func(self.param1)


# Output formatting information.
USAGE_FORMAT = '{0:20}'

# Commands used by the build script.
COMMAND_BUILD = 'build'
COMMAND_CLEAN = 'clean'
COMMAND_HELP = 'help'

# Command options.
OPTION_ALL = 'all'
OPTION_EXPUNGE = 'expunge'
OPTION_EXTENSION = 'extension'
OPTION_SERVER = 'server'
OPTION_SERVER_APPENGINE = 'server_appengine'

# Command/option map keywords
HELP = 'help'
OPTION_HELP = 'option_help'
OPTION_MAP = 'option_map'

# Define information about each command and their options.
COMMAND_MAP = {
    COMMAND_BUILD: {
        HELP: 'Build the given target(s).',
        OPTION_HELP: {
            OPTION_ALL: 'Build all targets listed in this help.',
            OPTION_EXTENSION: 'Build the extension.',
            OPTION_SERVER: 'Build the server (default variant).',
            OPTION_SERVER_APPENGINE: 'Build the server (AppEngine variant).'
        },
        OPTION_MAP: {
            OPTION_ALL: build.All,
            OPTION_EXTENSION: build.Extension,
            OPTION_SERVER: build.Server,
            OPTION_SERVER_APPENGINE: build.ServerAppEngine
        }
    },
    COMMAND_CLEAN: {
        HELP: 'Build the given target(s).',
        OPTION_HELP: {
            OPTION_ALL: 'Remove all build targets',
            OPTION_EXTENSION: 'Remove extension.',
            OPTION_EXPUNGE: 'Removes all targets and dependencies.'
            OPTION_SERVER: 'Remove the server (default variant).',
            OPTION_SERVER_APPENGINE: 'Remove the server (AppEngine variant).'
        },
        OPTION_MAP: {
            OPTION_ALL: clean.All,
            OPTION_EXTENSION: clean.Extension,
            OPTION_EXPUNGE: clean.Expunge,
            OPTION_SERVER: clean.Server,
            OPTION_SERVER_APPENGINE: clean.ServerAppEngine
        }
    },
    COMMAND_HELP: {
        HELP: 'Displays usage for given command',
        OPTION_HELP: {},
        OPTION_MAP: {
            '': MainUsage,
            COMMAND_BUILD: HelpBinding(COMMAND_BUILD, CommandUsage).Exec,
            COMMAND_CLEAN: HelpBinding(COMMAND_CLEAN, CommandUsage).Exec
        }
    }
}


def DisplayUsage(usage, heading, help_map):
  """Displays the usage message followed by a mapping help info.

  Args:
    usage: The main usage statement to display. (string)
    heading: The heading to put above the help info. (string)
    help_map: The map of value to help message to display. (dict)
  """
  print(usage)
  print('')  # Space out usage message and help info.
  print('Available %s:' % heading)
  for key in help_map:
    print('  %s %s' % (USAGE_FORMAT.format(key), help_map[key])


def MainUsage():
  """Displays how to use the build system."""
  info = {}
  for key in COMMAND_MAP:
    info[key] = COMMAND_MAP[key][HELP]
  DisplayUsage('Usage: python build.py <command> <option>', 'commands', info)


def CommandUsage(command):
  """Displays how to use the specified command.

  Args:
    command: The command to display. (string)
  """
  DisplayUsage('Usage: python build.py %s <options>' % command, 'options',
               COMMAND_MAP[command][OPTION_HELP])


def Main(args):
  """The main entry point for the build system.

  Args:
    args: The list or arguments supplied to the program. (list of string)
  """
  try:
    if len(args) == 1:
      raise Error
    if len(args) == 2:
      args.append('')  # Default option.
    elif len(args) > 3:
      print('Invalid number of arguments given.\n')
      raise Error
    elif args[1] not in COMMAND_MAP:
      print('Invalid command (%s) given.\n' % args[1])
      raise Error
    elif args[2] not in COMMAND_MAP[args[1]][OPTION_MAP]:
      print('Invalid option (%s) given for command (%s).\n' %
            (args[2], args[1]))
      raise Error
  except Error:
    Usage()
    sys.exit()

  command_name = args[1]
  option_name = args[2]
  command = COMMAND_MAP[command_name][OPTION_MAP][option_name]
  command()
