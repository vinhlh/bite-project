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

"""Bite suite handler."""

__author__ = 'phu@google.com (Po Hu)'

import datetime
import logging
import webapp2

from google.appengine.api import users

from handlers import base
from handlers import deferred_util
from models import bite_suite
from models import suite_test_map
from utils import basic_util
from utils import bite_constants


class Error(Exception):
  pass


class LabelInfoFormatError(Error):
  """An error encountered if the label format is not correct."""


class ShowSuiteDetail(base.BaseHandler):
  """Shows the suite details page."""

  def get(self):
    self.post()

  def post(self):
    """Shows the Bite suites info."""
    suite_name = self.GetOptionalParameter('suiteName', '')
    project_name = self.GetOptionalParameter('projectName', '')
    data = {'nav': bite_constants.NAV_DEFAULT_DATA}
    if suite_name and project_name:
      data['commands'] = [{'command': 'loadProject',
                           'suiteName': suite_name,
                           'projectName': project_name}]
    self.RenderTemplate('set.html', {'common': data})


class ShowSuitesHandler(base.BaseHandler):
  """The handler for showing the Bite suites."""

  def get(self):
    self.post()

  def _GetSuitesData(self, project_name):
    """Gets suites data."""
    suites_data = []
    projects = None
    logging.info('The project name is : ' + project_name)
    if project_name:
      projects = [project_name]
    suites = bite_suite.LoadAllSuitesOfProjects(projects)
    for suite in suites:
      labels = [suite.parent().name]
      labels.extend(suite.labels)
      suite_data = {
          'id': str(suite.key()),
          'type': 'suite',
          'title': suite.name,
          'labels': labels,
          'icon': '/images/artifacts/testautomated.png',
          'actions': [
              {'title': 'View details',
               'operation': 'details'}],
          'props': [{'label': '# of tests', 'value': suite.tests_number}]
      }
      suites_data.append(suite_data)
    return suites_data

  def post(self):
    """Shows the Bite suites info."""
    project_name = self.GetOptionalParameter('projectName', '')
    data = self._GetSuitesData(project_name)
    self.response.out.write(
        basic_util.DumpJsonStr({'details': data}))


class LoadAllSuitesInProjectHandler(base.BaseHandler):
  """The handler for loading all Bite suites of a project."""

  def get(self):
    self.post()

  def post(self):
    project_name = self.GetRequiredParameter('projectName')
    suites = bite_suite.LoadAllSuitesOfProject(project_name)
    suite_info = [
        {'name': suite.name, 'key': str(suite.key())}
        for suite in suites]
    self.response.out.write(
        basic_util.DumpJsonStr({'suites': suite_info}))


class DeleteTestsFromSuiteHandler(base.BaseHandler):
  """The handler for deleting tests from a suite."""

  def get(self):
    self.post()

  def post(self):
    """Deletes tests associated with a suite."""
    suite_name = self.GetRequiredParameter('suiteName')
    project_name = self.GetRequiredParameter('projectName')
    suite = bite_suite.LoadSuite(suite_name, project_name)
    if suite:
      suite_test_map.DeleteTestsFromSuite(str(suite.key()))
    else:
      error_log = 'No specified suite is available.'
      logging.error(error_log)
      self.response.out.write(error_log)


class LoadSuiteHandler(base.BaseHandler):
  """The handler for loading a specified Bite suite."""

  def get(self):
    self.post()

  def _dumpLabels(self, labels):
    """Dumps the label string.

    The label string in Json format should be:
    {'labels': ['label1', 'label2', ...]}

    Args:
      labels: A list of labels of a suite.

    Returns:
      A Json string of suite labels list.
    """
    if not labels or not isinstance(labels, list):
      labels = []
    return basic_util.DumpJsonStr({'labels': labels})

  def post(self):
    """Loads a specified suite."""
    suite_name = self.GetOptionalParameter('suiteName', '')
    project_name = self.GetOptionalParameter('projectName', '')
    suite_key_str = self.GetOptionalParameter('suiteKey', '')
    suite = bite_suite.LoadSuite(suite_name, project_name, suite_key_str)
    if suite:
      labels = self._dumpLabels(suite.labels)
      version_url = suite.latest_version_url
      if version_url is None:
        version_url = ''
      self.response.out.write(
          basic_util.DumpJsonStr(
              {'suiteName': suite.name,
               'suiteKey': str(suite.key()),
               'description': suite.description,
               'projectName': suite.parent().name,
               'labels': labels,
               'token': bite_suite.GetSuiteTokens(suite),
               'startUrl': bite_suite.GetStartUrl(suite),
               'interval': bite_suite.ParseWatchdogSetting(
                   suite.watchdog_setting),
               'versionUrl': version_url,
               'emailFrom': bite_suite.GetSuiteAttribute(
                   suite, 'report_setting', 'email_from'),
               'emailTo': bite_suite.GetSuiteAttribute(
                   suite, 'report_setting', 'email_to'),
               'failureThresh': bite_suite.GetSuiteAttribute(
                   suite, 'report_setting', 'failure_thresh'),
               'testSource': suite.test_source,
               'retryTimes': suite.retry_times,
               'defaultTimeout': suite.default_timeout,
               'deleteDeadline': suite.auto_delete_deadline,
               'reminder': suite.reminder_setting}))
    else:
      error_log = 'No specified suite is available.'
      logging.error(error_log)
      self.response.out.write(error_log)


