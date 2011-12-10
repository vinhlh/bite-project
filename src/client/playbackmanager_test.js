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
 * @fileoverview Unit tests for play back manager.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('rpf.PlayBackManager');
goog.require('rpf.Rpf');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var chrome = {};
var getConsoleWindowId = {};
var rpfInstance = null;

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  rpfInstance = mockControl_.createStrictMock(rpf.Rpf);
  chrome.extension = {};
  chrome.tabs = {};
  stubs_.set(goog.global, 'chrome', chrome);
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function testGetAllStepsFromScript() {
  var scriptStr = 'a\nb\n\n';
  var playbackMgr = new rpf.PlayBackManager(rpfInstance);
  var result = playbackMgr.getAllStepsFromScript(scriptStr);
  assertEquals(4, result.length);
  assertEquals('a', result[0]);
  assertEquals('b', result[1]);
}


function testCreatePlayBackScript() {
  var script = 'a*a';
  var datafile = 'b*b';
  var playbackMgr = new rpf.PlayBackManager();
  var result = playbackMgr.createPlayBackScript(datafile);
  assertNotEquals(-1, result.indexOf(datafile));
}


function testWaitForElementReadyAndExecCmds() {
  var isLoadingReadyForPlayback_ = function() {return true;}

  mockControl_.$replayAll();
  var playbackMgr = new rpf.PlayBackManager({}, isLoadingReadyForPlayback_);
  assertEquals('', playbackMgr.getCurrentCmd());
  playbackMgr.scripts_ = ['run('];
  playbackMgr.setCurrentStep(0);
  playbackMgr.waitForElementReadyAndExecCmds();
  mockControl_.$verifyAll();
}
