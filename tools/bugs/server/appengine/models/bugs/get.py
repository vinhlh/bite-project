#!/usr/bin/python2.7
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

"""Get bug functionality."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.


from bugs.models.bugs import bug


class Error(Exception):
  """Raised if an exception occurs while getting a bug."""
  pass


def Get(id):
  """Get bug details.

  Args:
    id: The id of the bug to retrieve. (integer)

  Returns:
    The object containing the bug details. (dict)

  Raises:
    Error: Raised if a bug was not found for the given id.
  """
  try:
    return bug.Get(id)
  except bug.InvalidIdError:
    raise Error
