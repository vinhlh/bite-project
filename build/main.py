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


import os
import shutil

import clean
import deps as DEPS
import extension as EXTENSION
import flags as FLAGS
import paths as PATHS
import rpf as RPF
import server as SERVER
import tools


def Main():
  """The main entry point for the build system."""
  cmdline_flags = FLAGS.FLAGS
  args = FLAGS.Process(cmdline_flags)
  verbose = not args[FLAGS.QUIET]

  # Prioritized process of command line arguments
  if args[FLAGS.EXPUNGE]:
    clean_paths = clean.CLEAN_PATHS
    expunge_paths = clean.EXPUNGE_PATHS
    clean.RemovePaths(clean_paths.values() + expunge_paths.values())
    exit()
  elif args[FLAGS.CLEAN]:
    clean_paths = clean.CLEAN_PATHS
    clean.RemovePaths(clean_paths.values())
    exit()

  # Set up the directories that will be built into.
  output_paths = [PATHS.GENFILES_ROOT, PATHS.DEPS_ROOT]
  for path in output_paths:
    if not os.path.exists(path):
      os.mkdir(path)

  # Verify required tools
  req_tools = tools.TOOLS
  if not tools.Verify(req_tools, verbose):
    print 'Build failed ... exiting.'
    exit()
  if verbose:
    print ''

  # Verify and download dependencies
  deps = DEPS.CreateDeps()
  if not DEPS.VerifyAndDownload(deps, verbose):
    print 'Build failed ... exiting.'
    exit()
  if verbose:
    print ''

  if args[FLAGS.DEPS]: # Stop here if deps flag is given; only download deps.
    exit()

  # Remove outputs, so they will be created again.
  if os.path.exists(PATHS.OUTPUT_ROOT):
    shutil.rmtree(PATHS.OUTPUT_ROOT)
  os.mkdir(PATHS.OUTPUT_ROOT)

  # T T -> Build
  # T F -> Build
  # F T -> No build
  # F F -> Build
  if args[FLAGS.EXTENSION_ONLY] or not args[FLAGS.SERVER_ONLY]:
    extension = EXTENSION.Extension(deps, debug=True, deps_root='',
                                    src_root='', dst_root='')
    extension.Construct(verbose, deps,
                        start_msg='Creating extension bundle ...',
                        fail_early=True,
                        deps_root='')

  # T T -> No build
  # T F -> No build
  # F T -> Build
  # F F -> Build
  if not args[FLAGS.EXTENSION_ONLY]:
    server = SERVER.Server(deps, debug=True, deps_root='', src_root='',
                           dst_root='')
    server.Construct(verbose, deps,
                     start_msg='Creating server bundle ...',
                     fail_early=True,
                     deps_root='')

  if args[FLAGS.RPF]:
    rpf = RPF.RPF(deps, debug=True, deps_root='', src_root='', dst_root='')
    rpf.Construct(verbose, deps,
                  start_msg='Creating RPF extension bundle ...',
                  fail_early=True,
                  deps_root='')
