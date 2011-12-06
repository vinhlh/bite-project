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

"""Bite suite and test map model.

This model is used to store the association between a suite and tests.
"""

__author__ = 'phu@google.com (Po Hu)'

#Import not at top
#pylint: disable-msg=C6204
try:
  from google.appengine.ext import db
  from models import bite_suite
  from utils import basic_util
except ImportError:
  from google.appengine.ext import db
  from models import bite_suite
  from utils import basic_util


DEFAULT_TEST_ID_LIST_LENGTH = 200
DEFAULT_PUT_DELETE_MAX = 500


class Error(Exception):
  pass


class MissingSuiteError(Error):
  """Misses the suite."""


class DuplicatedProjectNameError(Error):
  """Has the project name existing."""


class SuiteTestsMap(db.Model):
  """Contains suite and tests association."""
  suite = db.ReferenceProperty(bite_suite.BiteSuite,
                               collection_name='suite_tests_map')
  created_time = db.DateTimeProperty(required=False, auto_now_add=True)
  test_info_list_str = db.TextProperty()


def GetAllTestInfoOfSuite(suite_key_str):
  test_info_list = []
  suite_key = db.Key(suite_key_str)
  queries = SuiteTestsMap.all().filter('suite =', suite_key)
  test_info_lists = [basic_util.ParseJsonStr(query.test_info_list_str)
                     for query in queries]
  for test_info in test_info_lists:
    test_info_list.extend(test_info)
  return test_info_list


def AddTestsToSuite(suite_key_str, test_info_list):
  """Adds tests to a suite."""
  if not suite_key_str:
    raise MissingSuiteError('There is no suite defined.')
  suite_key = db.Key(suite_key_str)
  if not test_info_list:
    return
  map_list = []
  # Deals with a potentially very large list.
  while True:
    if len(map_list) == DEFAULT_PUT_DELETE_MAX:
      db.put(map_list)
      map_list = []
    if len(test_info_list) >= DEFAULT_TEST_ID_LIST_LENGTH:
      map_list.append(SuiteTestsMap(
          suite=suite_key,
          test_info_list_str=basic_util.DumpJsonStr(
              test_info_list[:DEFAULT_TEST_ID_LIST_LENGTH])))
      del test_info_list[:DEFAULT_TEST_ID_LIST_LENGTH]
    else:
      if test_info_list:
        map_list.append(SuiteTestsMap(
            suite=suite_key,
            test_info_list_str=basic_util.DumpJsonStr(test_info_list)))
      break
  if map_list:
    db.put(map_list)


def DeleteTestsFromSuite(suite_key_str):
  """Deletes tests from a suite."""
  if not suite_key_str:
    raise MissingSuiteError('There is no suite defined.')
  suite_key = db.Key(suite_key_str)
  map_key_list = SuiteTestsMap.all(keys_only=True).filter(
      'suite = ', suite_key)
  if not map_key_list:
    return
  map_key_list = [key for key in map_key_list]
  while True:
    if len(map_key_list) > DEFAULT_PUT_DELETE_MAX:
      db.delete(map_key_list[:DEFAULT_PUT_DELETE_MAX])
      del map_key_list[:DEFAULT_PUT_DELETE_MAX]
    else:
      db.delete(map_key_list)
      break

