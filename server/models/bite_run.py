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

"""Bite Run model.

Bite Run model is used to identify each run of a group of tests.
"""

__author__ = 'phu@google.com (Po Hu)'

import datetime
import logging
#Import not at top
#pylint: disable-msg=C6204
from google.appengine.ext import db
from models import bite_event
from models import bite_suite
from utils import basic_util


class Error(Exception):
  pass


class MissingRunNameError(Error):
  """Misses the run name."""


class MissingRunError(Error):
  """Misses the run."""


class DuplicatedProjectNameError(Error):
  """Has the project name existing."""


class BiteRunTemplate(db.Model):
  """Contains the run template info."""
  name = db.StringProperty(required=True)
  description = db.StringProperty(required=False)
  suite = db.ReferenceProperty(bite_suite.BiteSuite, required=True)
  run_once = db.BooleanProperty(required=True, default=True)
  watchdog_setting = db.StringProperty(required=False)
  filtered_labels = db.StringListProperty(default=None)
  test_dimension_labels = db.StringListProperty(default=None)
  tokens = db.StringProperty(required=False)
  start_url = db.StringProperty(required=False)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)


class BiteScheduledJob(db.Model):
  """Contains scheduled jobs info."""
  run_template = db.ReferenceProperty(BiteRunTemplate, required=True)
  suite = db.StringProperty(required=False)
  project = db.StringProperty(required=False)
  watchdog_last_time = db.DateTimeProperty()
  target_url_versions = db.StringListProperty()