class AddSuiteHandler(base.BaseHandler):
  """The handler for adding a Bite suite."""

  def get(self):
    self.post()

  def _parseLabelStr(self, label_str):
    """Parses the label string.

    The label string in Json format should be:
    {'labels': ['label1', 'label2', ...]}

    Args:
      label_str: A Json format string represents the labels.

    Returns:
      A list of labels.

    Raises:
      LabelInfoFormatError: An error occurred if the label info is incorrect.
    """
    if not label_str:
      return []
    label_obj = basic_util.ParseJsonStr(label_str)
    if label_obj.has_key('labels') and isinstance(label_obj['labels'], list):
      return label_obj['labels']
    else:
      raise LabelInfoFormatError()

  def _parseTestInfoStr(self, test_info_str):
    """Parses the test info string.

    The test info string in Json format should be:
    {'testInfoList': [{'id': xx, 'name': yy,
                       'automated': true}, ...]}

    Args:
      test_info_str: A Json format test info string.

    Returns:
      A list of tests.
    """
    if not test_info_str:
      return []
    test_info_obj = basic_util.ParseJsonStr(test_info_str)
    return test_info_obj['testInfoList']

  def post(self):
    """Adds a specified suite."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    suite_name = self.GetRequiredParameter('suiteName')
    project_name = self.GetRequiredParameter('projectName')
    description = self.GetOptionalParameter('description', '')
    tokens = self.GetOptionalParameter('tokens', '')
    interval = self.GetOptionalParameter('interval', '')
    label_str = self.GetOptionalParameter('labels', '')
    start_url = self.GetOptionalParameter('startUrl', '')
    test_source = self.GetOptionalParameter('testSource', '')
    project_id = self.GetOptionalParameter('projectId', '')
    public_labels_str = self.GetOptionalParameter('publicLabels', '')
    configs_str = self.GetOptionalParameter('configs', '')
    watchdog_setting_str = self.GetOptionalParameter('watchdogSetting', '')
    latest_version_url = self.GetOptionalParameter('versionUrl', '')
    report_setting_str = self.GetOptionalParameter('report', '')
    retry_times = self.GetOptionalIntParameter('retryTimes', 0)
    default_timeout = self.GetOptionalIntParameter(
        'defaultTimeout', bite_suite.DEFAULT_SUITE_TIMEOUT)
    auto_delete_deadline = self.GetOptionalIntParameter(
        'deleteDeadline', bite_suite.DEFAULT_AUTO_DELETE_DEADLINE)
    reminder_setting_str = self.GetOptionalParameter('reminder', '')
    email_from = self.GetOptionalParameter('emailFrom', [])
    email_to = self.GetOptionalParameter('emailTo', [])
    failure_thresh = self.GetOptionalParameter('failureThresh', 100)
    test_info_list_str = self.GetOptionalParameter('testInfo', '')
    tests_num = 0
    test_info_list = []
    public_labels = []
    if public_labels_str:
      public_labels = basic_util.ParseJsonStr(public_labels_str)
    if test_info_list_str:
      test_info_list = self._parseTestInfoStr(test_info_list_str)
      tests_num = len(test_info_list)

    if interval:
      watchdog_setting_str = bite_suite.GetSuiteWatchdogStr(
          {}, int(interval))

    if not latest_version_url:
      latest_version_url = None

    configs_str = bite_suite.GetSuiteConfigStr({}, tokens, start_url)
    report_setting_str = bite_suite.GetSuiteReportStr(
        {}, basic_util.ParseJsonStr(email_from),
        basic_util.ParseJsonStr(email_to), failure_thresh)

    if not bite_suite.CheckSuiteExists(suite_name, project_name):
      suite = bite_suite.AddSuite(
          suite_name, project_name, description,
          self._parseLabelStr(label_str),
          configs_str, watchdog_setting_str, latest_version_url,
          report_setting_str, retry_times, default_timeout,
          auto_delete_deadline, reminder_setting_str, tests_num,
          test_source)
    else:
      suite = bite_suite.UpdateSuite(
          suite_name, project_name, description,
          self._parseLabelStr(label_str),
          configs_str, watchdog_setting_str, latest_version_url,
          report_setting_str, retry_times, default_timeout,
          auto_delete_deadline, reminder_setting_str, tests_num,
          test_source)

    if test_info_list_str:
      suite_test_map.AddTestsToSuite(
          str(suite.key()), test_info_list)


app = webapp2.WSGIApplication(
    [('/suite/add', AddSuiteHandler),
     ('/suite/load', LoadSuiteHandler),
     ('/suite/load_project', LoadAllSuitesInProjectHandler),
     ('/suite/delete_tests', DeleteTestsFromSuiteHandler),
     ('/suite/show_all', ShowSuitesHandler),
     ('/suite/detail', ShowSuiteDetail)],
    debug=True)
