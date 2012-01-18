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


"""Build the RPF Extension."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jason.stredwick@gmail.com (Jason Stredwick)',
              'phu@google.com (Po Hu)')

from buildhelper import *
import logging
import optparse
import os
import shutil
import subprocess
import sys
import time
import urllib
import zipfile


COMPILE_CLOSURE_COMMAND = ' '.join([
  sys.executable, CLOSURE_COMPILER,
  ('--root=%s' % os.path.join('common', 'extension')),
  ('--root=%s' % os.path.join('extension', 'src', 'options')),
  ('--root=%s' % os.path.join(RPF_ROOT, 'src')),
  ('--root=%s' % DEPS['closure-library'][ROOT]),
  ('--root=%s' % SOY_COMPILER_SRC),
  ('--root=%s' % GENFILES_ROOT),
  ('--root=%s' % DEPS['selenium-atoms-lib'][ROOT]),
  '--input=%(input)s',
  '--output_mode=compiled',
  '--output_file=%(output)s',
  ('--compiler_jar=%s' % CLOSURE_COMPILER_JAR)] + COMPILER_FLAGS)


def main():
  ParseOptions()
  # Compile the closure scripts.
  # Soy
  soy_files = {
    'popup': os.path.join('extension', 'templates'),
    'consoles': os.path.join(BUG_ROOT, 'templates'),
    'rpfconsole': os.path.join(RPF_ROOT, 'templates'),
    'rpf_dialogs': os.path.join(RPF_ROOT, 'templates'),
    'locatorsupdater': os.path.join(RPF_ROOT, 'templates')
  }

  ps = []

  current_time = time.time()

  for soy_filename in soy_files:
    soy_filepath = soy_files[soy_filename]
    ps.append(CompileScript(soy_filename, soy_filepath, '.soy', '.soy.js',
        SOY_COMPILER_COMMAND))
  WaitUntilSubprocessesFinished(ps)

  ps = []
  # JavaScript
  js_targets = {
    'background': os.path.join(RPF_ROOT, 'src', 'base'),
    'getactioninfo': os.path.join(RPF_ROOT, 'src', 'libs'),
    'console': os.path.join(RPF_ROOT, 'src', 'libs'),
    'elementhelper': os.path.join('common', 'extension', 'dom'),
    'popup': os.path.join(RPF_ROOT, 'src', 'base')
  }

  for target in js_targets:
    target_filepath = js_targets[target]
    ps.append(CompileScript(target, target_filepath, '.js', '_script.js',
        COMPILE_CLOSURE_COMMAND))
  WaitUntilSubprocessesFinished(ps)

  print 'Totally %s (s) elapsed!' % (time.time() - current_time)

  # Remove the outputs, so they will be created again.
  if os.path.exists(OUTPUT_ROOT):
    shutil.rmtree(OUTPUT_ROOT)
  os.mkdir(OUTPUT_ROOT)

  # Create extension bundle.
  print('Creating extension bundle.')
  #   Create the extension bundle and options path.
  paths = [EXTENSION_DST, OPTIONS_DST, STYLES_DST]
  for path in paths:
    if not os.path.exists(path):
      os.mkdir(path)

  #   Manifest
  shutil.copy(os.path.join(RPF_ROOT, 'manifest.json'), EXTENSION_DST)

  #   Styles
  styles = [os.path.join('extension', 'styles', 'consoles.css'),
            os.path.join('extension', 'styles', 'options.css'),
            os.path.join('extension', 'styles', 'popup.css'),
            os.path.join('extension', 'styles', 'rpf_console.css'),
            os.path.join(RPF_ROOT, 'styles', 'recordmodemanager.css')]
  for style in styles:
    shutil.copy(style, STYLES_DST)

  #   Images
  shutil.copytree(os.path.join('extension', 'imgs'), IMGS_DST)

  #   HTML
  html = [os.path.join('extension', 'html', 'background.html'),
          os.path.join('extension', 'html', 'popup.html'),
          os.path.join('extension', 'src', 'options', 'options.html'),
          os.path.join(RPF_ROOT, 'html', 'console.html')]
  for html_file in html:
    shutil.copy(html_file, EXTENSION_DST)

  #   Scripts
  scripts = []
  for target in js_targets:
    shutil.copy(os.path.join(GENFILES_ROOT, ('%s_script.js' % target)),
                EXTENSION_DST)
  shutil.copy(os.path.join('common', 'extension', 'analytics', 'analytics.js'),
                           EXTENSION_DST)

  CopyAceFiles()

  CopyServerFiles()

if __name__ == '__main__':
  main()
