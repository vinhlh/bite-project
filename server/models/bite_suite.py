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

"""Bite suite model.

Bite Suite model is one of the main meat of BITE models. Users could add
a list of tests to a suite, and then configure the suite from various of
aspects like watchdog job, reports, dimensions, retry logic, etc.
"""

__author__ = 'phu@google.com (Po Hu)'

import datetime
import logging

from google.appengine.ext import db

from models import bite_event
from models import bite_project
from utils import basic_util


DEFAULT_SUITE_TIMEOUT = 9999
DEFAULT_AUTO_DELETE_DEADLINE = 9999


class Error(Exception):
  pass


class MissingSuiteNameError(Error):
  """Misses the suite name."""


class DuplicatedSuiteNameError(Error):
  """Has the suite name existing under project."""


class MissingProjectError(Error):
  """Misses the project name."""


class BiteSuite(db.Model):
  """Contains a group of tests as well as configurations."""
  name = db.StringProperty(required=True)
  visible = db.BooleanProperty(required=True, default=True)
  description = db.TextProperty(required=False)
  # project = db.ReferenceProperty(bite_project.BiteProject)
  labels = db.StringListProperty(default=None)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  created_time = db.DateTimeProperty(required=False, auto_now_add=True)
  configs = db.TextProperty(required=False)  # Used to override test's config.
  # Either interval or concrete time.
  watchdog_setting = db.StringProperty(required=False)
  latest_version_url = db.LinkProperty(required=False)
  # Includes sender, recipient, pass rate, etc info.
  report_setting = db.TextProperty(required=False)
  retry_times = db.IntegerProperty(required=False)
  default_timeout = db.IntegerProperty(required=False)
  # In how long should the job be auto deleted if not executed.
  auto_delete_deadline = db.IntegerProperty(required=False)
  reminder_setting = db.TextProperty(required=False)
  last_modified_time = db.DateTimeProperty(required=False, auto_now=True)
  last_modified_by = db.UserProperty(required=False, auto_current_user=True)
  tests_number = db.IntegerProperty(required=False)
  test_source = db.StringProperty(required=False,
                                  choices=('acc'))
  test_src_dict = db.TextProperty(required=False)


def ParseWatchdogSetting(watchdog_setting):
  """Parses the watchdog settings and returns the interval in mins."""
  watchdog_setting_obj = basic_util.ParseJsonStr(watchdog_setting)
  if (isinstance(watchdog_setting_obj, dict) and
      watchdog_setting_obj.has_key('every')):
    return int(watchdog_setting_obj['every'])
  else:
    return 0


def LoadSuite(name, project_name, suite_key_str=''):
  """Loads a bite suite."""
  if suite_key_str:
    return BiteSuite.get(db.Key(suite_key_str))
  if not name:
    raise MissingSuiteNameError('There is no suite name defined.')
  if not project_name:
    raise MissingProjectError('No project name was given.')
  suite_key = db.Key.from_path(bite_project.BiteProject.kind(),
                               project_name, 'BiteSuite', name)
  return BiteSuite.get(suite_key)


def LoadAllSuitesOfProjects(project_names=None):
  """Loads all the suites of the given projects."""
  if project_names is None:
    projects = bite_project.GetAllProjects()
    project_names = [project.name for project in projects]
  suites = []
  for project_name in project_names:
    suites.extend(LoadAllSuitesOfProject(project_name))
  return suites


def LoadAllSuitesOfProject(project_name):
  """Loads all of the suites of a project."""
  project_key = db.Key.from_path(bite_project.BiteProject.kind(),
                                 project_name)
  return BiteSuite.all().ancestor(project_key)


def GetSuiteWatchdogStr(watchdog_setting, interval):
  """Creates a watchdog setting string to save."""
  if not watchdog_setting:
    watchdog_setting = {}
  if interval:
    watchdog_setting['every'] = interval
  return basic_util.DumpJsonStr(watchdog_setting)


def GetSuiteConfigStr(configs, tokens, start_url=''):
  """Creates a suite config str."""
  if not configs:
    configs = {}
  if isinstance(configs, str):
    configs = basic_util.ParseJsonStr(configs)['configs']
  configs['tokens'] = tokens
  configs['start_url'] = start_url
  return basic_util.DumpJsonStr({'configs': configs})


def GetSuiteReportStr(report, email_from, email_to, failure_thresh):
  """Creates a suite report str."""
  if not report:
    report = {}
  if isinstance(report, str):
    report = basic_util.ParseJsonStr(report)['report']
  report['email_from'] = email_from
  report['email_to'] = email_to
  report['failure_thresh'] = failure_thresh
  return basic_util.DumpJsonStr({'report': report})


