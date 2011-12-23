#!/usr/bin/python
#
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

"""The deferred lib utils."""

__author__ = 'phu@google.com (Po Hu)'


import datetime
import logging
import math
import random

from google.appengine.ext import db
from google.appengine.ext import deferred

from models import bite_result
from models import bite_run
from models import bite_suite
from models import suite_test_map
from utils import basic_util


DEFAULT_PUT_DELETE_MAX = 500
DEFAULT_RESULTS_NUM_PER_TASK = 10000
DEFAULT_NO_DEFERRED_NUM = 2000


def DeleteResultsOfRun(run_key_str, max_num):
  """Deletes all the results of a given run."""
  offset = 0
  run_key = db.Key(run_key_str)
  run_slice_list = bite_run.BiteRunSlice.all(keys_only=True).filter(
      'run = ', run_key)
  slice_num = run_slice_list.count(DEFAULT_NO_DEFERRED_NUM)
  logging.info('There are %d slices to be deleted.' % slice_num)
  if slice_num < DEFAULT_NO_DEFERRED_NUM:
    is_deferred = False
  slices_per_task = max_num / DEFAULT_PUT_DELETE_MAX
  while True:
    slices = run_slice_list.fetch(slices_per_task, offset=offset)
    if not slices:
      break
    else:
      offset += len(slices)
    if is_deferred:
      deferred.defer(DeleteResults, slices, _queue='delete-results')
    else:
      DeleteResults(slices)


def DeleteResults(run_slices):
  if not run_slices:
    return
  for run_slice in run_slices:
    db.run_in_transaction(RetryBatchOperation,
                          bite_result.GetResultsOfRunSlice(run_slice),
                          False)
    db.delete(run_slice)


def RetryBatchOperation(temp_list, is_put):
  """Retries the batch operation until it succeeds or fails."""
  counter = 0
  while True:
    try:
      if is_put:
        db.put(temp_list)
      else:
        db.delete(temp_list)
      break
    except Exception, err:
      logging.warning('Batch operation failed because: ' + str(err))
      if counter > 6:
        raise
      else:
        counter += 1


def KickOffTests(test_info_list, run_slice_index, run_key):
  """Adds a list of result entities based on the given test list."""
  temp_list = []
  i = 0
  logging.info('Adding a run slice number: ' + str(run_slice_index))
  run_slice = bite_run.AddRunSlice(run_key, run_slice_index)
  while test_info_list:
    if len(temp_list) == len(test_info_list):
      db.run_in_transaction(RetryBatchOperation, temp_list, True)
      del test_info_list[:len(temp_list)]
      run_slice.queued_number = len(temp_list)
      run_slice.tests_number = len(temp_list)
      run_slice.put()
      break
    test_info = test_info_list[i]
    result = bite_result.BiteResult(parent=run_slice,
                                    run=run_key,
                                    test_id=test_info['id'],
                                    status='queued',
                                    random=random.random(),
                                    automated=test_info['automated'],
                                    test_name=test_info['name'])
    temp_list.append(result)
    if len(temp_list) == DEFAULT_PUT_DELETE_MAX:
      db.run_in_transaction(RetryBatchOperation, temp_list, True)
      temp_list = []
      del test_info_list[:DEFAULT_PUT_DELETE_MAX]
      run_slice.queued_number = DEFAULT_PUT_DELETE_MAX
      run_slice.tests_number = DEFAULT_PUT_DELETE_MAX
      run_slice.put()
      run_slice_index += 1
      if test_info_list:
        logging.info('Add a new run slice. Num of the list is: %d',
                     len(test_info_list))
        run_slice = bite_run.AddRunSlice(run_key, run_slice_index)
      i = 0
    else:
      i += 1


def StartRun(suite_key, run_name,
             test_info_list, tokens, labels,
             dimensions, start_url,
             run_template_key, user):
  """Starts the run with the given info."""
  if not suite_key and not run_template_key:
    return

  start_time = datetime.datetime.now()
  if not test_info_list:
    test_info_list = GetAllTestInfo(str(suite_key), user)
  if not tokens:
    tokens = bite_suite.GetSuiteTokens(suite_key)
  run = bite_run.AddRun(run_name, suite_key, start_time,
                        test_info_list, tokens, labels,
                        dimensions, start_url,
                        run_template_key)
  is_deferred = True
  if len(test_info_list) < DEFAULT_NO_DEFERRED_NUM:
    is_deferred = False
  StartTests(test_info_list, run.key(), is_deferred)
  return run.key()


def GetSlicesNum(total_num):
  """Returns how many slices are needed for holding all the results."""
  return int(math.ceil(float(total_num) / DEFAULT_PUT_DELETE_MAX))


def StartTests(test_info_list, run_key, is_deferred=True):
  """Kicks off the tests of the given suite."""
  temp_list = []
  run_index = 0
  logging.info('Starts kicking off tests in tasks.')
  while True:
    if len(test_info_list) >= DEFAULT_RESULTS_NUM_PER_TASK:
      temp_list = test_info_list[:DEFAULT_RESULTS_NUM_PER_TASK]
      if is_deferred:
        deferred.defer(KickOffTests, temp_list,
                       run_index, run_key, _queue='add-results')
      else:
        KickOffTests(temp_list, run_index, run_key)
      del test_info_list[:DEFAULT_RESULTS_NUM_PER_TASK]
      temp_list = []
      run_index += GetSlicesNum(DEFAULT_RESULTS_NUM_PER_TASK)
    else:
      if test_info_list:
        if is_deferred:
          deferred.defer(KickOffTests, test_info_list,
                         run_index, run_key, _queue='add-results')
        else:
          KickOffTests(test_info_list, run_index, run_key)
      break


def GetAllTestInfo(suite_key_str, user=None):
  """Gets all the tests for the suite."""
  suite = bite_suite.BiteSuite.get(db.Key(suite_key_str))
  # Assume the saved query overrides the stored tests.
  return suite_test_map.GetAllTestInfoOfSuite(suite_key_str)
