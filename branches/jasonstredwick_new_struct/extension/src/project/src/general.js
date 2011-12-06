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
 * @fileoverview Define the controller for bite.project.General
 * window.  The object defines the functionality specifically for this
 * controller and does not affect the outside world.  However, it does define
 * a set of signals that can be used by external sources to perform actions
 * when the controller performs certain tasks.
 *
 * The General window is inteneded to have only a single instance.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.General');

goog.require('bite.common.mvc.helper');
goog.require('bite.project.soy.General');
goog.require('goog.dom');
goog.require('goog.dom.TagName');



/**
 * Constructs an instance of a General controller.  The constructor
 * creates the object in a default state that has not been mapped to a view.
 * @constructor
 * @export
 */
bite.project.General = function() {
  /**
   * The description input element.
   * @type {Element}
   * @private
   */
  this.description_ = null;

  /**
   * Whether or not the window's model is initialized.
   * @type {boolean}
   * @private
   */
  this.isModelInitialized_ = false;

  /**
   * The name input element.
   * @type {Element}
   * @private
   */
  this.name_ = null;

  /**
   * The provider input element.
   * @type {Element}
   * @private
   */
  this.provider_ = null;

  /**
   * The provider info input element.
   * @type {Element}
   * @private
   */
  this.providerInfo_ = null;

  /**
   * The provider input element.
   * @type {Element}
   * @private
   */
  this.tcm_ = null;

  /**
   * The provider info input element.
   * @type {Element}
   * @private
   */
  this.tcmInfo_ = null;

  /**
   * Window element managed by this controller.  Defaults to null meaning the
   * controller is not attached to a model.
   * @type {Element}
   * @private
   */
  this.window_ = null;
};
goog.addSingletonGetter(bite.project.General);


/**
 * The window's id.
 * @type {string}
 * @private
 */
bite.project.General.CONSOLE_ID_ = 'project-general';


/**
 * The string identifiers for this view's data.
 * @enum {string}
 * @private
 */
bite.project.General.Data_ = {
  DESCRIPTION: 'description',
  NAME: 'name',
  PROVIDER: 'provider',
  PROVIDER_INFO: 'provider_info',
  TCM: 'tcm',
  TCM_INFO: 'tcm_info'
};


/**
 * Given an object, fill in values respective to this view.
 * @param {Object} inout_data An object to be filled with values.
 * @export
 */
bite.project.General.prototype.getData = function(inout_data) {
  if (!this.isInitialized()) {
    return;
  }

  inout_data[bite.project.General.Data_.DESCRIPTION] = this.description_.value;
  inout_data[bite.project.General.Data_.NAME] = this.name_.value;
  inout_data[bite.project.General.Data_.PROVIDER] = this.provider_.value;
  inout_data[bite.project.General.Data_.PROVIDER_INFO] =
      this.providerInfo_.value;
  inout_data[bite.project.General.Data_.TCM] = this.tcm_.value;
  inout_data[bite.project.General.Data_.TCM_INFO] = this.tcmInfo_.value;
};


/**
 * Returns the div element representing this details view.
 * @return {Element} It will return the element or null if not created.
 * @export
 */
bite.project.General.prototype.getView = function() {
  return this.window_;
};


/**
 * Initialize the General Window by creating the model and hooking
 * functions to the model.  If a baseUrl is given and the view is not yet
 * initialized then this function will try to initialize it.  Nothing happens
 * if the window is already initialized.
 * @param {string=} opt_baseUrl The baseUrl required for relative references.
 * @return {boolean} Whether or not the model is initialized.  It will also
 *     return true if the model is already initialized.
 * @export
 */
bite.project.General.prototype.init = function(opt_baseUrl) {
  if (this.isModelInitialized_) {
    return true;
  }

  var helper = bite.common.mvc.helper;
  this.window_ = helper.initModel(bite.project.soy.General.getModel,
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
bite.project.General.prototype.isInitialized = function() {
  return this.isModelInitialized_;
};


/**
 * Retrieve elements from the model to be used later.
 * @param {!Element} srcElement The element from which to find the ones
 *     desired.
 * @return {boolean} Whether or not they were all found.
 * @private
 */
bite.project.General.prototype.setupInputs_ = function(srcElement) {
  var helper = bite.common.mvc.helper;
  this.description_ = helper.getElement('project-description', srcElement);
  this.name_ = helper.getElement('project-name', srcElement);
  this.provider_ = helper.getElement('project-bug-provider',
                                                     srcElement);
  this.providerInfo_ = helper.getElement('project-bug-provider-info',
                                         srcElement);
  this.tcm_ = helper.getElement('project-tcm', srcElement);
  this.tcmInfo_ = helper.getElement('project-tcm-info', srcElement);

  return true;
};


/**
 * Takes an object that contains data for the various inputs and sets the
 * input elements to the appropriate values.
 * @param {Object} data The data used to fill out the form.
 * @return {boolean} Whether or not the window was updated.
 * @export
 */
bite.project.General.prototype.update = function(data) {
  if (!this.isInitialized()) {
    return false;
  }

  if (bite.project.General.Data_.DESCRIPTION in data) {
    this.description_.value = data[bite.project.General.Data_.DESCRIPTION];
  }

  if (bite.project.General.Data_.NAME in data) {
    this.name_.value = data[bite.project.General.Data_.NAME];
  }

  if (bite.project.General.Data_.PROVIDER in data) {
    this.provider_.value = data[bite.project.General.Data_.PROVIDER];
  }

  if (bite.project.General.Data_.PROVIDER_INFO in data) {
    this.providerInfo_.value = data[bite.project.General.Data_.PROVIDER_INFO];
  }

  if (bite.project.General.Data_.TCM in data) {
    this.tcm_.value = data[bite.project.General.Data_.TCM];
  }

  if (bite.project.General.Data_.TCM_INFO in data) {
    this.tcmInfo_.value = data[bite.project.General.Data_.TCM_INFO];
  }

  return true;
};


/**
 * Reset the model portion of the controller back to an uninitialized state.
 * @private
 */
bite.project.General.prototype.undoSetup_ = function() {
  // Make sure and remove the DOM Element from the document upon failure.
  if (this.window_) {
    bite.common.mvc.helper.removeElementById(bite.project.General.CONSOLE_ID_);
  }

  this.description_ = null;
  this.name_ = null;
  this.provider_ = null;
  this.providerInfo_ = null;
  this.tcm_ = null;
  this.tcmInfo_ = null;
  this.window_ = null;
};

