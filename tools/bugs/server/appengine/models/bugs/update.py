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

"""Update bug functionality."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


from bugs.models.bugs import bug


class InvalidKeyError(Exception):
  """Raised if the key did not correlate with a stored bug."""
  pass


class UpdateError(Exception):
  """Raised if an exception occurs while updating a bug."""
  pass


def Update(key, data):
  """Update a bug.

  Args:
    key: The key of the bug to retrieve. (integer)
    data: The data used to create a new bug. (dict)

  Returns:
    The key of the bug that was updated. (integer)

  Raises:
    Error: Raised if creation of a new model fails.
  """
  try:
    return bug.Update(key, data)
  except bug.InvalidKeyError:
    raise InvalidKeyError
  except bug.UpdateError:
    raise UpdateError

