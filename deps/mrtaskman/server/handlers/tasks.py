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

"""Handlers for the MrTaskman Tasks API."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

from google.appengine.api import users
from google.appengine.ext.blobstore import blobstore

import cgi
import json
import logging
import quopri
import urllib
import webapp2

from models import tasks
from util import model_to_dict
from third_party.prodeagle import counter


class TasksScheduleHandler(webapp2.RequestHandler):
  """Handles the creation of a new Task, also known as scheduling."""

  def post(self):
    """TODO(jeff.carollo): Specify request and response format."""
    counter.incr('Tasks.Schedule')
    content_type = self.request.headers['Content-Type']
    if 'application/json' not in content_type:
      logging.info('Content-Type: %s', content_type)
      self.response.out.write('Content-Type must be application/json.\n')
      self.response.set_status(415)
      return

    body = self.request.body.decode('utf-8')
    if body is None:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('Config is required in message body\n')
      self.response.set_status(400)
      return

    config = urllib.unquote(body)
    logging.info('Config: %s', config)

    try:
      parsed_config = json.loads(config, 'utf-8')
      if not parsed_config:
        raise Exception('json could not parse config.')
    except Exception, e:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('Failure parsing config.\n')
      self.response.out.write(e)
      self.response.out.write('\n')
      self.response.set_status(400)
      return

    try:
      name = parsed_config['task']['name']
    except KeyError, e:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('Failure parsing config.\n')
      self.response.out.write('task.name is required\n')
      self.response.set_status(400)
      return

    try:
      executor_requirements = parsed_config['task']['requirements']['executor']
      assert executor_requirements
      assert isinstance(executor_requirements, list)
      for executor_req in executor_requirements:
        assert isinstance(executor_req, basestring)
    except KeyError, e:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('Failure parsing config.\n')
      self.response.out.write('task.requirements.executor is required\n')
      self.response.set_status(400)
      return
    except AssertionError, e:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('Failure parsing config.\n')
      self.response.out.write(
          'task.requirements.executor must be a non-empty list of strings.\n')
      self.response.set_status(400)
      return

    priority = parsed_config['task'].get('priority', 0)
    try:
      logging.info('priority is %s', priority)
      priority = int(priority)
    except ValueError:
      counter.incr('Tasks.Schedule.400')
      self.response.out.write('task.priority must be an integer\n')
      self.response.set_status(400)
      return

    user = users.GetCurrentUser()

    scheduled_task = tasks.Schedule(
        name, config, user, executor_requirements, priority)

    try:
      email = user.email()
    except:
      email = 'unauthenticated'

    task_id = scheduled_task.key().id()
    logging.info('%s created task %s with ID %s.',
        email, name, task_id)
    logging.info('Config: %s', config)

    # Success. Write response.
    self.response.headers['Content-Type'] = 'application/json'
    response = dict()
    response['id'] = int(task_id)
    response['kind'] = 'mrtaskman#taskid'
    json.dump(response, self.response.out, indent=2)
    self.response.out.write('\n')
    counter.incr('Tasks.Schedule.200')


class TasksHandler(webapp2.RequestHandler):
  def get(self, task_id):
    """Retrieves a single task given by task_id."""
    counter.incr('Tasks.Get')
    # TODO(jeff.carollo): Specify request and response format."""
    task_id = int(task_id)
    task = tasks.GetById(task_id)

    if task is None:
      counter.incr('Tasks.Get.404')
      self.error(404)
      return

    # Success. Write response.
    self.response.headers['Content-Type'] = 'application/json'
    response = model_to_dict.ModelToDict(task)
    response['kind'] = 'mrtaskman#task'
    json.dump(response, self.response.out, indent=2)
    self.response.out.write('\n')
    counter.incr('Tasks.Get.200')

  def delete(self, task_id):
    """Removes a single task given by task_id."""
    counter.incr('Tasks.Delete')
    task_id = int(task_id)
    success = tasks.DeleteById(task_id)
    if not success:
      counter.incr('Tasks.Delete.404')
      self.error(404)
      return
    # 200 OK.
    counter.incr('Tasks.Delete.200')

  def post(self, task_id):
    """Uploads results of a task, including STDOUT and STDERR."""
    counter.incr('Tasks.Update')
    logging.info('Request: %s', self.request.body)
    task_id = int(task_id)

    blob_infos = self.GetBlobInfosFromPostBody()

    task_result = self.request.get('task_result', None)
    if task_result:
      task_result = quopri.decodestring(task_result).decode('ISO-8859-1')
    if task_result:
      try:
        task_result = json.loads(task_result, 'ISO-8859-1')
      except ValueError, e:
        self.response.out.write('Field "task_result" must be valid JSON.\n')
        logging.info(e)
        task_result = None
    if not task_result:
      counter.incr('Tasks.Update.400')
      self.DeleteBlobs(blob_infos)
      self.response.out.write('Field "task_result" is required.\n')
      self.response.set_status(400)
      return

    # Get required attempt and exit_code.
    try:
      # TODO(jeff.carollo): Make attempt a required path parameter,
      # and make it restful by delivering it in the tasks.assign response.
      attempt = task_result['attempt']
      exit_code = task_result['exit_code']
      assert isinstance(attempt, int)
      assert isinstance(exit_code, int)
    except KeyError, AssertionError:
      counter.incr('Tasks.Update.400')
      self.DeleteBlobs(blob_infos)
      self.response.out.write(
          'task_result must contain integers "attempt" and "exit_code".')
      self.response.set_status(400)
      return

    result_metadata = task_result.get('result_metadata', None)
    if result_metadata:
      try:
        result_metadata = json.dumps(result_metadata, indent=2)
      except:
        counter.incr('Tasks.Update.400')
        self.DeleteBlobs(blob_infos)
        self.response.out.write(
            'result_metadata must be JSON serializable.')
        self.response.set_status(400)
        return

    # Get optional execution_time.
    execution_time = task_result.get('execution_time', None)

    # Get optional blobs for STDOUT and STDERR.
    stdout = blob_infos.get('STDOUT', None)
    stderr = blob_infos.get('STDERR', None)
    stdout_download_url = self.MakeTaskResultFileDownloadUrl(stdout)
    stderr_download_url = self.MakeTaskResultFileDownloadUrl(stderr)

    # Get optional device_serial_number.
    device_serial_number = task_result.get('device_serial_number', None)

    # Get optional worker_log.
    worker_log = task_result.get('worker_log', None)

    try:
      tasks.UploadTaskResult(task_id, attempt, exit_code,
                             execution_time, stdout, stderr,
                             stdout_download_url, stderr_download_url,
                             device_serial_number, result_metadata,
                             worker_log)
    except tasks.TaskNotFoundError:
      counter.incr('Tasks.Update.404')
      self.DeleteBlobs(blob_infos)
      self.response.out.write('Task %d does not exist.' % task_id)
      self.response.set_status(404)
      return
    except tasks.TaskTimedOutError:
      counter.incr('Tasks.Update.400')
      self.DeleteBlobs(blob_infos)
      self.response.out.write('Response for task %d timed out' % task_id)
      self.response.set_status(400)
      return

    counter.incr('Tasks.Update.200')
    # 200 OK.

  def DeleteBlobs(self, blob_infos):
    """Deletes blobs referenced in this request.

    Should be called whenever post() returns a non-200 response.
    """
    for (_, blob_info) in blob_infos.items():
      blob_info.delete()

  def GetBaseUrl(self, url):
    """Returns 'http://foo.com' from 'http://foo.com/bar/baz?foobar'.

    TODO(jeff.carollo): Extract into utility.
    """
    import urlparse
    split = urlparse.urlsplit(url)
    return '%s://%s' % (split.scheme, split.netloc)

  def MakeTaskResultFileDownloadUrl(self, blob_info):
    """Creates a download URL for the given blob.

    Args:
      blob_info: A blobstore.BlobInfo, or None.

    Returns:
      A download path as str, or None if blob_info was None.
    """
    if not blob_info:
      return None
    return '%s/taskresultfiles/%s' % (
        self.GetBaseUrl(self.request.url), blob_info.key())

  # TODO(jeff.carollo): Extract into common base class.
  def GetBlobInfosFromPostBody(self):
    """Returns a dict of {'form_name': blobstore.BlobInfo}."""
    blobs = {}
    for (field_name, field_storage) in self.request.POST.items():
      if isinstance(field_storage, cgi.FieldStorage):
        blobs[field_name] = blobstore.parse_blob_info(field_storage)
    return blobs


