# Copyright 2011 uTest Inc. All Rights Reserved.
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

"""Model for test cycles."""

__author__ = 'alexist@utest.com (Alexis O. Torres)'

import json

from google.appengine.ext import db
from models import test_cycle


class TestCycleUserEncoder(json.JSONEncoder):
  """Encoder that knows how to encode TestCycleUser objects."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def default(self, obj):
    """Overrides the default JSONEncoder.

    Args:
      obj: Object to serialize.

    Returns:
      A serializable representation of the Object.
    """
    if isinstance(obj, TestCycleUser):
      return {'user': obj.user,
              'cycle_key': obj.cycle.key().name()}
    else:
      return json.JSONEncoder.default(self, obj)


class TestCycleUser(db.Model):
  """Model for TestCycle mapping."""
  user = db.StringProperty(required=True)
  cycle_id = db.StringProperty(required=True)
  cycle = db.ReferenceProperty(reference_class=test_cycle.TestCycle,
                               collection_name='testers')


def AddTestCycleUser(user, cycle):
  """Adds a new test cycle user mapping if one doesn't exists."""
  query = TestCycleUser.all(keys_only=True).filter('user =', user)
  user = query.filter('cycle =', cycle).get()
  if not user:
    user = TestCycleUser.get_or_insert(user=user,
                                       cycle_id=cycle.cycle_id,
                                       cycle=cycle)
  return user


def GetTesters(limit=10000):
  """Gets known tester cycles mappings"""
  return TestCycleUser.all().order('-cycle_id').fetch(limit)


def GetTestCyclesForUser(user, limit=10):
  """Gets the test cycles for a given user."""
  # Sort by decreasing test cycle ID (assumes that larger ID implies
  # a more recent)
  query = TestCycleUser.all().filter('user =', user).order('-cycle_id')
  user_cycles = query.fetch(limit)
  return [c.cycle for c in user_cycles]


def FetchTestersForCycle(key, limit=10000):
  """Gets the testers for a given test cycle"""
  cycle = test_cycle.TestCycle.get_by_id(int(key))
  return cycle.testers.fetch(limit)


def JsonEncode(testers):
  """JSON encode the given bugs list.

  Args:
    testers: A list of TestCycleUser.

  Returns:
    JSON encoded str representation of the list.
  """
  return json.dumps(testers, cls=TestCycleUserEncoder)

