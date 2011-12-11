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

"""Utility rules for building extension bundles.

Before you use any functions from this file, include the following
line in your BUILD file.

subinclude('//testing/chronos/bite/builddefs:BUILD.bundle')

Usage example:

    MIMIC_SRC = '//experimental/users/jasonstredwick/mimic/mimic'
    BUNDLE_ENTRIES = [
        # Mimic JavaScript entries.
        FilesetEntry(srcdir = MIMIC_SRC + ':BUILD',
                     destdir = 'chrome/content',
                     files = [ ':javascript_files' ],
        ),

        # Extension resources.
        FilesetEntry(files =
                         glob([ 'chrome/**' ]) +
                         [ 'chrome.manifest', 'install.rdf' ]
        ),
    ]

    # Generated rules: mimic_soft_rule and mimic_soft
    # Generated output: mimic_soft and mimic (both directories)
    GenBundle('mimic', BUNDLE_ENTRIES)

    # Generated rule: mimic_xpi_rule
    # Generated output: mimic.xpi
    GenXPI('mimic', [ ':mimic_soft' ])


Dependency example:

    BOTS_PKG = '//testing/chronos/appcompat/extension'
    EXTENSION_ENTRIES = [
        # Grab the extension bundle for Bots AppCompat.
        FilesetEntry(srcdir = BOTS_PKG' + :bundle_soft',
                     destdir = 'extension',
        ),
    ]

    MIMIC_PKG = '//experimental/users/jasonstredwick/mimic'
    FF35_ENTRIES = EXTENSION_ENTRIES + [
        # Grab the extension bundle for firefox3_5 mimic package.
        FilesetEntry(srcdir = MIMIC_PKG + '/firefox3_5:mimic_soft'),
    ]

    # Generated rules: mimic_ff35_soft_rule and mimic_ff35_soft
    # Generated output: mimic_ff35_soft and mimic_ff35 (both directories)
    GenBundle('mimic_ff35', FF35_ENTRIES)
"""


def GenBundle(base_name, fileset_entries):
  """Generate directories containing unpacked extensions.

  This function will generate two rules:
      [base_name]_soft_rule and [base_name]_rule.

  The rules created by this function generate folders using the given list
  of FilesetEntries.  The soft rule will generate a folder containing only
  symbolic links to its files while the other rule will generate a folder
  containing the actual files.

  The second version is necessary because the Fileset only outputs symlinks,
  and Chrome can't load unpacked extensions that contain symbolically linked
  files.  Also note that the second rule can not run on forge because forge
  can not create and return entire folders to the client.

  Args:
    base_name - The name used to create the directories.
    fileset_entries - A list of FilesetEntry.
  """
  soft_rule_name = base_name + 'soft_rule'
  hard_rule_name = base_name + '_rule'
  soft_output = base_name + '_soft'
  hard_output = base_name

  Fileset(name = soft_rule_name,
          out = soft_output,
          entries = fileset_entries,
  )

  genrule(name = hard_rule_name,
          srcs = [ ':' + soft_output ],
          outs = [ hard_output ],
          output_to_bindir = 1,
          cmd = 'cp -rfL $(SRCS) $(OUTS)',
          local = 1,
  )


def GenXPI(base_name, target_srcs):
  """Generate an xpi file for the specified extension.

  Create the extension bundle (.xpi) for Firefox.  Just drag and drop the file
  onto the FireFox browser to install it.  The generated filename will be
  [base_name].xpi and the rule is [base_name]_xpi_rule

  Args:
    base_name - The base name for the xpi file.
    target_srcs - A list containing the package:rules to be compressed.
  """
  rule_name = base_name + '_xpi_rule'
  output = base_name + '.xpi'

  genrule(name = rule_name,
          srcs = target_srcs,
          outs = [ output ],
          output_to_bindir = 1,
          cmd = 'cp -rfL $(SRCS) temp; cd temp; zip -r ../$(OUTS) *',
          local = 1,
  )

