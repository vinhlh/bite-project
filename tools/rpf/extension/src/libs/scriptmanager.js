// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview This file contains the script manager.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.ScriptManager');

goog.require('rpf.MiscHelper');



/**
 * A class for managing a given script.
 * @constructor
 * @export
 */
rpf.ScriptManager = function() {
  /**
   * The scripts array.
   * @type {Array}
   */
  this.scripts = [];

  /**
   * The temp data file string.
   * @type {string}
   */
  this.datafile = '';

  /**
   * The user specified lib string.
   * @type {string}
   */
  this.userLib = '';

  /**
   * The script start url.
   * @type {string}
   */
  this.startUrl = '';

  /**
   * The test name.
   * @type {string}
   */
  this.testName = '';

  /**
   * The project name.
   * @type {string}
   */
  this.projectName = '';

  /**
   * The element's css selectors.
   * @type {Array}
   */
  this.selectors = [];

  /**
   * The data user inputs.
   * @type {string}
   */
  this.content = '';

  /**
   * The element's node tag.
   * @type {string}
   */
  this.nodeTag = '';

  /**
   * The user's action with page.
   * @type string
   */
  this.action = '';

  /**
   * The descriptive info of the element.
   * @type {string}
   */
  this.descriptor = '';

  /**
   * The element's variable name.
   * @type {string}
   */
  this.elemVarName = '';

  /**
   * The screenshots array.
   * @type {Array}
   */
  this.screenShotsArray = [];
};


/**
 * Enum for label values.
 * @enum {string}
 * @export
 */
rpf.ScriptManager.Labels = {
  URL: 'url',
  NAME: 'name',
  SCRIPT: 'script',
  DATAFILE: 'datafile',
  USER_LIB: 'userlib',
  PROJECT_NAME: 'projectname',
  SCREEN_SHOTS: 'screenshots'
};


/**
 * Parses the json object from the cloud.
 * @param {Object} jsonObj An object of the test related info.
 * @export
 */
//TODO (phu): Consider creating an object for these fields.
rpf.ScriptManager.prototype.parseJsonObj = function(jsonObj) {
  this.testName = jsonObj[rpf.ScriptManager.Labels.NAME];
  this.startUrl = jsonObj[rpf.ScriptManager.Labels.URL];
  this.scriptStr = jsonObj[rpf.ScriptManager.Labels.SCRIPT];
  this.datafile = jsonObj[rpf.ScriptManager.Labels.DATAFILE];
  this.userLib = jsonObj[rpf.ScriptManager.Labels.USER_LIB];
  this.projectName = jsonObj[rpf.ScriptManager.Labels.PROJECT_NAME];
};


/**
 * Creates a Json serializable object by the test related info.
 * @param {string} name The test name.
 * @param {string} url The test start url.
 * @param {string} script The test script.
 * @param {string} datafile The test data file string.
 * @param {string} userLib The user specified lib string.
 * @param {string} projectName The project name.
 * @param {Array.<string>=} opt_screenshots The screenshots array.
 * @return {Object} The object of the test related info.
 * @export
 */
rpf.ScriptManager.prototype.createJsonObj = function(
    name, url, script, datafile, userLib, projectName, opt_screenshots) {
  var cmdsJsonObj = {};
  this.testName = name;
  this.startUrl = url;
  this.scriptStr = script;
  this.datafile = datafile;
  this.userLib = userLib;
  this.projectName = projectName;
  cmdsJsonObj[rpf.ScriptManager.Labels.NAME] = name;
  cmdsJsonObj[rpf.ScriptManager.Labels.URL] = url;
  cmdsJsonObj[rpf.ScriptManager.Labels.SCRIPT] = script;
  cmdsJsonObj[rpf.ScriptManager.Labels.DATAFILE] = datafile;
  cmdsJsonObj[rpf.ScriptManager.Labels.USER_LIB] = userLib;
  cmdsJsonObj[rpf.ScriptManager.Labels.PROJECT_NAME] = projectName;
  if (opt_screenshots) {
    this.screenShotsArray = opt_screenshots;
    cmdsJsonObj[rpf.ScriptManager.Labels.SCREEN_SHOTS] = opt_screenshots;
  }
  return cmdsJsonObj;
};
