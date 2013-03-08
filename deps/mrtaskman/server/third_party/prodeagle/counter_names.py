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


from google.appengine.api import namespace_manager
from google.appengine.ext import db
from google.appengine.runtime.apiproxy_errors import RequestTooLargeError

import datetime
import logging
import time
import re

from third_party.prodeagle.model import CounterNamesShard
from third_party.prodeagle import config

class CounterNamesManager(object):
  def __init__(self, namespace=config.NAMESPACE):
    self.known_counter_names_ = set([])
    self.last_update_ = None 
    self.last_shard_ = None
    self.namespace = namespace

  def all(self, force_reload=False):
    namespace = namespace_manager.get_namespace()
    try:
      namespace_manager.set_namespace(self.namespace)
      query = CounterNamesShard.all()
      if force_reload:
        self.known_counter_names_ = set([])
      elif self.last_update_:
        query.filter("timestamp >= ",
                     self.last_update_-
                     datetime.timedelta(0, config.MAX_CLOCK_SKEW))
      for record in query:
        self.known_counter_names_ = self.known_counter_names_.union(
                                        record.names)
        self.last_shard_ = max(self.last_shard_, int(record.key().name()))
        self.last_update_ = datetime.datetime.now()
      return self.known_counter_names_
    finally:
      namespace_manager.set_namespace(namespace)
    
  def addIfNew(self, names):
    new_names = []
    fresh = None
    for name in names:
      if name not in self.known_counter_names_:
        if fresh == None:
          fresh = self.all()
          if name not in fresh:
            new_names += [name] 
        else:
          new_names += [name] 
    if new_names:
      namespace = namespace_manager.get_namespace()
      try:
        namespace_manager.set_namespace(self.namespace)
        if self.last_shard_ == None:
          CounterNamesShard.get_or_insert("0")
          self.last_shard_ = 0
        ADD_SUCCESS = 1
        ADD_FULL = 2
        ADD_FAIL = 3
        def addNames(key, names):
          record = db.get(key)
          local_names = set(record.names)
          for name in names:
            if name not in local_names:
              local_names.add(name)
              record.names += [name]
          try:
            record.put()
            return ADD_SUCCESS
          except (RequestTooLargeError, ValueError):
            if len(names) == len(record.names):
              return ADD_FAIL
            else:            
              return ADD_FULL
        result = None
        try:
          result = db.run_in_transaction(addNames,
              db.Key.from_path('CounterNamesShard', str(self.last_shard_)),
              new_names)
        except:
          result = ADD_FAIL          
        if result == ADD_FULL:
          CounterNamesShard.get_or_insert(str(self.last_shard_ + 1))
          self.addIfNew(names)
        if result == ADD_SUCCESS:
          logging.info("Registered new counter names: %s." %
                       ",".join(new_names))
        else:
          logging.warning(
              "Coudn't register counter names: %s. (Will retry next time)" %
              ",".join(new_names))
      finally:
        namespace_manager.set_namespace(namespace)
    return (not not fresh, len(new_names))  
  
  def delete(self, regexp):
    # NOTE(andrin): When a counter is deleted and used again afterwards
    #               it will not be harvested in the following case:
    #               - Instance A deletes counter C.
    #               - Instance B has C still in self.known_counter_names_
    #                 and increments C without updating the CounterNamesShards.
    #               - Instance A generates the harvest report and wont find C.
    #               To fix this issue, we reload the DefaultCounterNamesManager
    #               once a day.
    #               To fix this issue manually, you can just deploy a new
    #               version of your app.
    namespace = namespace_manager.get_namespace()
    try:
      namespace_manager.set_namespace(self.namespace)
      to_delete = []
      matcher = re.compile("(" + regexp + ")$")
      for name in self.all():
        if matcher.match(name):
          to_delete += [name]
      for shard in CounterNamesShard.all():
        dirty = False
        for name in to_delete:
          if name in shard.names:
            shard.names.remove(name)
            dirty = True
        if dirty:
          shard.put()
      for name in to_delete:
        if name in self.known_counter_names_:
          self.known_counter_names_.remove(name)
      return to_delete
    finally:
      namespace_manager.set_namespace(namespace)

def getDefaultCounterNamesManager():
  global counter_names_manager_
  global counter_names_manager_ts_
  now = datetime.datetime.now()
  if (now - counter_names_manager_ts_).days:
    counter_names_manager_ts_ = now
    counter_names_manager_ = CounterNamesManager()
  return counter_names_manager_

counter_names_manager_ = CounterNamesManager()
counter_names_manager_ts_ = datetime.datetime.now()

def getEpochRounded(utc_datetime=None, slot_size=config.MIN_SLOT_SIZE):
  if not utc_datetime:
    utc_datetime = datetime.datetime.now()
  slot = int(time.mktime(utc_datetime.timetuple()))
  return (slot - slot % slot_size)

