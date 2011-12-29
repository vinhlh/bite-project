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


"""Datastore indexer object."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from google.appengine.api import users

from bugs.models.bugs import get
from bugs.models.bugs import update
from bugs.providers import pusher_base


class Error(pusher_base.Error):
  """General exception."""
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
    try:
      current_user = users.get_current_user()
      user_email = None
      if current_user:
        user_email = current_user.email()

      bug = get.Get(self.key)

      provider_data = {
        'key': self.key,
        'id': str(self.key), # bug_id
        'author': user_email,
        'author_id': user_email,
        'reported_on': bug['added'],
        'last_update': bug['modified'],
        'last_updater': user_email,
        'project': 'none',
        'priority': 'none',
        'details_link': ''
      }

      update.Update(self.key, provider_data)
    except (get.InvalidKeyError, update.InvalidKeyError, update.UpdateError):
      raise Error
