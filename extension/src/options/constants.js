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
 * @fileoverview Defines BITE options/settings constants including ids,
 * messaging, and option settings.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.options.constants');


/**
 * Options key values.
 * @enum {string}
 */
bite.options.constants.Id = {
  BUG_PROJECT: 'project',
  BUG_RECORDING: 'recording',
  BUG_SCREENSHOT: 'screenshot',
  BUG_STATE: 'state',
  BUG_UI_BINDING: 'uiBinding',
  SERVER_CHANNEL: 'serverChannel',
  AUTO_RECORD: 'autoRecord',
  FEATURES_BUGS: 'featuresBugs',
  FEATURES_RPF: 'featuresRpf',
  FEATURES_TESTS: 'featuresTests',
  FEATURES_CLOSE: 'featuresClose',
  FEATURES_REPORT: 'featuresReport'
};


/**
 * The owner string to specifiy that messages come from the configuration data.
 * @type {string}
 */
bite.options.constants.OWNER = 'bite.options';


/**
 * Messages to notify configuration data users.
 * @enum {string}
 */
bite.options.constants.Message = {
  UPDATE: 'update'
};


/**
 * Possible data sent with the various messages.
 * @enum {string}
 */
bite.options.constants.MessageData = {
  DATA: 'data' // The data will be an Object.<bite.option.constants.Id, string>
};


/**
 * Bug project option pulldown values.
 * @enum {string}
 */
bite.options.constants.ProjectOption = {
  ALL: 'all',
  GEO: 'geo',
  WEBSTORE: 'chromewebstore',
  NOT_TRASH: 'nottrash',
  TRASH: 'trash'
};


/**
 * Bug state option pulldown values.
 * @enum {string}
 */
bite.options.constants.StateOption = {
  ACTIVE: 'active',
  ALL: 'all',
  CLOSED: 'closed',
  RESOLVED: 'resolved'
};


/**
 * Three-way option pulldown values.
 * @enum {string}
 */
bite.options.constants.ThreeWayOption = {
  ALL: 'all',
  NO: 'no',
  YES: 'yes'
};


/**
 * BITE's server list.
 * @enum {string}
 */
bite.options.constants.ServerChannelOption = {
  DEV: 'https://dev-dot-bite-playground.appspot.com',
  STAGING: 'https://staging-dot-bite-server.appspot.com',
  RELEASE: 'https://bite-playground.appspot.com'
};

