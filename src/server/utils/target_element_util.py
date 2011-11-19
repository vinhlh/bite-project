#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.
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


"""Utilities to manipulate target element information."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import logging


TARGET_ELEMENT_START = 'target_element:'
TARGET_ELEMENT_END = ':target_element'
TARGET_ELEMENT_CLEAR = '[[BITE_CLEAR_BUG_BINDINGS]]'


def GetTargetElementStr(descr):
  """Gets string with markup around the target element description.

  Args:
    descr: Str describing an element on the page.

  Example:
    description = 'id=logo'
    target_info = GetTargetElementStr(description)
    print target_info

  Returns:
      A str with markup sorounding the description str.
  """
  return '%s %s %s' % (TARGET_ELEMENT_START, descr, TARGET_ELEMENT_END)


def ExtractTargetElement(text):
  """Extract existing target element info from the text string.

  Args:
    text: Str containing all text information of a bug.

  Returns:
    The the last target element description found in the text, or empty string.
  """
  if not text:
    logging.warning('ExtractTargetElement: No text specified.')
    return ''

  # Only look at target elements that occurred after the last time the user
  # cleared the previous target elements.
  text = text.split(TARGET_ELEMENT_CLEAR)[-1]

  start_index = text.rfind(TARGET_ELEMENT_START)
  if start_index < 0:
    logging.debug(
        'ExtractTargetElement: Did not find target element information.')
    return ''

  logging.debug('ExtractTargetElement: Found TARGET_ELEMENT_START.')
  start_index += len(TARGET_ELEMENT_START)
  end_index = text.find(TARGET_ELEMENT_END, start_index)
  if end_index < 0:
    logging.warning('ExtractTargetElement: Did not find TARGET_ELEMENT_END.')
    return ''

  logging.debug('ExtractTargetElement: Found TARGET_ELEMENT_END.')
  target_element = text[start_index : end_index].strip()
  logging.debug(
      'ExtractTargetElement: target_element information: %s', target_element)
  return target_element
