#!/usr/bin/python2.4
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

"""Bite constants."""

__author__ = 'phu@google.com (Po Hu)'


#Use implict string concat
#pylint: disable-msg=C6406

EVERYTHING_DEFAULT_UI_DATA = {
    'name': 'all',
    'href': '/event/show_all',
    'title': 'Everything',
    'artifacttitle': 'Recent Activities',
    'icon': '/images/artifacts/testing.png',
    'description': 'This page shows you the recent activities that are ' +
    'performed',
    'data': [],
    'filters': [
        {'name': 'all', 'title': 'All items',
         'href': '/event/show_all',
         'selected': True}]
}

SUITES_DEFAULT_UI_DATA = {
    'name': 'suites',
    'href': '/suite/show_all',
    'title': 'Sets',
    'icon': '/images/artifacts/testsuite.png',
    'description': 'Sets are a collection of tests intended to ' +
    'be run under a specific set of configuration(s).',
    'data': [],
    'filters': [
        {'name': 'all', 'title': 'All items',
         'href': '/suite/show_all',
         'selected': True}
    ]
}

RUNS_DEFAULT_UI_DATA = {
    'name': 'runs',
    'title': 'Runs',
    'href': '/run/show_all',
    'icon': '/images/artifacts/testrun.png',
    'description': 'Runs are an execution of a set of tests. ' +
    'Results are stored in the test case manager.',
    'filters': [{'name': 'all',
                 'title': 'All items',
                 'href': '/run/show_all?filter=all'},
                {'name': 'completed',
                 'title': 'Completed',
                 'href': '/run/show_all?filter=completed'},
                {'name': 'running',
                 'title': 'Running',
                 'href': '/run/show_all?filter=running'},
                {'name': 'scheduled',
                 'title': 'Scheduled',
                 'href': '/run/show_all?filter=scheduled'}]
}

NAV_DEFAULT_DATA = [
    {'title': 'Specs'},
    {'title': 'Code'},
    {'title': 'Tests',
     'href': '/suite/show_all',
     'selected': True},
    {'title': 'Admin'}
]

SCOPE_DEFAULT_DATA = {
    'name': 'runs',
    'scopes': [
        {'name': 'all',
         'title': 'Everything',
         'href': '/event/show_all'},
        {'name': 'suites',
         'title': 'Sets',
         'href': '/suite/show_all'},
        {'name': 'runs',
         'title': 'Runs',
         'href': '/run/show_all'}]
}

EVENT_ACTION_TO_READABLE = {
    'create': 'was created',
    'modify': 'was modified',
    'pass': 'was passed',
    'fail': 'was passed',
    'start': 'was started',
    'schedule': 'was scheduled',
    'delete': 'was deleted',
    'complete': 'was completed'
}
