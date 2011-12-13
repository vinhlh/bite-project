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

"""Bite run handler."""

__author__ = 'phu@google.com (Po Hu)'

#Import not at top
#pylint: disable-msg=C6204
#Statement before imports
#pylint: disable-msg=C6205
#Invalid method name
#pylint: disable-msg=C6409
#Catch Exception
#pylint: disable-msg=W0703
import datetime
import logging
try:
  import auto_import_fixer
except ImportError:
  pass

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from handlers import base
from handlers import deferred_util
from models import bite_project
from models import bite_result
from models import bite_run
from models import bite_suite
from utils import basic_util


DEFAULT_RUNS_NUMBER_PER_PAGE = 500


class Error(Exception):
  pass


class NotEnoughInfoError(Error):
  """Raised when there is not enough info passed."""


class ShowRunsOfSameSuiteHandler(base.BaseHandler):
  """The handler for showing the runs of the same suite."""

  def get(self):
    self.post()

  def post(self):
    """Shows the requested runs."""
    suite_key_str = self.GetOptionalParameter('suiteKey')
    suite_name = self.GetOptionalParameter('suiteName')
    project_name = self.GetOptionalParameter('projectName')
    run_filter = self.GetOptionalParameter('filter', 'all')

    if not suite_key_str:
      suite_key_str = str(bite_suite.LoadSuite(suite_name, project_name).key())

    runs = []
    if (run_filter == 'running' or
        run_filter == 'queued' or
        run_filter == 'completed'):
      runs = bite_run.GetRunsOfSuite(suite_key_str, True, status=run_filter,
                                     max_num=DEFAULT_RUNS_NUMBER_PER_PAGE)
    elif run_filter.startswith('day'):
      days = int(run_filter[3:])
      logging.info('Start from the past : ' + str(days))
      runs = bite_run.GetRunsOfSuite(suite_key_str, True, past_days=days,
                                     max_num=DEFAULT_RUNS_NUMBER_PER_PAGE)
    elif run_filter == 'all':
      runs = bite_run.GetRunsOfSuite(suite_key_str, True,
                                     max_num=DEFAULT_RUNS_NUMBER_PER_PAGE)
    self.response.out.write(basic_util.DumpJsonStr(
        {'runs': bite_run.GetRunsData(runs)}))


class ShowRunsHandler(base.BaseHandler):
  """The handler for showing the Bite runs."""

  def get(self):
    self.post()

  def setSelectedNav(self, selected_scope, name):
    """Sets the selected nav item."""
    for i in range(len(selected_scope['filters'])):
      if selected_scope['filters'][i]['name'] == name:
        selected_scope['filters'][i]['selected'] = True
      else:
        selected_scope['filters'][i]['selected'] = False

  def post(self):
    """Shows the Bite runs info."""
    run_filter = self.GetOptionalParameter('filter', 'all')
    project_name = self.GetOptionalParameter('projectName', '')
    if run_filter == 'scheduled':
      data = self._GetScheduledRunsData(project_name)
    else:
      runs, templates = bite_run.GetLatestRunsThroughTemplate(
          run_filter, project_name)
      data = bite_run.GetRunsData(runs)
      data.extend(bite_run.GetEmptyTemplateData(templates))
    self.response.out.write(
        basic_util.DumpJsonStr({'details': data}))

  def _GetScheduledRunsData(self, project_name):
    """Gets the scheduled runs data."""
    jobs = bite_run.GetAllScheduledJobs(project_name)
    runs_data = []
    for job in jobs:
      run_template = job.run_template
      suite = run_template.suite
      last_time = basic_util.CreateStartStr(job.watchdog_last_time)
      interval = bite_suite.ParseWatchdogSetting(
          run_template.watchdog_setting)
      run_data = {
          'id': str(job.key()),
          'type': 'run',
          'title': run_template.name,
          'labels': [suite.parent().name].extend(run_template.filtered_labels),
          'icon': '/images/sample/run00-pie.png',
          'props': [{'label': '# of tests', 'value': suite.tests_number},
                    {'label': 'last time', 'value': last_time},
                    {'label': 'interval', 'value': str(interval) + ' min'}]
      }
      runs_data.append(run_data)
    return runs_data


