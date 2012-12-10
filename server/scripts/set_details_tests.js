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
 * @fileoverview This file contains the details page's tests tab.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.set.Tests');

goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.TestSrcHelper');
goog.require('bite.server.templates.details');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');



/**
 * A class for set runs functions.
 * @param {function():Object} getInfoFunc The getter for set's info.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.set.Tests = function(getInfoFunc) {
  /**
   * To get the selected item's info.
   * @type {function():Object}
   * @private
   */
  this.getInfoFunc_ = getInfoFunc;

  /**
   * The tests source depot.
   * @type {string}
   */
  this.loadFrom = '';

  var loadTestsFunc = goog.bind(this.loadTestsFromBackend, this);

  /**
   * The current selected helper.
   * @type {bite.server.TestSrcHelper}
   * @private
   */
  this.selectedHelper_ = new bite.server.TestSrcHelper(loadTestsFunc);

  /**
   * The helpers map object.
   * @type {Object}
   * @private
   */
  this.helperMap_ = {
      '': new bite.server.TestSrcHelper(loadTestsFunc)
  };
};
goog.inherits(bite.server.set.Tests, bite.server.set.Tab);


/**
 * Inits the setting's overview page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.set.Tests.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML = bite.server.templates.details.showTabTests({});
  bite.server.Helper.addListenersToElems(
      [goog.dom.getElement('acc')],
      goog.bind(this.handleSrcSelection, this));
  this.loadSetting();
};


/**
 * Handles selecting a tests source.
 * @param {Event} event The event object.
 * @export
 */
bite.server.set.Tests.prototype.handleSrcSelection = function(event) {
  this.loadTestsFrom(event.target.id);
};


/**
 * Saves the previous page settings.
 * @export
 */
bite.server.set.Tests.prototype.saveSetting = function() {
  this.selectedHelper_.saveFields();
};


/**
 * Loads the page's tests settings.
 * @export
 */
bite.server.set.Tests.prototype.loadSetting = function() {
  if (this.loadFrom) {
    goog.dom.getElement(this.loadFrom).checked = true;
    this.loadTestsFrom(this.loadFrom);
  } else {
    this.clearTestSrcButtons();
    this.clearSetTestsPage();
  }
};


/**
 * Clears the set tests page.
 * @export
 */
bite.server.set.Tests.prototype.clearSetTestsPage = function() {
  goog.dom.getElement('loadTestsFromDiv').innerHTML = '';
  goog.dom.getElement('showTestsDiv').innerHTML = '';
};


/**
 * Clears the test sources radio buttons.
 * @export
 */
bite.server.set.Tests.prototype.clearTestSrcButtons = function() {
  var buttons = goog.dom.getDocument().getElementsByName('testsSrc');
  for (var i = 0, len = buttons.length; i < len; i++) {
    buttons[i].checked = false;
  }
};


/**
 * Sets the default properties.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Tests.prototype.setProperties = function(params) {
  this.loadFrom = params['testSource'];
  this.selectedHelper_ = this.helperMap_[this.loadFrom];
  this.selectedHelper_.setFields(params);
};


/**
 * Loads tests from a the given source.
 * @param {string} requestUrl The request url.
 * @param {string} parameters The parameter string.
 * @export
 */
bite.server.set.Tests.prototype.loadTestsFromBackend = function(
    requestUrl, parameters) {
  var that = this;
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      var tests = null;
      var tests_obj = this.getResponseJson();
      if (tests_obj) {
        var loadSrcDiv = goog.dom.getElement('showTestsDiv');
        loadSrcDiv.innerHTML = bite.server.templates.details.showTestList(
            tests_obj);
      }
    } else {
      throw new Error('Failed to get the tests. Error status: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
};


/**
 * Loads tests from a source and displays the UI.
 * @param {string} src The source depot.
 * @export
 */
bite.server.set.Tests.prototype.loadTestsFrom = function(src) {
  this.selectedHelper_ = this.helperMap_[src];
  this.loadFrom = src;
  this.clearSetTestsPage();
  var loadSrcDiv = goog.dom.getElement('loadTestsFromDiv');
  this.selectedHelper_.showQueryFields(loadSrcDiv);
};


/**
 * Adds the properties to the given map.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Tests.prototype.addProperties = function(params) {
  params['testSource'] = this.loadFrom;
  for (var testSrc in this.helperMap_) {
    this.helperMap_[testSrc].addProperties(params);
  }
};
