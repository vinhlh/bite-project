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


"""Build the BITE Extension."""

__author__ = 'ralphj@google.com (Julie Ralph)'

import logging
import optparse
import os
import shutil
import subprocess
import sys
import urllib
import zipfile

CHECKOUT_ACE_COMMAND = ('git clone git://github.com/ajaxorg/ace.git')
CHECKOUT_CLOSURE_COMMAND = ('svn checkout http://closure-library.googlecode.com'
                            '/svn/trunk/ closure-library')
CHECKOUT_SELENIUM_COMMAND = ('svn checkout http://selenium.googlecode.com'
                             '/svn/trunk/javascript/atoms selenium-atoms-lib')
CHECKOUT_GDATA_COMMAND = ('hg clone https://code.google.com/p/'
                          'gdata-python-client/')
CLOSURE_COMPILER_URL = ('http://closure-compiler.googlecode.com/files/'
                        'compiler-latest.zip')
SOY_COMPILER_URL = ('http://closure-templates.googlecode.com/files/'
                    'closure-templates-for-javascript-latest.zip')
SOYDATA_URL = ('http://closure-templates.googlecode.com/svn/trunk/javascript/'
               'soydata.js')
CLOSURE_COMPILER = os.path.join('closure-library', 'closure', 'bin', 'build',
                                'closurebuilder.py')
CLIENT_SRC = os.path.join('src', 'client')
SERVER_SRC = os.path.join('src', 'server')
COMPILE_CLOSURE_COMMAND = ' '.join([sys.executable, CLOSURE_COMPILER,
                                    ('--root=%s' % CLIENT_SRC),
                                    '--root=closure-library',
                                    '--root=build_gen',
                                    '--root=selenium-atoms-lib',
                                    '--input=%(input)s',
                                    '--output_mode=compiled',
                                    '--output_file=%(output)s',
                                    '--compiler_jar=compiler.jar'])
SOY_COMPILER_COMMAND = ' '.join(['java -jar SoyToJsSrcCompiler.jar',
                                 '--shouldProvideRequireSoyNamespaces',
                                 '--outputPathFormat %(output)s',
                                 '%(file)s'])


class ClosureError(Exception):
  pass


def BuildClosureScript(input_filename, output_filename):
  """Build a compiled closure script based on the given input file.

  Args:
    input_filename: A string representing the name of the input script to
        compile
    output_filename: A string representing the name of the output script.

  Raises:
    ClosureError: If closure fails to compile the given input file.
  """
  result = ExecuteCommand(
      COMPILE_CLOSURE_COMMAND % {
          'input': input_filename,
          'output': output_filename})

  if result or not os.path.exists(output_filename):
    raise ClosureError('Failed while compiling %s.' % input_filename)


def BuildSoyJs(input_file):
  """Builds a javascript file from a soy file.

  Args:
    input_file: A path to the soy file to compile into JavaScript. The js file
        will be stored in build_gen/{FILENAME}.soy.js

  Raises:
    ClosureError: If the soy compiler fails to compile.
  """
  output_name = os.path.join('build_gen', '%s.js' % input_file)
  result = ExecuteCommand(
      SOY_COMPILER_COMMAND % {
          'file': input_file,
          'output': output_name})
  if result or not os.path.exists(output_name):
    raise ClosureError('Failed while compiling the soy file %s.' % input_file)


def Clean():
  if os.path.exists('clean'):
    shutil.rmtree('build')
  if os.path.exists('build_gen'):
    shutil.rmtree('build_gen')


def ExecuteCommand(command):
  """Execute the given command and return the output.

  Args:
    command: A string representing the command to execute.

  Returns:
    The return code of the process.
  """
  print 'Running command: %s' % command
  process = subprocess.Popen(command.split(' '),
                             stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE,
                             shell=True)
  results = process.communicate()
  if process.returncode:
    logging.error(results[1])
  return process.returncode


def SetupAce():
  """Setup the Ace library.

  Checkout the Ace library using git.

  Raises:
    ClosureError: If the setup fails.
  """

  if not os.path.exists('ace'):
    ExecuteCommand(CHECKOUT_ACE_COMMAND)
    if not os.path.exists('ace'):
      logging.error('Could not checkout ACE from github.')
      raise ClosureError('Could not set up ACE.')


