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

"""MrTaskman client command-line utility.

Allows users to upload configs, check the results of tasks, etc.
"""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import gflags
import json
import logging
import sys
import urllib2

from client import mrtaskman_api


FLAGS = gflags.FLAGS


def Help(unused_argv):
  print Usage()
  return 0


def Task(argv):
  try:
    task_id = int(argv.pop(0))
  except:
    sys.stderr.write('task command requires an integer task_id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    task = api.GetTask(task_id)
    json.dump(task, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def ListTasksByName(argv):
  try:
    task_name = argv.pop(0)
  except:
    sys.stderr.write('tasks command requires a string task_name argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    tasks = api.ListTasksByName(task_name)
    json.dump(tasks, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Peek(argv):
  try:
    executor = argv.pop(0)
  except:
    sys.stderr.write('peek command requires a string executor argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    task = api.PeekAtExecutor(executor)
    json.dump(task, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Pause(argv):
  try:
    executor = argv.pop(0)
  except:
    sys.stderr.write('pause command requires a string executor argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    api.PauseExecutor(executor)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Resume(argv):
  try:
    executor = argv.pop(0)
  except:
    sys.stderr.write('resume command requires a string executor argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    api.ResumeExecutor(executor)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def IsPaused(argv):
  try:
    executor = argv.pop(0)
  except:
    sys.stderr.write('ispaused command requires a string executor argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    executor_pause_state = api.GetExecutorPauseState(executor)
    json.dump(executor_pause_state, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def TaskCompleteUrl(argv):
  try:
    task_id = int(argv.pop(0))
  except:
    sys.stderr.write('task command requires an integer task_id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    task_complete_url_obj = api.GetTaskCompleteUrl(task_id)
    json.dump(task_complete_url_obj, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Schedule(argv):
  try:
    config_filepath = argv.pop(0)
  except:
    sys.stderr.write('schedule command requires a config filepath argument.\n')
    return 3

  try:
    config_file = file(config_filepath, 'r')
  except Exception, e:
    sys.stderr.write('Error opening %s:\n%s\n' % (config_filepath, e))
    return 4

  try:
    config = json.load(config_file)
  except Exception, e:
    sys.stderr.write('Error reading or parsing config file:\n%s\n' % e)
    return 5

  api = mrtaskman_api.MrTaskmanApi()

  try:
    task_result = api.ScheduleTask(config)
    json.dump(task_result, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def DeleteTask(argv):
  try:
    task_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        'deletetask command requires an integer task_id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    api.DeleteTask(task_id)
    print 'Successfully deleted task %d' % task_id
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def CreatePackage(argv):
  try:
    package_filepath = argv.pop(0)
  except:
    sys.stderr.write(
        'createpackage command requires a package filepath argument.\n')
    return 3

  try:
    package_file = file(package_filepath, 'r')
  except Exception, e:
    sys.stderr.write('Error opening %s:\n%s\n' % (package_filepath, e))
    return 4

  try:
    package = json.load(package_file)
  except Exception, e:
    sys.stderr.write('Error reading or parsing package file:\n%s\n' % e)
    return 5

  api = mrtaskman_api.MrTaskmanApi()

  try:
    package_result = api.CreatePackage(package)
    json.dump(package_result, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def DeletePackage(argv):
  try:
    package_name = argv.pop(0)
  except:
    sys.stderr.write(
        'deletepackage command requires a string package name argument.\n')
    return 3

  try:
    package_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        'deletepackage command requires an int package id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    api.DeletePackage(package_name, package_id)
    print 'Successfully deleted package %s.%d' % (package_name, package_id)
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Package(argv):
  try:
    package_name = argv.pop(0)
  except:
    sys.stderr.write(
        'package command requires a string package name argument.\n')
    return 3

  try:
    package_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        'package command requires an int package id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    package = api.GetPackage(package_name, package_id)
    json.dump(package, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Stdout(argv):
  return GetResultFile('stdout', argv)


def Stderr(argv):
  return GetResultFile('stderr', argv)


def GetResultFile(command_name, argv):
  try:
    task_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        '%s command requires an integer task_id argument.\n' % command_name)
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    task = api.GetTask(task_id)
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code

  if task['state'] != 'complete':
    sys.stderr.write(
        '%s not available for incomplete task %d\n' % (command_name, task_id))
    return 1

  try:
    result = task['result']
    download_url = result['%s_download_url' % command_name]
  except KeyError:
    sys.stderr.write(
        'Task does not have results.%s_download_url.\n' % command_name)
    return 1

  try:
    contents = urllib2.urlopen(download_url).read()
    print contents.decode('utf-8')
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Event(argv):
  try:
    event_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        'event command requires an int event id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    event = api.GetEvent(event_id)
    json.dump(event, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def Events(argv):
  api = mrtaskman_api.MrTaskmanApi()

  try:
    events = api.ListEvents()
    json.dump(events, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def CreateEvent(argv):
  try:
    event_filepath = argv.pop(0)
  except:
    sys.stderr.write('createevent command requires a filepath argument.\n')
    return 3

  try:
    event_file = file(event_filepath, 'r')
  except Exception, e:
    sys.stderr.write('Error opening %s:\n%s\n' % (event_filepath, e))
    return 4

  try:
    event = json.load(event_file)
  except Exception, e:
    sys.stderr.write('Error reading or parsing event file:\n%s\n' % e)
    return 5

  api = mrtaskman_api.MrTaskmanApi()

  try:
    event_result = api.CreateEvent(event)
    json.dump(event_result, sys.stdout, indent=2)
    print ''
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def DeleteEvent(argv):
  try:
    event_id = int(argv.pop(0))
  except:
    sys.stderr.write(
        'deleteevent command requires an int event id argument.\n')
    return 3

  api = mrtaskman_api.MrTaskmanApi()

  try:
    api.DeleteEvent(event_id)
    print 'Successfully deleted event %s' % event_id
    return 0
  except urllib2.HTTPError, e:
    sys.stderr.write('Got %d HTTP response from MrTaskman:\n%s\n' % (
                     e.code, e.read()))
    return e.code


def CommandNotImplemented(argv):
  """Dummy command which explains that a command is not yet implemented."""
  sys.stderr.write('This command is not yet implemented.\n')
  return 5


def Usage():
  return (
"""mrt.py - MrTaskman client command-line utility.

USAGE:
  mrt.py [options] command [args]

COMMANDS:
  help\t\t\tPrints this message.

  deletetask {id}\tDelete task with given id.
  schedule {task_file}\tSchedules a new task from given task_file.
  task {id}\t\tRetrieve information on given task id.
  task_complete_url {id}\tRetrieve URL where task results can be posted.
  tasks {name}\t\tList available tasks with given name.
  stdout {id}\t\tPrints stdout from completed task with given id.
  stderr {id}\t\tPrints stderr from completed task with given id.

  peek {executor}\tRetrieve first unscheduled task for given executor.
  pause {executor}\tPause given executor queue.
  resume {executor}\tResume given executor queue.
  ispaused {executor}\tRetrieves pause state of given executor.

  createpackage {manifest}\t Create a new package with given manifest.
  deletepackage {name} {version} Delete package with given name and version.
  package {name} {version}\t Retrieve information on given package.
  packages\t\t\t List existing packages. (Not Implemented)

  createevent {event}\tCreate an new Event with given event file.
  deleteevent {event_id}\tDelete Event with given id.
  event {event_id}\t\tPrint Event with given id.
  events\t\t\tList most recent MrTaskman Events.""")


# Mapping of command text to command function.
COMMANDS = {
  'help': Help,
  'deletetask': DeleteTask,
  'schedule': Schedule,
  'task': Task,
  'task_complete_url': TaskCompleteUrl,
  'tasks': ListTasksByName,
  'stdout': Stdout,
  'stderr': Stderr,
  'peek': Peek,
  'pause': Pause,
  'resume': Resume,
  'ispaused': IsPaused,
  'createpackage': CreatePackage,
  'deletepackage': DeletePackage,
  'package': Package,
  'packages': CommandNotImplemented,
  'createevent': CreateEvent,
  'deleteevent': DeleteEvent,
  'event': Event,
  'events': Events,
}


def main(argv):
  # Parse command-line flags.
  try:
    argv = FLAGS(argv)
  except gflags.FlagsError, e:
    sys.stderr.write(Usage())
    sys.stderr.write('%s\n' % e)
    sys.exit(1)

  # Set up logging.
  FORMAT = '%(asctime)-15s %(message)s'
  logging.basicConfig(format=FORMAT, level=logging.INFO)

  try:
    mrt = argv.pop(0)

    # Parse command.
    try:
      command = argv.pop(0)
      logging.debug('command: %s', command)
    except:
      return Help([])

    # Invoke command.
    try:
      return COMMANDS[command](argv)
    except KeyError:
      sys.stderr.write('Command %s not found.\nSee mrt.py help.' % command)
      return 2
  finally:
    # Nothing should be done after the next line.
    logging.shutdown()


if __name__ == '__main__':
  main(sys.argv)
