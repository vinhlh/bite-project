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
 * @fileoverview Unit tests for events manager.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('rpf.EventsManager');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var chrome = {};
var playbackMgr = {};
var recordMgr = {};
var mockLocalStorage = null;

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  chrome.extension = {};
  chrome.extension.onRequest = {};
  chrome.extension.onRequest.addListener = function(f) {};
  chrome.tabs = {};
  chrome.tabs.onUpdated = {};
  chrome.tabs.onUpdated.addListener = function(f) {};
  stubs_.set(goog.global, 'chrome', chrome);
  mockLocalStorage = {getItem: function() { return 'http://hud.test'; },
                      setItem: function(unused_var) {}};
  stubs_.set(goog.global, 'localStorage', mockLocalStorage);
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function testCallBackTabUpdated() {
  var changeInfo = {'status': rpf.EventsManager.TabStatus_.LOADING};
  playbackMgr.getPlaybackTabId = function() { return 1; };
  playbackMgr.getCurrentStep = function() {return 1; };
  recordMgr.getTestTabId = function() { return 1; };
  var eventsMgr = new rpf.EventsManager(playbackMgr, recordMgr);
  mockControl_.$replayAll();
  eventsMgr.callBackTabUpdated_(1, changeInfo);
  mockControl_.$verifyAll();
}


function testCallBackOnRequest() {
  var request = {};
  var sender = {};
  var sendResponse = {};
  request['command'] = rpf.EventsManager.CmdTypes_.CMD_DONE;
  request['result'] = '';
  request['index'] = 1;
  request['bodyHtml'] = 'a';
  playbackMgr.getCurrentStep = function() {return 1; };

  recordMgr.getTestTabId = function() { return 1;};
  var eventsMgr = new rpf.EventsManager(playbackMgr, recordMgr);
  mockControl_.$replayAll();
  eventsMgr.callBackOnRequest(request, sender, sendResponse);
  mockControl_.$verifyAll();
}


function testExecuteMultipleScripts() {
  var mockExecuteScript_ =
      mockControl_.createFunctionMock('executeScript');
  mockExecuteScript_(1, {file: 'a', allFrames: true},
                     goog.testing.mockmatchers.isFunction).$returns('');
  chrome.tabs.executeScript = mockExecuteScript_;
  var eventsMgr = new rpf.EventsManager(playbackMgr, recordMgr);
  mockControl_.$replayAll();
  var result = eventsMgr.executeMultipleScripts(
      ['a'], 0, true, 1, null);
  mockControl_.$verifyAll();
}