class GetDetailsHandler(base.BaseHandler):
  """Gets the details info of a given run."""

  def get(self):
    self.post()

  def _CreateDurationStr(self, time_delta):
    hours, remainder = divmod(time_delta.seconds, 3600)
    minutes = remainder / 60
    return '%dd %dh %dm' % (time_delta.days, hours, minutes)

  def AddRunSummary(self, params, passed_num, failed_num, run_start_time,
                    run_lead, run):
    """Adds the run summary info in the given dict."""
    completed_num = passed_num + failed_num
    uncompleted_num = run.tests_number - passed_num - failed_num
    completed_str = '%s (%d of %d)' % (
        basic_util.GetPercentStr(completed_num, run.tests_number),
        completed_num, run.tests_number)
    passed_str = '%s (%d of %d)' % (
        basic_util.GetPercentStr(passed_num, completed_num),
        passed_num, completed_num)
    failed_str = '%s (%d of %d)' % (
        basic_util.GetPercentStr(failed_num, completed_num),
        failed_num, completed_num)
    uncompleted_str = '%s (%d of %d)' % (
        basic_util.GetPercentStr(uncompleted_num, run.tests_number),
        uncompleted_num, run.tests_number)
    start_time_pst = basic_util.ConvertFromUtcToPst(run_start_time)
    elapsed_time = datetime.datetime.now() - run_start_time
    elapsed_time_str = self._CreateDurationStr(elapsed_time)
    start_time_str = basic_util.CreateStartStr(start_time_pst)

    params['completed_str'] = completed_str
    params['passed_str'] = passed_str
    params['failed_str'] = failed_str
    params['uncompleted_str'] = uncompleted_str
    params['elapsed_time_str'] = elapsed_time_str
    params['start_time_str'] = start_time_str
    params['run_lead'] = run_lead
    params['passed_num'] = passed_num
    params['failed_num'] = failed_num
    params['uncompleted_num'] = uncompleted_num

  def AddRunDetails(self, results):
    """Creates the details info object."""
    details = []
    for result in results:
      finish_time_str = ''
      if result.finished_time:
        finish_time_pst = basic_util.ConvertFromUtcToPst(result.finished_time)
        finish_time_str = basic_util.CreateStartStr(finish_time_pst)
      details.append({'id': result.test_id,
                      'resultKey': str(result.key()),
                      'log': str(result.log),
                      'name': result.test_name,
                      'status': result.status,
                      'when': finish_time_str,
                      'tester': result.executor_ip,
                      'labels': result.labels})
    return details

  def post(self):
    """Starts a run and kicks off the tests."""
    run_key_str = self.GetRequiredParameter('runKey')
    run = bite_run.GetModel(run_key_str)
    results_num = self.GetOptionalIntParameter('resultsNum', 5)
    completed_numbers = bite_run.GetTestsNumberOfStatus(run_key_str)
    passed_num = completed_numbers['passed']
    failed_num = completed_numbers['failed']
    run_start_time = run.start_time
    run_lead = ''
    if run.created_by:
      run_lead = run.created_by.email()
    results = bite_result.GetResultsOfRun(run_key_str, results_num)
    details = {}
    self.AddRunSummary(details, passed_num, failed_num,
                       run_start_time, run_lead, run)
    details['results'] = self.AddRunDetails(results)
    self.response.out.write(
        basic_util.DumpJsonStr({'details': details}))


