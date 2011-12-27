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

"""New url bug mapping creation functionality."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

from google.appengine.ext import db

from bugs.models.bugs import bug
from bugs.models.url_bug_map import url_bug_map


class Error(Exception):
  """Raised if an exception occurs while creating the new mappings."""
  pass


def Create(bug_key):
  """Create a new url to bug mapping.

  Args:
    bug_key: The key for the bug to create a mapping for. (integer)

  Returns:
    The key of the newly created mapping or None if no mapping is possible.
    (integer or None)

  Raises:
    Error: Raised if an error occurs while creating the mapping.
  """
  try:
    bug_entity = bug.Bug.get_by_id(bug_key)
    if not bug_entity:
      raise Error
    return url_bug_map.Create(bug_entity)
  except (Error, url_bug_map.CreateError):
    raise Error