class BiteRun(db.Model):
  """Contains run related info."""
  name = db.StringProperty(required=True)
  tests_number = db.IntegerProperty(required=False)
  passed_number = db.IntegerProperty(required=False)
  failed_number = db.IntegerProperty(required=False)
  queued_number = db.IntegerProperty(required=False)
  suite = db.ReferenceProperty(bite_suite.BiteSuite, required=True)
  visible = db.BooleanProperty(required=True, default=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  start_time = db.DateTimeProperty(required=False)
  end_time = db.DateTimeProperty(required=False)
  status = db.StringProperty(
      required=False,
      choices=('queued', 'running', 'completed'))
  labels = db.StringListProperty(default=None)
  tokens = db.StringProperty(required=False)
  test_dimension_labels = db.StringListProperty(default=None)
  start_url = db.StringProperty(required=False)
  run_template = db.ReferenceProperty(BiteRunTemplate, required=False)


class BiteRunSlice(db.Model):
  """Contains a run slice info which is used to control results."""
  run = db.ReferenceProperty(BiteRun, required=False)
  passed_number = db.IntegerProperty(required=False)
  failed_number = db.IntegerProperty(required=False)
  queued_number = db.IntegerProperty(required=False)
  tests_number = db.IntegerProperty(required=False)


def GetAllScheduledJobs(project_name=''):
  """Gets all the scheduled jobs."""
  results = BiteScheduledJob.all()
  if project_name:
    results.filter('project =', project_name)
  return results


def AddScheduledJob(run_template_key_str, interval):
  """Adds a scheduled job for a suite."""
  run_template = BiteRunTemplate.get(db.Key(str(run_template_key_str)))
  suite = run_template.suite
  if not interval:
    interval = ParseWatchdogSetting(run_template.watchdog_setting)
  for obj in run_template.bitescheduledjob_set:
    obj.delete()
  # add scheduled job
  if int(interval) > 0:
    scheduled_job = BiteScheduledJob(
        watchdog_last_time=datetime.datetime.now(),
        target_url_versions=[],
        run_template=run_template,
        suite=suite.name,
        project=suite.parent().name)
    scheduled_job.put()
    bite_event.AddEvent(scheduled_job, action='schedule', event_type='schedule',
                        name=run_template.name,
                        labels=run_template.filtered_labels,
                        project=suite.parent().name)


def UpdateScheduledJobs(jobs):
  """Updates the scheduled jobs."""
  db.put(jobs)


def GetRunTemplatesWithSuite(suite):
  """Gets the run templates associated with a suite."""
  return BiteRunTemplate.all().filter('suite =', suite)


def CheckRunTemplateExists(run_template_key_str):
  """Checks if the run template exists or not."""
  try:
    BiteRunTemplate.get(db.Key(run_template_key_str))
    return True
  except db.KindError, err:
    logging.info('The given run template key is not found:' +
                 str(err))
    return False


def AddRunTemplate(name, suite_key_str, description='', run_once=True,
                   watchdog_setting='', filtered_labels=None,
                   test_dimension_labels=None, tokens='',
                   start_url=''):
  """Adds a run template."""
  suite = bite_suite.BiteSuite.get(db.Key(suite_key_str))
  if not name:
    raise MissingRunNameError()

  def PutRun():
    """Saves the run entity."""
    run = BiteRunTemplate(
        name=name,
        description=description,
        suite=suite,
        run_once=run_once,
        watchdog_setting=watchdog_setting,
        filtered_labels=filtered_labels or [],
        test_dimension_labels=test_dimension_labels or [],
        tokens=tokens,
        start_url=start_url)
    run.put()
    return run
  run = db.run_in_transaction(PutRun)
  bite_event.AddEvent(run, action=bite_event.EventActions.CREATE,
                      event_type=bite_event.EventTypes.RUN_TEMPLATE,
                      name=run.name, labels=run.filtered_labels,
                      project=run.suite.parent().name)
  return run


def UpdateRunTemplate(name, suite_key_str, run_template_key_str,
                      description='', run_once=True,
                      watchdog_setting='', filtered_labels=None,
                      test_dimension_labels=None, tokens='',
                      start_url=''):
  """Updates a run template."""
  suite = bite_suite.BiteSuite.get(db.Key(suite_key_str))
  if not name:
    raise MissingRunNameError()
  logging.info(tokens)

  def Update():
    """Updates the bite run template instance."""
    run = BiteRunTemplate.get(db.Key(run_template_key_str))
    run.name = name
    run.description = description
    run.suite = suite
    run.run_once = run_once
    run.watchdog_setting = watchdog_setting
    run.filtered_labels = filtered_labels or []
    run.test_dimension_labels = test_dimension_labels or []
    run.tokens = tokens
    run.start_url = start_url
    run.put()
    return run
  run = db.run_in_transaction(Update)
  bite_event.AddEvent(run, action=bite_event.EventActions.MODIFY,
                      event_type=bite_event.EventTypes.RUN_TEMPLATE,
                      name=run.name, labels=run.filtered_labels,
                      project=run.suite.parent().name)
  return run


def AddRun(name, suite_key, start_time, test_info_list,
           tokens='', labels=None, dimensions=None, start_url='',
           run_template_key_str=''):
  """Adds a run."""
  suite = bite_suite.BiteSuite.get(suite_key)
  if not name:
    if not suite_key:
      raise MissingRunNameError()
    else:
      name = suite.name
  # Add a run entity.
  run_key = db.Key.from_path(bite_suite.BiteSuite.kind(),
                             suite.key().name(),
                             'BiteRun',
                             name + '_' + str(start_time))
  tests_len = len(test_info_list)
  if not labels:
    labels = suite.labels
  run_template = None
  if run_template_key_str:
    run_template = db.Key(run_template_key_str)
  run = BiteRun.get_or_insert(run_key.name(),
                              name=name,
                              tests_number=tests_len,
                              passed_number=0,
                              failed_number=0,
                              queued_number=tests_len,
                              suite=suite,
                              start_time=start_time,
                              end_time=None,
                              status='queued',
                              labels=labels,
                              tokens=tokens,
                              test_dimension_labels=dimensions,
                              start_url=start_url,
                              run_template=run_template)
  bite_event.AddEvent(run, action='create', event_type='run',
                      name=run.name, labels=run.labels,
                      project=run.suite.parent().name)
  return run


def DeleteRun(run_key_str):
  run_key = db.Key(run_key_str)
  db.delete(run_key)
  #bite_event.AddEvent(run_key, action='delete', event_type='run')


def GetRunsOfSuite(suite_key_str, reverse_start_order=False, max_num=None,
                   status=None, past_days=None):
  """Gets runs of a suite."""
  runs = BiteRun.all().filter('suite = ', db.Key(suite_key_str))
  if status and status != 'all':
    runs.filter('status =', status)
  if reverse_start_order:
    runs.order('-start_time')
  if past_days:
    start_time = datetime.datetime.now() - datetime.timedelta(days=past_days)
    runs.filter('start_time >', start_time)
  if max_num:
    return runs.fetch(max_num)
  else:
    return runs


def GetRunsOfTemplate(template_key, reverse_start_order=False, max_num=None,
                      status=None, past_days=None):
  """Gets runs of a template."""
  if isinstance(template_key, str):
    template_key = db.Key(template_key)
  runs = BiteRun.all().filter('run_template = ', template_key)
  if status and status != 'all':
    runs.filter('status =', status)
  if reverse_start_order:
    runs.order('-start_time')
  if past_days:
    start_time = datetime.datetime.now() - datetime.timedelta(days=past_days)
    runs.filter('start_time >', start_time)
  if max_num:
    return runs.fetch(max_num)
  else:
    return runs


def AddRunSlice(run_key, index):
  """Adds a run slice."""
  if not run_key:
    raise MissingRunError()
  run_slice_key_name = run_key.name() + '_' + str(index)
  return BiteRunSlice.get_or_insert(run_slice_key_name,
                                    run=run_key,
                                    passed_number=0,
                                    failed_number=0,
                                    queued_number=0)


def GetSpecifiedRun(tokens):
  """Gets a specified run matching given conditions."""
  runs = (BiteRun.all().filter('queued_number >', 0).
          filter('tokens =', tokens))
  run = runs.fetch(1)[0]
  if run.status == 'queued':
    run.status = 'running'
    run.put()
  return run


def GetLatestRunsThroughSuite(status):
  """Gets the latest runs info through suite info."""
  suites = bite_suite.LoadAllSuitesOfProjects()
  latest_runs = []
  for suite in suites:
    latest_runs.extend(GetRunsOfSuite(str(suite.key()), True, 1, status))
  return latest_runs


def GetLatestRunsThroughTemplate(status, project_name):
  """Gets the latest runs through run template info."""
  projects = None
  logging.info('The project name in run is: ' + project_name)
  if project_name:
    projects = [project_name]
  suites = bite_suite.LoadAllSuitesOfProjects(projects)
  latest_runs = []
  empty_templates = []
  for suite in suites:
    run_templates = GetRunTemplatesWithSuite(suite)
    for run_template in run_templates:
      runs = GetRunsOfTemplate(run_template, True, 1, status)
      if not runs:
        empty_templates.append(run_template)
      latest_runs.extend(runs)
  return latest_runs, empty_templates


def GetTestsNumberOfStatus(run_key_str):
  """Gets the tests number of a specified status."""
  if not run_key_str:
    raise MissingRunError()
  run_key = db.Key(run_key_str)
  run_slices = BiteRunSlice.all().filter('run =', run_key)
  passed_number = 0
  failed_number = 0
  for slice_obj in run_slices:
    passed_number += slice_obj.passed_number
    failed_number += slice_obj.failed_number
  return {'passed': passed_number, 'failed': failed_number}


def GetModel(run_key_str):
  return BiteRun.get(db.Key(run_key_str))


def GetTemplateEntity(run_template_key_str):
  return BiteRunTemplate.get(db.Key(run_template_key_str))


def GetEmptyTemplateData(templates):
  """Gets the data of empty templates."""
  return [{
      'id': '',
      'templateId': str(template.key()),
      'type': 'runTemplate',
      'title': template.name,
      'labels': template.filtered_labels.extend(
          template.test_dimension_labels),
      'icon': '/images/sample/run00-pie.png',
      'state': 'template',
      'actions': [{'title': 'View details',
                   'operation': 'runDetails'},
                  {'title': 'Start a run',
                   'operation': 'startARunTemplate'}],
      'props': []
      } for template in templates]


def GetRunsData(runs):
  """Gets all the relevant runs info."""
  runs_data = []
  for run in runs:
    state = 'running'
    if run.end_time:
      state = 'finished'
    number_obj = GetTestsNumberOfStatus(str(run.key()))
    passed_num = number_obj['passed']
    failed_num = number_obj['failed']
    total_num = passed_num + failed_num
    complete_value = '%s (%d)' % (
        basic_util.GetPercentStr(total_num, run.tests_number),
        total_num)
    passed_value = '%s (%d)' % (
        basic_util.GetPercentStr(passed_num, total_num),
        passed_num)
    failed_value = '%s (%d)' % (
        basic_util.GetPercentStr(failed_num, total_num),
        failed_num)
    labels = [run.suite.parent().name]
    labels.extend(run.labels)
    start_time_pst = basic_util.ConvertFromUtcToPst(run.start_time)
    start_time = basic_util.CreateStartStr(start_time_pst)
    template_id = ''
    if run.run_template:
      template_id = str(run.run_template.key())
    run_data = {
        'id': str(run.key()),
        'templateId': template_id,
        'type': 'run',
        'title': run.name,
        'labels': labels,
        'icon': '/images/sample/run00-pie.png',
        'state': state,
        'actions': [
            {'title': 'View details',
             'operation': 'runDetails'},
            {'title': 'Delete',
             'operation': 'deleteRun'}],
        'props': [{'label': '# of tests', 'value': run.tests_number},
                  {'label': 'started', 'value': start_time},
                  {'label': 'complete', 'value': complete_value},
                  {'label': 'passed', 'value': passed_value},
                  {'label': 'failed', 'value': failed_value}]
    }
    runs_data.append(run_data)
  return runs_data
