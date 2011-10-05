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
 * @fileoverview This file contains the console messages related functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.StatusLogger');

goog.require('goog.fx');
goog.require('goog.fx.dom');



/**
 * A class for handling messages related functions.
 * @constructor
 */
rpf.StatusLogger = function() {
  /**
   * The status input element.
   * @type {Element}
   * @private
   */
  this.statusArea_ = goog.dom.getElement(rpf.StatusLogger.ID_);

  this.anim_ = new goog.fx.dom.FadeInAndShow(this.statusArea_, 600);

  this.setStatus(rpf.StatusLogger.DEFAULT);
};
goog.addSingletonGetter(rpf.StatusLogger);


/**
 * The status Element id.
 * @type {string}
 * @private
 */
rpf.StatusLogger.ID_ = 'statusLog';


/**
 * Default messages.
 * @type {string}
 */
rpf.StatusLogger.DEFAULT = [
  'Click Record/Playback option in popup to switch the tab under record ' +
  '(You might need to refresh the tab)',
  'Double click on a step to view the details.'].join('<br>');


/**
 * Starts recording messages.
 * @type {string}
 */
rpf.StatusLogger.START_RECORDING = [
  'Started recording (You might need to refresh the tab' +
  ' if elements are not highlighting on hover)',
  'Right click on an element to verify attributes.'].join('<br>');


/**
 * Stops recording messages.
 * @type {string}
 */
rpf.StatusLogger.STOP_RECORDING = [
  'Stopped recording'].join('<br>');


/**
 * Starts loading a test messages.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST = ['Loading...'].join('<br>');


/**
 * Starts loading a test messages.
 * @type {string}
 */
rpf.StatusLogger.LOAD_NO_TEST_ERROR = [
  'Please select a test.',
  '(You might want to load a project first)'].join('<br>');


/**
 * Loads a test successfully message.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST_SUCCESS = [
  'Load Successful.'].join('<br>');


/**
 * Loads a test unsuccessfully message.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST_FAILED = [
  'Failed loading...',
  'It could be an appengine hiccup or authentication expiration.'].join('<br>');


/**
 * Project missing details.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_MISSING_DETAILS = [
    'Project missing details...'].join('<br>');


/**
 * Project has no tests.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_NO_TESTS = ['Project has no tests...'].join('<br>');


/**
 * Project not found.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_NOT_FOUND = ['Project not found...'].join('<br>');


/**
 * Saving messages.
 * @type {string}
 */
rpf.StatusLogger.SAVING = ['Saving...'].join('<br>');


/**
 * Starts playback messages.
 * @type {string}
 */
rpf.StatusLogger.START_PLAYBACK = [
  'Started playback the test.',
  '(Stop button can clear status)'
].join('<br>');


/**
 * Finishes playback successfully messages.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_SUCCESS = [
  'Finished playback the test successfully!'].join('<br>');


/**
 * Finishes playback unsuccessfully messages.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_FAILED = [
  'Failed to playback the test.'].join('<br>');


/**
 * Manually stopped the playback.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_STOPPED = ['The playback was stopped.'].join('<br>');


/**
 * Saving failure messages.
 * @type {string}
 */
rpf.StatusLogger.SAVE_FAILED = [
  'Failed saving... (There might be a server hiccup,' +
  'please try again later)'].join('<br>');


/**
 * Saving success messages.
 * @type {string}
 */
rpf.StatusLogger.SAVE_SUCCESS = [
  'Saved successfully.'].join('<br>');


/**
 * Sets the console status.
 * @param {string} status Status string.
 * @param {string=} opt_color Status color.
 * @export
 */
rpf.StatusLogger.prototype.setStatus = function(status, opt_color) {
  var color = opt_color || 'black';
  var statusDiv = '<div style="color:' + color + '">' + status + '</div>';
  this.statusArea_.innerHTML = statusDiv;
  this.anim_.play();
};


/**
 * Sets the console status when being called back.
 * @param {Object.<string, string>} response
 *     The callback function to set status.
 * @export
 */
rpf.StatusLogger.prototype.setStatusCallback = function(response) {
  this.setStatus(response['message'], response['color']);
};

