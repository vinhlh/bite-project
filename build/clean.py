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

from build import targets


def All():
  """Remove all the build targets."""
  try:
    if os.path.exists(targets.OUTPUT_ROOT):
      shutil.rmtree(targets.OUTPUT_ROOT)
    CreateRoots()
  except (OSError, targets.Error):
    ReportError()


def Extension():
  """Remove the extension."""
  try:
    if os.path.exists(targets.EXTENSION_ROOT):
      shutil.rmtree(targets.EXTENSION_ROOT)
  except OSError, targets.Error):
    ReportError()


def Expunge():
  """Remove all build targets and the dependencies."""
  try:
    if os.path.exists(targets.DEPS_ROOT):
      shutil.rmtree(targets.DEPS_ROOT)
    All()
  except (OSError, targets.Error):
    ReportError()


def Server():
  """Remove the server (default variant)."""
  try:
    if os.path.exists(targets.SERVER_ROOT):
      shutil.rmtree(targets.SERVER_ROOT)
  except OSError:
    ReportError()


def ServerAppEngine():
  """Remove the server (AppEngine variant)."""
  try:
    if os.path.exists(targets.SERVER_APPENGINE_ROOT):
      shutil.rmtree(targets.SERVER_APPENGINE_ROOT)
  except OSError:
    ReportError()
