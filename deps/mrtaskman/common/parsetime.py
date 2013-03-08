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

"""Provides ParseTimeDelta function for converting strings to timedeltas.

Original source courtesy of virhilo from StackOverflow:
http://stackoverflow.com/questions/4628122/how-to-construct-a-timedelta-object-from-a-simple-string
"""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import re
from datetime import timedelta


TIME_DELTA_REGEX = re.compile(
    r'((?P<hours>\d+?)hr)?((?P<minutes>\d+?)m)?((?P<seconds>\d+?)s)?')


def ParseTimeDelta(time_str):
  """Converts a string into a datetime.timedelta.

  Example:
    assert datetime.timedelta(0, 3600) == ParseTimeDelta('1h')
    assert datetime.timedelta(0, 120) == ParseTimeDelta('2m')
    assert datetime.timedelta(0, 130) == ParseTimeDelta('2m10s')

  Args:
    time_str: Time representation as str.

  Returns:
    datetime.timedelta corresponding to given time_str, or None.
  """
  parts = TIME_DELTA_REGEX.match(time_str)
  if not parts:
    return None
  parts = parts.groupdict()
  time_params = {}
  for (name, param) in parts.iteritems():
    if param:
      time_params[name] = int(param)
  return timedelta(**time_params)
