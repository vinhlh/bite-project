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


"""Issue Tracker indexer object."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from bugs.providers import pusher_base


class Error(pusher_base.Error):
  pass


class Pusher(pusher_base.PusherBase):
  """Pusher base class.

  Pusher is responsible for filling the provider's database with the bug
  details.  Normally, this may require a transformation of the metadata from
  the BITE bug details into data useful for the provider.
  """

  def __init__(self, key, max_retries=3):
    pusher_base.PusherBase.__init__(self, key, max_retries)

  def Push(self):
    """Updates the bug model with values set by providers such as bug_id.

    Raises:
      Error: Raised if there was an error creating an index.
    """
    pass
