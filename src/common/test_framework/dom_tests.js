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
 * @fileoverview Define useful dom related js_test functions.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.test_framework.DomTests');

goog.require('goog.dom');
goog.require('goog.dom.query');



/**
 * Used to execute tests.
 * @constructor
 */
bite.common.test_framework.DomTests = function() {};
goog.addSingletonGetter(bite.common.test_framework.DomTests);


/**
 * Performs a boolean test on elements against their given boolean attribute
 * versus expected values.
 * @param {Object.<string,boolean>} inputs The ids for the elements
 *     mapped to their expected boolean value.
 * @param {string} attribute The name of the element attribute to examine.
 * @param {Element=} rootElement The element from which to do the queries.
 */
bite.common.test_framework.DomTests.prototype.testElementBooleanValue =
    function(inputs, attribute, rootElement) {
  rootElement = rootElement || goog.dom.getDocument();

  for (var key in inputs) {
    var query = goog.dom.query('[id="' + key + '"]', rootElement);
    assertEquals(1, query.length);
    if (inputs[key]) {
      assertTrue(key, query[0][attribute]);
    } else {
      assertFalse(key, query[0][attribute]);
    }
  }
};


/**
 * Performs an equality test on elements against their given attribute versus
 * expected values.
 * @param {Object.<string>} inputs The ids for the elements mapped to their
 *     expected boolean value.
 * @param {string} attribute The name of the element attribute to examine.
 * @param {Element=} rootElement The element from which to do the queries.
 */
bite.common.test_framework.DomTests.prototype.testElementEqualsValue =
    function(inputs, attribute,   rootElement) {
  rootElement = rootElement || goog.dom.getDocument();

  for (var key in inputs) {
    var query = goog.dom.query('[id="' + key + '"]', rootElement);
    assertEquals(key, 1, query.length);
    assertEquals(key, inputs[key], query[0][attribute]);
  }
};

