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
import deps
#import extension
import flags
import paths
import server
import tools


def Main():
  """The main entry point for the build system."""
  cmdline_flags = flags.FLAGS
  args = flags.Process(cmdline_flags)
  verbose = not args[flags.QUIET]

  # Prioritized process of command line arguments
  if args[flags.EXPUNGE]:
    clean_paths = clean.CLEAN_PATHS
    expunge_paths = clean.EXPUNGE_PATHS
    clean.RemovePaths(clean_paths.values() + expunge_paths.values())
    exit()
  elif args[flags.CLEAN]:
    clean.RemovePaths(clean.CLEAN_PATHS)
    exit()

  # Set up the directories that will be built into.
  output_paths = [paths.GENFILES_ROOT, paths.DEPS_ROOT]
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
  req_deps = deps.CreateDeps()
  if not deps.VerifyAndDownload(req_deps, verbose):
    print 'Build failed ... exiting.'
    exit()
  if verbose:
    print ''

  if args[flags.DEPS]: # Stop here if deps flag is given; only download deps.
    exit()

  # Remove outputs, so they will be created again.
  if os.path.exists(paths.OUTPUT_ROOT):
    shutil.rmtree(paths.OUTPUT_ROOT)
  os.mkdir(paths.OUTPUT_ROOT)

  # T T -> Build
  # T F -> Build
  # F T -> No build
  # F F -> Build
  if args[flags.EXTENSION_ONLY] or not args[flags.SERVER_ONLY]:
    # Build extension
    #extension.Build(verbose)
    pass

  # T T -> No build
  # T F -> No build
  # F T -> Build
  # F F -> Build
  if not args[flags.EXTENSION_ONLY]:
    server.Construct(verbose)


if __name__ == '__main__':
  Main()
