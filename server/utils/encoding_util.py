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

"""Utilities for encoding and decoding strings."""

__author__ = 'alexis.torrs@gmail.com (Alexis O. Torres)'


def EncodeToAscii(value):
  """Needed to encode unicode into a datastore supported encoding.

  Args:
    value: String to encode.

  Returns:
    An utf-8 encoded string.
  """
  if not value:
    return value
  try:
    result = value.encode('ascii', 'ignore')
  except UnicodeDecodeError:
    logging.debug('String contains unicode characters, normalizing')
    new_str = unicode(value, encoding='utf-8', errors='ignore')
    result = new_str.encode('ascii', 'ignore')
  return result
