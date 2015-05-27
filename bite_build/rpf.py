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


"""Constructs the RPF bundle."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os

import bundle
import deps as DEPS
import paths as PATHS


SRC = bundle.SRC
DST = bundle.DST
TREE = bundle.TREE

GENFILES_ROOT = os.path.join(PATHS.GENFILES_ROOT, 'rpf')


class RPF(bundle.Bundle):
  def __init__(self, deps, debug=True, deps_root='', src_root='', dst_root=''):
    bundle.Bundle.__init__(self, deps, debug, deps_root, src_root, dst_root)

  def CreateJsTargets(self, src_location, dst_location):
    dst_root = os.path.join(dst_location, GENFILES_ROOT)

    return {
      'background': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'base',
                          'background.js'),
        DST: os.path.join(dst_root, 'background_script.js')
      },

      'getactioninfo': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'libs',
                          'getactioninfo.js'),
        DST: os.path.join(dst_root, 'getactioninfo_script.js')
      },

      'console': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'libs',
                          'console.js'),
        DST: os.path.join(dst_root, 'console_script.js')
      },

      'elementhelper': {
        SRC: os.path.join(src_location, 'common', 'extension', 'dom',
                          'elementhelper.js'),
        DST: os.path.join(dst_root, 'elementhelper_script.js')
      },

      'popup': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'src', 'base',
                          'popup.js'),
        DST: os.path.join(dst_root, 'popup_script.js')
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

    targets = {
      'manifest': {
        SRC: os.path.join(src_location, PATHS.RPF_ROOT, 'manifest.json'),
        DST: os.path.join(dst_root, 'manifest.json'),
        TREE: False
      },

      'images': {
        SRC: os.path.join(src_location, 'extension', 'imgs'),
        DST: os.path.join(dst_location, PATHS.RPF_IMGS_DST),
        TREE: True
      },

      'analytics': {
        SRC: os.path.join(src_location, 'common', 'extension', 'analytics',
                          'analytics.js'),
        DST: os.path.join(dst_root, 'analytics.js'),
        TREE: False
      },

      # 'ace': {
      #   SRC: os.path.join(deps_location, deps[DEPS.ACE][DEPS.ROOT], 'build',
      #                     'src'),
      #   DST: os.path.join(dst_root, 'ace'),
      #   TREE: True
      # }

      ## map directory to this
      'ace': {
        SRC: os.path.join(deps_location, deps[DEPS.ACE][DEPS.ROOT], 'lib', 'ace'),
        DST: os.path.join(dst_root, 'ace'),
        TREE: True
      }

    }

    # Styles
    names = ['consoles', 'options', 'popup', 'rpf_console']
    src_root = os.path.join(src_location, 'extension', 'styles')
    dst_root = os.path.join(dst_location, PATHS.RPF_STYLES_DST)
    bundle.AddTargets(names, targets, src_root, dst_root, '.css', '.css',
                      '_css')
    names = ['recordmodemanager']
    src_root = os.path.join(src_location, PATHS.RPF_ROOT, 'styles')
    bundle.AddTargets(names, targets, src_root, dst_root, '.css', '.css',
                      '_css')

    # HTML
    names = ['background', 'popup']
    src_root = os.path.join(src_location, 'extension', 'html')
    dst_root = os.path.join(dst_location, PATHS.RPF_DST)
    bundle.AddTargets(names, targets, src_root, dst_root, '.html', '.html',
                      '_html')
    names = ['options']
    src_root = os.path.join(src_location, 'extension', 'src', 'options')
    bundle.AddTargets(names, targets, src_root, dst_root, '.html', '.html',
                      '_html')
    names = ['console']
    src_root = os.path.join(src_location, PATHS.RPF_ROOT, 'html')
    bundle.AddTargets(names, targets, src_root, dst_root, '.html', '.html',
                      '_html')

    # Add in known compiled JavaScript files.
    js_targets = self.CreateJsTargets(src_location=src_location,
                                      dst_location=dst_location)
    for target_name in js_targets:
      name = '%s_script' % target_name
      filename = '%s.js' % name
      dst = os.path.join(dst_root, filename)

      targets[name] = {
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
                                 'rpf'),
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
