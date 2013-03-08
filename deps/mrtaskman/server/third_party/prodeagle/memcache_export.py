#!/usr/bin/env python
#
# Copyright 2012 MiuMeet AG.
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

from google.appengine.api import memcache
from third_party.prodeagle import counter_names, config

import datetime

class MemcacheExport(): 
  def getCounters(self, from_time, until_time):
    result = {}
    start = counter_names.getEpochRounded(
        from_time + datetime.timedelta(0 ,config.MIN_SLOT_SIZE))
    end = counter_names.getEpochRounded(until_time)
    stats = memcache.get_stats()
    for key in stats:
      counter = "AppEngine.Memcache." + key
      if counter not in result:
        result[counter] = {}
      current = start
      while current <= end:
        result[counter][current] = stats[key]
        current += config.MIN_SLOT_SIZE
    return result
