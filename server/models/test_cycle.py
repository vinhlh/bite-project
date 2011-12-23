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

__author__ = 'alexis.torres@gmail.com (Alexis O. Torres)'

import json

from google.appengine.ext import db


class TestCycle(db.Model):
  """Model for TestCycle mapping."""
  provider = db.StringProperty(required=True)
  project = db.StringProperty(required=True)
  cycle_id = db.StringProperty(required=True)


class TestCycleEncoder(json.JSONEncoder):
  """Encoder that knows how to encode TestCycle objects."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def default(self, obj):
    """Overrides the default JSONEncoder.

    Args:
      obj: Object to serialize.

    Returns:
      A serializable representation of the Object.
    """
    if isinstance(obj, TestCycle):
      return {'key': obj.key().id(),
              'provider': obj.provider,
              'project': obj.project,
              'cycle_id': obj.cycle_id}
    else:
      return json.JSONEncoder.default(self, obj)


def AddTestCycle(provider, project, cycle_id):
  """Records a new test cycle if one doesn't exist."""
  query = TestCycle.all(keys_only=True).filter('provider = ', provider)
  query = query.filter('provider =', provider).filter('cycle_id =', cycle_id)
  cycle = query.get()
  if not cycle
    cycle = TestCycle(provider=provider,
                      project=project,
                      cycle_id=cycle_id)
    cycle.put()
  return cycle

def FetchTestCycles(limit=10000):
  """Fetches the tracked test cycles up to the specified limit"""
  return TestCycle.all().order('-cycle_id').fetch(limit)


def JsonEncode(cycles):
  """JSON encode the given test cycle list.

  Args:
    cycles: A list of TestCycle.

  Returns:
    JSON encoded str representation of the list.
  """
  return json.dumps(cycles, cls=TestCycleEncoder)

