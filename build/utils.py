#!/usr/bin/python
#
# Copyright 2011 Google Inc. All Rights Reserved.
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


"""The build system utility functions."""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import subprocess
import time


ONCOMPLETE = 'oncomplete'
OUT = 'out'
PROCESS = 'process'
SUCCESS = 'success'


def ExecuteCommand(command, on_complete=None, no_wait=False):
  """Execute the given command and return the output.

  Args:
    command: A string representing the command to execute.
    no_wait: Whether not to wait for finished.

  Returns:
    The process or None if no_wait is True.
  """
  process = subprocess.Popen(command.split(' '),
                             stderr=subprocess.STDOUT,
                             stdout=subprocess.PIPE)
  if no_wait:
    return {PROCESS: process, SUCCESS: None, OUT: None,
            ONCOMPLETE: on_complete}

  (out, _) = process.communicate()
  if process.returncode:
    success = False
  else:
    success = True

  if on_complete:
    on_complete(success, out)

  return {PROCESS: process, SUCCESS: success, OUT: out,
          ONCOMPLETE: on_complete}


def WaitUntilSubprocessesFinished(process_list, fail_early=True):
  """Waits until the given sub processes are all finished.

  If the list of processes to wait on contain those that have already completed
  then their onComplete functions will be called again if given.

  The fail_early flag
  """
  failed = False
  ps = [p for p in process_list]
  while len(ps):
    completed = [p for p in ps if p[PROCESS].poll() is not None]
    for p in completed:
      ps.remove(p)

    for p in completed:
      p[SUCCESS] = p[PROCESS].returncode == 0
      p[OUT] = p[PROCESS].stdout.read()

      if p[ONCOMPLETE] is not None:
        p[ONCOMPLETE](p[SUCCESS], p[OUT])

      if not p[SUCCESS]:
        failed = True

    if fail_early and failed:
      for p in ps:
        KillSubprocess(p)
      return False

    if len(ps):
      time.sleep(0.2) # Sleep before pulling again.

  return not failed


def KillSubprocess(p):
  if p[PROCESS].poll() is None:
    p[PROCESS].terminate()

  success = False
  out = None
  cancelled = True

  if p[ONCOMPLETE] is not None:
    p[ONCOMPLETE](success, out, cancelled)


def GetIndentString(indent):
  return ''.join([' ' for i in range(0, indent)])