class LoadResultsSummaryHandler(GetDetailsHandler):
  """Loads the results summary handler."""

  def get(self):
    self.post()

  def post(self):
    """Returns to client the run's results summary."""
    run_key_str = self.GetRequiredParameter('runKey')
    run = bite_run.GetModel(run_key_str)
    completed_numbers = bite_run.GetTestsNumberOfStatus(run_key_str)
    passed_num = completed_numbers['passed']
    failed_num = completed_numbers['failed']
    run_start_time = run.start_time
    run_lead = ''
    if run.created_by:
      run_lead = run.created_by.email()
    data = {}
    self.AddRunSummary(data, passed_num, failed_num,
                       run_start_time, run_lead, run)
    details = {
        'startTimeStr': data['start_time_str'],
        'elapsedTimeStr': data['elapsed_time_str'],
        'numOfTesters': '',
        'resultsLabels': run.labels,
        'passedNum': data['passed_num'],
        'failedNum': data['failed_num'],
        'uncompletedNum': data['uncompleted_num'],
        'summaryRows': [
            {'type': 'All',
             'pass': data['passed_str'],
             'fail': data['failed_str'],
             'notRun': data['uncompleted_str'],
             'total': run.tests_number}
        ],

    }
    self.response.out.write(
        basic_util.DumpJsonStr({'data': details}))


class LoadResultsDetailsHandler(GetDetailsHandler):
  """Loads the results summary handler."""

  def get(self):
    self.post()

  def post(self):
    """Returns the run's detailed results."""
    run_key_str = self.GetRequiredParameter('runKey')
    results = bite_result.GetResultsOfRun(run_key_str, 9999)
    data = {}
    data['results'] = self.AddRunDetails(results)
    details = {
        'numOfTests': len(data['results']),
        'resultRows': data['results']
    }
    self.response.out.write(
        basic_util.DumpJsonStr({'data': details}))


class LoadRunTemplateHandler(base.BaseHandler):
  """Loads a run template."""

  def get(self):
    self.post()

  def post(self):
    """Loads a run template."""
    run_key_str = self.GetOptionalParameter('runKey', '')
    run_template_key_str = self.GetOptionalParameter('runTemplateKey', '')
    if run_key_str:
      run = bite_run.GetModel(run_key_str)
      run_template = run.run_template
    else:
      run_template = bite_run.GetTemplateEntity(run_template_key_str)
    if run_template:
      self.response.out.write(
          basic_util.DumpJsonStr(
              {'suiteKey': str(run_template.suite.key()),
               'runKey': run_key_str,
               'runTemplateKey': str(run_template.key()),
               'runName': run_template.name,
               'runDesc': run_template.description,
               'filteredLabels': run_template.filtered_labels,
               'dimensionLabels': run_template.test_dimension_labels,
               'runTokens': run_template.tokens,
               'runRecurMethod': not run_template.run_once,
               'interval': bite_suite.ParseWatchdogSetting(
                   run_template.watchdog_setting),
               'runStartUrl': run_template.start_url}))
    else:
      error_log = 'No specified run template is available.'
      logging.error(error_log)
      self.response.out.write(error_log)


class AddRunTemplateHandler(base.BaseHandler):
  """Adds a run template."""

  def get(self):
    self.post()

  def post(self):
    """Adds a run template."""
    suite_key_str = self.GetOptionalParameter('suiteKey', '')
    run_template_key_str = self.GetOptionalParameter('runTemplateKey', '')
    run_name = self.GetRequiredParameter('runName')
    run_description = self.GetOptionalParameter('runDesc', '')
    run_filtered_labels = self.GetOptionalParameter('filteredLabels', '')
    run_dimension_labels = self.GetOptionalParameter('dimensionLabels', '')
    run_tokens = self.GetOptionalParameter('runTokens', '')
    run_recurring = self.GetOptionalParameter('runRecurMethod', True)
    run_start_url = self.GetOptionalParameter('runStartUrl', '')
    watchdog_setting_str = self.GetOptionalParameter('watchdogSetting', '')
    interval = self.GetOptionalParameter('interval', '')

    if interval:
      watchdog_setting_str = bite_suite.GetSuiteWatchdogStr(
          {}, int(interval))
    if not suite_key_str:
      logging.info('run tmeplate key str:' + run_template_key_str)
      suite_key_str = str(
          bite_run.GetTemplateEntity(run_template_key_str).suite.key())
    if run_filtered_labels:
      run_filtered_labels = basic_util.ParseJsonStr(run_filtered_labels)
    if run_dimension_labels:
      run_dimension_labels = basic_util.ParseJsonStr(run_dimension_labels)

    if (not run_template_key_str or
        not bite_run.CheckRunTemplateExists(run_template_key_str)):
      run_template = bite_run.AddRunTemplate(
          run_name, suite_key_str, run_description, run_recurring,
          watchdog_setting_str, run_filtered_labels,
          run_dimension_labels, run_tokens,
          run_start_url)
    else:
      run_template = bite_run.UpdateRunTemplate(
          run_name, suite_key_str, run_template_key_str,
          run_description, run_recurring,
          watchdog_setting_str, run_filtered_labels,
          run_dimension_labels, run_tokens,
          run_start_url)
    if watchdog_setting_str:
      bite_run.AddScheduledJob(str(run_template.key()), int(interval))
    self.response.out.write(str(run_template.key()))