def MakeTaskCompleteUrl(task_id):
  """Returns a URL for a worker to POST to when done with given Task."""
  return blobstore.create_upload_url('/tasks/%d' % task_id)


class TasksAssignHandler(webapp2.RequestHandler):
  """Handles /tasks/assign, which hands off tasks to workers."""

  def put(self):
    # TODO(jeff.carollo): Specify request and response format."""
    counter.incr('Tasks.Assign')
    body = self.request.body.decode('utf-8')
    if body is None:
      counter.incr('Tasks.Assign.400')
      self.response.out.write('AssignRequest is required in message body\n')
      self.response.set_status(400)
      return

    assign_request = urllib.unquote(body)
    logging.info('assign_request: %s', assign_request)

    try:
      parsed_request = json.loads(assign_request)
      if not parsed_request:
        raise Exception('json could not parse AssignRequest.')
    except Exception, e:
      counter.incr('Tasks.Assign.400')
      self.response.out.write('Failure parsing AssignRequest.\n')
      self.response.out.write(e)
      self.response.out.write('\n')
      self.response.set_status(400)
      return

    # TODO(jeff.carollo): Make these real objects with validate methods.
    try:
      worker = parsed_request['worker']
    except KeyError, e:
      counter.incr('Tasks.Assign.400')
      self.response.out.write('AssignRequest.worker is required.\n')
      self.response.out.write(e)
      self.response.out.write('\n')
      self.response.set_status(400)
      return

    try:
      executor_capabilities = parsed_request['capabilities']['executor']
    except KeyError, e:
      counter.incr('Tasks.Assign.400')
      self.response.out.write(
          'AssignRequest.capabilities.executor is required.\n')
      self.response.out.write(e)
      self.response.out.write('\n')
      self.response.set_status(400)
      return

    counters = counter.Batch()
    for executor_name in executor_capabilities:
      counters.incr('Executors.%s.Assign' % executor_name)
    counters.commit()

    task = tasks.Assign(worker, executor_capabilities)

    self.response.headers['Content-Type'] = 'application/json'
    if task is None:
      return

    response = model_to_dict.ModelToDict(task)
    response['kind'] = 'mrtaskman#task'
    json.dump(response, self.response.out, indent=2)
    self.response.out.write('\n')
    counter.incr('Tasks.Assign.200')


