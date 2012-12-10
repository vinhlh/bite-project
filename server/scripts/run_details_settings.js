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
 * @fileoverview This file contains the run details page's settings tab.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('bite.server.run.Settings');

goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.RunSettings');
goog.require('goog.dom');
goog.require('goog.string');



/**
 * A class for the settings tab in the Run's page.
 * @param {function():string} getKeyFunc The getter for set's key.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.run.Settings = function(getKeyFunc) {
  /**
   * A function used to get the selected item's key string.
   * @type {function():string}
   * @private
   */
  this.getKeyFunc_ = getKeyFunc;

  /**
   * The run's token string.
   * @type {string}
   * @private
   */
  this.token_ = '';

  /**
   * The run's start url string.
   * @type {string}
   * @private
   */
  this.startUrl_ = '';

  /**
   * The run's line timeout limit.
   * @type {number}
   * @private
   */
  this.lineTimeout_ = 0;

  /**
   * The run's test timeout limit.
   * @type {number}
   * @private
   */
  this.testTimeout_ = 0;

  /**
   * The run's filtered results labels.
   * @type {Array}
   * @private
   */
  this.filteredResultLabels_ = [];

  /**
   * The run's test dimension labels.
   * @type {Array}
   * @private
   */
  this.dimensionLabels_ = [];

  /**
   * Whether to save the screenshots.
   * @type {boolean}
   * @private
   */
  this.saveScnShots_ = true;
};
goog.inherits(bite.server.run.Settings, bite.server.set.Tab);


/**
 * Inits the Run page's settings page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.run.Settings.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML =
      bite.server.templates.details.RunSettings.showTabSettings({});
  this.loadSetting();
};


/**
 * Saves the previous page settings. This is called when another tab is
 * selected.
 * @export
 */
bite.server.run.Settings.prototype.saveSetting = function() {
  this.filteredResultLabels_ = bite.server.Helper.splitAndTrim(
    goog.dom.getElement('runFilteredLabels').value, ',');
  this.dimensionLabels_ = bite.server.Helper.splitAndTrim(
    goog.dom.getElement('runDimensionLabels').value, ',');
  this.token_ = goog.dom.getElement('runWorkerToken').value;
  this.startUrl_ = goog.dom.getElement('runStartUrl').value;
  this.lineTimeout_ = goog.dom.getElement('runLineTimeout').value;
  this.testTimeout_ = goog.dom.getElement('runTestTimeout').value;
  this.saveScnShots_ = goog.dom.getElement('runSaveScnShots').checked;
};


/**
 * Loads the page's settings. This is called when the settings tab is selected.
 * @export
 */
bite.server.run.Settings.prototype.loadSetting = function() {
  goog.dom.getElement('runFilteredLabels').value =
      bite.server.Helper.joinToStr(this.filteredResultLabels_, ',');
  goog.dom.getElement('runDimensionLabels').value =
      bite.server.Helper.joinToStr(this.dimensionLabels_, ',');
  goog.dom.getElement('runWorkerToken').value = this.token_;
  goog.dom.getElement('runStartUrl').value = this.startUrl_;
  goog.dom.getElement('runLineTimeout').value = this.lineTimeout_;
  goog.dom.getElement('runTestTimeout').value = this.testTimeout_;
  goog.dom.getElement('runSaveScnShots').checked = this.saveScnShots_;
};


/**
 * Sets the default properties. This is called when loading a set from server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.run.Settings.prototype.setProperties = function(params) {
  this.filteredResultLabels_ = params['filteredLabels'];
  this.dimensionLabels_ = params['dimensionLabels'];
  this.token_ = params['runTokens'];
  this.startUrl_ = params['runStartUrl'];
  this.lineTimeout_ = 0;
  this.testTimeout_ = 0;
  this.saveScnShots_ = true;
};


/**
 * Adds the properties to the given map. This is called when it creates
 * a map of properties to be saved to server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.run.Settings.prototype.addProperties = function(params) {
  params['runTokens'] = this.token_;
  params['runStartUrl'] = this.startUrl_;
  params['filteredLabels'] = JSON.stringify(this.filteredResultLabels_);
  params['dimensionLabels'] = JSON.stringify(this.dimensionLabels_);
  params['lineTimeout'] = this.lineTimeout_;
  params['testTimeout'] = this.testTimeout_;
  params['saveScnShots'] = this.saveScnShots_;
};
