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


"""Clean actions."""

__author__ = ('ralphj@google.com (Julie Ralph)'
              'jasonstredwick@google.com (Jason Stredwick)')


import os
import shutil

import paths
import utils


CLEAN_PATHS = {
  'genfiles': paths.GENFILES_ROOT,
  'output': paths.OUTPUT_ROOT
}

# Concatenation with CLEAN_PATHS expected.
EXPUNGE_PATHS = {
  'deps': paths.DEPS_ROOT
}


def RemovePaths(path_array):
  for path in path_array:
    if (os.path.exists(path)):
      # TODO (jason.stredwick): Temporary fix for Windows under the new build.
      #shutil.rmtree(path)
      if utils.IsOsWindows():
        os.system('rmdir /S /Q \"{}\"'.format(path))
      else:
        shutil.rmtree(path)
