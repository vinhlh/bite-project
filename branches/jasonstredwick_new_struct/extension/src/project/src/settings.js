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
 * @fileoverview Define the controller for bite.project.Settings
 * window.  The object defines the functionality specifically for this
 * controller and does not affect the outside world.  However, it does define
 * a set of signals that can be used by external sources to perform actions
 * when the controller performs certain tasks.
 *
 * The Settings window is inteneded to have only a single instance.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.Settings');

goog.require('bite.common.mvc.helper');
goog.require('bite.project.soy.Settings');
goog.require('goog.dom');
goog.require('goog.dom.TagName');



/**
 * Constructs an instance of a Settings controller.  The constructor
 * creates the object in a default state that has not been mapped to a view.
 * @constructor
 * @export
 */
bite.project.Settings = function() {
  /**
   * Whether or not the window's model is initialized.
   * @type {boolean}
   * @private
   */
  this.isModelInitialized_ = false;

  /**
   * Holds the line length element.
   * @type {Element}
   * @private
   */
  this.lineLength_ = null;

  /**
   * Holds the run time element.
   * @type {Element}
   * @private
   */
  this.runtime_ = null;

  /**
   * Holds the screenshot checkbox element.
   * @type {Element}
   * @private
   */
  this.screenshot_ = null;

  /**
   * Holds the timeout limit element.
   * @type {Element}
   * @private
   */
  this.timeout_ = null;

  /**
   * Holds the worker mode token element.
   * @type {Element}
   * @private
   */
  this.token_ = null;

  /**
   * Holds the start url element.
   * @type {Element}
   * @private
   */
  this.url_ = null;

  /**
   * Window element managed by this controller.  Defaults to null meaning the
   * controller is not attached to a model.
   * @type {Element}
   * @private
   */
  this.window_ = null;
};
goog.addSingletonGetter(bite.project.Settings);


/**
 * The window's id.
 * @type {string}
 * @private
 */
bite.project.Settings.CONSOLE_ID_ = 'project-settings';


/**
 * The string identifiers for this view's data.
 * @enum {string}
 * @private
 */
bite.project.Settings.Data_ = {
  LINE_LENGTH: 'test_case_line_length',
  RUNTIME: 'max_runs_per_test',
  SCREENSHOT: 'save_screen_shot',
  TIMEOUT: 'line_timeout_limit',
  TOKEN: 'worker_mode_token',
  URL: 'start_url_replacement'
};


/**
 * Given an object, fill in values respective to this view.
 * @param {Object} inout_data An object to be filled with values.
 * @export
 */
bite.project.Settings.prototype.getData = function(inout_data) {
  if (!this.isInitialized()) {
    return;
  }

  inout_data[bite.project.Settings.Data_.LINE_LENGTH] = this.lineLength_.value;
  inout_data[bite.project.Settings.Data_.RUNTIME] = this.runtime_.value;
  inout_data[bite.project.Settings.Data_.SCREENSHOT] =
      (this.screenshot_.value) ? 'true' : 'false';
  inout_data[bite.project.Settings.Data_.TIMEOUT] = this.timeout_.value;
  inout_data[bite.project.Settings.Data_.TOKEN] = this.token_.value;
  inout_data[bite.project.Settings.Data_.URL] = this.url_.value;
};

/**
 * Returns the div element of this details view.
 * @return {Element} It will return the element or null if not created.
 * @export
 */
bite.project.Settings.prototype.getView = function() {
  return this.window_;
};


/**
 * Initialize the Settings Window by creating the model and hooking
 * functions to the model.  If a baseUrl is given and the view is not yet
 * initialized then this function will try to initialize it.  Nothing happens
 * if the window is already initialized.
 * @param {string=} opt_baseUrl The baseUrl required for relative references.
 * @return {boolean} Whether or not the model is initialized.  It will also
 *     return true if the model is already initialized.
 * @export
 */
bite.project.Settings.prototype.init = function(opt_baseUrl) {
  if (this.isModelInitialized_) {
    return true;
  }

  var helper = bite.common.mvc.helper;
  this.window_ = helper.initModel(bite.project.soy.Settings.getModel,
                                  {'baseUrl': opt_baseUrl});

  if (this.window_ && this.setupInputs_(this.window_)) {
    this.isModelInitialized_ = true;
  } else {
    this.undoSetup_();
  }

  return this.isModelInitialized_;
};


/**
 * Determines if the window is constructed or not.
 * @return {boolean} Whether or not the view is initialized.
 * @export
 */
bite.project.Settings.prototype.isInitialized = function() {
  return this.isModelInitialized_;
};


/**
 * Retrieve and store references to the input elements.
 * @param {!Element} srcElement The element from which to find the needed
 *     elements.
 * @return {boolean} Whether or not all elements were found.
 * @private
 */
bite.project.Settings.prototype.setupInputs_ = function(srcElement) {
  var helper = bite.common.mvc.helper;

  this.lineLength_ = helper.getElement('project-line-length', srcElement);
  this.runtime_ = helper.getElement('project-max-time', srcElement);
  this.screenshot_ = helper.getElement('project-screenshot', srcElement);
  this.timeout_ = helper.getElement('project-timeout', srcElement);
  this.token_ = helper.getElement('project-worker-mode-token', srcElement);
  this.url_ = helper.getElement('project-start-url', srcElement);

  return true;
};


/**
 * Takes an object that contains data for the various inputs and sets the
 * input elements to the appropriate values.
 * @param {Object} data The data used to fill out the form.
 * @return {boolean} Whether or not the window was updated.
 * @export
 */
bite.project.Settings.prototype.update = function(data) {
  if (!this.isInitialized()) {
    return false;
  }

  if (bite.project.Settings.Data_.LINE_LENGTH in data) {
    this.lineLength_.value = data[bite.project.Settings.Data_.LINE_LENGTH];
  }

  if (bite.project.Settings.Data_.RUNTIME in data) {
    this.runtime_.value = data[bite.project.Settings.Data_.RUNTIME];
  }

  if (bite.project.Settings.Data_.SCREENSHOT in data) {
    this.screenshot_.checked =
        (data[bite.project.Settings.Data_.SCREENSHOT]) ? 'true' : 'false';
  }

  if (bite.project.Settings.Data_.TIMEOUT in data) {
    this.timeout_.value = data[bite.project.Settings.Data_.TIMEOUT];
  }

  if (bite.project.Settings.Data_.TOKEN in data) {
    this.token_.value = data[bite.project.Settings.Data_.TOKEN];
  }

  if (bite.project.Settings.Data_.URL in data) {
    this.url_.value = data[bite.project.Settings.Data_.URL];
  }

  return true;
};


/**
 * Reset the model portion of the controller back to an uninitialized state.
 * @private
 */
bite.project.Settings.prototype.undoSetup_ = function() {
  // Make sure and remove the DOM Element from the document upon failure.
  if (this.window_) {
    var helper = bite.common.mvc.helper;
    helper.removeElementById(bite.project.Settings.CONSOLE_ID_);
  }

  this.lineLength_ = null;
  this.runtime_ = null;
  this.screenshot_ = null;
  this.timeout_ = null;
  this.token_ = null;
  this.url_ = null;
  this.window_ = null;
};

