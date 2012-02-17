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
 * @fileoverview User visible messages for bite.
 * @author michaelwill@google.com (Michael Williamson)
 */

goog.provide('bite.client.messages');

/** @desc Tests option title. */
var MSG_POPUP_OPTION_TEST_NAME = goog.getMsg('Tests');

/** @desc Tests option info. */
var MSG_POPUP_OPTION_TEST_DESC = goog.getMsg('Find and run manual tests.');

/** @desc Bugs option title. */
var MSG_POPUP_OPTION_BUGS_NAME = goog.getMsg('Bugs');

/** @desc Bugs option info. */
var MSG_POPUP_OPTION_BUGS_DESC = goog.getMsg(
    'Visualize existing bugs or file new ones.');

/** @desc Report Bug option title. */
var MSG_POPUP_OPTION_REPORT_BUG_NAME = goog.getMsg('Report Bug');

/** @desc Report Bug option info. */
var MSG_POPUP_OPTION_REPORT_BUG_DESC = goog.getMsg(
    'File a bug against this page (Ctrl+Alt+B)');

/** @desc Close option title. */
var MSG_POPUP_OPTION_CLOSE_NAME = goog.getMsg('Close Consoles');

/** @desc Close option info. */
var MSG_POPUP_OPTION_CLOSE_DESC = goog.getMsg(
    'Close all BITE consoles in all windows.');

/** @desc Record and playback option title. */
var MSG_POPUP_OPTION_FLUX_NAME = goog.getMsg('Record/Playback');

/** @desc Record and playback option info. */
var MSG_POPUP_OPTION_FLUX_DESC = goog.getMsg(
    'Record and playback UI automation.');

/** @desc Xpath finder option title. */
var MSG_POPUP_OPTION_XPATH_NAME = goog.getMsg('Xpath Finder');

/** @desc Xpath finder option info. */
var MSG_POPUP_OPTION_XPATH_DESC = goog.getMsg(
    'Help to get a custom Xpath.');

/** @desc Layers option title. */
var MSG_POPUP_OPTION_LAYERS_NAME = goog.getMsg('Layers');

/** @desc Layers option info. */
var MSG_POPUP_OPTION_LAYERS_DESC = goog.getMsg(
    'Create or use custom tools and scripts.');

/** @desc Sets option title. */
var MSG_POPUP_OPTION_SETS_NAME = goog.getMsg('Sets');

/** @desc Sets option info. */
var MSG_POPUP_OPTION_SETS_DESC = goog.getMsg(
    'Manage and analyze collections of tests.');

/** @desc Risk option title. */
var MSG_POPUP_OPTION_RISK_NAME = goog.getMsg('Risk');

/** @desc Risk option info. */
var MSG_POPUP_OPTION_RISK_DESC = goog.getMsg(
    'Track risk and test analytics.');

/** @desc Admin option title. */
var MSG_POPUP_OPTION_ADMIN_NAME = goog.getMsg('Admin');

/** @desc Admin option info. */
var MSG_POPUP_OPTION_ADMIN_DESC = goog.getMsg(
    'Manage projects, layers and security.');

/** @desc Help option title. */
var MSG_POPUP_OPTION_HELP_NAME = goog.getMsg('Help');

/** @desc Help option info. */
var MSG_POPUP_OPTION_HELP_DESC = goog.getMsg('Learn how to use RPF.');

/** @desc Settings option title. */
var MSG_POPUP_OPTION_SETTINGS_NAME = goog.getMsg('Settings');

/** @desc Settings option info. */
var MSG_POPUP_OPTION_SETTINGS_DESC = goog.getMsg('Configure BITE.');

/**
 * @param {string} uri The url that will help the user in
 *     the event of an error.
 * @return {string} The message.
 */
function CALL_MSG_POPUP_LOGIN_ERROR(uri) {
  /** @desc A login error string. */
  var MSG_POPUP_LOGIN_ERROR = goog.getMsg(
      'There was a problem logging in.<br>' +
      '<a href="{$uri}" target="_blank">Try logging in here</a>.',
      {uri: uri});
  return MSG_POPUP_LOGIN_ERROR;
}
