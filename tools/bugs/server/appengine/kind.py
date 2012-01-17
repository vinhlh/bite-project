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

"""Define the kinds of data returned from the bugs tool."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from common.util import class_attr


class Kind(object):
  """Define kind keywords for the bugs tool."""
  BUG = 'bugs#bug'
  ID = 'bugs#id'
  URL_BUG_MAP = 'bugs#url-bug-map'
  URLS = 'bugs#urls'


# List of valid kinds.
_ALL_KINDS = class_attr.GetPODAttrsValue(Kind)


def IsValid(value):
  """Determine if the given value is a valid kind.

  Args:
    value: The value to test. (string)

  Returns:
    Whether or not the value is a kind. (boolean)
  """
  return value in _ALL_KINDS
