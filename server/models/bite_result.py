#!/usr/bin/python2.4
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

"""Bite Result model.

Bite Result model is used to store a test's result during a run.
"""

__author__ = 'phu@google.com (Po Hu)'

import datetime
import logging
import random
#Import not at top
#pylint: disable-msg=C6204
try:
  from google.appengine.ext import db
  from models import bite_event
  from models import bite_run
except ImportError:
  from google.appengine.ext import db
  from models import bite_event
  from models import bite_run


class Error(Exception):
  pass


class MissingRunError(Error):
  """Misses the project name."""


class MissingTestInfoError(Error):
  """Misses the test info."""


class ResultAlreadyPickedError(Error):
  """The result has already been picked and not in queued status."""


class BiteResult(db.Model):
  """Contains result related info."""
  run = db.ReferenceProperty(bite_run.BiteRun)
  test_id = db.StringProperty(required=False)
  status = db.StringProperty(
      choices=('queued', 'assigned', 'passed', 'failed',
               'undefined'))
  screenshot = db.TextProperty(required=False)
  last_picked_time = db.DateTimeProperty(required=False)
  retried_times = db.IntegerProperty(required=False, default=0)
  created_time = db.DateTimeProperty(required=False, auto_now_add=True)
  log = db.TextProperty(required=False)
  finished_time = db.DateTimeProperty(required=False)
  executor_ip = db.StringProperty(required=False)
  # Make sure there is a 1 for each run.
  random = db.FloatProperty(required=True)
  automated = db.BooleanProperty(required=False, default=True)
  test_name = db.StringProperty(required=False)
  labels = db.StringListProperty(default=None)


def GetResult(run_key, test_id='', test_name=''):
  """Gets the result based on the given info."""
  results = BiteResult.all().filter('run = ', db.Key(run_key))
  if test_id:
    results.filter('test_id =', test_id)
  if test_name:
    results.filter('test_name =', test_name)
  return results


def LoadResultByKeyStr(key_str):
  """Load the result by key string."""
  return BiteResult.get(db.Key(key_str))


def AddResult(run_key, test_id):
  """Adds a result entity."""
  if not run_key:
    raise MissingRunError('There is no run defined.')

  if not test_id:
    raise MissingTestInfoError('No test id is specified.')
  # Assume name is ascii.
  return BiteResult.get_or_insert(run=run_key,
                                  test_id=test_id)


def GetResultsOfRunSlice(run_slice_key):
  """Gets the results of a run slice."""
  return BiteResult.all(keys_only=True).ancestor(run_slice_key)


def UpdateStatusAfterFetched(result):
  """Updates the result's status."""
  result = BiteResult.get(result.key())
  if result.status == 'queued':
    result.status = 'assigned'
    result.put()
    result.parent().queued_number -= 1
    result.parent().put()
    return True
  else:
    # TODO(phu): Fetch another result in queued status.
    #raise ResultAlreadyPickedError()
    return False


def GetRandomQueuedJob(run):
  """Gets a random queued job given a run."""
  rand_num = random.random()
  result = BiteResult.all().order('random').filter(
      'run =', run).filter('status =', 'queued').filter(
          'random >=', rand_num).get()
  logging.info('Looked at larger random :')
  if result is None:
    logging.info('Looking for a result smaller than the random.')
    result = BiteResult.all().order('-random').filter(
        'run =', run).filter('status =', 'queued').filter(
            'random <', rand_num).get()
  if result:
    logging.info('Found a valid result')
    success = db.run_in_transaction(UpdateStatusAfterFetched, result)
    logging.info('The final result is:' + str(success))
    if success:
      if result.parent().queued_number == 0:
        run.queued_number -= result.parent().tests_number
        # TODO(phu): Need to run_in_transaction.
        run.put()
      return result
  return ''


def UpdateResult(result_id, parent_key_str, status, screenshot='',
                 log='', finished_time='', executor_ip=''):
  """Updates the result and run slice info in a transaction."""
  result = db.run_in_transaction(
      _UpdateResult, result_id, parent_key_str,
      status, screenshot, log, finished_time, executor_ip)
  run_slice = result.parent()
  run = run_slice.run
  if (run_slice.passed_number + run_slice.failed_number ==
      run_slice.tests_number):
    run.passed_number += run_slice.passed_number
    run.failed_number += run_slice.failed_number
    run.end_time = datetime.datetime.now()
    run.status = 'completed'
    run.put()
    bite_event.AddEvent(run, action='complete', event_type='run',
                        name=run.name, labels=run.labels,
                        project=run.suite.parent().name)
  return result


def _UpdateResult(result_id, parent_key_str, status, screenshot='',
                  log='', finished_time='', executor_ip=''):
  """Updates the result after it's executed."""
  parent_key = None
  if parent_key_str:
    parent_key = db.Key(str(parent_key_str))
  result = BiteResult.get_by_id(result_id, parent_key)
  result.status = status
  result.screenshot = screenshot
  result.log = log
  if not finished_time:
    finished_time = datetime.datetime.now()
  result.finished_time = finished_time
  result.executor_ip = executor_ip
  result.put()
  if status == 'passed':
    result.parent().passed_number += 1
  elif status == 'failed':
    result.parent().failed_number += 1
  result.parent().put()
  return result


def GetResultsOfRun(run_key_str, number):
  """Gets a number of results of the specified run."""
  return (BiteResult.all().filter('run =', db.Key(run_key_str)).
          order('-finished_time').fetch(number))
