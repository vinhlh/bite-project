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
 * @fileoverview This file contains how RPF loads tests.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.LoaderDialog');

goog.require('bite.common.mvc.helper');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.StatusLogger');
goog.require('rpf.soy.Dialog');



/**
 * A class for loading tests from locally or cloud.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
 *     onUiEvents The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.LoaderDialog = function(messenger, onUiEvents) {
  /**
   * The ids of the tests.
   * @type {Array.<string>}
   * @private
   */
  this.uniqueIds_ = null;

  /**
   * The names of the tests.
   * @type {Array}
   * @private
   */
  this.testNames_ = [];

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * The current responded project object.
   * @type {Object}
   * @private
   */
  this.curProject_ = null;
};


/**
 * Enum for location values.
 * @enum {string}
 */
rpf.LoaderDialog.Locations = {
  WEB: 'web',
  LOCAL: 'local'
};


/**
 * Loads the current specified project.
 * @param {string} projectName The project name.
 * @param {Function} callback The
 */
rpf.LoaderDialog.prototype.loadProject = function(projectName, callback) {
  this.showTests_(callback, projectName);
};


/**
 * Automates the dialog.
 * @param {boolean} isWeb Whether the location is the web.
 * @param {string} project The project name.
 * @param {string} test The test name.
 * @param {function(Object)} callback The callback function.
 */
rpf.LoaderDialog.prototype.automateDialog = function(
    isWeb, project, test, callback) {
};


/**
 * Gets the storage location.
 * @return {string} The storage location.
 */
rpf.LoaderDialog.prototype.getStorageLocation = function() {
  var locations = goog.dom.getDocument().getElementsByName('projectLocation');
  for (var i = 0, len = locations.length; i < len; ++i) {
    if (locations[i].checked) {
      return locations[i].value;
    }
  }
  alert('Please select a location.');
  throw new Error('No location was specified.');
};


/**
 * Shows tests from locally or cloud.
 * @param {Function} callback The callback.
 * @param {string} projectName The project name.
 * @private
 */
rpf.LoaderDialog.prototype.showTests_ = function(
    callback, projectName) {
  var names = [];
  var storageLocation = this.getStorageLocation();
  if (!projectName) {
    rpf.StatusLogger.getInstance().setStatus(
        'Please enter a project name.', 'red');
    return;
  }
  var command = storageLocation == rpf.LoaderDialog.Locations.WEB ?
                Bite.Constants.CONSOLE_CMDS.GET_PROJECT :
                Bite.Constants.CONSOLE_CMDS.GET_LOCAL_PROJECT;
  var newCallback = goog.bind(this.updateNamesAndIds_, this, callback);
  this.messenger_.sendMessage(
      {'command': command,
       'params': {'name': projectName}},
      newCallback);
};


/**
 * Update names and ids in load dialog.
 * @param {Function} callback The callback function.
 * @param {Object} response The response object.
 * @private
 */
rpf.LoaderDialog.prototype.updateNamesAndIds_ = function(
    callback, response) {
  var jsonObj = response['jsonObj'];
  if (jsonObj['error']) {
    callback({'success': false});
    return;
  }
  this.curProject_ = jsonObj;
  var tests = jsonObj['tests'];
  var project_details = jsonObj['project_details'];
  var projectName = jsonObj['name'];
  var names = [];
  var ids = response['location'] == 'web' ? [] : null;

  goog.array.sortObjectsByKey(tests, 'test_name');
  for (var i = 0; i < tests.length; ++i) {
    names.push(tests[i]['test_name']);
    if (response['location'] == 'web') {
      ids.push(tests[i]['id']);
    }
  }

  this.testNames_ = names;
  this.uniqueIds_ = ids;
  this.onUiEvents_(
      Bite.Constants.UiCmds.UPDATE_INVOKE_SELECT,
      {'names': this.testNames_,
       'ids': this.uniqueIds_},
      /** @type {Event} */ ({}));

  this.onUiEvents_(
      Bite.Constants.UiCmds.SET_PROJECT_INFO,
      {'name': projectName,
       'tests': tests,
       'details': project_details,
       'from': 'web'},
      /** @type {Event} */ ({}));

  callback(this.testNames_, {'success': true});
};


/**
 * Loads the specified test.
 * @param {function(Object)} callback The load test callback function.
 * @param {string} project The optional project name.
 * @param {string} test The optional test name.
 */
rpf.LoaderDialog.prototype.loadSelectedTest = function(
    callback, project, test) {
  var testId = this.getIdByName(test);
  var locationStorage = this.getStorageLocation();

  if (locationStorage == rpf.LoaderDialog.Locations.WEB) {
    this.onUiEvents_(Bite.Constants.UiCmds.LOAD_TEST_FROM_WTF,
        {'jsonId': testId,
         'mode': rpf.MiscHelper.Modes.CONSOLE},
        /** @type {Event} */ ({}));
  } else {
    this.onUiEvents_(Bite.Constants.UiCmds.LOAD_TEST_FROM_LOCAL,
        {'name': test,
         'projectName': project},
        /** @type {Event} */ ({}));
  }
};


/**
 * Gets the id by test name. Note, this assumes there is no duplicated test
 * name.
 * @param {string} name The test name.
 * @return {string} The id of the test.
 */
rpf.LoaderDialog.prototype.getIdByName = function(name) {
  if (!this.uniqueIds_ || !name) {
    return '';
  }
  for (var i = 0, len = this.testNames_.length; i < len; ++i) {
    if (name == this.testNames_[i]) {
      return this.uniqueIds_[i];
    }
  }
};


/**
 * @return {Array.<string>} The ids of the tests.
 */
rpf.LoaderDialog.prototype.getUniqueIds = function() {
  return this.uniqueIds_;
};


/**
 * @return {Array} The names of the tests.
 */
rpf.LoaderDialog.prototype.getTestNames = function() {
  return this.testNames_;
};


/**
 * Gets the current project object.
 * @return {Object} The project object.
 */
rpf.LoaderDialog.prototype.getCurrentProject = function() {
  return this.curProject_;
};

