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
 * @fileoverview Define the controller for bite.project.Member
 * window.  The object defines the functionality specifically for this
 * controller and does not affect the outside world.  However, it does define
 * a set of signals that can be used by external sources to perform actions
 * when the controller performs certain tasks.
 *
 * The Member window is inteneded to have only a single instance.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.Member');

goog.require('bite.common.mvc.helper');
goog.require('bite.project.soy.Member');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.string');



/**
 * Constructs an instance of a Member controller.  The constructor
 * creates the object in a default state that has not been mapped to a view.
 * @constructor
 * @export
 */
bite.project.Member = function() {
  /**
   * The cancel button element.
   * @type {Element}
   * @private
   */
  this.buttonCancel_ = null;

  /**
   * The invite button element.
   * @type {Element}
   * @private
   */
  this.buttonInvite_ = null;

  /**
   * The remove button element.
   * @type {Element}
   * @private
   */
  this.buttonRemove_ = null;

  /**
   * The invite textarea.
   * @type {Element}
   * @private
   */
  this.invite_ = null;

  /**
   * Whether or not the window's model is initialized.
   * @type {boolean}
   * @private
   */
  this.isModelInitialized_ = false;

  /**
   * The Element that contains a list of group members.
   * @type {Element}
   * @private
   */
  this.members_ = null;

  /**
   * Window element managed by this controller.  Defaults to null meaning the
   * controller is not attached to a model.
   * @type {Element}
   * @private
   */
  this.window_ = null;
};
goog.addSingletonGetter(bite.project.Member);


/**
 * The window's id.
 * @type {string}
 * @private
 */
bite.project.Member.CONSOLE_ID_ = 'project-member';


/**
 * The string identifiers for this view's data.
 * TODO (jasonstredwick): Need to incorporate the rest of the elements into
 *                        this and other enums.
 * @enum {string}
 * @private
 */
bite.project.Member.Data_ = {
  MEMBERS: 'emails'
};


/**
 * Given an object, fill in values respective to this view.
 * @param {Object} inout_data An object to be filled with values.
 * @export
 */
bite.project.Member.prototype.getData = function(inout_data) {
  if (!this.isInitialized()) {
    return;
  }

  var members = [];

  for (var i = 0, len = this.members_.rows.length; i < len; ++i) {
    members.push(this.members_.rows[i].cells[0]);
  }

  inout_data[bite.project.Member.Data_.MEMBERS] = members;
};


/**
 * Returns the div element for this details view.
 * @return {Element} It will return the element or null if not created.
 * @export
 */
bite.project.Member.prototype.getView = function() {
  return this.window_;
};


/**
 * Initialize the Member Window by creating the model and hooking
 * functions to the model.  If a baseUrl is given and the view is not yet
 * initialized then this function will try to initialize it.  Nothing happens
 * if the window is already initialized.
 * @param {string=} opt_baseUrl The baseUrl required for relative references.
 * @return {boolean} Whether or not the model is initialized.  It will also
 *     return true if the model is already initialized.
 * @export
 */
bite.project.Member.prototype.init = function(opt_baseUrl) {
  if (this.isModelInitialized_) {
    return true;
  }

  var helper = bite.common.mvc.helper;
  this.window_ = helper.initModel(bite.project.soy.Member.getModel,
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
bite.project.Member.prototype.isInitialized = function() {
  return this.isModelInitialized_;
};


/**
 * Retrieve and store references to the input elements.
 * @param {!Element} srcElement The element from which to find the needed
 *     elements.
 * @return {boolean} Whether or not all elements were found.
 * @private
 */
bite.project.Member.prototype.setupInputs_ = function(srcElement) {
  var helper = bite.common.mvc.helper;

  this.buttonCancel_ = helper.getElement('project-invite-cancel', srcElement);
  this.buttonInvite_ = helper.getElement('project-invite', srcElement);
  this.buttonRemove_ = helper.getElement('project-member-remove', srcElement);
  this.invite_ = helper.getElement('project-invite-users', srcElement);
  this.members_ = helper.getElement('project-members', srcElement);

  return true;
};

/**
 * Takes an object that contains data for the various inputs and sets the
 * input elements to the appropriate values.
 * @param {Object} data The data used to fill out the form.
 * @return {boolean} Whether or not the window was updated.
 * @export
 */
bite.project.Member.prototype.update = function(data) {
  if (!this.isInitialized()) {
    return false;
  }

  this.members_.innerHTML = bite.project.soy.Member.addMembers(
      {members: data[bite.project.Member.Data_.MEMBERS]});

  return true;
};


/**
 * Reset the model portion of the controller back to an uninitialized state.
 * @private
 */
bite.project.Member.prototype.undoSetup_ = function() {
  // Make sure and remove the DOM Element from the document upon failure.
  if (this.window_) {
    bite.common.mvc.helper.removeElementById(bite.project.Member.CONSOLE_ID_);
  }

  this.buttonCancel_ = null;
  this.buttonInvite_ = null;
  this.buttonRemove_ = null;
  this.invite_ = null;
  this.members_ = null;
  this.window_ = null;
};

