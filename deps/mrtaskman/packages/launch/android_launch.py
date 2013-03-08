#!/usr/bin/python

"""Executes Android Launch test over adb to attached Android device."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import datetime
import logging
import os
import re
import subprocess
import sys
import time

from tasklib import apklib


ADB_COMMAND = apklib.ADB_COMMAND
LAUNCH_COMMAND = (ADB_COMMAND +
    'shell "am start --activity-reset-task-if-needed -W -n %s/%s; echo $? > /data/local/tmp/ret"')

STDOUT_FILENAME = 'cmd_stdout.log'
STDERR_FILENAME = 'cmd_stderr.log'


def ExitWithErrorCode(error_code):
  if error_code == 0:
    logging.warning('Error code is zero, maaking it non-zero')
    error_code = -7
  sys.exit(error_code)


def main(argv):
  my_name = argv.pop(0)

  try:
    apk_file_path = argv.pop(0)
  except:
    sys.stderr.write('Must give apk_file_path as first argument.\n')
    sys.exit(-1)

  FORMAT = '%(asctime)-15s %(message)s'
  logging.basicConfig(format=FORMAT, level=logging.DEBUG)

  result_metadata = {}
  try:
    manifest = apklib.ReadAndroidManifest(apk_file_path)
    result_metadata[u'AndroidManifest.xml'] = manifest.encode('utf-8')
    class_path = apklib.FindClassPath(manifest)
    class_name = apklib.FindClassName(manifest)
    logging.info('Found class_path: %s', class_path)

    logging.info('installing apk...')
    try:
      output = subprocess.check_output(
          ADB_COMMAND + 'install -r %s' % apk_file_path,
          shell=True)
      apklib.CheckAdbSuccess(output)
    except subprocess.CalledProcessError, e:
      logging.error('adb install error %d:\n%s', e.returncode, e.output)
      try:
        logging.info('Signing .apk...')
        apklib.SignApk(apk_file_path)
        output = subprocess.check_output(
            ADB_COMMAND + 'install -r %s' % apk_file_path,
            shell=True)
        apklib.CheckAdbSuccess(output)
      except subprocess.CalledProcessError, e:
        logging.error('adb install error %d:\n%s', e.returncode, e.output)
        ExitWithErrorCode(e.returncode)

    try:
      if '.' not in class_name:
        class_name = '.%s' % class_name
      command = LAUNCH_COMMAND % (class_path, class_name)
      logging.info('Running command %s.', command)
      cmd_stdout = open(STDOUT_FILENAME, 'w')
      cmd_stderr = open(STDERR_FILENAME, 'w')
      try:
        timeout = datetime.timedelta(0, 62)  # Give the thing 62 seconds.
        begin_time = datetime.datetime.now()
        timeout_time = begin_time + timeout
        process = subprocess.Popen(args=command,
                                   stdout=cmd_stdout,
                                   stderr=cmd_stderr,
                                   shell=True)

        ret = None
        while None == ret and (datetime.datetime.now() < timeout_time):
          time.sleep(0.02)
          ret = process.poll()

        finished_time = datetime.datetime.now()
        if finished_time >= timeout_time and (None == ret):
          logging.error('command %s timed out.', command)
          process.terminate()
          process.wait()
          # TODO(jeff.carollo): Figure out why this times out and fix it.
          # Not so easy. Others on Internet report same behavior.
          ret = 0

        execution_time = finished_time - begin_time
        logging.info('execution_time: %s', execution_time)

        apklib.CheckAdbShellExitCode()
        if ret != 0:
          logging.error('adb command exited with code %s', ret)
          ExitWithErrorCode(ret)
      except subprocess.CalledProcessError, e:
        logging.error('CalledProcessError %d:\n%s', e.returncode, e.output)
        ExitWithErrorCode(e.returncode)
    finally:
      cmd_stdout.flush()
      cmd_stdout.close()
      cmd_stderr.flush()
      cmd_stderr.close()
      logging.info('Uninstalling .apk...')
      try:
        output = subprocess.check_output(
            ADB_COMMAND + 'uninstall %s' % class_path,
            shell=True)
        apklib.CheckAdbSuccess(output)
      except subprocess.CalledProcessError, e:
        logging.error('adb uninstall error %d:\n%s', e.returncode, e.output)
        # Don't fail just because uninstall failed.

      try:
        # Inspect and dump to logs the cmd stdout output.
        cmd_stdout = open(STDOUT_FILENAME, 'r')
        stdout_exitcode = apklib.DumpAndCheckErrorLogs(cmd_stdout, sys.stdout)
      except Exception, e:
        logging.error('Error while dumping command stdout: %s', str(e))
        stdout_exitcode = -5  # Don't exit yet, allow stderr to be dumped.
      finally:
        cmd_stdout.close()

      try:
        # Parse execution_time from output of command and write to metadata.
        cmd_stdout = open(STDOUT_FILENAME, 'r')
        stdout = cmd_stdout.read()
        match = re.match(r'.*TotalTime..(\d+).*', stdout, re.S)
        if match:
          total_ms = match.group(1)
          result_metadata['execution_time'] = float(total_ms) / 1000.0
      except Exception, e:
        logging.exception(e)
      finally:
        cmd_stdout.close()

      apklib.WriteResultMetadata(result_metadata)

      try:
        # Inspect and dump to logs the cmd stderr output.
        cmd_stderr = open(STDERR_FILENAME, 'r')
        stderr_exitcode = apklib.DumpAndCheckErrorLogs(cmd_stderr, sys.stderr)
      except Exception, e:
        logging.error('Error while dumping command stderr: %s', str(e))
        stderr_exitcode = -5
      finally:
        cmd_stderr.close()

      if stdout_exitcode != 0:
        logging.info('Error found in stdout.')
        ExitWithErrorCode(stdout_exitcode)
      if stderr_exitcode != 0:
        logging.info('Error found in stderr.')
        ExitWithErrorCode(stderr_exitcode)

    logging.info('Launch work done successfully.')
    return 0
  finally:
    logging.shutdown()


if __name__ == '__main__':
  main(sys.argv)
