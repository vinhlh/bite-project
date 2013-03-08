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

from google.appengine.api import memcache
from google.appengine.api import taskqueue
from third_party.prodeagle import counter_names
import logging

from third_party.prodeagle import config

def incr(name, delta=1, save_stats=config.SAVE_PRODEAGLE_STATS):
  if delta:
    incrBatch({ name : delta }, save_stats)

class Batch():
  def __init__(self):
    self.pending = {}
  
  def incr(self, name, delta=1):
    if delta:
      self.pending[name] = self.pending.get(name, 0) + delta
  
  def commit(self, save_stats=config.SAVE_PRODEAGLE_STATS):
    if self.pending:
      incrBatch(self.pending, save_stats)
    self.pending = {}

def incrBatch(counters, save_stats=config.SAVE_PRODEAGLE_STATS):
  try:
    cnm = counter_names.getDefaultCounterNamesManager()
    slot = counter_names.getEpochRounded()
    prefixed_counters = {}
    for name in counters:
      prefixed_counters[str(slot) + name] = counters[name]
    save_in_between_name = None
    if config.SAVE_IN_BETWEEN:
      save_in_between_name = ("save_in_between_%d" %
                              counter_names.getEpochRounded(utc_datetime=None,
                                  slot_size=config.SAVE_IN_BETWEEN))
      prefixed_counters[save_in_between_name] = 1
    existing = memcache.offset_multi(prefixed_counters,
                                     namespace=cnm.namespace,
                                     initial_value=0)
    new_counter_names = []
    for name in counters:
      if (counters[name] == existing[str(slot) + name]):
        new_counter_names += [name]
    (data_store_access, n_added_names) = cnm.addIfNew(new_counter_names)
    if config.SAVE_IN_BETWEEN and existing[save_in_between_name] == 1:
      try:
        taskqueue.Task(url=config.PRODEAGLE_HARVEST_URL,
                       params={"save_in_between": "1"},
                       countdown=config.SAVE_IN_BETWEEN,
                       name="prodeagle-" + save_in_between_name).add()
      except:
        pass
    if save_stats:
      counters = Batch()
      if data_store_access:
        counters.incr("ProdEagle.Datastore.ReadAccess")
      if n_added_names:
        counters.incr("ProdEagle.NewNames", n_added_names)
        counters.incr("ProdEagle.Datastore.WriteAccess")
      if config.SAVE_IN_BETWEEN and existing[save_in_between_name] == 1:
        counters.incr("ProdEagle.SaveInBetween")
      counters.commit(save_stats=False)
  except:
    logging.warning("Couldn't increase the following counters: %s"
                    % ", ".join(counters.keys()))
        
