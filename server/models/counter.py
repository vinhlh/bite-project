# Copyright 2010 Google Inc. All Rights Reserved.
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

"""Counter sharding class."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import random

from google.appengine.ext import db


class Error(Exception):
  pass


class MissingShardNameError(Error):
  pass


class CounterShard(db.Model):
  """Shards for the counter."""
  count = db.IntegerProperty(required=True, default=0)


_NUM_SHARDS = 9


def _GetShardKeyName(name, index):
  """Gets a key name for a partition on a given shard.

  Args:
    name: Str name of the shard.
    index: Int partitin number.

  Returns:
    Str key name for the given partition.
  """
  return 'CounterShard_%s_%d' % (name, index)


def _GetShardKey(name, index):
  """Returns the unique db.Key for the specified shard partition.

  Args:
    name: Str name of the shard.
    index: Int partition number.

  Returns:
    A db.Key object.
  """
  key_name = _GetShardKeyName(name, index)
  return db.Key.from_path('CounterShard', key_name)


def GetCount(name):
  """Retrieves the total count value for a given sharded counter.

  The counter value is calculated each time this method is called.
  This value is eventually consistent.

  Args:
    name: Str name of the shard.

  Returns:
    The total downloads count as an int.

  Raises:
    MissingShardNameError: Raised if name is not specified.
  """
  if not name:
    raise MissingShardNameError()

  total = 0
  counters = db.get(
      [_GetShardKey(name, index) for index in range(_NUM_SHARDS)])
  for counter in counters:
    if counter:
      total += counter.count
  return total


def Increment(name):
  """Increment the value for a given sharded counter.

  Args:
    name: Str name of the shard.

  Raises:
        MissingShardNameError: Raised if name is not specified.
  """
  if not name:
    raise MissingShardNameError()

  def txn():
    index = random.randint(0, _NUM_SHARDS - 1)
    counter = db.get(_GetShardKey(name, index))
    if not counter:
      counter = CounterShard(key_name=_GetShardKeyName(name, index))
    counter.count += 1
    counter.put()
  db.run_in_transaction(txn)

