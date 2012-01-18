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


"""The build helper."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jason.stredwick@gmail.com (Jason Stredwick)')

import logging
import optparse
import os
import shutil
import subprocess
import sys
import time
import urllib
import zipfile


# Common folders.
GENFILES_ROOT = 'genfiles'
OUTPUT_ROOT = 'output'
DEPS_ROOT = 'deps'

# Common roots
BUG_ROOT = os.path.join('tools', 'bugs', 'extension')
RPF_ROOT = os.path.join('tools', 'rpf', 'extension')

# Output paths
EXTENSION_DST = os.path.join(OUTPUT_ROOT, 'extension')
SERVER_DST = os.path.join(OUTPUT_ROOT, 'server')
IMGS_DST = os.path.join(EXTENSION_DST, 'imgs')
OPTIONS_DST = os.path.join(EXTENSION_DST, 'options')
STYLES_DST = os.path.join(EXTENSION_DST, 'styles')

# Keywords for DEPS
CHECKOUT_COMMAND = 'checkout'
ROOT = 'root'
URL = 'url'

# Define dependencies that are checkout from various repositories.
DEPS = {
  'ace': {
    ROOT: os.path.join(DEPS_ROOT, 'ace'),
    URL: 'git://github.com/ajaxorg/ace.git',
    CHECKOUT_COMMAND: 'git clone %s %s'
  },
  'gdata-python-client': {
    ROOT: os.path.join(DEPS_ROOT, 'gdata-python-client'),
    URL: 'http://code.google.com/p/gdata-python-client/',
    CHECKOUT_COMMAND: 'hg clone %s %s'
  },
  'selenium-atoms-lib': {
    ROOT: os.path.join(DEPS_ROOT, 'selenium-atoms-lib'),
    URL: 'http://selenium.googlecode.com/svn/trunk/javascript/atoms',
    CHECKOUT_COMMAND: 'svn checkout %s %s'
  },
  'closure-library': {
    ROOT: os.path.join(DEPS_ROOT, 'closure', 'closure-library'),
    URL: 'http://closure-library.googlecode.com/svn/trunk/',
    CHECKOUT_COMMAND: 'svn checkout %s %s'
  },
  'urlnorm': {
    ROOT: os.path.join(DEPS_ROOT, 'urlnorm'),
    URL: 'git://gist.github.com/246089.git',
    CHECKOUT_COMMAND: 'git clone %s %s'
  },
  'mrtaskman': {
    ROOT: os.path.join(DEPS_ROOT, 'mrtaskman'),
    URL: 'http://code.google.com/p/mrtaskman',
    CHECKOUT_COMMAND: 'git clone %s %s'
  }
}

CLOSURE_COMPILER_ROOT = os.path.join(DEPS_ROOT, 'closure')
CLOSURE_COMPILER_JAR = os.path.join(CLOSURE_COMPILER_ROOT, 'compiler.jar')
CLOSURE_COMPILER_URL = ('http://closure-compiler.googlecode.com/files/'
                        'compiler-latest.zip')

SOY_COMPILER_ROOT = os.path.join(DEPS_ROOT, 'soy')
SOY_COMPILER_JAR = os.path.join(SOY_COMPILER_ROOT, 'SoyToJsSrcCompiler.jar')
SOY_COMPILER_URL = ('http://closure-templates.googlecode.com/files/'
                    'closure-templates-for-javascript-latest.zip')
SOY_COMPILER_SRC = os.path.join(DEPS_ROOT, 'soy', 'src')
SOYDATA_URL = ('http://closure-templates.googlecode.com/svn/trunk/javascript/'
               'soydata.js')

# Compiling commands.
CLOSURE_COMPILER = os.path.join(DEPS['closure-library'][ROOT], 'closure',
                                'bin', 'build', 'closurebuilder.py')

COMPILER_FLAGS = [
  '--compiler_flags=--generate_exports',
  '--compiler_flags=--js=%s' % os.path.join(
      DEPS['closure-library'][ROOT], 'closure', 'goog', 'deps.js'),
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
  '--compiler_flags=--jscomp_error=visibility',
  ('--compiler_flags=--externs=%s' % os.path.join(
      'common', 'extension', 'externs', 'chrome_extensions.js')),
  ('--compiler_flags=--externs=%s' % os.path.join(
      'common', 'extension', 'externs', 'rpf_externs.js')),
  ('--compiler_flags=--externs=%s' % os.path.join(
      'common', 'extension', 'externs', 'ace_externs.js'))
]

SOY_COMPILER_COMMAND = ' '.join([('java -jar %s' % SOY_COMPILER_JAR),
                                 '--shouldProvideRequireSoyNamespaces',
                                 '--shouldGenerateJsdoc',
                                 '--outputPathFormat %(output)s',
                                 '%(input)s'])


class ClosureError(Exception):
  pass


def Clean():
  """Clean removes the generated files and output."""
  if os.path.exists(OUTPUT_ROOT):
    shutil.rmtree(OUTPUT_ROOT)
  if os.path.exists(GENFILES_ROOT):
    shutil.rmtree(GENFILES_ROOT)


def CleanExpunge():
  """Cleans up the generated and output files plus the dependencies."""
  if os.path.exists(DEPS_ROOT):
    shutil.rmtree(DEPS_ROOT)
  Clean()


def CompileScript(filename_base, filepath, suffix_in, suffix_out, command):
  """Compile a script based on the given input file.

  Args:
    filename: The base name of the script to compile. (string)
    filepath: The location of the the script. (string)
    suffix_in: The suffix to add to the basename for input. (string)
    suffix_out: The suffix to add to the basename for output. (string)
    command: The compile command to use.

  Returns:
    The process which actually is executing the command.
  """
  input = os.path.join(filepath, ('%s%s' % (filename_base, suffix_in)))
  output = os.path.join(GENFILES_ROOT, ('%s%s' % (filename_base, suffix_out)))

  # For speed, only compile the script if it is not already compiled.
  if os.path.exists(output):
    return

  data = {'input': input,
          'output': output}
  result = ExecuteCommand(command % data, True)
  return result


def ExecuteCommand(command, no_wait=False):
  """Execute the given command and return the output.

  Args:
    command: A string representing the command to execute.
    no_wait: Whether not to wait for finished.

  Returns:
    The process.
  """
  print 'Running command: %s' % command
  process = subprocess.Popen(command.split(' '),
                             stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
  if not no_wait:
    results = process.communicate()
    if process.returncode:
      logging.error(results[1])
  return process


def SetupClosureCompiler():
  """Setup the closure library and compiler.

  Checkout the closure library using svn if it doesn't exist. Also, download
  the closure compiler.

  Raises:
    ClosureError: If the setup fails.
  """
  # Download the compiler jar if it doesn't exist.
  if not os.path.exists(CLOSURE_COMPILER_JAR):
    print('Downloading closure compiler jar file.')
    (compiler_zip, _) = urllib.urlretrieve(CLOSURE_COMPILER_URL)
    compiler_zipfile = zipfile.ZipFile(compiler_zip)
    compiler_zipfile.extract('compiler.jar', CLOSURE_COMPILER_ROOT)
    if not os.path.exists(CLOSURE_COMPILER_JAR):
      logging.error('Could not download the closure compiler jar.')
      raise ClosureError('Could not find the closure compiler.')


def SetupDep(dep_name):
  """Download the dependency to the correct location.

  Args:
    dep_name: The name of the dependency to setup. (string)
  """
  dep = DEPS[dep_name]
  if not os.path.exists(dep[ROOT]):
    ExecuteCommand(dep[CHECKOUT_COMMAND] % (dep[URL], dep[ROOT]))
    if not os.path.exists(dep[ROOT]):
      logging.error('Could not checkout %s from %s.' % (dep_name, dep[URL]))
      raise ClosureError('Could not set up %s.' % dep_name)


def SetupSoyCompiler():
  """Setup the closure library and compiler.

  Checkout the closure library using svn if it doesn't exist. Also, download
  the closure compiler.

  Raises:
    ClosureError: If the setup fails.
  """
  # Download the soy compiler jar if it doesn't exist.
  soyutils_src = os.path.join(SOY_COMPILER_SRC, 'soyutils_usegoog.js')
  if (not os.path.exists(SOY_COMPILER_JAR) or
      not os.path.exists(soyutils_src)):
    print('Downloading soy compiler and utils.')
    (soy_compiler_zip, _) = urllib.urlretrieve(SOY_COMPILER_URL)
    soy_compiler_zipfile = zipfile.ZipFile(soy_compiler_zip)
    soy_compiler_zipfile.extract('SoyToJsSrcCompiler.jar', SOY_COMPILER_ROOT)
    soy_compiler_zipfile.extract('soyutils_usegoog.js', SOY_COMPILER_SRC)
    if (not os.path.exists(SOY_COMPILER_JAR) or
        not os.path.exists(soyutils_src)):
      logging.error('Could not download the soy compiler jar.')
      raise ClosureError('Could not find the soy compiler.')

  # Download required soydata file, which is required for soyutils_usegoog.js
  # to work.
  soydata_src = os.path.join(SOY_COMPILER_SRC, 'soydata.js')
  if not os.path.exists(soydata_src):
    urllib.urlretrieve(SOYDATA_URL, soydata_src)
    if not os.path.exists(soydata_src):
      logging.error('Could not download soydata.js.')
      raise ClosureError('Could not fine soydata.js')


def WaitUntilSubprocessesFinished(ps):
  """Waits until the given sub processes are all finished."""
  while True:
    status = [p.poll() for p in ps if p != None]
    if all([x is not None for x in status]):
      for p in ps:
        if p != None and p.returncode != 0:
          print p.stderr.read()
      return
    else:
      time.sleep(0.2)


def ParseOptions():
  """Parses the command and perform tasks."""
  usage = 'usage: %prog [options]'
  parser = optparse.OptionParser(usage)
  parser.add_option('--clean', dest='build_clean',
                    action='store_true', default=False,
                    help='Clean the build directories.')
  parser.add_option('--expunge', dest='build_expunge',
                    action='store_true', default=False,
                    help='Clean the build directories and deps.')
  parser.add_option('--deps', dest='build_deps',
                    action='store_true', default=False,
                    help='Download deps.')
  (options, _) = parser.parse_args()

  # Exit if only want to clean.
  if options.build_clean:
    Clean()
    exit()
  elif options.build_expunge:
    CleanExpunge()
    exit()

  # Set up the directories that will be built into.
  paths = [GENFILES_ROOT, DEPS_ROOT]
  for path in paths:
    if not os.path.exists(path):
      os.mkdir(path)

  # Get external resources.
  for dep_name in DEPS:
    SetupDep(dep_name)
  SetupClosureCompiler()
  SetupSoyCompiler()

  if options.build_deps:
    exit()

