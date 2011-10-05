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

goog.require('Bite.Constants');
goog.require('bite.Popup');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.mockmatchers');
goog.require('goog.testing.net.XhrIo');
goog.require('goog.testing.recordFunction');
goog.require('rpf.CodeGenerator');
goog.require('rpf.ConsoleLogger');
goog.require('rpf.EventsManager');
goog.require('rpf.PlayBackManager');
goog.require('rpf.RecordManager');
goog.require('rpf.Rpf');
goog.require('rpf.SaveLoadManager');
goog.require('rpf.ScriptManager');
goog.require('rpf.WorkerManager');


var stubs_ = new goog.testing.PropertyReplacer();
var mockLocalStorage = null;

function setUp() {
  initChrome();
  this.mocks = new goog.testing.MockControl();
  this.stubs = new goog.testing.PropertyReplacer();
  console.error = function(error) {};
  mockLocalStorage = {getItem: function() { return 'http://hud.test'; },
                      setItem: function(unused_var) {}};
  stubs_.set(goog.global, 'localStorage', mockLocalStorage);
}

function tearDown() {
  this.stubs.reset();
  this.mocks.$tearDown();
  rpf.Rpf.instance_ = null;
}

function setupRpf() {
  this.mockWorkerMgr = this.mocks.createStrictMock(rpf.WorkerManager);
  this.mockWorkerMgrCtor = this.mocks.createConstructorMock(
      rpf, 'WorkerManager');
  this.mockWorkerMgrCtor(
      goog.testing.mockmatchers.isObject,
      goog.testing.mockmatchers.isObject,
      goog.testing.mockmatchers.isObject,
      goog.testing.mockmatchers.isFunction,
      goog.testing.mockmatchers.isFunction).$returns(this.mockWorkerMgr);

  chrome.tabs.onUpdated = {};
  chrome.tabs.onRemoved = {};
  chrome.tabs.onUpdated.addListener = goog.testing.recordFunction();
  chrome.tabs.onUpdated.removeListener = goog.testing.recordFunction();
  chrome.tabs.onRemoved.addListener = goog.testing.recordFunction();
  chrome.tabs.onRemoved.removeListener = goog.testing.recordFunction();

  chrome.windows = {};
  chrome.windows.update = goog.testing.recordFunction();
  chrome.windows.onRemoved = {};
  chrome.windows.onRemoved.addListener = goog.testing.recordFunction();
  chrome.windows.onRemoved.removeListener = goog.testing.recordFunction();
}

function testRpf() {
  setupRpf();

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  this.mocks.$verifyAll();
}

function testCreateWindow() {
  setupRpf();

  var createRpfWindowFunc = goog.testing.recordFunction();
  rpf.Rpf.prototype.createRpfWindow_ = createRpfWindowFunc;

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.createWindow();
  this.mocks.$verifyAll();

  assertEquals(1, createRpfWindowFunc.getCallCount());
}

function testCreateWindow_alreadyCreated() {
  setupRpf();

  var createRpfWindowFunc = goog.testing.recordFunction();
  rpf.Rpf.prototype.createRpfWindow_ = createRpfWindowFunc;
  var focusFunc = goog.testing.recordFunction();
  rpf.Rpf.prototype.focusRpf = focusFunc;

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(56);
  rpfInstance.createWindow();
  this.mocks.$verifyAll();

  assertEquals(0, createRpfWindowFunc.getCallCount());
  assertEquals(1, focusFunc.getCallCount());
}

function testCreateWindow_forceRefresh() {
  setupRpf();

  var createRpfWindowFunc = goog.testing.recordFunction();
  rpf.Rpf.prototype.createRpfWindow_ = createRpfWindowFunc;
  var focusFunc = goog.testing.recordFunction();
  rpf.Rpf.prototype.focusRpf = focusFunc;

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(56);
  rpfInstance.createWindow(true);
  this.mocks.$verifyAll();

  assertEquals(1, createRpfWindowFunc.getCallCount());
  assertEquals(0, focusFunc.getCallCount());
}

function testRemoveWindow() {
  setupRpf();

  var removeWindowFunc = goog.testing.recordFunction();
  rpf.MiscHelper.removeWindowById = removeWindowFunc;

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(56);
  rpfInstance.removeWindow();
  this.mocks.$verifyAll();
  assertEquals(1, removeWindowFunc.getCallCount());
  var args = removeWindowFunc.getLastCall().getArguments();
  assertEquals(56, args[0]);
}

function testRemoveWindow_preexistingWindow() {
  setupRpf();

  var removeWindowFunc = goog.testing.recordFunction();
  rpf.MiscHelper.removeWindowById = removeWindowFunc;

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(-1);
  rpfInstance.removeWindow();
  this.mocks.$verifyAll();
  assertEquals(0, removeWindowFunc.getCallCount());
}

function testWindowDestroyed_differentWindow() {
  setupRpf();

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(55);
  rpfInstance.windowDestroyed_(50);
  this.mocks.$verifyAll();

  assertEquals(55, rpfInstance.getWindowId());
}

function testWindowDestroyed() {
  setupRpf();

  chrome.tabs.onRemoved = {};
  chrome.tabs.onRemoved.removeListener = goog.testing.recordFunction();

  chrome.tabs.onUpdated = {};
  chrome.tabs.onUpdated.removeListener = goog.testing.recordFunction();

  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(55);
  rpfInstance.windowDestroyed_(55);
  this.mocks.$verifyAll();

  assertEquals(-1, rpfInstance.getWindowId());
}

function testWindowCreated() {
  setupRpf();
  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();

  var result = rpfInstance.windowCreated();
  assertFalse(result);
  this.mocks.$verifyAll();
}

function testWindowCreated_preexistingWindow() {
  setupRpf();
  this.mocks.$replayAll();
  var rpfInstance = rpf.Rpf.getInstance();
  rpfInstance.setWindowId(1);
  var result = rpfInstance.windowCreated();
  assertTrue(result);
  this.mocks.$verifyAll();
}
