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
 * @fileoverview Define the controller for bite.project.Explore
 * window.  The object defines the functionality specifically for this
 * controller and does not affect the outside world.  However, it does define
 * a set of signals that can be used by external sources to perform actions
 * when the controller performs certain tasks.
 *
 * The Explore window is inteneded to have only a single instance.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.Explore');

goog.require('bite.common.mvc.helper');
goog.require('bite.project.soy.Explore');
goog.require('goog.dom');
goog.require('goog.dom.TagName');



/**
 * Constructs an instance of a Explore controller.  The constructor
 * creates the object in a default state that has not been mapped to a view.
 * @constructor
 * @export
 */
bite.project.Explore = function() {
  /**
   * Drill down button for browse results.
   * @type {Element}
   * @private
   */
  this.drillBrowse_ = null;

  /**
   * Drill down button for search results.
   * @type {Element}
   * @private
   */
  this.drillSearch_ = null;

  /**
   * Drill down button for subscription results.
   * @type {Element}
   * @private
   */
  this.drillSubscription_ = null;

  /**
   * Whether or not the window's model is initialized.
   * @type {boolean}
   * @private
   */
  this.isModelInitialized_ = false;

  /**
   * Window element managed by this controller.  Defaults to null meaning the
   * controller is not attached to a model.
   * @type {Element}
   * @private
   */
  this.window_ = null;
};
goog.addSingletonGetter(bite.project.Explore);


/**
 * The window's id.
 * @type {string}
 * @private
 */
bite.project.Explore.CONSOLE_ID_ = 'project-explore';


/**
 * Buttons.
 * @enum {string}
 * @private
 */
bite.project.Explore.Button_ = {
  BROWSE: 'project-general-browse-results',
  SEARCH: 'project-general-search-drilldown',
  SUBSCRIPTION: 'project-general-subscription-drilldown'
};


/**
 * Given an object, fill in values respective to this view.
 * @param {Object} inout_data An object to be filled with values.
 * @export
 */
bite.project.Explore.prototype.getData = function(inout_data) {
};


/**
 * Returns the div element for the explore view.
 * @return {Element} It will return the element or null if not created.
 * @export
 */
bite.project.Explore.prototype.getView = function() {
  return this.window_;
};


/**
 * Initialize the Explore Window by creating the model and hooking
 * functions to the model.  If a baseUrl is given and the view is not yet
 * initialized then this function will try to initialize it.  Nothing happens
 * if the window is already initialized.
 * @param {string=} opt_baseUrl The baseUrl required for relative references.
 * @return {boolean} Whether or not the model is initialized.  It will also
 *     return true if the model is already initialized.
 * @export
 */
bite.project.Explore.prototype.init = function(opt_baseUrl) {
  if (this.isModelInitialized_) {
    return true;
  }

  var helper = bite.common.mvc.helper;
  this.window_ = helper.renderModel(bite.project.soy.Explore.getModel,
                                    {'baseUrl': opt_baseUrl});

  if (this.window_ && this.setupButtons_(this.window_)) {
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
bite.project.Explore.prototype.isInitialized = function() {
  return this.isModelInitialized_;
};


/**
 * Retrieve and store button elements.
 * @param {!Element} srcElement The element to search within.
 * @return {boolean} Successfully setup buttons.
 * @private
 */
bite.project.Explore.prototype.setupButtons_ = function(srcElement) {
  var helper = bite.common.mvc.helper;
  var button = bite.project.Explore.Button_;

  this.drillBrowse_ = helper.getElement(button.BROWSE, srcElement);
  this.drillSearch_ = helper.getElement(button.SEARCH, srcElement);
  this.drillSubscription_ = helper.getElement(button.SUBSCRIPTION, srcElement);

  return true;
};


/**
 * Takes an object that contains data for the various inputs and sets the
 * input elements to the appropriate values.
 * TODO (jasonstredwick): Cleanup function by either moving code to soy or
 *     rethink what needs to happen here.
 * @param {Object} data The data used to fill out the form.
 * @return {boolean} Whether or not the window was updated.
 * @export
 */
bite.project.Explore.prototype.update = function(data) {
  if (!this.isInitialized()) {
    return false;
  }

  var i = 0;
  var len = 0;
  var element = null;
  var srcElement = /** @type {!Element} */ (this.window_);
  var helper = bite.common.mvc.helper;
  var elementName = '';

  if ('subscriptions' in data) {
    // Clear element
    elementName = 'project-general-subscriptions';
    var subscriptionsElement = helper.getElement(elementName, srcElement);
    subscriptionsElement.innerHTML = '';

    // Add in up to the first five values.
    var subscriptions = data['subscriptions'];
    for (i = 0, len = subscriptions.length; i < len && i < 5; ++i) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = subscriptions[i];
      goog.dom.appendChild(subscriptionsElement, element);
    }

    if (subscriptions.length >= 5) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = 'See more...';
      element.className = 'see-more';
      goog.dom.appendChild(subscriptionsElement, element);
    }
  }

  if ('search' in data) {
    // Reset element
    elementName = 'project-general-search-results';
    var searchElement = helper.getElement(elementName, srcElement);
    var searchBar = searchElement.childNodes[0];
    goog.dom.removeChildren(searchElement);
    goog.dom.appendChild(searchElement, searchBar);

    var results = data['search'];

    // Add in the number of results.
    element = goog.dom.createElement(goog.dom.TagName.DIV);
    element.innerHTML = 'Found ' + results.length + 'results.';
    element.className = 'results';
    goog.dom.appendChild(searchElement, element);

    // Add in up to the first five values.
    for (i = 0, len = results.length; i < len && i < 5; ++i) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = results[i];
      goog.dom.appendChild(searchElement, element);
    }

    if (results.length >= 5) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = 'See more...';
      element.className = 'see-more';
      goog.dom.appendChild(searchElement, element);
    }
  }

  if ('browse' in data) {
    // Reset element
    elementName = 'project-general-search-results';
    var browseElement = helper.getElement(elementName, srcElement);
    browseElement.innerHTML = '';

    var browseResults = data['browse'];

    // Add in up to the first five values.
    for (i = 0, len = browseResults.length; i < len && i < 5; ++i) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = browseResults[i];
      goog.dom.appendChild(browseElement, element);
    }

    if (browseResults.length >= 5) {
      element = goog.dom.createElement(goog.dom.TagName.DIV);
      element.innerHTML = 'See more...';
      element.className = 'see-more';
      goog.dom.appendChild(browseElement, element);
    }
  }

  return true;
};


/**
 * Reset the model portion of the controller back to an uninitialized state.
 * @private
 */
bite.project.Explore.prototype.undoSetup_ = function() {
  // Make sure and remove the DOM Element from the document upon failure.
  if (this.window_) {
    bite.common.mvc.helper.removeElementById(bite.project.Explore.CONSOLE_ID_);
  }

  this.drillBrowse_ = null;
  this.drillSearch_ = null;
  this.drillSubscription_ = null;
  this.window_ = null;
};

