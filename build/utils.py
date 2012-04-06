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


def WaitUntilSubprocessesFinished(ps):
  """Waits until the given sub processes are all finished."""

  while True:
    changed = [p for p in ps
               if p[PROCESS].poll() is not None and p[SUCCESS] is None]
    for p in changed:
      p[SUCCESS] = p[PROCESS].returncode == 0
      p[OUT] = p[PROCESS].stdout.read()
      if p[ONCOMPLETE] is not None:
        p[ONCOMPLETE](p[SUCCESS], p[OUT])

    status = [p[PROCESS].poll() for p in ps]
    if all([x is not None for x in status]):
      return
    else:
      time.sleep(0.2) # Sleep before pulling again.