def SetupClosure():
  """Setup the closure library and compiler.

  Checkout the closure library using svn if it doesn't exist. Also, download
  the closure compiler.

  Raises:
    ClosureError: If the setup fails.
  """
  # Set up the svn repo for closure if it doesn't exist.
  if not os.path.exists('closure-library'):
    ExecuteCommand(CHECKOUT_CLOSURE_COMMAND)
    if not os.path.exists('closure-library'):
      logging.error(('Could not check out the closure library from svn. '
                     'Please check out the closure library to the '
                     '"closure-library" directory.'))
      raise ClosureError('Could not set up the closure library.')

  # Download the compiler jar if it doesn't exist.
  if not os.path.exists('compiler.jar'):
    (compiler_zip, _) = urllib.urlretrieve(CLOSURE_COMPILER_URL)
    compiler_zipfile = zipfile.ZipFile(compiler_zip)
    compiler_zipfile.extract('compiler.jar')
    if not os.path.exists('compiler.jar'):
      logging.error('Could not download the closure compiler jar.')
      raise ClosureError('Could not find the closure compiler.')

  # Download the soy compiler jar if it doesn't exist.
  soyutils_src = os.path.join('build_gen', 'soyutils_usegoog.js')
  if (not os.path.exists('SoyToJsSrcCompiler.jar') or
      not os.path.exists(soyutils_src)):
    (soy_compiler_zip, _) = urllib.urlretrieve(SOY_COMPILER_URL)
    soy_compiler_zipfile = zipfile.ZipFile(soy_compiler_zip)
    soy_compiler_zipfile.extract('SoyToJsSrcCompiler.jar')
    soy_compiler_zipfile.extract('soyutils_usegoog.js', 'build_gen')
    if (not os.path.exists('SoyToJsSrcCompiler.jar') or
        not os.path.exists(soyutils_src)):
      logging.error('Could not download the soy compiler jar.')
      raise ClosureError('Could not find the soy compiler.')

  # Download required soydata file, which is required for soyutils_usegoog.js
  # to work.
  soydata_src = os.path.join('build_gen', 'soydata.js')
  if not os.path.exists(soydata_src):
    urllib.urlretrieve(SOYDATA_URL, soydata_src)
    if not os.path.exists(soydata_src):
      logging.error('Could not download soydata.js.')
      raise ClosureError('Could not fine soydata.js')


def SetupSelenium():
  """Setup the selenium library.

  Checkout necessary files from the selenium library using svn, if they
  don't exist.

  Raises:
    ClosureError: If the setup fails.
  """
  bot_src = os.path.join('selenium-atoms-lib', 'bot.js')
  if not os.path.exists(bot_src):
    ExecuteCommand(CHECKOUT_SELENIUM_COMMAND)
    if not os.path.exists(bot_src):
      logging.error('Could not download the selenium library.')
      raise ClosureError('Could not find the selenium library.')

def SetupGdata():
  """Setup the gData client.

  Checkout necessary files from the gData client using mercury, if they
  don't exist.

  Raises:
    ClosureError: If the setup fails.
  """
  if not os.path.exists('gdata-python-client'):
    ExecuteCommand(CHECKOUT_GDATA_COMMAND)
    if not os.path.exists('gdata-python-client'):
      logging.error('Could not download the gData client.')
      raise ClosureError('Could not find the gData client.')


def main():
  usage = 'usage: %prog [options]'
  parser = optparse.OptionParser(usage)
  parser.add_option('--clean', dest='build_clean',
                    action='store_true', default=False,
                    help='Clean the build directories.')
  (options, _) = parser.parse_args()

  if options.build_clean:
    Clean()
    exit()

  # Set up the directories that will be built into.
  options_dst = os.path.join('build', 'options')
  if not os.path.exists('build'):
    os.mkdir('build')
  if not os.path.exists(options_dst):
    os.mkdir(options_dst)
  if not os.path.exists('build_gen'):
    os.mkdir('build_gen')

  # Get external resources.
  SetupClosure()
  SetupSelenium()
  SetupGdata()
  SetupAce()

  # Compile the closure scripts.
  soy_files = ['consoles.soy',
               'rpfconsole.soy',
               'rpf_dialogs.soy',
               'locatorsupdater.soy',
               'newbug_console.soy',
               'newbug_type_selector.soy',
               'popup.soy']

  for soy_filename in soy_files:
    BuildSoyJs(os.path.join(CLIENT_SRC, soy_filename))

  js_targets = {'background.js': 'background_script.js',
                'content.js': 'content_script.js',
                'getactioninfo.js': 'getactioninfo_script.js',
                'console.js': 'console_script.js',
                'elementhelper.js': 'elementhelper_script.js',
                'popup.js': 'popup_script.js',
                'options/page.js': 'options_script.js'}

  for target in js_targets:
    BuildClosureScript(os.path.join(CLIENT_SRC, target),
                       os.path.join('build', js_targets[target]))

  # Copy over the static resources
  styles_dst = os.path.join('build', 'styles')
  styles_src = os.path.join(CLIENT_SRC, 'styles')
  if os.path.exists(styles_dst):
    shutil.rmtree(styles_dst)
  shutil.copytree(styles_src, styles_dst)

  imgs_dst = os.path.join('build', 'imgs')
  imgs_src = os.path.join(CLIENT_SRC, 'imgs')
  if os.path.exists(imgs_dst):
    shutil.rmtree(imgs_dst)
  shutil.copytree(imgs_src, imgs_dst)

  static_files = [os.path.join(CLIENT_SRC, 'background.html'),
                  os.path.join(CLIENT_SRC, 'console.html'),
                  os.path.join(CLIENT_SRC, 'options', 'options.html'),
                  os.path.join(CLIENT_SRC, 'popup.html'),
                  os.path.join(CLIENT_SRC, 'manifest.json')]
  for static_file in static_files:
    shutil.copy(static_file, 'build')

  # Copy the required ACE files.
  ace_dst = os.path.join('build', 'ace')
  ace_src = os.path.join('ace', 'build', 'src')
  if os.path.exists(ace_dst):
    shutil.rmtree(ace_dst)
  shutil.copytree(ace_src, ace_dst)

  # Copy gData files to the server.
  shutil.copytree(os.path.join('gdata-python-client', 'src', 'gdata'),
                  os.path.join(SERVER_SRC, 'gdata'))
  shutil.copytree(os.path.join('gdata-python-client', 'src', 'atom'),
                  os.path.join(SERVER_SRC, 'atom'))

if __name__ == '__main__':
  main()
