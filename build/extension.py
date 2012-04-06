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


"""Constructs the extension bundle."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os


def Construct(verbose):
  print 'extension'
  return



def X():
  externs_location=None

  externs_root = os.path.join('common', 'extension', 'externs')
  if externs_location:
    externs_root = os.path.join(externs_location, externs_root)

    '--compiler_flags=--externs=%s' % os.path.join(externs_root,
                                                   'chrome_extensions.js'),
    '--compiler_flags=--externs=%s' % os.path.join(externs_root,
                                                   'rpf_externs.js'),
    '--compiler_flags=--externs=%s' % os.path.join(externs_root,
                                                   'ace_externs.js')




def CopyAceFiles():
  """Copies the ACE files to the destination folder."""
  #   Copy the required ACE files.
  ace_dst = os.path.join(EXTENSION_DST, 'ace')
  ace_src = os.path.join(DEPS['ace'][ROOT], 'build', 'src')
  if os.path.exists(ace_dst):
    shutil.rmtree(ace_dst)
  shutil.copytree(ace_src, ace_dst)
