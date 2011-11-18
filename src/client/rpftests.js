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
 * @fileoverview This file contains functions to manipulate tests.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.Tests');

goog.require('bite.base.Helper');
goog.require('bite.console.Helper');



/**
 * A class for manipulating a group of RPF tests.
 * @constructor
 */
rpf.Tests = function() {
  /**
   * The project name.
   * @type {string}
   * @private
   */
  this.projectName_ = '';

  /**
   * The test array.
   * @type {!Array}
   * @private
   */
  this.tests_ = [];

  /**
   * The place where the tests were loaded from.
   * @type {string}
   * @private
   */
  this.loadFrom_ = '';

  /**
   * The details.
   * @type {!Object}
   * @private
   */
  this.details_ = {};
};


/**
 * Sets the project name.
 * @param {string} name The new project name.
 */
rpf.Tests.prototype.setProjectName = function(name) {
  this.projectName_ = name;
};


/**
 * Gets the project name.
 * @return {string} The project name.
 */
rpf.Tests.prototype.getProjectName = function() {
  return this.projectName_;
};


/**
 * Sets the tests.
 * @param {!Array} tests The test array.
 */
rpf.Tests.prototype.setTests = function(tests) {
  this.tests_ = tests;
};


/**
 * @return {Array} The test array.
 */
rpf.Tests.prototype.getTests = function() {
  return this.tests_;
};


/**
 * Sets the place where the tests were loaded from.
 * @param {string} loadFrom Where the tests were loaded from.
 */
rpf.Tests.prototype.setLoadFrom = function(loadFrom) {
  this.loadFrom_ = loadFrom;
};


/**
 * Gets the place where the tests were loaded from.
 * @return {string} Where the tests were loaded from.
 */
rpf.Tests.prototype.getLoadFrom = function() {
  return this.loadFrom_;
};


/**
 * Gets the info map by the given test name.
 * @param {string} testName The test name.
 * @return {Object} The info map.
 */
rpf.Tests.prototype.getInfoMapByTest = function(testName) {
  var tests = this.tests_;
  for (var i = 0, len = tests.length; i < len; ++i) {
    if (tests[i]['test_name'] == testName) {
      var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
      var result = bite.console.Helper.trimInfoMap(testObj['datafile']);
      return result['infoMap'];
    }
  }
  return null;
};


/**
 * Saves the info map back to the given test.
 * @param {string} testName The test name.
 * @param {Object} infoMap The info map.
 */
rpf.Tests.prototype.saveInfoMapToTest = function(testName, infoMap) {
  var tests = this.tests_;
  for (var i = 0, len = tests.length; i < len; ++i) {
    if (tests[i]['test_name'] == testName) {
      var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
      var result = bite.console.Helper.trimInfoMap(testObj['datafile']);
      result['infoMap'] = infoMap;
      testObj['datafile'] = bite.console.Helper.appendInfoMap(
          result['infoMap'], result['datafile']);
    }
  }
};


/**
 * Gets the line number that needs to be updated.
 * @param {string} stepId The step id that needs to be updated.
 * @param {string} testName The test name that the failure happened.
 * @return {number} The line number that failed in the given test.
 */
rpf.Tests.prototype.getFailureLineNumber = function(stepId, testName) {
  var tests = this.tests_;
  var script = null;
  var infoMap = null;
  var elemXpath = '';
  for (var i = 0, len = tests.length; i < len; ++i) {
    var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
    var result = bite.console.Helper.trimInfoMap(testObj['datafile']);
    var name = testObj['name'];
    var step = result['infoMap']['steps'][stepId];
    if (step) {
      elemXpath = result['infoMap']['elems'][step['elemId']]['xpaths'][0];
    }
    if (name == testName) {
      script = testObj['script'];
      infoMap = result['infoMap'];
    }
  }
  if (!elemXpath || !script) {
    return -1;
  }
  var lines = script.split('\n');
  for (i = 0, len = lines.length; i < len; ++i) {
    var id = bite.base.Helper.getStepId(lines[i]);
    if (!id) {
      continue;
    }
    var elemId = infoMap['steps'][id]['elemId'];
    if (elemXpath == infoMap['elems'][elemId]['xpaths'][0]) {
      return i;
    }
  }
  return -1;
};


/**
 * Sets the project details.
 * @param {!Object} details The details.
 */
rpf.Tests.prototype.setDetails = function(details) {
  this.details_ = details;
};


/**
 * Gets the page map.
 * @return {Object} The page map.
 */
rpf.Tests.prototype.getPageMap = function() {
  return this.details_ ? this.details_['page_map'] : null;
};