def ParseReportStr(report_str):
  """Parses the report string.

  The report string in Json format should be:
  {'report': {'name1': 'value1',
               ...}}

  Args:
    report_str: A Json format report string.

  Returns:
    A dict of report info.
  """
  if not report_str:
    return {}
  report_obj = basic_util.ParseJsonStr(report_str)
  return report_obj['report']


def ParseConfigStr(configs_str):
  """Parses the configs string.

  The configs string in Json format should be:
  {'configs': {'name1': 'value1',
               ...}}

  Args:
    configs_str: A Json format configs string.

  Returns:
    A dict of configs.
  """
  if not configs_str:
    return {}
  configs_obj = basic_util.ParseJsonStr(configs_str)
  return configs_obj['configs']


def GetSuiteTokens(suite):
  """Gets the tokens of the given suite."""
  try:
    return GetSuiteAttribute(suite, 'configs', 'tokens')
  except:
    return ''


def GetStartUrl(suite):
  """Gets the start url of the given suite."""
  return GetSuiteAttribute(suite, 'configs', 'start_url')


def GetSuiteAttribute(suite, prop, attr):
  """Gets the attribute of the given suite."""
  if isinstance(suite, unicode) or isinstance(suite, str):
    suite = BiteSuite.get(db.Key(suite))
  prop_obj = {}
  if prop == 'configs':
    prop_obj = ParseConfigStr(str(suite.configs))
  elif prop == 'watchdog_setting':
    return ParseWatchdogSetting(suite.watchdog_setting)
  elif prop == 'report_setting':
    prop_obj = ParseReportStr(str(suite.report_setting))
  result = ''
  if prop_obj.has_key(attr):
    result = prop_obj[attr]
  return result


def CheckSuiteExists(suite_name, project_name):
  """Checks if the suite exists or not."""
  suite_key = db.Key.from_path(bite_project.BiteProject.kind(),
                               project_name, 'BiteSuite', suite_name)

  if BiteSuite.get(suite_key):
    return True
  else:
    return False


def UpdateSuite(name, project_name, description='', labels=None, configs='',
                watchdog_setting='', latest_version_url=None, report_setting='',
                retry_times=0, default_timeout=DEFAULT_SUITE_TIMEOUT,
                auto_delete_deadline=DEFAULT_AUTO_DELETE_DEADLINE,
                reminder_setting='', tests_num=0,
                test_source='', test_src_dict=''):
  """Updates the given suite."""
  suite_key = db.Key.from_path(bite_project.BiteProject.kind(),
                               project_name, 'BiteSuite', name)
  suite = BiteSuite.get(suite_key)
  suite.name = name
  suite.description = description
  suite.labels = labels
  suite.configs = configs
  suite.watchdog_setting = watchdog_setting
  suite.latest_version_url = latest_version_url
  suite.report_setting = report_setting
  suite.retry_times = retry_times
  suite.default_timeout = default_timeout
  suite.auto_delete_deadline = auto_delete_deadline
  suite.reminder_setting = reminder_setting
  suite.tests_number = tests_num
  suite.test_source = test_source
  suite.test_src_dict = test_src_dict
  suite.put()
  bite_event.AddEvent(suite, action='modify', event_type='set',
                      name=suite.name, labels=suite.labels,
                      project=suite.parent().name)
  return suite


def AddSuite(name, project_name, description='', labels=None, configs='',
             watchdog_setting='', latest_version_url=None, report_setting='',
             retry_times=0, default_timeout=DEFAULT_SUITE_TIMEOUT,
             auto_delete_deadline=DEFAULT_AUTO_DELETE_DEADLINE,
             reminder_setting='', tests_num=0,
             test_source='', test_src_dict=''):
  """Adds a bite suite."""
  if not name:
    raise MissingSuiteNameError('There is no suite name defined.')

  if not project_name:
    raise MissingProjectError('No project name was given.')
  project_key = db.Key.from_path(bite_project.BiteProject.kind(),
                                 project_name)

  if CheckSuiteExists(name, project_name):
    raise DuplicatedSuiteNameError('Duplicated suite name.')

  # Assume name is ascii.
  suite = BiteSuite.get_or_insert(str(name),
                                  parent=project_key,
                                  name=name,
                                  description=description,
                                  labels=labels or [],
                                  configs=configs,
                                  watchdog_setting=watchdog_setting,
                                  latest_version_url=latest_version_url,
                                  report_setting=report_setting,
                                  retry_times=retry_times,
                                  default_timeout=default_timeout,
                                  auto_delete_deadline=auto_delete_deadline,
                                  reminder_setting=reminder_setting,
                                  tests_number=tests_num,
                                  test_source=test_source,
                                  test_src_dict=test_src_dict)
  bite_event.AddEvent(suite, action='create', event_type='set',
                      name=suite.name, labels=suite.labels,
                      project=suite.parent().name)
  return suite
