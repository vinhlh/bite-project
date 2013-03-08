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

from google.appengine.ext.appstats import recording
from third_party.prodeagle import counter_names, config

import datetime
import math
import re

class AppStatsExport():
  def append(self, end_time, key, value, result):
    if key not in result:
      result[key] = {}
    slot = counter_names.getEpochRounded(end_time)
    if slot not in result[key]:
      result[key][slot] = []
    result[key][slot] += [value]
  
  def getCounters(self, from_time, until_time):
    result = {}
    summaries = recording.load_summary_protos()
    per_request_re = False
    if config.APPSTATS_PER_REQUESTS:
      per_request_re = re.compile(config.APPSTATS_PER_REQUESTS)
    for index, summary in enumerate(summaries):
      end_time = datetime.datetime.fromtimestamp(
                     (summary.start_timestamp_milliseconds() +
                      summary.duration_milliseconds()) / 1000)
      if end_time <= from_time or end_time > until_time:
        continue 
      path_key = summary.http_path()
      if config.APPSTATS_DIFFERENTIATE_BETWEEN_POST_AND_GET:
        path_key += "." + summary.http_method()
      if not per_request_re:
        path_key = False
      elif not per_request_re.match(path_key):
        path_key = "Other"
      self.append(end_time, "AppStats.Requests.All", 1, result)
      self.append(end_time, "AppStats.Latency.Real.All",
                  summary.duration_milliseconds(), result)
      self.append(end_time, "AppStats.Latency.API.All",
                  summary.api_milliseconds(),
                  result)
      self.append(end_time, "AppStats.Latency.Overhead.All",
                  summary.overhead_walltime_milliseconds(), result)
      if path_key:
        self.append(end_time, "AppStats.Requests.All." + path_key, 1, result)
        self.append(end_time, "AppStats.Latency.Real.All." + path_key,
                    summary.duration_milliseconds(), result)
        self.append(end_time, "AppStats.Latency.API.All." + path_key ,
                    summary.api_milliseconds(), result)
      for x in summary.rpc_stats_list():
        rpc_key = x.service_call_name()
        value = x.total_amount_of_calls()
        self.append(end_time, "AppStats.RPC." + rpc_key, value, result)
        self.append(end_time, "AppStats.RPC.Total", value, result)
        if path_key:
          self.append(end_time, "AppStats.RPC." + rpc_key + "." + path_key,
                      value, result)
          self.append(end_time, "AppStats.RPC.Total." + path_key,
                      value, result)
    for key in result.keys():
      if (key.startswith("AppStats.Latency") or
          key.startswith("AppStats.Requests")):
        for percentile in config.APPSTATS_PERCENTILES:
          new_key = key.replace("All", str(percentile) + "thPercentile", 1)
          result[new_key] = {}
      for slot in result[key]:
        if (key.startswith("AppStats.Latency") or
            key.startswith("AppStats.Requests")):
          result[key][slot].sort()
          for percentile in config.APPSTATS_PERCENTILES:
            len_percentile = int(math.ceil(len(result[key][slot]) / 100.0 *
                                           percentile ))
            new_key = key.replace("All", str(percentile) + "thPercentile", 1)
            result[new_key][slot] = \
                int(sum(result[key][slot][:len_percentile]) / len_percentile)
        result[key][slot] = sum(result[key][slot])
    return result
  
