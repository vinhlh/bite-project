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


"""Build BITE."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jasonstredwick@google.com (Jason Stredwick)')


import logging
import os
import shutil
import sys

from builddefs.tools import access as tools
from builddefs.tools import base


# Commands used by the build script.
COMMAND_BUILD = 'build'
COMMAND_CLEAN = 'clean'
COMMAND_HELP = 'help'

# Command options.
COMMAND_OPTION_ALL = 'all'
COMMAND_OPTION_EXPUNGE = 'expunge'
COMMAND_OPTION_EXTENSION = 'extension'
COMMAND_OPTION_SERVER = 'server'
COMMAND_OPTION_SERVER_APPENGINE = 'server_appengine'

### Root paths
# The relative path from the build script to where all dependencies are stored.
DEPS_ROOT = 'deps'
# The relative path from the build script to where all outputs are stored.
OUTPUT_ROOT = 'output'
# The relative path from the build script to the extension server generated
# files.
EXTENSION_ROOT = os.path.join(OUTPUT_ROOT, 'extension')
SERVER_APPENGINE_ROOT = os.path.join(OUTPUT_ROOT, 'server-appengine')
SERVER_ROOT = SERVER_APPENGINE_ROOT

# Outline the dependencies for building BITE; how to install and to where.
DEPS = {
  'ace': {
    'tool': 'git',
    'command': 'clone',
    'url': 'git://github.com/ajaxorg/ace.git',
    'output': os.path.join(DEPS_ROOT, 'ace')
  },

  'atoms': {
    'tool': 'svn',
    'command': 'checkout',
    'url': 'http://selenium.googlecode.com/svn/trunk/javascript/atoms',
    'output': os.path.join(DEPS_ROOT, 'selenium-atoms-lib')
  },

  'gdata': {
    'tool': 'hg',
    'command': 'clone',
    'url': 'https://code.google.com/p/gdata-python-client/',
    'output': os.path.join(DEPS_ROOT, 'gdata')
  }
}


class Error(Exception):
  """General exception for this module."""
  pass


def CreateRoots():
  """Ensure the common folders exist and are writable."""
  paths = [DEPS_ROOT, OUTPUT_ROOT]
  for path in paths:
    if os.path.exists(path) and not os.path.isdir(path):
      logging.error('%s already exists and is not a directory.' % path)
      raise Error
    elif not os.path.exists(path):
      os.mkdir(path)

    if not os.access(path, os.W_OK):
      logging.error('%s is not writable.' % path)
      raise Error


def Initialize():
  """Ensures the folders and tools are present."""
  print('Initializing build.')
  try:
    CreateRoots()

    # Initialize the tools and library dependencies.
    tools.Initialize(DEPS_ROOT)
    InitializeDeps()
  except (base.ToolError, Error):
    print('Exiting ...')
    sys.exit()


def InitializeDeps():
  """Ensures the library dependencies are present."""
  failed = False
  for key in DEPS:
    dep = DEPS[key]

    command = dep['command']
    output = dep['output']
    tool_name = dep['tool']
    url = dep['url']

    print('Initializing library dependency (%s).' % url)

    try:
      if not os.path.exists(output):
        tool = tools.Get(tool_name)
        tool.Execute([command, url, output], DEPS_ROOT)
        if not os.path.exists(output):
          logging.error('...Failed')
          raise Error
    except (base.ToolError, Error):
      failed = True

  if failed:
    raise Error


def Build(target):
  """Build the specified target(s).

  The main build function ensures the assumptions about individual targets'
  state are held.

  Args:
    target: The target to build. (string)
  """
  try:
    if target == COMMAND_OPTION_ALL:
      Clean(COMMAND_OPTION_EXTENSION)
      BuildExtension()
      Clean(COMMAND_OPTION_SERVER_APPENGINE)
      BuildServerAppengine()
    elif target == COMMAND_OPTION_EXTENSION:
      Clean(COMMAND_OPTION_EXTENSION)
      BuildExtension()
    elif target == COMMAND_OPTION_SERVER:
      # TODO(jasonstredwick): Refactor for genericity.
      Clean(COMMAND_OPTION_SERVER_APPENGINE)
      BuildServerAppengine()
    elif target == COMMAND_OPTION_SERVER_APPENGINE:
      Clean(COMMAND_OPTION_SERVER_APPENGINE)
      BuildServerAppengine()
    else:
      logging.error('Target (%s) not recognized for build.' % target)
      raise Error
  except Error:
    pass


def BuildExtension():
  """Construct the BITE extension.

  Assumes that no material is present in the output folder.
  """
  # Construct extension folder structure.
  os.mkdir(EXTENSION_ROOT)
  if not os.path.exists(EXTENSION_ROOT):
    logging.error('Failed to create output folder for extension.')
    return

  # Move over extension folders.
  extension_folders = ['styles', 'imgs']
  for folder in extension_folders:
    path_src = os.path.join('extension', folder)
    path_dst = os.path.join(EXTENSION_ROOT, folder)
    if os.path.exists(path_dst):
      shutil.rmtree(path_dst)
    shutil.copytree(path_src, path_dst)

  # Move static resources.
  html_path = os.path.join('extension', 'html')
  static_files = [os.path.join(html_path, 'background.html'),
                  os.path.join(html_path, 'popup.html'),
                  os.path.join('extension', 'src', 'options', 'options.html'),
                  os.path.join('extension', 'manifest.json')]
  for static_file in static_files:
    shutil.copy(static_file, EXTENSION_ROOT)

  # Combine tool resources
  # TODO (jasonstredwick): Fix this.
  rpf_path = os.path.join('tools', 'rpf', 'extension')
  static_files = [os.path.join(rpf_path, 'html', 'console.html')]
  for static_file in static_files:
    shutil.copy(static_file, EXTENSION_ROOT)
  static_files = [os.path.join(rpf_path, 'styles', 'recordmodemanager.css')]
  for static_file in static_files:
    shutil.copy(static_file, os.path.join(EXTENSION_ROOT, 'styles'))
  # Copy the required ACE files.
  ace_dst = os.path.join(EXTENSION_ROOT, 'ace')
  ace_src = os.path.join(DEPS['ace']['output'], 'build', 'src')
  shutil.copytree(ace_src, ace_dst)

  # Compile the soy templates.
  genfiles_path = 'genfiles'
  os.mkdir(genfiles_path)

  extension_src_path = os.path.join('extension', 'templates')
  bug_src_path = os.path.join('tools', 'bug', 'extension', 'templates')
  rpf_src_path = os.path.join('tools', 'rpf', 'extension', 'templates')
  soy_files = {'popup': extension_src_path,
               'rpfconsole': rpf_src_path,
               'rpf_dialogs': rpf_src_path,
               'locatorsupdater': rpf_src_path,
               'consoles': bug_src_path,
               'newbug_console': bug_src_path,
               'newbug_type_selector': bug_src_path}

  try:
    soy_compiler = tools.Get(tools.SOY_TO_JS_COMPILER)
  except base.ToolError:
    logging.error('Extension build process failed, halting.')
    Clean(COMMAND_OPTION_EXTENSION)
    return

  for filename in soy_files:
    src = os.path.join(soy_files[filename], filename) + '.soy'
    dst = os.path.join(genfiles_path, filename) + '.js'
    params = ['--shouldProvideRequireSoyNamespaces',
              ('--outputPathFormat %s' % dst),
              src]
    try:
      soy_compiler.Execute(params, DEPS_ROOT)
      if not os.path.exists(dst):
        raise Error
    except (base.ToolError, Error):
      logging.error('Failed to compile soy file (%s).' % filename)
      shutil.rmtree(genfiles_path)
      Clean(COMMAND_OPTION_EXTENSION)
      return

  # Compile javascript.
  js_targets = {os.path.join(extension_src_path, 'background.js'):
                os.path.join(EXTENSION_ROOT, 'background_script.js'),
                os.path.join(rpf_src_path, 'console.js'):
                os.path.join(EXTENSION_ROOT, 'console_script.js'),
                os.path.join(extension_src_path, 'content.js'):
                os.path.join(EXTENSION_ROOT, 'content_script.js'),
                os.path.join(extension_src_path, 'elementhelper.js'):
                os.path.join(EXTENSION_ROOT, 'elementhelper_script.js'),
                os.path.join(rpf_src_path, 'getactioninfo.js'):
                os.path.join(EXTENSION_ROOT, 'getactioninfo_script.js'),
                os.path.join(extension_src_path, 'popup.js'):
                os.path.join(EXTENSION_ROOT, 'popup_script.js'),
                os.path.join(extension_src_path, 'options', 'page.js'):
                os.path.join(EXTENSION_ROOT, 'options_script.js')}

  try:
    closure_builder = tools.Get(tools.CLOSURE_COMPILER)
  except base.ToolError:
    logging.error('Extension build process failed, halting.')
    shutil.rmtree(genfiles_path)
    Clean(COMMAND_OPTION_EXTENSION)
    return

  for target in js_targets:
    src = target
    dst = js_targets[target]
    params = [('--root=%s' % genfiles_path),
              ('--root=%s' % extension_src_path),
              ('--root=%s' % rpf_src_path),
              ('--root=%s' % bug_src_path),
              ('--root=%s' % 'common'),
              # TODO (jasonstredwick): Figure out how to link this dep.
              ('--root=%s' % os.path.join(DEPS_ROOT, 'soy-compiler')),
              ('--root=%s' % DEPS['atoms']['output']),
              ('--input=%s' % src),
              ('--output_file=%s' % dst),
              ('--output_mode=compiled')]
    try:
      closure_builder.Execute(params, DEPS_ROOT)
      if not os.path.exists(dst):
        raise Error
    except (base.ToolError, Error):
      logging.error('Failed to compile JavaScript file (%s).' % filename)
      shutil.rmtree(genfiles_path)
      Clean(COMMAND_OPTION_EXTENSION)
      return

  # Clean up generated files.
  shutil.rmtree(genfiles_path)


def BuildServerAppengine():
  # Copy gData files to the server.
  shutil.copytree('gdata-python-client/src/gdata', 'src/server/gdata')
  shutil.copytree('gdata-python-client/src/atom', 'src/server/atom')


def Clean(target):
  """Cleans the given target; i.e. remove it.

  Args:
    target: The target to remove. (string)
  """
  try:
    if target == COMMAND_OPTION_EXPUNGE:
      if os.path.exists(DEPS_ROOT):
        shutil.rmtree(DEPS_ROOT)
      if os.path.exists(OUTPUT_ROOT):
        shutil.rmtree(OUTPUT_ROOT)
      CreateRoots()
    elif target == COMMAND_OPTION_ALL:
      if os.path.exists(OUTPUT_ROOT):
        shutil.rmtree(OUTPUT_ROOT)
      CreateRoots()
    elif target == COMMAND_OPTION_EXTENSION:
      if os.path.exists(EXTENSION_ROOT):
        shutil.rmtree(EXTENSION_ROOT)
    elif target == COMMAND_OPTION_SERVER:
      if os.path.exists(SERVER_ROOT):
        shutil.rmtree(SERVER_ROOT)
    elif target == COMMAND_OPTION_SERVER_APPENGINE:
      if os.path.exists(SERVER_APPENGINE_ROOT):
        shutil.rmtree(SERVER_APPENGINE_ROOT)
    else:
      logging.error('Target (%s) not recognized for clean.' % target)
      raise Error
  except (OSError, Error):
    logging.error('clean failed; could not remove root folders.')
    raise Error


def Usage():
  """Displays how to use the build script."""
  usage = '\n'.join([
    'Usage: python build.py <command> <option>',
    '',
    'Available commands:',
    '  %s\t\t\tBuilds the given targets.',
    '  %s\t\t\tCleans up the generated output.',
    '  %s\t\t\tDisplays this usage message.',
    '',
    'Available options:',
    '  %s\t\t\tRemoves all targets, but does not include tools and ',
    '  \t\t\texternal dependencies.',
    '  %s\t\tRemoves all targets and all tools and dependencies.',
    '  \t\t\t(Only applies to clean)',
    '  %s\t\tThe BITE extension.',
    '  %s\t\tThe default server build (AppEngine).',
    '  %s\tThe AppEngine server build.'
  ])

  # Replace commands.
  usage = (usage %
            # Replace commands.
           (COMMAND_BUILD, COMMAND_CLEAN, COMMAND_HELP,
            # Replace options.
            COMMAND_OPTION_ALL, COMMAND_OPTION_EXPUNGE,
            COMMAND_OPTION_EXTENSION, COMMAND_OPTION_SERVER,
            COMMAND_OPTION_SERVER_APPENGINE))

  print(usage)


def main():
  """The main entry point for the script."""
  argc = len(sys.argv)
  args = sys.argv
  if argc == 1 or args[1] == COMMAND_HELP or argc != 3:
    Usage()
    sys.exit()

  command = None
  command_name = args[1]
  if command_name == COMMAND_BUILD:
    command = Build
  elif command_name == COMMAND_CLEAN:
    command = Clean
  else:
    Usage()
    sys.exit()

  try:
    Initialize()
    command and command(args[2])
  except Error:
    pass

  print('exiting...')


if __name__ == '__main__':
  main()

