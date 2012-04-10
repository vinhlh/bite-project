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


import argparse


CLEAN = 'clean'
DEPS = 'deps'
EXPUNGE = 'expunge'
EXTENSION_ONLY = 'extension_only'
QUIET = 'quiet'
RPF = 'rpf'
SERVER_ONLY = 'server_only'

# Define information about each command and their options.
FLAGS = {
    CLEAN: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Remove all generated and output files.'
    },

    DEPS: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Download depenedencies only; no building.'
    },

    EXPUNGE: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Remove all generated, output files, and dependencies.'
    },

    EXTENSION_ONLY: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Only build the extension.'
    },

    QUIET: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Minimal build output.'
    },

    RPF: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Build RPF extension.'
    },

    SERVER_ONLY: {
      'action': 'store_true',
      'default': False,
      'required': False,
      'help': 'Only build the server'
    }
}


def Process(flags):
  arg_parser = argparse.ArgumentParser(prog='bb')
  for key in flags:
    flag = flags[key]
    arg_parser.add_argument(('--%s' % key), dest=key, action=flag['action'],
                            default=flag['default'], required=flag['required'],
                            help=flag['help'])

  return vars(arg_parser.parse_args())
