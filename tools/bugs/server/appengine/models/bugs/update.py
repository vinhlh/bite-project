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

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from bugs.models.bugs import bug


class UpdateError(bug.UpdateError):
  """Raised if an exception occurs while updating a bug."""
  pass


def Update(bug_model, data):
  """Update a bug.

  Args:
    bug_model: The bug to update. (bug.Bug)
    data: The data used to create a new bug. (dict)
  Raises:
    UpdateError: Raised the update action fails.
  """
  try:
    bug.Update(bug_model, data)
  except bug.UpdateError, e:
    raise UpdateError(e)

