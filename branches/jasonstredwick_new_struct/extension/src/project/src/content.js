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
 * @fileoverview Unifies the bite.project subsystem within the context of
 * content scripts.  The constructor as a the initializer for the subsystem
 * causes the rest of the system to initialize.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.Content');

goog.require('bite.project.Explore');
goog.require('bite.project.General');
goog.require('bite.project.Member');
goog.require('bite.project.Settings');



/**
 * Constructs an object that manages the project UX.
 * @constructor
 * @export
 */
bite.project.Content = function() {
  /**
   * Whether or not consoles are initialized.
   * @type {boolean}
   * @private
   */
  this.areConsolesInitialized_ = false;

  /**
   * A string representing the base url for relative references.
   * @type {string}
   * @private
   */
  this.baseUrl_ = '';

  /**
   * The controller for the detail's page general view.
   * @type {bite.project.General}
   * @private
   */
  this.detailsGeneralView_ = null;

  /**
   * The controller for the detail's page member view.
   * @type {bite.project.Member}
   * @private
   */
  this.detailsMemberView_ = null;

  /**
   * The controller for the detail's page settings view.
   * @type {bite.project.Settings}
   * @private
   */
  this.detailsSettingsView_ = null;

  /**
   * The controller for the explore page.
   * @type {bite.project.Explore}
   * @private
   */
  this.exploreView_ = null;

  /**
   * Whether or not the common view is initialized.
   * @type {boolean}
   * @private
   */
  this.isViewInitialized_ = false;
};
goog.addSingletonGetter(bite.project.Content);


/**
 * A list of actions defined for projects.
 * @enum {string}
 * @export
 */
bite.project.Content.action = {
  GET_VIEW: 'get-view'
};


/**
 * Names used to identify the various project views in terms of visual
 * elements.
 * @enum {string}
 * @export
 */
bite.project.Content.viewId = {
  EXPLORE: 'explore',
  GENERAL: 'general',
  MEMBER: 'member',
  SETTINGS: 'settings'
};


/**
 * Names used to identify the various project views in terms of data retrieval.
 * @enum {string}
 * @export
 */
bite.project.Content.dataId = {
  DETAILS: 'details',
  EXPLORE: 'explore'
};


/**
 * Returns the div element containing a project view.
 * @param {bite.project.Content.viewId} id Which view.
 * @return {Element} The div element for the requested view or null if not
 *     created.
 * @export
 */
bite.project.Content.prototype.getView = function(id) {
  switch (id) {
    case bite.project.Content.viewId.EXPLORE:
      return this.exploreView_.getView();

    case bite.project.Content.viewId.GENERAL:
      return this.detailsGeneralView_.getView();

    case bite.project.Content.viewId.MEMBER:
      return this.detailsMemberView_.getView();

    case bite.project.Content.viewId.SETTINGS:
      return this.detailsSettingsView_.getView();

    default:
      console.log('WARNING (bite.project.Content.getView): Bad id - ' + id);
  }

  return null;
};


/**
 * Returns the div element containing a project view.
 * @param {bite.project.Content.dataId} id Which view.
 * @param {Object} inout_data An object to be filled.
 * @export
 */
bite.project.Content.prototype.getData = function(id, inout_data) {
  switch (id) {
    case bite.project.Content.dataId.EXPLORE:
      this.exploreView_.getData(inout_data);

    case bite.project.Content.dataId.DETAILS:
      this.detailsGeneralView_.getData(inout_data);
      this.detailsMemberView_.getData(inout_data);
      this.detailsSettingsView_.getData(inout_data);

    default:
      console.log('WARNING (bite.project.Content.getData): Bad id - ' + id);
  }

  return;
};


/**
 * Initializes the Project UX for content scripts.
 * @param {string=} baseUrl The base url to use for relative references.
 * @export
 */
bite.project.Content.prototype.init = function(baseUrl) {
  this.baseUrl_ = baseUrl || '';

  // Initialize controllers
  this.exploreView_ = bite.project.Explore.getInstance();
  this.exploreView_.init(this.baseUrl_);

  this.detailsGeneralView_ = bite.project.General.getInstance();
  this.detailsGeneralView_.init(this.baseUrl_);

  this.detailsMemberView_ = bite.project.Member.getInstance();
  this.detailsMemberView_.init(this.baseUrl_);

  this.detailsSettingsView_ = bite.project.Settings.getInstance();
  this.detailsSettingsView_.init(this.baseUrl_);
};

/**
 * Create the content instance to initialize the project subsystem in the
 * context of a content script.
 */
bite.project.Content.getInstance();

