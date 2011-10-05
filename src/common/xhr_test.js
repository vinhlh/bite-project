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
 * @fileoverview Unit tests for common.net.Xhr.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('common.net.Xhr');
goog.require('goog.testing.PropertyReplacer');


/**
 * Create an event that will return false meaning the request failed.  It
 * also provides an error code and error message.
 * @type {!Object}
 */
var failEvent = {
  target: {
    getLastError: function() { return 'error' },
    getLastErrorCode: function() { return 400; },
    getResponseText: function() { return 'fail'; },
    isSuccess: function() { return false; }
  }
}


/**
 * A string represent the error message sent back by the fail event.
 * @type {string}
 */
var FAIL_MESSAGE = failEvent.target.getLastErrorCode() + ': ' +
                   failEvent.target.getLastError();


/**
 * A string represent the success message sent back by the success event.
 * @type {string}
 */
var SUCCESS_MESSAGE = 'success';


/**
 * Create an event that will return false meaning the request failed.  It
 * also provides an error code and error message.
 * @type {!Object}
 */
var successEvent = {
  target: {
    getLastError: function() { return 'none' },
    getLastErrorCode: function() { return 200; },
    getResponseText: function() { return SUCCESS_MESSAGE; },
    isSuccess: function() { return true; }
  }
}


/**
 * Replace the Xhr send function.
 * @param {string} url The url.
 * @param {Function} callback The callback.
 */
function send(url, callback) {
  if (url == 'fail') {
    callback(failEvent);
  } else {
    callback(successEvent);
  }
}


/**
 * Create stub object.
 * @type {goog.testing.PropertyReplacer}
 */
var stubs_ = new goog.testing.PropertyReplacer();
stubs_.set(goog.net.XhrIo, 'send', send);


/**
 * Setup performed for each test.
 */
function setUp() {
}


/**
 * Cleanup performed for each test.
 */
function tearDown() {
}


/**
 * Callback function that validates inputs sent from an XHR call.
 * @param {string} msg The message given to assert to identify the specific
 *     test.
 * @param {boolean} expectedSuccess The expected value for success.
 * @param {string} expectedData The expected value for data.
 * @param {boolean} success The value passed from the request.
 * @param {string} data The data passed from the request.
 */
function validate(msg, expectedSuccess, expectedData, success, data) {
  assertEquals(msg, expectedSuccess, success);
  assertEquals(msg, expectedData, data);
}


/**
 * Test the functions expecting a valid response.
 */
function testResponse() {
  var msg = '(Response)';
  var url = 'pass';
  var data = '';
  var response = SUCCESS_MESSAGE;

  var callback = goog.partial(validate, 'AsyncGet' + msg, true, response);
  common.net.Xhr.async.get(url, callback);

  callback = goog.partial(validate, 'AsyncPost' + msg, true, response);
  common.net.Xhr.async.post(url, data, callback);
}


/**
 * Test the functions expecting a valid response but no callback provided.
 */
function testNoCallback() {
  var msg = '(No callback)';
  var url = 'pass';
  var data = '';
  var errorMsg = ' failed when optional callback was not supplied: ';

  try {
    common.net.Xhr.async.get(url);
  } catch (error) {
    fail(msg + 'AsyncGet' + errorMsg + error);
  }

  try {
    common.net.Xhr.async.post(url, data);
  } catch (error) {
    fail(msg + 'AsyncPost' + errorMsg + error);
  }
}


/**
 * Test the functions where the request receives a response but the request
 * failed with a specific error code and error message.
 */
function testRequestFailedException() {
  var msg =  '(Request Failed)';
  var url = 'fail';
  var data = '';

  var callback = goog.partial(validate, 'AsyncGet' + msg, false, FAIL_MESSAGE);
  common.net.Xhr.async.get(url, callback);

  callback = goog.partial(validate, 'AsyncPost' + msg, false, FAIL_MESSAGE);
  common.net.Xhr.async.post(url, data, callback);
}


/**
 * Test the functions with no url.  Assumes that any false input will suffice
 * for "no url" meaning null, undefined, and ''.
 */
function testMissingUrl() {
  var msg = '(Missing Url)';
  var url = '';
  var data = '';

  var callback = goog.partial(validate, 'AsyncGet' + msg, false,
                              common.net.Xhr.ErrorMessage_.MISSING_URL);
  common.net.Xhr.async.get(url, callback);

  callback = goog.partial(validate, 'AsyncPost' + msg, false,
                          common.net.Xhr.ErrorMessage_.MISSING_URL);
  common.net.Xhr.async.post(url, data, callback);
}