class CheckScheduledJobs(base.BaseHandler):
  """Checks whether to run the scheduled jobs."""

  def get(self):
    self.post()

  def _checkHitInterval(self, last_time, interval, test):
    elapsed_time = datetime.datetime.now() - last_time
    elapsed_minutes = elapsed_time.days * 24 * 60 + elapsed_time.seconds / 60
    logging.info(
        'Since last run, it has passed ' + str(elapsed_minutes) + ' mins')
    if test:
      return True
    else:
      return elapsed_minutes > interval

  def CheckScheduledJob(self, test):
    """Checks whether to launch the scheduled jobs."""
    jobs = bite_run.GetAllScheduledJobs()
    updated_jobs = []
    for job in jobs:
      interval = bite_suite.ParseWatchdogSetting(
          job.run_template.watchdog_setting)
      if (interval and self._checkHitInterval(job.watchdog_last_time,
                                              interval, test)):
        self.kickOffScheduledJob(job.run_template)
        job.watchdog_last_time = datetime.datetime.now()
        updated_jobs.append(job)
    if updated_jobs:
      bite_run.UpdateScheduledJobs(updated_jobs)

  def kickOffScheduledJob(self, run_template):
    deferred_util.StartRun(
        str(run_template.suite.key()),
        run_template.name, [],
        run_template.tokens,
        run_template.filtered_labels,
        run_template.test_dimension_labels,
        run_template.start_url,
        str(run_template.key()),
        run_template.created_by)

  def post(self):
    """Checks whether to run a suite."""
    test = self.GetOptionalParameter('test', '')
    self.CheckScheduledJob(test)
    self.response.out.write('done')


class AddRealTimeRunHandler(base.BaseHandler):
  """The handler for adding a realtime run."""

  def get(self):
    self.post()

  def post(self):
    """Starts a run and kicks off the tests."""
    user = users.get_current_user()
    run_name = self.GetRequiredParameter('runName')
    test_info_list_str = self.GetRequiredParameter('testInfoList')
    project_name = self.GetOptionalParameter('projectName', 'default')
    suite_name = self.GetOptionalParameter('suiteName', 'default')
    user_agent = self.GetOptionalParameter('userAgent', '')

    test_info_list = basic_util.ParseJsonStr(test_info_list_str)

    # Creates the test info list based on the given tests info.
    test_list = []
    for test in test_info_list:
      test_list.append({'id': str(test['id']),
                        'title': test['name'],
                        'name': test['name'],
                        'automated': True,
                        'author': '',
                        'labels': [run_name]})

    # Creates the suite if the required suite doesn't exist.
    try:
      project = bite_project.GetProject(project_name)
    except bite_project.NoProjectFoundError:
      project = bite_project.AddProject(project_name, '')

    # Creates the suite if the required suite doesn't exist.
    if not bite_suite.CheckSuiteExists(suite_name, project_name):
      suite = bite_suite.AddSuite(suite_name, project_name)
    else:
      suite = bite_suite.LoadSuite(suite_name, project_name)

    # Creates the run.
    run_key = deferred_util.StartRun(suite.key(), run_name, test_list, '',
                                     [suite_name, user_agent], [], None, '',
                                     user)

    self.response.out.write(run_key)