class TaskCompleteUrlHandler(webapp2.RequestHandler):
  """In case our task complete URL expires."""
  def get(self, task_id):
    counter.incr('Tasks.GetTaskCompleteUrl')
    try:
      task_id = int(task_id)
    except:
      counter.incr('Tasks.GetTaskCompleteUrl.400')
      self.response.set_status(400)
      self.response.out.write('task_id must be an integer.')
      return

    response = {}
    response['kind'] = 'mrtaskman#task_complete_url'
    response['task_complete_url'] = MakeTaskCompleteUrl(task_id)

    json.dump(response, self.response.out, indent=2)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('\n')
    counter.incr('Tasks.GetTaskCompleteUrl.200')


class TasksListByExecutorHandler(webapp2.RequestHandler):
  def get(self, executor):
    """Lists tasks for a given executor."""
    limit = self.request.get('limit', 1000)
    limit = int(limit)
    task_list = tasks.GetByExecutor(executor, limit)
    response = {}
    response['kind'] = 'mrtaskman#task_list'
    response['tasks'] = [model_to_dict.ModelToDict(task)
                         for task in task_list]

    json.dump(response, self.response.out, indent=2)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('\n')

  def delete(self, executor):
    """Deletes all tasks for a given executor."""
    tasks.DeleteByExecutor(executor)
    self.response.out.write('Delete task started.\n')
    self.response.headers['Content-Type'] = 'text/plain'


class TasksListByNameHandler(webapp2.RequestHandler):
  def get(self):
    name = self.request.get('name', None)
    if not name:
      self.response.out.write('Param "name" is required.')
      self.response.set_status(400)
      return
    name = name.decode('utf-8')

    task_list = tasks.GetByName(name)

    response = {}
    response['kind'] = 'mrtaskman#task_list'
    logging.info('tasks: %s', task_list)
    response['tasks'] = [model_to_dict.ModelToDict(task)
                         for task in task_list]
    json.dump(response, self.response.out, indent=2)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('\n')


class TasksPeekAtExecutorHandler(webapp2.RequestHandler):
  def get(self, executor):
    """Gets first scheduled (unassigned) task for a given executor."""
    task = tasks.GetOldestTaskForCapability(executor)
    if task is None:
      self.response.set_status(404)
      return

    response = model_to_dict.ModelToDict(task)
    response['kind'] = 'mrtaskman#task'

    json.dump(response, self.response.out, indent=2)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('\n')


class PauseExecutorHandler(webapp2.RequestHandler):
  def get(self, executor):
    """Returns pause status of given executor."""
    paused = tasks.IsExecutorPaused(executor)

    response = {}
    response['kind'] = 'mrtaskman#executor_pause_state'
    response['paused'] = paused

    json.dump(response, self.response.out, indent=2)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('\n')

  def post(self, executor):
    """Idempotently pauses given executor."""
    tasks.PauseExecutor(executor)

  def delete(self, executor):
    """Unpauses given executor."""
    for i in xrange(5):
      success = tasks.ResumeExecutor(executor)
      if success:
        return
    self.response.set_status(500)
    self.response.out.write('Could not resume executor due to backend issue.')


app = webapp2.WSGIApplication([
    ('/tasks/([0-9]+)', TasksHandler),
    ('/tasks/([0-9]+)/task_complete_url', TaskCompleteUrlHandler),
    ('/tasks/assign', TasksAssignHandler),
    ('/tasks/list_by_name', TasksListByNameHandler),
    ('/tasks/schedule', TasksScheduleHandler),
    ('/executors/([a-zA-Z0-9]+)', TasksListByExecutorHandler),
    ('/executors/([a-zA-Z0-9]+)/pause', PauseExecutorHandler),
    ('/executors/([a-zA-Z0-9]+)/peek', TasksPeekAtExecutorHandler),
    ], debug=True)
