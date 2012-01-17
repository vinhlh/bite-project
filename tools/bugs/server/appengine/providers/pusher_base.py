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


"""Base class for Pusher objects."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

class Error(Exception):
  pass


class PusherBase(object):
  """Pusher base class

  Pushers are responsible for pushing bugs to a specific provider database.

  Attributes:
    bug: The bug object to push. (bugs.models.bug.Bug)
    max_retries: The maximum number of attempts to push a bug. (integer)
  """

  def __init__(self, bug, max_retries=3):
    self.bug = bug
    self.max_retries = max_retries

  def Push(self):
    raise NotImplementedError
