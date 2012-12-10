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
 * @fileoverview Unit tests for the Run's details page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.Run');
goog.require('bite.server.run.Overview');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.mockmatchers');
goog.require('goog.testing.net.XhrIo');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  stubs_.replace(goog.net.XhrIo, 'send', goog.testing.net.XhrIo.send);
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  goog.testing.net.XhrIo.sendInstances_ = [];
  stubs_.reset();
}


function testLoadRunFromServer() {
  var elem1 = goog.dom.createDom('div', {'id': 'runName',
      'value': 'abc'});
  goog.dom.appendChild(goog.dom.getDocument().body, elem1);
  var elem2 = goog.dom.createDom('div', {'id': 'runDesc',
      'value': 'abc'});
  goog.dom.appendChild(goog.dom.getDocument().body, elem2);
  var elem3 = goog.dom.createDom('div', {'id': 'interval',
    'value': 'abc'});
  goog.dom.appendChild(goog.dom.getDocument().body, elem3);
  var mockGetKeyFunc = mockControl_.createFunctionMock();
  mockControl_.$replayAll();
  var run = new bite.server.Run();
  var runKey = 'abc';
  run.selectedTab = new bite.server.run.Overview(mockGetKeyFunc);
  run.loadRunFromServer(runKey);
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];
  var sentUri = sendInstance.getLastUri();
  sendInstance.simulateResponse(200, JSON.stringify({'runKey': 'ddd'}));
  assertEquals('/run/load_template', sentUri);
  assertEquals('ddd', run.runKey_);
  mockControl_.$verifyAll();
}


function testSaveRunToServer() {
  var run = new bite.server.Run();
  run.saveRunToServer();
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];
  var sentUri = sendInstance.getLastUri();
  assertEquals('/run/add_template', sentUri);
}

