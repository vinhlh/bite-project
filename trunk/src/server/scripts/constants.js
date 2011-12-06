// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview BITE server constants.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.Constants');


/**
 * The everything tab UI data in explore page.
 * @type {Object}
 * @export
 */
bite.server.Constants.EVERYTHING_DEFAULT_UI_DATA = {
  'name': 'all',
  'href': '/event/show_all',
  'title': 'Everything',
  'artifactTitle': 'Recent Activities',
  'icon': '/images/artifacts/testing.png',
  'description': 'This page shows recent activities',
  'data': [],
  'filters': [
      {'name': 'all',
       'title': 'All items',
       'href': '/event/show_all',
       'selected': true}]
};


/**
 * The Set tab UI data in explore page.
 * @type {Object}
 * @export
 */
bite.server.Constants.SUITES_DEFAULT_UI_DATA = {
  'name': 'suites',
  'href': '/suite/show_all',
  'title': 'Sets',
  'icon': '/images/artifacts/testsuite.png',
  'description': 'Sets are a collection of tests intended to ' +
      'be run under a specific configuration(s).',
  'data': [],
  'filters': [
      {'name': 'all',
       'title': 'All items',
       'href': '/suite/show_all',
       'selected': true}]
};


/**
 * The Runs tab UI data in explore page.
 * @type {Object}
 * @export
 */
bite.server.Constants.RUNS_DEFAULT_UI_DATA = {
  'name': 'runs',
  'title': 'Runs',
  'href': '/run/show_all',
  'icon': '/images/artifacts/testrun.png',
  'description': 'Runs are an execution of a set of tests. ' +
      'Results are stored in the test case manager.',
  'filters': [
      {'name': 'all',
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
};


/**
 * The top navigation data in all pages.
 * @type {Array}
 * @export
 */
bite.server.Constants.TOP_NAV_DEFAULT_DATA = [
];


/**
 * The tab id and tab data's map in explore page.
 * @type {Object}
 * @export
 */
bite.server.Constants.NAV_DETAILS_MAP = {
  'all': bite.server.Constants.EVERYTHING_DEFAULT_UI_DATA,
  'suites': bite.server.Constants.SUITES_DEFAULT_UI_DATA,
  'runs': bite.server.Constants.RUNS_DEFAULT_UI_DATA
};


/**
 * The main navigations UI data in explore page.
 * @type {Array}
 * @export
 */
bite.server.Constants.DEFAULT_MAINNAVS_EXPLORE_PAGE = [
  {'name': 'all',
   'title': 'Everything',
   'path': '/event/show_all'},
  {'name': 'suites',
   'title': 'Sets',
   'path': '/suite/show_all'},
  {'name': 'runs',
   'title': 'Runs',
   'path': '/run/show_all'}
];


/**
 * The main navigations UI data in project explore page.
 * @type {Array}
 * @export
 */
bite.server.Constants.MAINNAVS_PROJECT_EXPLORE_PAGE = [
  {'name': 'projects',
   'title': 'Projects'}
];


/**
 * The main navigations UI data in Set's details page.
 * @type {Array}
 * @export
 */
bite.server.Constants.DEFAULT_MAINNAVS_DETAILS_PAGE = [
  {'name': 'runs',
   'title': 'Runs',
   'href': ''}
];


/**
 * The main navigations UI data in Run's details page.
 * @type {Array}
 * @export
 */
bite.server.Constants.DEFAULT_MAINNAVS_RUN_DETAILS_PAGE = [
  {'name': 'results',
   'title': 'Results',
   'href': ''}
];


/**
 * The main navigations UI data in Project's details page.
 * @type {Array}
 * @export
 */
bite.server.Constants.DEFAULT_MAINNAVS_PROJECT_DETAILS_PAGE = [
  {'name': 'general',
   'title': 'General',
   'href': ''},
  {'name': 'members',
   'title': 'Members',
   'href': ''},
  {'name': 'settings',
   'title': 'Settings',
   'href': ''}
];


/**
 * The left navigations UI data in runs tab of Set's details page.
 * @type {Array}
 * @export
 */
bite.server.Constants.DETAILS_RUNS_LEFT_NAVIGATION = [
  {'name': 'all',
   'title': 'All'},
  {'name': 'day1',
   'title': 'Past 24 hours'},
  {'name': 'day2',
   'title': 'Past 2 days'},
  {'name': 'day7',
   'title': 'Past week'},
  {'name': 'running',
   'title': 'Running'},
  {'name': 'queued',
   'title': 'Queued'},
  {'name': 'completed',
   'title': 'Completed'}
];
