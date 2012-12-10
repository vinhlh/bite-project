// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview Tests for the code on the Options script file.
 *
 * @author michaelwill@google.com (Michael Williamson)
 */


goog.require('Bite.Constants');
goog.require('bite.Popup');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.net.XhrIo');
goog.require('goog.testing.recordFunction');
goog.require('rpf.Rpf');


var mocks = null;
var stubs = null;
var popup = null;
var mockBackground = null;

function setUp() {
  initChrome();
  mocks = new goog.testing.MockControl();
  stubs = new goog.testing.PropertyReplacer();

  var mockLocalStorage = {getItem: function() {return 'http://hud.test'}};
  stubs.set(goog.global, 'localStorage', mockLocalStorage);

  popup = new bite.Popup();
}

function tearDown() {
  stubs.reset();
  mocks.$tearDown();
}

function testOnClickCallback_bugs() {
  var option = bite.Popup.CONSOLE_OPTIONS_.BUGS.name;

  popup.onClickCallback_(option);

  var lastRequestObj = chrome.extension.lastRequest;
  assertEquals(Bite.Constants.HUD_ACTION.TOGGLE_BUGS,
               lastRequestObj.action);
}

function testOnClickCallback_tests() {
  var option = bite.Popup.CONSOLE_OPTIONS_.TESTS.name;

  popup.onClickCallback_(option);

  var lastRequestObj = chrome.extension.lastRequest;
  assertEquals(Bite.Constants.HUD_ACTION.TOGGLE_TESTS,
               lastRequestObj.action);
}

function testOnClickCallback_rpf() {
  var option = bite.Popup.CONSOLE_OPTIONS_.FLUX.name;

  var rpfInstance = mocks.createStrictMock(rpf.Rpf);

  mocks.$replayAll();
  popup.onClickCallback_(option);
  mocks.$verifyAll();
  var lastRequestObj = chrome.extension.lastRequest;
  assertEquals(Bite.Constants.HUD_ACTION.CREATE_RPF_WINDOW,
               lastRequestObj.action);
}

function testOnClickCallback_options() {
  var option = bite.Popup.CONSOLE_OPTIONS_.SETTINGS.name;
  popup.onClickCallback_(option);
  assertContains('options', chrome.tabs.createdTabUrl);
}

function testOnClickCallback_exception() {
  try {
    popup.onClickCallback_('blalsdjf');
  } catch (e) {
    return;
  }
  fail('Should have thrown an error!');
}

function testInitLoginComplete() {

  var callbackRecord = goog.testing.recordFunction();

  var success = true;
  var url = 'loginOrOut';
  var username = 'michaelwill';
  var responseObj = {
    'success': success,
    'url': url,
    'username': username
  };

  var soyRecord = goog.testing.recordFunction();
  stubs.set(soy, 'renderElement', soyRecord);

  var myVersion = 'myversion';
  stubs.set(popup, 'getVersion', function() { return myVersion; });

  // Going to ignore case where parse throws and exception.  Testing onFailure_
  // as a separate test.
  popup.initLoginComplete_(callbackRecord, responseObj);

  assertEquals(1, soyRecord.getCallCount());
  var soyData = soyRecord.getLastCall().getArguments()[2];
  assertEquals(myVersion, soyData.version);
  assertEquals(username, soyData.username);
  assertEquals(url, soyData.url);

  assertEquals(1, callbackRecord.getCallCount());
  assertTrue(popup.getInitComplete());
}

function testOnFailure_Error() {
  var callbackRecord = goog.testing.recordFunction();
  var error = 'error';

  var soyRecord = goog.testing.recordFunction();
  stubs.set(soy, 'renderElement', soyRecord);

  popup.onFailure_(error, callbackRecord);
  assertFalse(popup.getInitComplete());
  assertEquals(error, popup.getLastError());

  assertEquals(1, soyRecord.getCallCount());
  var soyData = soyRecord.getLastCall().getArguments()[2];
  assertNotNull(soyData['message']);

  assertEquals(1, callbackRecord.getCallCount());
}

function testInitDataComplete() {

  var mockCallback = mocks.createFunctionMock();

  var mockParse = mocks.createFunctionMock();
  mockParse('data').$returns({'version': 'a'});
  stubs.set(JSON, 'parse', mockParse);

  var mockInitLogin = mocks.createFunctionMock();
  mockInitLogin(mockCallback).$returns();
  stubs.set(bite.Popup.prototype, 'initLogin_', mockInitLogin);

  mocks.$replayAll();
  // Going to ignore case where parse throws and exception.  Testing onFailure_
  // as a separate test.
  popup.initDataComplete_(mockCallback, true, 'data');
  mocks.$verifyAll();

  assertEquals('a', popup.getVersion());
}

function testInit() {

  var callbackRecord = goog.testing.recordFunction();

  var soyRecorder = goog.testing.recordFunction();
  stubs.set(soy, 'renderElement', soyRecorder);

  var mockInitData = mocks.createFunctionMock();
  mockInitData(callbackRecord).$returns();
  stubs.set(bite.Popup.prototype, 'initData_', mockInitData);

  mocks.$replayAll();
  popup.init(callbackRecord);
  popup.initComplete_ = true;
  popup.init(callbackRecord);
  mocks.$verifyAll();

  assertEquals(1, soyRecorder.getCallCount());
  assertEquals(1, callbackRecord.getCallCount());
}

function testInstallEventHandlers() {

  var clickCallbackRecorder = goog.testing.recordFunction();
  stubs.set(popup, 'onClickCallback_', clickCallbackRecorder);
  popup.installEventHandlers_();
  var clickEvent = new goog.events.Event(goog.events.EventType.CLICK);

  // Try with the first element.
  var rowElement = goog.dom.getElementsByTagNameAndClass(
      'tr', bite.Popup.POPUP_ITEM_ROW_CLASS_)[0];
  goog.events.fireListeners(rowElement, goog.events.EventType.CLICK,
                            false, clickEvent);

  assertEquals(1, clickCallbackRecorder.getCallCount());
  var args = clickCallbackRecorder.getLastCall().getArguments();
  assertEquals('item1', args[0]);
}
