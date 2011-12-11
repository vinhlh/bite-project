# -*- mode: python; -*-
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
# Author: jasonstredwick@google.com (Jason Stredwick)

"""Utility rules for soy templates.

Before you use any functions from this file, include the following
line in your BUILD file.

subinclude('//testing/chronos/bite/builddefs:BUILD.soy_rule')
"""


def GenSoyJs(rule_name, files, flags=None, locales=None, compiler=None):
  """Generate the javascript files from the soy template files.

  Args:
    rule_name - The rule name.
    files - The list of soy template files.
    flags - A list of compiler flags, defaults to None; i.e. use the
        function's default.
    locales - A list of locales to generate templates for, defaults to None;
        i.e. do not use locales.
    compiler - The compiler to create javascript from soy files, defaults
        to None; i.e. use the function's default.
  """

  DEFAULT_LOCALES = [ 'en' ]
  locales = locales or DEFAULT_LOCALES

  DEFAULT_COMPILER = '//java/com/google/template/soy:SoyToJsSrcCompiler'
  compiler = compiler or DEFAULT_COMPILER

  DEFAULT_FLAGS = [
    '--should_provide_require_soy_namespaces',
    '--shouldGenerateJsdoc',
    '--locales=' + ','.join(locales),
    '--message_file_path_format="/home/build//' +
        'googledata/transconsole/xtb/SoyExamples/{LOCALE}.xtb"',
    '--output_path_format="$(@D)/{INPUT_FILE_NAME}__{LOCALE_LOWER_CASE}.js"'
  ]
  flags = ' '.join(flags or DEFAULT_FLAGS)

  targets = [
    soyFile + '__' + locale.lower().replace('-', '_') + '.js'
    for soyFile in files for locale in locales
  ]

  command = ('$(location ' + compiler + ') ' + flags + ' $(SRCS)')

  genrule(name = rule_name,
          srcs = files,
          tools = [ compiler ],
          outs = targets,
          cmd = command)

