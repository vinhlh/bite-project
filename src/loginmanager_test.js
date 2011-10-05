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
// Author: michaelwill@google.com (Michael Williamson)


goog.require('bite.LoginManager');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.net.XhrIo');
goog.require('goog.testing.recordFunction');



var stubs = null;
var loginManager = null;

function setUp() {
  loginManager = new bite.LoginManager();
  stubs = new goog.testing.PropertyReplacer();
  stubs.replace(goog.net.XhrIo, 'send', goog.testing.net.XhrIo.send);
  var mockLocalStorage = {getItem: function() {return 'http://hud.test'}};
  stubs.set(goog.global, 'localStorage', mockLocalStorage);
}

function tearDown() {
  stubs.reset();
}

function testGetCurrentUser() {
  var expectedPath = goog.Uri.parse(bite.LoginManager.CHECK_LOGIN_STATUS_PATH_);

  var callback = new goog.testing.recordFunction();
  loginManager.getCurrentUser(callback);

  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];

  var sentUri = sendInstance.getLastUri();
  assertContains(expectedPath, sentUri);

  var returnedUrl = 'www.test.com';
  var returnedUser = 'michaelwill';
  var serverResponse = {
    'url': returnedUrl,
    'user': returnedUser
  };
  sendInstance.simulateResponse(200, goog.json.serialize(serverResponse));

  assertEquals(1, callback.getCallCount());

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var callbackArgs = callback.getLastCall().getArguments();
  var responseObj = callbackArgs[0];
  assertContains(returnedUrl, responseObj['url']);
  assertContains(server, responseObj['url']);
  assertEquals(returnedUser, responseObj['username']);
  assertTrue(responseObj['success']);
}

function testGetCurrentUser_noBiteServerInLoginUrl() {
  var expectedPath =
      goog.Uri.parse(bite.LoginManager.CHECK_LOGIN_STATUS_PATH_);

  var callback = new goog.testing.recordFunction();
  loginManager.getCurrentUser(callback);

  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];

  var returnedUrl = 'http://www.test.com';
  var returnedUser = 'michaelwill';
  var returnedObj = {
    'url': returnedUrl,
    'user': returnedUser
  };
  sendInstance.simulateResponse(200, goog.json.serialize(returnedObj));

  assertEquals(1, callback.getCallCount());
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var callbackArgs = callback.getLastCall().getArguments();
  var responseObj = callbackArgs[0];
  assertContains(returnedUrl, responseObj['url']);
  assertNotContains(server, responseObj['url']);
  assertTrue(responseObj['success']);
}

function testGetCurrentUser_noUserLoggedIn() {
  var callback = new goog.testing.recordFunction();
  loginManager.getCurrentUser(callback);
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];

  var returnedUrl = 'www.test.com';
  var returnedUser = 'michaelwill';
  var returnedObj = {
    'url': returnedUrl
  };
  sendInstance.simulateResponse(200, goog.json.serialize(returnedObj));
  var callbackArgs = callback.getLastCall().getArguments();
  var responseObj = callbackArgs[0];
  assertContains(returnedUrl, responseObj['url']);
  assertEquals('', responseObj['username']);
  assertTrue(responseObj['success']);
}

function testGetCurrentUser_server400() {
  var callback = new goog.testing.recordFunction();
  loginManager.getCurrentUser(callback);
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];

  sendInstance.simulateResponse(400, '');
  var callbackArgs = callback.getLastCall().getArguments();
  var responseObj = callbackArgs[0];
  assertFalse(responseObj['success']);
  assertEquals('', responseObj['url']);
  assertEquals('', responseObj['username']);
}

function testGetCurrentUser_illegalJson() {
  var callback = new goog.testing.recordFunction();
  loginManager.getCurrentUser(callback);
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];

  sendInstance.simulateResponse(200, 'bla bla bla');
  var callbackArgs = callback.getLastCall().getArguments();
  var responseObj = callbackArgs[0];
  assertFalse(responseObj['success']);
  assertEquals('', responseObj['url']);
  assertEquals('', responseObj['username']);
}

