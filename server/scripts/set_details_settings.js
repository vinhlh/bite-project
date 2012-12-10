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
 * @fileoverview This file contains the details page's runs tab.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('bite.server.set.Settings');

goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details');
goog.require('goog.dom');
goog.require('goog.string');



/**
 * A class for the settings tab in the Set's page.
 * @param {function():Object} getInfoFunc The getter for set's info.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.set.Settings = function(getInfoFunc) {
  /**
   * A function used to get the selected item's info.
   * @type {function():Object}
   * @private
   */
  this.getInfoFunc_ = getInfoFunc;

  /**
   * The set's token string.
   * @type {string}
   * @private
   */
  this.token_ = '';

  /**
   * The set's start url string.
   * @type {string}
   * @private
   */
  this.startUrl_ = '';

  /**
   * The set's scheduled running interval.
   * @type {number}
   * @private
   */
  this.interval_ = 0;

  /**
   * The set's default email from list.
   * @type {Array}
   * @private
   */
  this.emailFrom_ = [];

  /**
   * The set's default email to list.
   * @type {Array}
   * @private
   */
  this.emailTo_ = [];

  /**
   * The set's failure threshhold.
   * @type {number}
   * @private
   */
  this.failureThresh_ = 0;
};
goog.inherits(bite.server.set.Settings, bite.server.set.Tab);


/**
 * Inits the setting's overview page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.set.Settings.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML = bite.server.templates.details.showTabSettings({});
  this.loadSetting();
};


/**
 * Saves the previous page settings. This is called when another tab is
 * selected.
 * @export
 */
bite.server.set.Settings.prototype.saveSetting = function() {
  this.token_ = goog.dom.getElement('setToken').value;
  this.startUrl_ = goog.dom.getElement('setReplaceUrl').value;
  this.interval_ = goog.string.toNumber(
      goog.dom.getElement('setInterval').value);
  this.emailFrom_ = bite.server.Helper.splitAndTrim(
      goog.dom.getElement('setEmailFrom').value, ',');
  this.emailTo_ = bite.server.Helper.splitAndTrim(
      goog.dom.getElement('setEmailTo').value, ',');
  this.failureThresh_ =
      goog.string.toNumber(goog.dom.getElement('setEmailThreshold').value);
};


/**
 * Loads the page's settings. This is called when the settings tab is selected.
 * @export
 */
bite.server.set.Settings.prototype.loadSetting = function() {
  goog.dom.getElement('setToken').value = this.token_;
  goog.dom.getElement('setReplaceUrl').value = this.startUrl_;
  goog.dom.getElement('setInterval').value = this.interval_;
  goog.dom.getElement('setEmailFrom').value = bite.server.Helper.joinToStr(
      this.emailFrom_, ',');
  goog.dom.getElement('setEmailTo').value = bite.server.Helper.joinToStr(
      this.emailTo_, ',');
  goog.dom.getElement('setEmailThreshold').value = this.failureThresh_;
};


/**
 * Sets the default properties. This is called when loading a set from server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Settings.prototype.setProperties = function(params) {
  this.token_ = params['token'];
  this.startUrl_ = params['startUrl'];
  this.interval_ = params['interval'];
  this.emailFrom_ = params['emailFrom'];
  this.emailTo_ = params['emailTo'];
  this.failureThresh_ = params['failureThresh'];
};


/**
 * Adds the properties to the given map. This is called when it creates
 * a map of properties to be saved to server.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Settings.prototype.addProperties = function(params) {
  // TODO(phu): Use constants or enum for the constants.
  params['tokens'] = this.token_;
  params['interval'] = this.interval_;
  params['startUrl'] = this.startUrl_;
  params['failureThresh'] = this.failureThresh_;
  params['emailFrom'] = JSON.stringify(this.emailFrom_);
  params['emailTo'] = JSON.stringify(this.emailTo_);
};
