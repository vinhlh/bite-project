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


"""Provides access to the tools by returning the Tool's type."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import logging

from builddefs.tools import base
from builddefs.tools import closure_builder
from builddefs.tools import closure_compiler
from builddefs.tools import git
from builddefs.tools import mercurial
from builddefs.tools import soy_to_js_compiler
from builddefs.tools import svn


CLOSURE_BUILDER = 'closure-builder'
CLOSURE_COMPILER = 'closure-compiler'
GIT = 'git'
MERCURIAL = 'hg'
SOY_TO_JS_COMPILER = 'soy-compiler'
SVN = 'svn'

_TOOL_MAP = {
  CLOSURE_BUILDER: closure_builder.ClosureBuilder,
  CLOSURE_COMPILER: closure_compiler.ClosureCompiler,
  GIT: git.Git,
  MERCURIAL: mercurial.Mercurial,
  SOY_TO_JS_COMPILER: soy_to_js_compiler.SoyToJsCompiler,
  SVN: svn.Svn
}


def Get(tool_name):
  """Return the appropriate tool or raise an exception.

  Args:
    tool_name: The name of the desired tool. (string)

  Returns:
    Returns the tool type. (base.Tool)

  Raises:
    base.ToolError: Raised if the tool is not valid.
  """
  if not tool_name in _TOOL_MAP:
    logging.error('Invalid tool (%s) requested.' % str(tool_name))
    raise base.ToolError

  return _TOOL_MAP[tool_name]


def Initialize(location=None):
  """Initialize the tools by ensuring they are installed.

  Initialization will attempt to install as many of the tools as possible
  before raising an exception.

  Args:
    location: Optional location where the tools may exist. (string)

  Raises:
    base.ToolError: Raised if the tools are not properly initialized.
  """
  failed = False

  print('Initializing git.')
  try:
    if not _TOOL_MAP[GIT].IsInstalled(location):
      _TOOL_MAP[GIT].Install(location)
  except base.ToolError:
    logging.error('...Failed')
    failed = True

  print('Initializing mercurial.')
  try:
    if not _TOOL_MAP[MERCURIAL].IsInstalled(location):
      _TOOL_MAP[MERCURIAL].Install(location)
  except base.ToolError:
    logging.error('...Failed')
    failed = True

  print('Initializing svn.')
  # Need to know if svn is installed due to tool inter-dependencies.
  svn_installed = False
  try:
    if not _TOOL_MAP[SVN].IsInstalled(location):
      _TOOL_MAP[SVN].Install(location)
    svn_installed = True
  except base.ToolError:
    logging.error('...Failed')
    failed = True

  if svn_installed:
    print('Initializing closure-builder.')
    try:
      if not _TOOL_MAP[CLOSURE_BUILDER].IsInstalled(location):
        _TOOL_MAP[CLOSURE_BUILDER].Install(location)
    except base.ToolError:
      logging.error('...Failed')
      failed = True

    print('Initializing closure-compiler.')
    try:
      if not _TOOL_MAP[CLOSURE_COMPILER].IsInstalled(location):
        _TOOL_MAP[CLOSURE_COMPILER].Install(location)
    except base.ToolError:
      logging.error('...Failed')
      failed = True

  print('Initializing soy-to-js-compiler.')
  try:
    if not _TOOL_MAP[SOY_TO_JS_COMPILER].IsInstalled(location):
      _TOOL_MAP[SOY_TO_JS_COMPILER].Install(location)
  except base.ToolError:
    logging.error('...Failed')
    failed = True

  # Raise exception if at least one tool is not installed.
  if failed:
    raise base.ToolError

