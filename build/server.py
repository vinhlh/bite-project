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

import bundle
import deps as DEPS
import paths as PATHS


SERVER_ROOT = 'server'
JS_SRC = os.path.join(SERVER_ROOT, 'scripts')
SOY_SRC = os.path.join(SERVER_ROOT, 'scripts', 'soys')

SRC = bundle.SRC
DST = bundle.DST
TREE = bundle.TREE


class Server(bundle.Bundle):
  def __init__(self, deps, debug=True, deps_root='', src_root='', dst_root=''):
    bundle.Bundle.__init__(self, deps, debug, deps_root, src_root, dst_root)

  def CreateJsTargets(self, src_location, dst_location):
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


  def CreateSoyTargets(self, src_location, dst_location):
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


  def CreateCopyTargets(self, deps, deps_location, src_location, dst_location):
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
        SRC: os.path.join(deps_location, deps[DEPS.GDATA][ROOT], 'src',
                          'gdata'),
        DST: os.path.join(server_dst, 'gdata'),
        TREE: True
      },

      'urlnorm_src': {
        SRC: os.path.join(deps_location, deps[DEPS.URLNORM][ROOT],
                          'urlnorm.py'),
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
    js_targets = self.CreateJsTargets(src_location=src_location,
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


  def CreateClosureCompilerControls(self, deps, src_location, deps_location):
    return [
      '--root=%s' % os.path.join(src_location, JS_SRC),
      '--root=%s' % os.path.join(deps_location,
                                 deps[DEPS.CLOSURE_LIB][DEPS.ROOT]),
      '--root=%s' % os.path.join(deps_location, DEPS.GetSoyLibraryPath(deps)),
      '--root=%s' % os.path.join(deps_location, PATHS.GENFILES_ROOT, 'server'),
      '--root=%s' % os.path.join(deps_location, deps[DEPS.ATOMS][DEPS.ROOT])
    ]
