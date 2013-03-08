#!/usr/bin/python

"""Executes Android Install test over adb to attached Android device."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import datetime
import logging
import os
import subprocess
import sys
import time

from tasklib import apklib


ADB_COMMAND = apklib.ADB_COMMAND
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

  cmd_stdout = open(STDOUT_FILENAME, 'w')
  cmd_stderr = open(STDERR_FILENAME, 'w')
  result_metadata = {}
  try:
    manifest = apklib.ReadAndroidManifest(apk_file_path)
    result_metadata[u'AndroidManifest.xml'] = manifest.encode('utf-8')
    class_path = apklib.FindClassPath(manifest)
    logging.info('Found class_path: %s', class_path)

    tried_once = True
    logging.info('Installing .apk...')
    command = ADB_COMMAND + 'install -r %s' % apk_file_path,
    while True:
      try:
        timeout = datetime.timedelta(0, 900)  # Give the thing 15 minutes.
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
        execution_time = finished_time - begin_time
        logging.info('execution_time: %s', execution_time)

        if finished_time >= timeout_time and (None == ret):
          logging.error('command %s timed out.', command)
          process.terminate()
          process.wait()
          ret = 0
        elif ret == 0:
          # Only write execution_time if we didn't time out or fail.
          result_metadata['execution_time'] = execution_time.total_seconds()

        apklib.CheckAdbShellExitCode()
        if ret != 0:
          logging.error('adb command exited with code %s', ret)
          ExitWithErrorCode(ret)
        break
      except subprocess.CalledProcessError, e:
        logging.error('adb install error %d:\n%s', e.returncode, e.output)
        if tried_once:
          tried_once = False
          logging.info('Signing .apk...')
          apklib.SignApk(apk_file_path)
          continue
        ExitWithErrorCode(e.returncode)
        break

    logging.info('Uninstalling .apk...')
    try:
      output = subprocess.check_output(
          ADB_COMMAND + 'uninstall %s' % class_path,
          shell=True)
      print output
      apklib.CheckAdbSuccess(output)
    except subprocess.CalledProcessError, e:
      logging.error('adb uninstall error %d:\n%s', e.returncode, e.output)
      # Don't fail because uninstall didn't work.

    logging.info('Install work done successfully.')
    return 0
  finally:
    apklib.WriteResultMetadata(result_metadata)
    cmd_stdout.flush()
    cmd_stdout.close()
    cmd_stderr.flush()
    cmd_stderr.close()
    logging.shutdown()


if __name__ == '__main__':
  main(sys.argv)
