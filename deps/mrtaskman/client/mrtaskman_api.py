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

"""MrTaskman API client, which wraps MrTaskman REST API."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'


import json
import logging
import urllib
import urllib2


try:
  # Imports non-AppEngine.
  import gflags
  FLAGS = gflags.FLAGS
  gflags.DEFINE_string('mrtaskman_address', 'http://mrtaskman.appspot.com',
                       'URL of MrTaskman server to connect to.')
except ImportError:
  # Imports on AppEngine.
  import settings
  # No gflags, use defaults.
  class Flags(object):
    mrtaskman_address = settings.MRTASKMAN_URL
  FLAGS = Flags()

try:
  from common import http_file_upload
except ImportError:
  from mrtaskman_api_not import http_file_upload


# Define portable MakeHttpRequest adapter.
try:
  from google.appengine.api import urlfetch
  def MakeHttpRequest(url, method='GET', headers={}, body=None, timeout=25):
    """Makes HTTP request and returns read response.

    Raises urllib2.HTTPError on non-200 response.
    """
    response = urlfetch.fetch(url, payload=body, method=method, headers=headers,
                              deadline=timeout)
    response_body = response.content
    status_code = response.status_code
    headers = response.headers
    if 200 != status_code:
      class Readable:
        def __init__(self, data):
          self.data = data
          self.done_ = False

        def read(self):
          self.done_ = True
          return self.data

        def readline(self):
          if self.done_:
            return None
          self.done_ = True
          return self.data

      raise urllib2.HTTPError(url, status_code, 'An HTTPError occurred.',
                              headers, Readable(response_body))
    else:
      return response_body
except ImportError:
  def MakeHttpRequest(url, method='GET', headers={}, body=None, timeout=15*60):
    """Makes HTTP request and returns read response.

    Raises urllib2.HTTPError on non-200 response.
    """
    request = urllib2.Request(url, body, headers)
    request.get_method = lambda: method

    response = urllib2.urlopen(request, timeout=timeout)
    response_body = response.read()
    return response_body


class MrTaskmanApi(object):
  """Client wrapper for MrTaskman REST API."""

  def __init__(self, mrtaskman_address=FLAGS.mrtaskman_address):
    self.mrtaskman_url = mrtaskman_address

  def GetTask(self, task_id):
    """Performs a tasks.get on given task_id.

    Args:
      task_id: Id of task to retrieve as int

    Returns:
      Task object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(task_id, int)

    path = '/tasks/%d' % task_id
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def ListTasksByName(self, task_name):
    """Performs a tasks.listByName on given task_name.

    Args:
      task_name: Name of task as str

    Returns:
      TaskList object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(task_name, basestring)

    path = '/tasks/list_by_name?name=%s' % urllib.quote(task_name)
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def PeekAtExecutor(self, executor_capability):
    """Performs an executors.peek on given executor_capability.

    Effectively shows the first unscheduled task for given executor.

    Args:
      executor_capability: Name of executor capability as str.

    Returns:
      TaskResult object or None.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(executor_capability, basestring)

    path = '/executors/%s/peek' % executor_capability
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def PauseExecutor(self, executor_capability):
    """Performs an executors.pause on given executor_capability.

    Effectively prevents assignment of unscheduled tasks for given executor.

    Args:
      executor_capability: Name of executor capability as str.

    Returns:
      None.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(executor_capability, basestring)

    path = '/executors/%s/pause' % executor_capability
    url = FLAGS.mrtaskman_address + path
    body = ''
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='POST', headers=headers, body=body)

  def ResumeExecutor(self, executor_capability):
    """Performs an executors.resume on given executor_capability.

    Effectively resumes assignment of unscheduled tasks for given executor.

    Args:
      executor_capability: Name of executor capability as str.

    Returns:
      None.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(executor_capability, basestring)

    path = '/executors/%s/pause' % executor_capability
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='DELETE', headers=headers, body=body)

  def GetExecutorPauseState(self, executor_capability):
    """Performs an executors.getPauseState on given executor_capability.

    Retrieves the pause state of given executor.

    Args:
      executor_capability: Name of executor capability as str.

    Returns:
      mrtaskman#executor_pause_state object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(executor_capability, basestring)

    path = '/executors/%s/pause' % executor_capability
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}

    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def ScheduleTask(self, config):
    """Performs a tasks.schedule on given config object.

    Args:
      config: Config object to schedule

    Returns:
      ScheduleTaskResult object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert config
    # TODO(jeff.carollo): Validate config.

    path = '/tasks/schedule'
    url = FLAGS.mrtaskman_address + path
    body = json.dumps(config, indent=2).encode('utf-8')
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='POST', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def DeleteTask(self, task_id):
    """Performs a tasks.delete on given task_id.

    Args:
      task_id: Id of task to delete as int

    Returns:
      None

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(task_id, int)

    path = '/tasks/%d' % task_id
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='DELETE', headers=headers, body=body)
    return

  def AssignTask(self, worker, hostname, capabilities):
    """Makes a request to /tasks/assign to get assigned a task.

    Args:
      worker: Unique name of worker as str
      hostname: Hostname identifying this machine
      capabilities: Dict describing capabilities of the worker

    Returns:
      Assigned mrtaskman#task object, or None if no tasks were available.

    Raises:
      urllib2.HTTPError on non-200 response.

    Example:
      def PollForTask(self):
        while True:
          api = mrtaskman_api.MrTaskmanApi()
          task = api.AssignTask('MacOsWorker1of10',
                                'leonardo@mydomain',
                                {
                                  'executor': ['macos'],
                                })
          if not task:
            time.sleep(10.)
            continue
          self.ExecuteTask(task)
    """
    assert worker
    assert hostname
    assert capabilities

    # Construct /tasks/assign request to MrTaskman.
    assign_request = dict()
    assign_request['kind'] = 'mrtaskman#assign_request'
    assign_request['worker'] = worker
    assign_request['hostname'] = hostname
    assign_request['capabilities'] = capabilities

    path = '/tasks/assign'
    url = FLAGS.mrtaskman_address + path
    body = json.dumps(assign_request, indent=2).encode('utf-8')
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='PUT', headers=headers, body=body)
    if not response_body:
      return None
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def GetTaskCompleteUrl(self, task_id):
    """Retrieves a URL which results for given task_id can be posted to.

    Args:
      task_id: Id of task to retrieve complete URL for as int

    Returns:
      TaskCompleteUrl object, which has a ['task_complete_url'] field.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    path = '/tasks/%d/task_complete_url' % int(task_id)
    url = FLAGS.mrtaskman_address + path
    body = ''
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def SendTaskResult(self, response_url, stdout, stderr, task_result):
    """Submits the results of a task to a MrTaskman-provided response_url.

    Args:
      response_url: MrTaskman-provided URL for this task as str
      stdout: Standard output of task as str
      stderr: Standard error of task as str
      task_result: mrtaskman#task_complete_request object for task

    Returns:
      None

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    (body, headers) = http_file_upload.EncodeMultipartHttpFormData(
        {},
        [{'name': 'task_result',
          'Content-Type': 'application/json; charset=utf-8',
          'data': json.dumps(task_result, 'utf-8', indent=2)}],
        [{'name': 'STDOUT',
          'filename': 'stdout',
          'data': stdout},
         {'name': 'STDERR',
          'filename': 'stderr',
          'data': stderr}])

    response_body = MakeHttpRequest(
        response_url, method='POST', headers=headers, body=body)

  def MakeTaskUrl(self, task_id):
    """Returns the URL to the task given by task_id."""
    return '%s/tasks/%d' % (FLAGS.mrtaskman_address, task_id)

  def CreatePackage(self, create_package_request):
    """Performs a packages.create with given create_package_request.

    Args:
      create_package_request: mrtaskman#create_package_request object.

    Returns:
      mrtaskman#create_package_result object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert create_package_request
    # TODO(jeff.carollo): Validate request.

    path = '/packages/create'

    # Get url to upload to.
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    get_upload_url_response = response_body.decode('utf-8')
    get_upload_url_object = json.loads(get_upload_url_response, 'utf-8')
    upload_url = get_upload_url_object['upload_url']

    # Parse files from request.
    package_files = create_package_request['files']
    file_form_entries = []
    for package_file in package_files:
      file_form_entry = {}
      file_form_entry['name'] = package_file['form_name']
      file_form_entry['filename'] = package_file['filename']
      file_form_entry['filepath'] = package_file['client_path']
      file_form_entries.append(file_form_entry)

    # Upload to that URL.
    (body, headers) = http_file_upload.EncodeMultipartHttpFormData(
        {},
        [{'name': 'manifest',
          'Content-Type': 'application.json; charset=utf-8',
          'data': json.dumps(create_package_request, 'utf-8', indent=2)}],
        file_form_entries)
    response_body = MakeHttpRequest(
        upload_url, method='POST', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def GetPackage(self, package_name, package_version):
    """Performs a package.get on given package_name and package_version.

    Args:
      package_name: Name of package to retrieve as str
      package_version: version of package to retrieve as int

    Returns:
      mrtaskman#package object

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert package_name
    assert isinstance(package_version, int)

    path = '/packages/%s.%d' % (package_name, package_version)
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def DeletePackage(self, package_name, package_version):
    """Performs a packages.delete on given package_name and package_version.

    Args:
      package_name: Name of package to delete as str
      package_version: version of package to delete as int

    Returns:
      None

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert package_name
    assert isinstance(package_version, int)

    path = '/packages/%s.%d' % (package_name, package_version)
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {}
    response_body = MakeHttpRequest(
        url, method='DELETE', headers=headers, body=body)
    return

  def GetEvent(self, event_id):
    """Performs an events.get for given event_id.

    Args:
      event_id: Id of event as int.

    Returns:
      mrtaskman#event object

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(event_id, int)

    path = '/events/%d' % event_id
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def DeleteEvent(self, event_id):
    """Performs an events.delete on given event_id.

    Args:
      event_id: Id of event as int.

    Returns:
      None

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert isinstance(event_id, int)

    path = '/events/%d' % event_id
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {}
    response_body = MakeHttpRequest(
        url, method='DELETE', headers=headers, body=body)
    return

  def CreateEvent(self, event):
    """Performs an events.create on given Event object.

    Args:
      config: Event object to create.

    Returns:
      Event object.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    assert event
    # TODO(jeff.carollo): Validate event.

    path = '/events'
    url = FLAGS.mrtaskman_address + path
    body = json.dumps(event, indent=2).encode('utf-8')
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='POST', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')

  def ListEvents(self):
    """Performs an events.list.

    Args:
      None

    Returns:
      List of Event objects.

    Raises:
      urllib2.HTTPError on non-200 response.
    """
    path = '/events/all'
    url = FLAGS.mrtaskman_address + path
    body = None
    headers = {'Accept': 'application/json'}
    response_body = MakeHttpRequest(
        url, method='GET', headers=headers, body=body)
    response_body = response_body.decode('utf-8')
    return json.loads(response_body, 'utf-8')
