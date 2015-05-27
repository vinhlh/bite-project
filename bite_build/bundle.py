#!/usr/bin/python
#
# Copyright 2011 Google Inc. All Rights Reserved.
#
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


"""Underlying bundle functionality."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import shutil
import time

import closure
import deps as DEPS
import paths as PATHS
import utils


SRC = 'src'
DST = 'dst'
TREE = 'tree'


class Bundle(object):
  def __init__(self, deps, debug, deps_root, src_root, dst_root):
    """Create a bundler object.

    Args:
      deps: A set of dependencies used by BITE. (dict)
      debug: Whether or not the build is in debug or prod mode. (boolean)
      deps_root: The root directory for dependencies. (string)
      src_root: The root directory to search for source material. (string)
      dst_root: The root directory the output folder belongs in. (string)
    """
    self.SetDebug(debug, deps, deps_root) # Array - set compiler flags
    self.soy_flags = closure.CreateSoyCompilerFlags() # Array

    self.js_targets = self.CreateJsTargets(src_root, dst_root) # Dict
    self.soy_targets = self.CreateSoyTargets(src_root, dst_root) # Dict
    self.copy_targets = self.CreateCopyTargets(deps, deps_root, src_root,
                                               dst_root) # Dict
    # Array
    self.compiler_controls = self.CreateClosureCompilerControls(deps,
                                                                src_root,
                                                                deps_root)

  def SetDebug(self, debug, deps, deps_root=''):
    """Resets compiler flags to origin set with the new debug value."""
    self.compiler_flags = closure.CreateClosureCompilerFlags(deps, debug=debug,
        deps_location=deps_root)

  def AddCompilerControls(self, controls_array):
    self.compiler_controls = self.compiler_controls + controls_array

  def AddCompilerFlags(self, flags_array):
    self.compiler_flags = self.compiler_flags + flags_array

  def AddSoyFlags(self, flags_array):
    self.soy_flags = self.soy_flags + flags_array

  def AddJsTargets(self, targets_dict):
    for target_name in targets_dict:
      self.js_targets[target_name] = targets_dict[target_name]

  def AddSoyTargets(self, targets_dict):
    for target_name in targets_dict:
      self.soy_targets[target_name] = targets_dict[target_name]

  def AddCopyTargets(self, targets_dict):
    for target_name in targets_dict:
      self.copy_targets[target_name] = targets_dict[target_name]

  def Construct(self, verbose, deps, start_msg=None, fail_early=True,
                deps_root=''):
    if start_msg is not None:
      print start_msg

    # Prepare data
    soy_command = closure.CreateSoyCompilerCommand(deps, self.soy_flags,
                                                   deps_location=deps_root)
    compiler_command = closure.CreateClosureCompilerCommand(deps,
        self.compiler_flags, self.compiler_controls, deps_location=deps_root)

    # Start bundling process
    current_time = time.time()

    _CompileTargets(soy_command, self.soy_targets, verbose,
                    fail_early=fail_early, indent=2,
                    start_msg='Compiling soy templates ...')
    _CompileTargets(compiler_command, self.js_targets, verbose,
                    fail_early=fail_early, indent=2,
                    start_msg='Compiling JavaScript files ...')

    if verbose:
      print '%sCopying target library and files ...' % utils.GetIndentString(2)

    for target_name in self.copy_targets:
      target = self.copy_targets[target_name]
      src = target[SRC]
      dst = target[DST]
      isTree = target[TREE]

      (path, _) = os.path.split(dst)
      if path and not os.path.exists(path):
        os.makedirs(path)

      if isTree:
        shutil.copytree(src, dst)
      else:
        shutil.copy2(src, dst)

    if verbose:
      s = utils.GetIndentString(2)
      print '%s[SUCCESS] Bundle construction complete.' % s

    print 'Total time elapsed %s (s)' % (time.time() - current_time)
    if verbose:
      print ''

  def CreateJsTargets(self, src_location, dst_location):
    return {}

  def CreateSoyTargets(self, src_root, dst_root):
    return {}

  def CreateCopyTargets(self, deps, deps_root, src_root, dst_root):
    return {}

  def CreateClosureCompilerControls(self, deps, src_root, deps_root):
    return []


def AddTargets(names, targets, src_root, dst_root, src_ext, dst_ext,
               name_ext=''):
  for name in names:
    targets['%s%s' % (name, name_ext)] = {
      SRC: os.path.join(src_root, '%s%s' % (name, src_ext)),
      DST: os.path.join(dst_root, '%s%s' % (name, dst_ext)),
      TREE: False
    }


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
