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

"""New bug creation functionality."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from bugs.models.bugs import bug


class CreateError(bug.CreateError):
  pass


def Create(data):
  """Create a new bug.

  Args:
    data: The data used to create a new bug. (dict)
  Returns:
    The newly created bug. (bug.Bug)
  Raises:
    CreateError: Raised if creation of a new model fails.
  """
  try:
    return bug.Create(data)
  except bug.CreateError, e:
    raise CreateError(e)
