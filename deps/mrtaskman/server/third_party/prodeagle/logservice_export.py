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

from google.appengine.api import logservice
from third_party.prodeagle import counter_names, config

import datetime
import math
import re
import time

class LogServiceExport():
  def append(self, end_time, key, value, result):
    if key not in result:
      result[key] = {}
    slot = counter_names.getEpochRounded(end_time)
    if slot not in result[key]:
      result[key][slot] = 0
    result[key][slot] += value
  
  def getErrorLogCounters(self, from_time, until_time):
    result = {}
    error_log_url = False
    if config.ERROR_LOG_EXPORT_URL:
      error_log_url = re.compile(config.ERROR_LOG_EXPORT_URL)
    count = 0
    for log_entry in logservice.fetch(
          minimum_log_level=logservice.LOG_LEVEL_ERROR,
          include_app_logs=False, batch_size=config.ERROR_LOG_EXPORT_AMOUNT):
      count += 1
      if count > config.ERROR_LOG_EXPORT_AMOUNT:
        break
      end_time = datetime.datetime.fromtimestamp(int(log_entry.end_time))
      if end_time <= from_time or end_time > until_time:
        continue
      name = "AppEngine.ErrorLog.HTTP." + str(log_entry.status) 
      self.append(end_time, name, 1, result)
      path_key = log_entry.resource
      if "?" in path_key:
        path_key = path_key[:path_key.find("?")]
      if error_log_url and error_log_url.match(path_key):
        self.append(end_time, name + "." + path_key, 1, result)
    return result
  
  def getLogCounters(self, from_time, until_time):
    result = {}
    log_url = False
    if config.LOG_EXPORT_URL:
      log_url = re.compile(config.LOG_EXPORT_URL)
    count = 0
    first_entry = None
    last_entry = None
    for log_entry in logservice.fetch(
          include_app_logs=False, batch_size=config.LOG_EXPORT_AMOUNT):
      count += 1
      if count >= config.LOG_EXPORT_AMOUNT:
        break
      end_time = datetime.datetime.fromtimestamp(int(log_entry.end_time))
      if end_time <= from_time or end_time > until_time:
        continue
      first_entry = first_entry or log_entry
      last_entry =  log_entry
      name = "AppEngine.Log.Sampled." 
      self.append(end_time, name + "Request", 1, result)
      if log_entry.pending_time:
        self.append(end_time, name + "PendingTimeMs",
                    int(log_entry.pending_time * 1000), result)
      if log_entry.cost:
        self.append(end_time, name + "CostPerBillionRequests",
                    int(log_entry.cost * 1000000000), result)
      path_key = log_entry.resource
      if "?" in path_key:
        path_key = path_key[:path_key.find("?")]
      if log_url:
        if not log_url.match(path_key):
          path_key = "Other"
        self.append(end_time, name + "Request." + path_key, 1, result)
        if log_entry.cost:
          self.append(end_time, name + "CostPerBillionRequests." + path_key,
                      int(log_entry.cost * 1000000000), result)
    if first_entry:
      end_time = datetime.datetime.fromtimestamp(int(last_entry.end_time))
      self.append(end_time, "AppEngine.Log.SampledMs",
                  (last_entry.end_time-first_entry.end_time) * 1000, result)
    return result
