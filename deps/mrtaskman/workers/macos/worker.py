#!/usr/bin/python
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

"""MrTaskman worker script which executes MacOS commands."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import cStringIO
import datetime
import httplib
import json
import logging
import os
import socket
import StringIO
import subprocess
import sys
import time
import urllib2

import gflags
from client import mrtaskman_api
from client import package_installer
from common import device_info
from common import http_file_upload
from common import parsetime
from common import split_stream


FLAGS = gflags.FLAGS
gflags.DEFINE_string('log_filename', '', 'Where to log stuff. Required.')
gflags.DEFINE_string('worker_name', '', 'Unique worker name.')
gflags.DEFINE_list('worker_capabilities', ['macos', 'android'],
                   'Things this worker can do.')


class TaskError(Exception):
  pass
class MrTaskmanUnrecoverableHttpError(TaskError):
  pass
class MrTaskmanRecoverableHttpError(TaskError):
  pass


def GetHostname():
  return socket.gethostname()


class MacOsWorker(object):
  """Executes macos tasks."""

  def __init__(self, worker_name, log_stream):
    self.worker_name_ = worker_name
    self.log_stream_ = log_stream
    self.api_ = mrtaskman_api.MrTaskmanApi()
    self.hostname_ = GetHostname()
    self.capabilities_ = {'executor': self.GetCapabilities()}
    self.executors_ = {}
    for capability in self.capabilities_['executor']:
      self.executors_[capability] = self.ExecuteTask

  def GetCapabilities(self):
    capabilities = device_info.GetCapabilities()
    capabilities.append('macos')
    capabilities.append(self.worker_name_)
    return capabilities

  def AssignTask(self):
    """Makes a request to /tasks/assign to get assigned a task.

    Returns:
      Task if a task was assigned, or None.
    """
    try:
      task = self.api_.AssignTask(self.worker_name_, self.hostname_,
                                  self.capabilities_)
      return task
    except urllib2.HTTPError, e:
      logging.info('Got %d HTTP response from MrTaskman on AssignTask.',
                   e.code)
      return None
    except urllib2.URLError, e:
      logging.info('Got URLError trying to reach MrTaskman: %s', e)
      return None

  def SendResponse(self, task_id, stdout, stderr, task_result):
    while True:
      try:
        # TODO(jeff.carollo): Refactor.
        device_sn = device_info.GetDeviceSerialNumber()
        task_result['device_serial_number'] = device_sn

        response_url = self.api_.GetTaskCompleteUrl(task_id)
        if not response_url:
          logging.info('No task complete url for task_id %s', task_id)
          return
        response_url = response_url.get('task_complete_url', None)
        if not response_url:
          logging.info('No task complete url for task_id %s', task_id)
          return
        self.api_.SendTaskResult(response_url, stdout, stderr, task_result)
        logging.info('Successfully sent response for task %s: %s',
                     task_id, self.api_.MakeTaskUrl(task_id))
        return
      except urllib2.HTTPError, error_response:
        body = error_response.read()
        code = error_response.code
        if code == 404:
          logging.warning('TaskCompleteUrl timed out.')
          continue
        logging.warning('SendResponse HTTPError code %d\n%s',
                        code, body)
        return
      except urllib2.URLError, e:
        logging.info(
            'Got URLError trying to send response to MrTaskman: %s', e)
        logging.info('Retrying in 10 seconds')
        time.sleep(10)
        continue

  def GetTaskCompleteUrl(self, task_id):
    try:
      return self.api_.GetTaskCompleteUrl(task_id)
    except urllib2.HTTPError, error_response:
      body = error_response.read()
      code = error_response.code
      logging.warning('GetTaskCompleteUrl HTTPError code %d\n%s',
                      code, body)

  def ShouldWaitForDevice(self):
    """Returns True iff this worker controls a device which is offline."""
    if not device_info.DEVICE_SN:
      return False
    return not device_info.DeviceIsConnected()

  def PollAndExecute(self):
    logging.info('Polling for work...')
    device_active = True
    while True:
      try:
        if self.ShouldWaitForDevice():
          if device_active:
            logging.info('Device %s is offline. Waiting for it to come back.',
                         device_info.DEVICE_SN)
            device_active = False
          time.sleep(10)
          continue
        if not device_active:
          logging.info('Device came back online.')
          device_active = True

        # TODO(jeff.carollo): Wrap this in a catch-all Excepion handler that
        # allows us to continue executing in the face of various task errors.
        task = self.AssignTask()

        if not task:
          time.sleep(10)
          continue
      except KeyboardInterrupt:
        logging.info('Caught CTRL+C. Exiting.')
        return

      task_stream = cStringIO.StringIO()
      task_logs = None
      self.log_stream_.AddStream(task_stream)
      try:
        logging.info('Got a task:\n%s\n', json.dumps(task, 'utf-8', indent=2))

        config = task['config']
        task_id = int(task['id'])
        attempt = task['attempts']

        # Figure out which of our executors we can use.
        executor = None
        allowed_executors = config['task']['requirements']['executor']
        for allowed_executor in allowed_executors:
          try:
            executor = self.executors_[allowed_executor]
          except KeyError:
            pass
          if executor is not None:
            break

        if executor is None:
          # TODO: Send error response to server.
          # This is probably our fault - we said we could do something
          # that we actually couldn't do.
          logging.error('No matching executor from %s', allowed_executors)
          raise Exception('No allowed executors matched our executors_:\n' +
                          '%s\nvs.%s\n' % (allowed_executors, self.executors_))

        try:
          # We've got a valid executor, so use it.
          (results, stdout, stderr) = executor(task_id, attempt, task, config)
        except MrTaskmanUnrecoverableHttpError:
          logging.error(
              'Unrecoverable MrTaskman HTTP error. Aborting task %d.', task_id)
          continue
      finally:
        self.log_stream_.RemoveStream(task_stream)
        task_logs = task_stream.getvalue().decode('utf-8')
        task_stream.close()

      try:
        results['worker_log'] = task_logs.encode('utf-8')
        self.SendResponse(task_id,
                          stdout,
                          stderr,
                          results)
      except MrTaskmanUnrecoverableHttpError:
        logging.error(
            'Unrecoverable MrTaskman HTTP error. Aborting task %d.', task_id)

      logging.info('Polling for work...')
      # Loop back up and poll for the next task.

  def ExecuteTask(self, task_id, attempt, task, config):
    logging.info('Recieved task %s', task_id)

    try:
      tmpdir = package_installer.TmpDir()

      # Download the files we need from the server.
      files = config.get('files', [])
      self.DownloadAndStageFiles(files)

      # Install any packages we might need.
      # TODO(jeff.carollo): Handle any exceptions raised here.
      packages = config.get('packages', [])
      self.DownloadAndInstallPackages(packages, tmpdir)

      # We probably don't want to run forever. Default to 12 minutes.
      timeout = config['task'].get('timeout', '12m')
      timeout = parsetime.ParseTimeDelta(timeout)

      # Get any environment variables to inject.
      env = config['task'].get('env', {})
      env = env.update(os.environ)

      # Get our command and execute it.
      command = config['task']['command']

      logging.info('Running command %s', command)
      (exit_code, stdout, stderr, execution_time, result_metadata) = (
          self.RunCommandRedirectingStdoutAndStderrWithTimeout(
              command, env, timeout, tmpdir.GetTmpDir()))

      logging.info('Executed %s with result %d', command, exit_code)

      results = {
        'kind': 'mrtaskman#task_complete_request',
        'task_id': task_id,
        'attempt': attempt,
        'exit_code': exit_code,
        'execution_time': execution_time.total_seconds(),
        'result_metadata': result_metadata
      }
      return (results, stdout, stderr)
    finally:
      tmpdir.CleanUp()

  def RunCommandRedirectingStdoutAndStderrWithTimeout(
      self, command, env, timeout, cwd):
    command = ' '.join([command, '>stdout', '2>stderr'])

    # TODO: More precise timing through process info.
    begin_time = datetime.datetime.now()
    timeout_time = begin_time + timeout
    process = subprocess.Popen(args=command,
                               env=env,
                               shell=True,
                               cwd=cwd)

    ret = None
    while None == ret and (datetime.datetime.now() < timeout_time):
      time.sleep(0.02)
      ret = process.poll()

    finished_time = datetime.datetime.now()
    if finished_time >= timeout_time and (None == ret):
      logging.info('command %s timed out.', command)
      process.terminate()
      process.wait()
      ret = -99

    execution_time = finished_time - begin_time

    try:
      stdout = file(os.path.join(cwd, 'stdout'), 'rb')
    except IOError, e:
      logging.error('stdout was not written.')
      stdout = file(os.path.join(cwd, 'stdout'), 'w')
      stdout.write('No stdout.')
      stdout.flush()
      stdout.close()
      stdout = file(os.path.join(cwd, 'stdout'), 'rb')
    try:
      stderr = file(os.path.join(cwd, 'stderr'), 'rb')
    except IOError, e:
      logging.error('stderr was not written.')
      stderr = file(os.path.join(cwd, 'stderr'), 'w')
      stderr.write('No stderr.')
      stderr.flush()
      stderr.close()
      stderr = file(os.path.join(cwd, 'stderr'), 'rb')
    try:
      result_metadata_file = file(os.path.join(cwd, 'result_metadata'), 'r')
      result_metadata = json.loads(result_metadata_file.read().decode('utf-8'))
    except:
      result_metadata = None
    return (ret, stdout, stderr, execution_time, result_metadata)

  def DownloadAndStageFiles(self, files):
    logging.info('Not staging files: %s', files)
    # TODO: Stage files.

  def DownloadAndInstallPackages(self, packages, tmpdir):
    # TODO(jeff.carollo): Create a package cache if things take off.
    for package in packages:
      attempts = 0
      while True:
        try:
          package_installer.DownloadAndInstallPackage(
              package['name'], package['version'],
              tmpdir.GetTmpDir())
          break
        except urllib2.HTTPError, e:
          logging.error('Got HTTPError %d trying to grab package %s.%s: %s',
              e.code, package['name'], package['version'], e)
          raise MrTaskmanUnrecoverableHttpError(e)
        except (urllib2.URLError, httplib.IncompleteRead), e:
          logging.error('Got URLError trying to grab package %s.%s: %s',
              package['name'], package['version'], e)
          logging.info('Retrying in 10')
          attempts += 1
          # TODO(jeff.carollo): Figure out a robust way to do this.
          # Likely need to just try a few times to get around Internet blips
          # then mark task as failed for package reasons.
          if attempts < 10:
            time.sleep(10)
            continue
          else:
            logging.error('Failed to grab package for 100 attempts. Aborting.')
            raise MrTaskmanUnrecoverableHttpError(e)
        except IOError, e:
          logging.error('Got IOError trying to grab package %s.%s: %s',
              package['name'], package['version'], e)
          raise MrTaskmanUnrecoverableHttpError(e)


def main(argv):
  try:
    argv = FLAGS(argv)
  except gflags.FlagsError, e:
    sys.stderr.write('%s\n' % e)
    sys.exit(1)
    return

  # Set default socket timeout to 2 hours so that we catch missing timeouts.
  socket.setdefaulttimeout(2 * 60 * 60)

  if not FLAGS.log_filename:
    sys.stderr.write('Flag --log_filename is required.\n')
    sys.exit(-9)
    return

  try:
    from third_party import portalocker
    log_file = file(FLAGS.log_filename, 'a+')
    portalocker.lock(log_file, portalocker.LOCK_EX | portalocker.LOCK_NB)
  except:
    print 'Count not get exclusive lock.'
    sys.exit(-10)
    return

  try:
    FORMAT = '%(asctime)-15s %(message)s'
    log_stream = split_stream.SplitStream(sys.stdout, log_file)
    logging.basicConfig(format=FORMAT, level=logging.DEBUG,
                        stream=log_stream)

    macos_worker = MacOsWorker(FLAGS.worker_name, log_stream=log_stream)
    # Run forever, executing tasks from the server when available.
    macos_worker.PollAndExecute()
  finally:
    logging.shutdown()
    log_file.flush()
    portalocker.unlock(log_file)
    log_file.close()


if __name__ == '__main__':
  main(sys.argv)
