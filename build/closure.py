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


"""Functionality related to the closure and soy compilers."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import sys
import utils

import deps as DEPS


def CreateCssFlags():
  return [
    '--add_copyright',
    '--allow_unrecognized_functions',
    '--allowed_non_standard_function=color-stop',
    '--allowed_non_standard_pseudo_type=nth-child',
    '--allowed_non_standard_function=-moz-linear-gradient',
    '--allowed_non_standard_function=-webkit-gradient',
    '--allowed_non_standard_function=from',
    '--allowed_non_standard_function=to',
    '--allowed_non_standard_function=alpha',
    '--allow_ie_function_syntax',
    '--allow_unrecognized_pseudo_types',
    '--simplify_css',
    '--eliminate_dead_styles',
  ]


def CreateClosureCompilerCommand(deps, flags, controls, deps_location=''):
  builder = os.path.join(deps_location, deps[DEPS.CLOSURE_LIB][DEPS.ROOT],
                         'closure', 'bin', 'build', 'closurebuilder.py')

  compiler = deps[DEPS.CLOSURE_COMPILER][DEPS.ROOT]
  if deps_location:
    compiler = os.path.join(deps_location, compiler)

  command_base = [sys.executable,
                  builder,
                  '--output_mode=compiled',
                  '--compiler_jar=%s' % compiler,
                  '--input=%(input)s',
                  '--output_file=%(output)s']
  return ' '.join(command_base + controls + flags)


def CreateClosureCompilerFlags(deps, debug=True, deps_location=''):
  deps_src = os.path.join(deps_location, deps[DEPS.CLOSURE_LIB][DEPS.ROOT],
                          'closure', 'goog', 'deps.js')

  debug = [
    '--compiler_flags=--formatting=pretty_print',
    '--compiler_flags=--generate_exports',
    '--compiler_flags=--js=%s' % deps_src
  ]

  prod = [
  ]

  if debug:
    compile_level = debug
  else:
    compile_level = prod

  return compile_level + [
    #'--compiler_flags=--aggressive_var_check_level=ERROR',
    #'--compiler_flags=--check_global_names_level=ERROR',
    '--compiler_flags=--jscomp_error=accessControls',
    '--compiler_flags=--jscomp_error=ambiguousFunctionDecl',
    '--compiler_flags=--jscomp_error=checkRegExp',
    '--compiler_flags=--jscomp_error=checkTypes',
    '--compiler_flags=--jscomp_error=checkVars',
    '--compiler_flags=--jscomp_error=constantProperty',
    '--compiler_flags=--jscomp_error=deprecated',
    '--compiler_flags=--jscomp_error=fileoverviewTags',
    '--compiler_flags=--jscomp_error=globalThis',
    '--compiler_flags=--jscomp_error=invalidCasts',
    '--compiler_flags=--jscomp_error=missingProperties',
    '--compiler_flags=--jscomp_error=nonStandardJsDocs',
    '--compiler_flags=--jscomp_error=strictModuleDepCheck',
    '--compiler_flags=--jscomp_error=undefinedVars',
    '--compiler_flags=--jscomp_error=unknownDefines',
    '--compiler_flags=--jscomp_error=visibility'
  ]


def CreateSoyCompilerCommand(deps, flags, deps_location=''):
  compiler = os.path.join(deps_location,
                          deps[DEPS.CLOSURE_SOY_COMPILER][DEPS.ROOT])

  return ' '.join(['java -jar %s' % compiler] + flags +
                  ['--outputPathFormat %(output)s',
                   '%(input)s'])


def CreateSoyCompilerFlags():
  return [
    '--shouldProvideRequireSoyNamespaces',
    '--shouldGenerateJsdoc'
  ]


def CompileScript(src, dst, command, on_complete=None, force_compile=False):
  """Compile a script based on the given input file.

  Args:
    src: The target source file to be compiled. (string)
    dst: The file to create. (string)
    command: The compile command to use.

  Returns:
    The process which actually is executing the command.
  """
  # For speed, only compile the script if it is not already compiled.
  if not force_compile and os.path.exists(dst):
    return None

  if os.path.exists(dst):
    os.remove(dst)

  data = {'input': src, 'output': dst}
  return utils.ExecuteCommand(command % data, on_complete=on_complete,
                              no_wait=True)


class OnComplete:
  def __init__(self, src, dst, verbose, fail_early):
    self.src = src
    self.dst = dst
    self.verbose = verbose
    self.fail_early = fail_early

  def __call__(self, success, out):
    try:
      if success and os.path.exists(self.dst):
        print '[SUCCESS] Compiling %s' % self.src
      else:
        raise Exception
    except Exception:
      if os.path.exists(self.dst):
        os.remove(self.dst)

      print '[FAILED]  Compiling %s' % self.src
      if out:
        print out
        print ''

      if self.fail_early:
        exit()
