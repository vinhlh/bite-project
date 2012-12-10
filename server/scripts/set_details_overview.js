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
 * @fileoverview This file contains the details page's all tab.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.set.Overview');

goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details');
goog.require('goog.dom');



/**
 * A class for the set, which is a group of tests.
 * @param {function():Object} getInfoFunc The function to get the set's info.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.set.Overview = function(getInfoFunc) {
  /**
   * The function to get the info of selected item.
   * @type {function():Object}
   * @private
   */
  this.getInfoFunc_ = getInfoFunc;

  /**
   * The set's description.
   * @type {string}
   */
  this.description = '';

  /**
   * The set's labels.
   * @type {Array.<string>}
   */
  this.labels = [];

  /**
   * The set's project name.
   * @type {string}
   */
  this.biteProject = 'BITE';
};
goog.inherits(bite.server.set.Overview, bite.server.set.Tab);


/**
 * Inits the setting's overview page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.set.Overview.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML = bite.server.templates.details.showTabOverview({});
  this.loadSetting();
};


/**
 * Saves the previous page settings. This is called when another tab is
 * selected.
 * @export
 */
bite.server.set.Overview.prototype.saveSetting = function() {
  this.biteProject = goog.dom.getElement('setProject').value;
  this.description = goog.dom.getElement('setDesc').value;
  this.labels = bite.server.Helper.splitAndTrim(
      goog.dom.getElement('setLabels').value, ',');
};


/**
 * Loads the page's settings. This is called when the overview tab is selected.
 * @export
 */
bite.server.set.Overview.prototype.loadSetting = function() {
  goog.dom.getElement('setProject').value = this.biteProject;
  goog.dom.getElement('setDesc').value = this.description;
  goog.dom.getElement('setLabels').value = bite.server.Helper.joinToStr(
      this.labels, ',');
};


/**
 * Sets the default properties. This is called when a set is loaded, and
 * a map of params will be passed in.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Overview.prototype.setProperties = function(params) {
  this.description = params['description'];
  this.labels = JSON.parse(params['labels'])['labels'];
  this.biteProject = params['projectName'];
};


/**
 * Adds the properties to the given map. This is called when a set is saved,
 * and this function adds parameters to the map to be sent to the server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Overview.prototype.addProperties = function(params) {
  params['projectName'] = this.biteProject;
  params['description'] = this.description;
  params['labels'] = JSON.stringify({'labels': this.labels});
};
