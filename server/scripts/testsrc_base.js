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
 * @fileoverview This file contains the tests source base class, which
 * handles loading and saving tests from and to a specified source depot.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.TestSrcHelper');



/**
 * A class for the source of tests related functions.
 * @param {Function} loadTestsFromBackend The tests loading function.
 * @constructor
 * @export
 */
bite.server.TestSrcHelper = function(loadTestsFromBackend) {
  /**
   * Some value.
   * @type {Function}
   */
  this.loadTestsFromBackend = loadTestsFromBackend;
};


/**
 * Shows the query fields UI.
 * @export
 */
bite.server.TestSrcHelper.prototype.showQueryFields = function() {
};


/**
 * Saves the inputs from fields.
 * @export
 */
bite.server.TestSrcHelper.prototype.saveFields = function() {
};


/**
 * Loads the inputs in fields.
 * @export
 */
bite.server.TestSrcHelper.prototype.loadFields = function() {
};


/**
 * Sets the fields.
 * @param {Object} paramsMap A params map.
 * @export
 */
bite.server.TestSrcHelper.prototype.setFields = function(paramsMap) {
};


/**
 * Adds the properties to the given params map.
 * @param {Object} paramsMap A params map.
 * @export
 */
bite.server.TestSrcHelper.prototype.addProperties = function(paramsMap) {
};
