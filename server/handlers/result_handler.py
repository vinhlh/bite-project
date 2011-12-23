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

"""Bite fetch job handler."""

__author__ = 'phu@google.com (Po Hu)'

import logging
import webapp2

from handlers import base
from models import bite_result
from models import bite_run
from utils import basic_util


class Error(Exception):
  pass


class FetchResultHandler(base.BaseHandler):
  """The handler for fetching a queued result."""

  def get(self):
    self.post()

  def post(self):
    """Fetches a random result matching criteria."""
    tokens = self.GetOptionalParameter('tokens', '')
    run = bite_run.GetSpecifiedRun(tokens)
    job = {}
    result = {}
    if run:
      job = bite_result.GetRandomQueuedJob(run)
    if job:
      result = {'result': {'id': job.key().id(),
                           'testId': job.test_id,
                           'parent': str(job.parent().key())}}
    self.response.out.write(
        basic_util.DumpJsonStr(result))


class UpdateResultHandler(base.BaseHandler):
  """The handler for updating a result."""

  def get(self):
    self.post()

  def post(self):
    """Updates the result."""
    result = self.GetRequiredParameter('result')
    status = self.GetOptionalParameter('status', 'undefined')
    screenshot = self.GetOptionalParameter('screenshot', '')
    log = self.GetOptionalParameter('log', '')
    ip = self.request.remote_addr
    logging.info(str(result))
    result_obj = basic_util.ParseJsonStr(str(result))['result']
    if result_obj.has_key('runKey'):
      temp = bite_result.GetResult(
          result_obj['runKey'], result_obj['testId'],result_obj['testName'])
      # If multiple temp has multiple values, uses the first one.
      result = temp.get()
      if result:
        result_obj['id'] = result.key().id()
        result_obj['parent'] = str(result.parent().key())

    result = bite_result.UpdateResult(
        result_obj['id'], result_obj['parent'],
        status, screenshot, log, '', ip)
    self.response.out.write(
        'Result has been successfully updated.' + result.test_id)


class ViewResultHandler(base.BaseHandler):
  """The handler for viewing a result."""

  def get(self):
    self.post()

  def post(self):
    """Updates the result."""
    resultKeyStr = self.GetRequiredParameter('resultKey')
    result = bite_result.LoadResultByKeyStr(resultKeyStr)
    params = {'screenshot': str(result.screenshot)}
    self.response.out.write(basic_util.DumpJsonStr(params))


app = webapp2.WSGIApplication(
    [('/result/fetch', FetchResultHandler),
     ('/result/update', UpdateResultHandler),
     ('/result/view', ViewResultHandler)],
    debug=True)

