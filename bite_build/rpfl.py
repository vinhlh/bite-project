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


"""Constructs the RPFL bundle."""

__author__ = 'VinhLH'


import os

import bundle
import deps as DEPS
import paths as PATHS


SRC = bundle.SRC
DST = bundle.DST
TREE = bundle.TREE

GENFILES_ROOT = os.path.join(PATHS.GENFILES_ROOT, 'rpf_lib')


class RPFL(bundle.Bundle):
  def __init__(self, deps, debug=True, deps_root='', src_root='', dst_root=''):
    bundle.Bundle.__init__(self, deps, debug, deps_root, src_root, dst_root)

  def CreateJsTargets(self, src_location, dst_location):
    dst_root = os.path.join(dst_location, GENFILES_ROOT)

    return {
      ## custom build to extract the framework
      'rpf.content': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'libs',
                          'getactioninfo.js'),
        DST: os.path.join(dst_root, 'rpf.content.js')
      },

      'rpf.background': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'base',
                          'rpf_utils.js'),
        DST: os.path.join(dst_root, 'rpf.background.js')
      }

    }


  def CreateSoyTargets(self, src_location, dst_location):
    dst_root = os.path.join(dst_location, GENFILES_ROOT)

    targets = {
      'common_ux': {
        SRC: os.path.join(src_location, 'common', 'extension', 'ux',
                          'common_ux.soy'),
        DST: os.path.join(dst_root, 'common_ux.soy.js')
      }
    }

    names = ['popup', 'rpfconsole', 'rpf_dialogs', 'locatorsupdater']
    src_root = os.path.join(src_location, PATHS.RPF_ROOT, 'templates')
    bundle.AddTargets(names, targets, src_root, dst_root, '.soy', '.soy.js')

    return targets

  def CreateCopyTargets(self, deps, deps_location, src_location, dst_location):
    dst_root = os.path.join(dst_location, PATHS.RPF_DST)
    targets = {}

    js_targets = self.CreateJsTargets(src_location=src_location,
                                      dst_location=dst_location)
    for target_name in js_targets:
      filename = '%s.js' % target_name
      dst = os.path.join(dst_root, filename)

      targets[target_name] = {
        SRC: js_targets[target_name][DST],
        DST: dst,
        TREE: False
      }

    return targets


  def CreateClosureCompilerControls(self, deps, src_location, deps_location):
    return [
      '--root=%s' % os.path.join(src_location, 'common', 'extension'),
      '--root=%s' % os.path.join(src_location, PATHS.RPF_ROOT, 'src'),
      '--root=%s' % os.path.join(deps_location,
                                 deps[DEPS.CLOSURE_LIB][DEPS.ROOT]),
      '--root=%s' % os.path.join(deps_location, DEPS.GetSoyLibraryPath(deps)),
      '--root=%s' % os.path.join(deps_location, PATHS.GENFILES_ROOT,
                                 'rpf_lib'),
      '--root=%s' % os.path.join(deps_location, deps[DEPS.ATOMS][DEPS.ROOT]),
      # add this dep
      '--root=%s' % os.path.join(deps_location, deps[DEPS.WGXPATH][DEPS.ROOT]),

      '--compiler_flags=--externs=%s' % os.path.join(src_location,
          'common', 'extension', 'externs', 'closure.js'),
      '--compiler_flags=--externs=%s' % os.path.join(src_location,
          'common', 'extension', 'externs', 'chrome_extensions.js'),
      '--compiler_flags=--externs=%s' % os.path.join(src_location,
          'common', 'extension', 'externs', 'rpf_externs.js'),
      '--compiler_flags=--externs=%s' % os.path.join(src_location,
          'common', 'extension', 'externs', 'ace_externs.js')
    ]
