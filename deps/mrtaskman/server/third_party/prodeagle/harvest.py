#!/usr/bin/env python
#
# Copyright 2011 MiuMeet AG.
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

try:
  import json as simplejson
except:
  from django.utils import simplejson

from google.appengine.api import memcache
from google.appengine.api import namespace_manager
from google.appengine.api import urlfetch
from google.appengine.api import users
from google.appengine.ext import db

import logging
import sets
import datetime
import time
import webapp2

from third_party.prodeagle import auth, config, counter_names, appstats_export, logservice_export, memcache_export
from third_party.prodeagle.model import CountersLastHarvest, CountersSavedInBetween

class HarvestHandler(webapp2.RequestHandler):

  def wasDataLostSinceLastHarvest(self, namespace, slot,
                                  reset_test_counters=False):
    lost_data_check_keys = [ "last_slot_%d" % x
                             for x in range(config.EXPECTED_MEMCACHE_SERVERS) ]
    lost_data_check = memcache.get_multi(lost_data_check_keys,
                                         namespace=namespace)

    if reset_test_counters:
      memcache.delete_multi(lost_data_check_keys, namespace=namespace)
      next_lost_data = {}
      for key in lost_data_check_keys:
        next_lost_data[key] = 1
      memcache.offset_multi(next_lost_data,
                            namespace=namespace,
                            initial_value=0)

    if len(lost_data_check) != len(lost_data_check_keys):
      logging.warning("ProdEagle counters lost before %d" % slot)
      return True
    return False

  def addCounterToResult(self, counter, slot, delta, result_counters):
    if counter not in result_counters:
      result_counters[counter] = {}
    if slot not in result_counters[counter]:
      result_counters[counter][slot] = 0
    result_counters[counter][slot] += delta

  def addCountersToResult(self, counters, result_counters):
    for key in counters:
      for slot in counters[key]:
        self.addCounterToResult(key, int(slot), counters[key][slot],
                                result_counters)

  def getAndSetExporDates(self):
    last_export_date = datetime.datetime.fromtimestamp(
          int(self.request.get("last_time", "0")))
    counters_last_harvest = CountersLastHarvest.get_by_key_name("master")
    if counters_last_harvest:
      last_export_date = counters_last_harvest.ts or last_export_date
    else:
      counters_last_harvest = CountersLastHarvest(key_name="master")

    last_export_date = max(last_export_date,
        datetime.datetime.fromtimestamp(time.time() - config.MAX_LOOK_BACK))
    this_export_date = datetime.datetime.now()
    this_export_date -= datetime.timedelta(0, 0, this_export_date.microsecond)
    counters_last_harvest.ts = this_export_date
    counters_last_harvest.put()
    return last_export_date, this_export_date

  def createReport(self, production_call=False):
    namespace = namespace_manager.get_namespace()
    try:
      cnm = counter_names.getDefaultCounterNamesManager()
      namespace_manager.set_namespace(cnm.namespace)

      last_export_date, this_export_date = self.getAndSetExporDates()

      slot = counter_names.getEpochRounded(
          last_export_date - datetime.timedelta(0, config.MAX_CLOCK_SKEW))
      result = { "time": int(time.mktime(this_export_date.timetuple())),
                 "counters": {},
                 "ms_of_data_lost": 0,
                 "version": 1.0 }
      result["all_data_inaccurate"] = self.wasDataLostSinceLastHarvest(
                                          cnm.namespace, slot, True)
      all_keys = cnm.all(force_reload=True)
      while slot <= counter_names.getEpochRounded(this_export_date):
        gap = time.time()
        slot_updates = memcache.get_multi(all_keys, key_prefix=str(slot),
                                          namespace=cnm.namespace)
        # NOTE(andrin): Between get_multi & delete_multi we loose all updates!
        memcache.delete_multi(slot_updates.keys(), key_prefix=str(slot),
                              namespace=cnm.namespace)
        result["ms_of_data_lost"] = max(int((time.time() - gap) * 1000),
                                        result["ms_of_data_lost"])
        for counter in slot_updates:
          if slot_updates[counter]:
            self.addCounterToResult(counter, slot, slot_updates[counter],
                                    result["counters"])
        slot += config.MIN_SLOT_SIZE

      result["all_data_inaccurate"] |= self.wasDataLostSinceLastHarvest(
                                           cnm.namespace, slot)

      if config.APPSTATS_ENABLE:
        appstats = appstats_export.AppStatsExport().getCounters(
            last_export_date, this_export_date)
        self.addCountersToResult(appstats, result["counters"])
      if config.ERROR_LOG_EXPORT_ENABLE or config.LOG_EXPORT_ENABLE:
        logexport = logservice_export.LogServiceExport()
        if config.ERROR_LOG_EXPORT_ENABLE:
          self.addCountersToResult(logexport.getErrorLogCounters(
                                       last_export_date, this_export_date),
                                   result["counters"])
        if config.LOG_EXPORT_ENABLE:
          self.addCountersToResult(logexport.getLogCounters(
                                       last_export_date, this_export_date),
                                   result["counters"])
      if config.MEMCACHE_EXPORT_ENABLE:
        self.addCountersToResult(memcache_export.MemcacheExport().getCounters(
                                     last_export_date, this_export_date),
                                 result["counters"])

      if not production_call:
        save = CountersSavedInBetween()
        save.counters = simplejson.dumps(result["counters"])
        save.all_data_inaccurate = result["all_data_inaccurate"]
        save.ms_of_data_lost = result["ms_of_data_lost"]
        save.put()
        result = { "time": result["time"], "counters": {},
                   "ms_of_data_lost": 0, "all_data_inaccurate": False,
                   "version": result["version"] }
        logging.info("Saved counters in between!")
      if self.request.get("save_in_between"):
        return

      for saved in CountersSavedInBetween.all():
        saved_counters = simplejson.loads(saved.counters)
        self.addCountersToResult(saved_counters, result["counters"])
        result["ms_of_data_lost"] += saved.ms_of_data_lost
        result["all_data_inaccurate"] |= saved.all_data_inaccurate
        if production_call:
          saved.delete()

      if production_call or self.request.get("json"):
        self.response.headers['Content-Type'] = "text/plain; charset=utf-8"
        self.response.out.write(simplejson.dumps(result,
                                                 sort_keys=True, indent=2))
      else:
        slot = counter_names.getEpochRounded()
        for key in all_keys:
          self.addCounterToResult(key, slot, 0, result["counters"])
        self.response.out.write("<h3>Data since last export</h3>")
        self.response.out.write(
            "<a href='http://www.prodeagle.com'>Go to ProdEagle dashboard</a>")
        self.response.out.write(
            "<br><br><a href='%s'>Logout</a>" %
            users.create_logout_url(self.request.url))
        for counter in sorted(result["counters"].keys()):
          self.response.out.write("<br/><b>%s</b>: %d" %
              (counter, sum(result["counters"][counter].values())))
    finally:
      namespace_manager.set_namespace(namespace)

  def get(self):
    add_user = self.request.get("administrator") or self.request.get("viewer")
    if add_user:
      auth.addUser(self, add_user)
    elif auth.isProdEagle(self) or auth.isAdministrator(self):
      delete_counter = self.request.get("delete_counter")
      if delete_counter:
        cnm = counter_names.getDefaultCounterNamesManager()
        result = cnm.delete(delete_counter) or ["None"]
        logging.info("Deleted the following counters: %s" % ", ".join(result))
      else:
        self.createReport(self.request.get("production_call") == "1")
    self.response.out.write('')

  def post(self):
    self.get()

app = webapp2.WSGIApplication([
    ('/.*', HarvestHandler),
    ], debug=True)

