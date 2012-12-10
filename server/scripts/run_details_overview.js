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
 * @fileoverview This file contains the run's details page's all tabs.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.run.Overview');

goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.RunOverview');
goog.require('goog.dom');



/**
 * A class for overview tab in run's details page.
 * @param {function():string} getKeyFunc The function to get the key string.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.run.Overview = function(getKeyFunc) {
  goog.base(this, getKeyFunc);

  /**
   * The function to get the key string of selected item.
   * @type {function():string}
   * @private
   */
  this.getKeyFunc_ = getKeyFunc;

  /**
   * The run's name.
   * @type {string}
   * @private
   */
  this.name_ = '';

  /**
   * The run's description.
   * @type {string}
   * @private
   */
  this.description_ = '';

  /**
   * The run's occurrence.
   * @type {string}
   * @private
   */
  this.occurrence_ = '';

  /**
   * The run's scheduled interval in minutes.
   * @type {string}
   * @private
   */
  this.interval_ = '';

  /**
   * The run's start time.
   * @type {string}
   * @private
   */
  this.startTime_ = '';
};
goog.inherits(bite.server.run.Overview, bite.server.set.Tab);


/**
 * Inits the overview tab of the run's details page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.run.Overview.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML =
      bite.server.templates.details.RunOverview.showTabOverview({});
  this.loadSetting();
};


/**
 * Saves the previous page settings. This is called when another tab is
 * selected.
 * @export
 */
bite.server.run.Overview.prototype.saveSetting = function() {
  this.name_ = goog.dom.getElement('runName').value;
  this.interval_ = goog.dom.getElement('interval').value;
  this.description_ = goog.dom.getElement('runDesc').value;
};


/**
 * Loads the page's settings. This is called when the overview tab is selected.
 * @export
 */
bite.server.run.Overview.prototype.loadSetting = function() {
  goog.dom.getElement('runName').value = this.name_;
  goog.dom.getElement('interval').value = this.interval_;
  goog.dom.getElement('runDesc').value = this.description_;
};


/**
 * Sets the default properties. This is called when a set is loaded, and
 * a map of params will be passed in.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.run.Overview.prototype.setProperties = function(params) {
  this.description_ = params['runDesc'];
  this.interval_ = params['interval'];
  this.name_ = params['runName'];
};


/**
 * Adds the properties to the given map. This is called when a set is saved,
 * and this function adds parameters to the map to be sent to the server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.run.Overview.prototype.addProperties = function(params) {
  params['runDesc'] = this.description_;
  params['interval'] = this.interval_;
  params['runName'] = this.name_;
};