class AddRunHandler(base.BaseHandler):
  """The handler for adding a Bite run."""

  def get(self):
    self.post()

  def post(self):
    """Starts a run, kicks off the tests and returns the run key."""
    user = users.get_current_user()
    suite_key = self.GetOptionalParameter('suiteKey', '')
    run_template_key = self.GetOptionalParameter('runTemplateKey', '')
    run_key = self.GetOptionalParameter('runKey', '')
    run_name = self.GetOptionalParameter('runName', '')
    test_info_list = self.GetOptionalParameter('testInfoList', [])
    tokens = self.GetOptionalParameter('tokens', '')
    labels = self.GetOptionalParameter('labels', [])
    dimensions = self.GetOptionalParameter('dimensions', [])
    start_url = self.GetOptionalParameter('startUrl', '')

    if not suite_key and not run_template_key and not run_key:
      raise NotEnoughInfoError('Not enough info to start the run.')

    run_template = {}
    if run_key:
      run_entity = bite_run.GetModel(run_key)
      if run_entity.run_template:
        run_template = run_entity.run_template
        run_template_key = str(run_template.key())
    if run_template_key:
      if not run_template:
        run_template = bite_run.GetTemplateEntity(run_template_key)
      suite_key = str(run_template.suite.key())
      run_name = run_template.name
      tokens = run_template.tokens
      labels = run_template.filtered_labels
      dimensions = run_template.test_dimension_labels
      start_url = run_template.start_url

    deferred_util.StartRun(
        suite_key, run_name, test_info_list, tokens, labels,
        dimensions, start_url, run_template_key, user)
    self.response.out.write('done')


class DeleteRunHandler(base.BaseHandler):
  """The handler for deleting a Bite run."""

  def get(self):
    self.post()

  def post(self):
    run_key = self.GetRequiredParameter('runKey')
    deferred_util.DeleteResultsOfRun(
        run_key,
        deferred_util.DEFAULT_RESULTS_NUM_PER_TASK)
    bite_run.DeleteRun(run_key)
    self.response.out.write('done deleting!')


class GetRunsOfSuiteHandler(base.BaseHandler):
  """The handler for getting Bite runs based on suites."""

  def get(self):
    self.post()

  def post(self):
    suite_key_str = self.GetRequiredParameter('suiteKey')
    runs = bite_run.GetRunsOfSuite(suite_key_str)
    runs_info = [
        {'name': run.name, 'key': str(run.key())}
        for run in runs]
    self.response.out.write(
        basic_util.DumpJsonStr({'runs': runs_info}))


class GetNumOfStatus(base.BaseHandler):
  """Gets number of tests in a specified status."""

  def get(self):
    self.post()

  def post(self):
    status = self.GetRequiredParameter('status')
    run_key_str = self.GetRequiredParameter('runKey')
    number = bite_run.GetTestsNumberOfStatus(run_key_str, status)
    self.response.out.write(str(number))


application = webapp.WSGIApplication(
    [('/run/add', AddRunHandler),
     ('/run/delete', DeleteRunHandler),
     ('/run/get_runs', GetRunsOfSuiteHandler),
     ('/run/get_num', GetNumOfStatus),
     ('/run/show_all', ShowRunsHandler),
     ('/run/same_suite', ShowRunsOfSameSuiteHandler),
     ('/run/get_details', GetDetailsHandler),
     ('/run/load_results_summary', LoadResultsSummaryHandler),
     ('/run/load_results_details', LoadResultsDetailsHandler),
     ('/run/check_scheduled_jobs', CheckScheduledJobs),
     ('/run/add_template', AddRunTemplateHandler),
     ('/run/load_template', LoadRunTemplateHandler),
     ('/run/add_realtime_run', AddRealTimeRunHandler)],
    debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
