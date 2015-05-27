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


"""The build system command line flags."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


try:
  import argparse
except ImportError:
  print ('[FAILED]  Missing argparse.py library.  Should come standard with '
         '2.7 and 3.2+; Please download and add to python library path.')
  print '    http://code.google.com/p/argparse/downloads/list'
  print 'Build failed ... exiting.'
  exit()


CLEAN = 'clean'
DEPS = 'deps'
EXPUNGE = 'expunge'
EXTENSION_ONLY = 'extension_only'
QUIET = 'quiet'
RPF = 'rpf'
SERVER_ONLY = 'server_only'

ACTION = 'action'
DEFAULT = 'default'
REQUIRED = 'required'
HELP = 'help'

# Define information about each command and their options.
FLAGS = {
  CLEAN: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Remove all generated and output files.'
  },

  DEPS: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Download depenedencies only; no building.'
  },

  EXPUNGE: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Remove all generated, output files, and dependencies.'
  },

  EXTENSION_ONLY: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Only build the extension.'
  },

  QUIET: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Minimal build output.'
  },

  RPF: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Build RPF extension.'
  },

  SERVER_ONLY: {
    ACTION: 'store_true',
    DEFAULT: False,
    REQUIRED: False,
    HELP: 'Only build the server'
  }
}


def Process(flags):
  arg_parser = argparse.ArgumentParser(prog='bb')
  for key in flags:
    flag = flags[key]
    arg_parser.add_argument(('--%s' % key), dest=key, action=flag[ACTION],
                            default=flag[DEFAULT], required=flag[REQUIRED],
                            help=flag[HELP])

  return vars(arg_parser.parse_args())
