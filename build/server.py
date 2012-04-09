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


"""Constructs the server bundle."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import shutil
import time

import closure
import deps as DEPS
import paths as PATHS
import utils


SERVER_ROOT = 'server'
JS_SRC = os.path.join(SERVER_ROOT, 'scripts')
SOY_SRC = os.path.join(SERVER_ROOT, 'scripts', 'soys')

SRC = 'src'
DST = 'dst'
TREE = 'tree'


def CreateJsTargets(src_location='', dst_location=''):
  src_root = os.path.join(src_location, JS_SRC)
  dst_root = os.path.join(dst_location, PATHS.GENFILES_ROOT, 'server')

  names = [
    'url_parser',
    'store_edit',
    'store_view',
    'result_table'
  ]

  targets = {}
  for name in names:
    targets[name] = {
      SRC: os.path.join(src_root, '%s.js' % name),
      DST: os.path.join(dst_root, '%s_script.js' % name)
    }

  return targets


def CreateSoyTargets(src_location='', dst_location=''):
  src_root = os.path.join(src_location, SOY_SRC)
  dst_root = os.path.join(dst_location, PATHS.GENFILES_ROOT, 'server')

  names = [
    'explore_page',
    'set_details_page',
    'result_page',
    'run_details_settings',
    'run_details_results',
    'run_details_overview',
    'run_details_page',
    'set_details_runs',
    'project_details_page',
    'store'
  ]

  targets = {}
  for name in names:
    targets[name] = {
      SRC: os.path.join(src_root, '%s.soy' % name),
      DST: os.path.join(dst_root, '%s.soy.js' % name)
    }

  return targets


def CreateCopyTargets(deps, deps_location='', genfiles_location='',
                      src_location='', dst_location=''):
  genfiles_root = os.path.join(genfiles_location, PATHS.GENFILES_ROOT)
  server_src = os.path.join(src_location, SERVER_ROOT)
  server_dst = os.path.join(dst_location, PATHS.SERVER_DST)
  tools_src = src_location or ''
  common_src = src_location or ''

  ROOT = DEPS.ROOT

  targets = {
    'server_src': {
      SRC: server_src,
      DST: server_dst,
      TREE: True
    },

    'bugs_src': {
      SRC: os.path.join(tools_src, 'tools', 'bugs', 'server', 'appengine'),
      DST: os.path.join(server_dst, 'bugs'),
      TREE: True
    },

    'common_src': {
      SRC: os.path.join(common_src, 'common', 'server', 'appengine'),
      DST: os.path.join(server_dst, 'common'),
      TREE: True
    },

    'gdata_src': {
      SRC: os.path.join(deps_location, deps[DEPS.GDATA][ROOT],'src', 'gdata'),
      DST: os.path.join(server_dst, 'gdata'),
      TREE: True
    },

    'urlnorm_src': {
      SRC: os.path.join(deps_location, deps[DEPS.URLNORM][ROOT], 'urlnorm.py'),
      DST: os.path.join(server_dst, 'third_party', 'urlnorm.py'),
      TREE: False
    },

    'mrtaskman_src': {
      SRC: os.path.join(deps_location, deps[DEPS.MRTASKMAN][ROOT], 'server',
                        'util'),
      DST: os.path.join(server_dst, 'util'),
      TREE: True
    },
  }

  # Add in known compiled JavaScript files.
  js_targets = CreateJsTargets(src_location=src_location,
                               dst_location=dst_location)
  for target_name in js_targets:
    name = '%s_script' % target_name
    filename = '%s.js' % name
    targets[name] = {
      SRC: js_targets[target_name][DST],
      DST: os.path.join(server_dst, 'scripts', filename),
      TREE: False
    }

  return targets


def CreateClosureCompilerControls(deps, src_location='', deps_location=''):
  return [
    '--root=%s' % os.path.join(src_location, JS_SRC),
    '--root=%s' % os.path.join(deps_location,
                               deps[DEPS.CLOSURE_LIB][DEPS.ROOT]),
    '--root=%s' % os.path.join(deps_location, DEPS.GetSoyLibraryPath(deps)),
    '--root=%s' % os.path.join(deps_location, PATHS.GENFILES_ROOT, 'server'),
    '--root=%s' % os.path.join(deps_location, deps[DEPS.ATOMS][DEPS.ROOT]),
  ]


def Construct(copy_targets, js_targets, soy_targets, soy_compile_command,
              closure_compile_command, verbose, fail_early=True):
  print 'Creating server bundle ...'

  current_time = time.time()

  _CompileTargets(soy_compile_command, soy_targets, verbose,
                  fail_early=fail_early, indent=2,
                  start_msg='Compiling soy templates ...')
  _CompileTargets(closure_compile_command, js_targets, verbose,
                  fail_early=fail_early, indent=2,
                  start_msg='Compiling JavaScript files ...')

  if verbose:
    print '%sCopying target library and files ...' % utils.GetIndentString(2)

  for target_name in copy_targets:
    target = copy_targets[target_name]
    src = target[SRC]
    dst = target[DST]
    isTree = target[TREE]

    if isTree:
      shutil.copytree(src, dst)
    else:
      shutil.copyfile(src, dst)

  if verbose:
    s = utils.GetIndentString(2)
    print '%s[SUCCESS] Bundle construction complete.' % s

  print 'Total time elapsed %s (s)' % (time.time() - current_time)
  if verbose:
    print ''


def _CompileTargets(command, targets, verbose, fail_early, indent=0,
                    start_msg=None):
  indent_string = utils.GetIndentString(indent)

  # List of processes not yet completed (when added to list).
  ps = []

  # Start compile process for each target and append it to ps if no_wait is
  # True.  no_wait means the processes will run simultaneously as possible.
  # For each process with no_wait == False, they will be completed immediately
  # so no need to wait for them.
  for target_name in targets:
    src = targets[target_name][SRC]
    dst = targets[target_name][DST]

    # Ensure the directory structure exists for the destination file.
    (path, _) = os.path.split(dst)
    if not os.path.exists(path):
      os.makedirs(path)

    # Callback once the compile process completes.  Used in asynchronous build
    # environment.
    on_complete = closure.OnComplete(src, dst, verbose, fail_early=False,
                                     indent=indent)

    # Start compile process
    cs = closure.CompileScript(src, dst, command, on_complete)
    # Only add process to ps if it is not done.
    if cs is not None and cs[utils.SUCCESS] is None:
      ps.append(cs)
    # If compiling fails and fail_early is true then kill all currently pending
    # processes and exit.
    elif fail_early and cs is not None and not cs[utils.SUCCESS]:
      for p in ps:
        utils.KillSubprocess(p)
      exit()

  if verbose and len(ps) and start_msg is not None:
    print '%s%s' % (indent_string, start_msg)

  # Wait for all compile processes to finish and check for failure.
  if not utils.WaitUntilSubprocessesFinished(ps, fail_early=fail_early):
    if fail_early:
      exit()

  if verbose and len(ps) and start_msg is not None:
    print ''
