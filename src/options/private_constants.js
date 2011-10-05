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
 * @fileoverview Defines BITE options/settings constants that are intended to
 * be private to the options package.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.options.private_constants');

goog.require('bite.options.constants');


/**
 * Options key values used for caching values in the localStorage.
 *
 * Some of the keys are values from bite.options.constants.Id instead of
 * directly accessing the enum due to the fact that Closure can not handle
 * keys in an enum being set from values in a different enum.  They also can't
 * handle non-capitalized, quoted strings as keys for enums.  Thus this type
 * is Object out of necessity.
 * @type {!Object}
 */
bite.options.private_constants.Key = {
  ADMIN_LAST_SAVE_TIME: 'bite.options.admin.lastSaveTime',
  ADMIN_LAST_SAVE_USER: 'bite.options.admin.lastSaveUser',

  'project': 'bite.options.bug.project',
  'recording': 'bite.options.bug.recording',
  'screenshot': 'bite.options.bug.screenshot',
  'state': 'bite.options.bug.state',
  'uiBinding': 'bite.options.bug.uiBinding',
  'serverChannel': 'bite.options.server.channel',
  'autoRecord': 'bite.options.rpf.autoRecord',
  'featuresBugs': 'bite.options.popup.Bugs',
  'featuresRpf': 'bite.options.popup.Rpf',
  'featuresTests': 'bite.options.popup.Tests'
};


/**
 * Defines the default username constant when there is no username given.
 * @type {string}
 */
bite.options.private_constants.DEFAULT_USERNAME = 'unknown';


/**
 * Default values for the Option settings.
 *
 * Some of the keys are values from bite.options.constants.Id instead of
 * directly accessing the enum due to the fact that Closure can not handle
 * keys in an enum being set from values in a different enum.  They also can't
 * handle non-capitalized, quoted strings as keys for enums.  Thus this type
 * is Object out of necessity.
 * @type {!Object}
 */
bite.options.private_constants.Default = {
  'project': bite.options.constants.ProjectOption.NOT_TRASH,
  'recording': bite.options.constants.ThreeWayOption.ALL,
  'screenshot': bite.options.constants.ThreeWayOption.ALL,
  'state': bite.options.constants.StateOption.ALL,
  'uiBinding': bite.options.constants.ThreeWayOption.ALL,
  'serverChannel': bite.options.constants.ServerChannelOption.DEV,
  'autoRecord': 'true',
  'featuresBugs': 'true',
  'featuresRpf': 'true',
  'featuresTests': 'true'
};

