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
 * @fileoverview Unit tests for the Set's details page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.Set');
goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.json');
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


function testLoadSuiteFromServer() {
  var set = new bite.server.Set();
  set.loadSuiteFromServer('a', 'b', 'c');
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];
  var sentUri = sendInstance.getLastUri();
  assertEquals('/suite/load', sentUri);
}


function testSaveSetToServer() {
  var elem = goog.dom.createDom('div', {'id': 'setName',
                                        'value': 'abc'});
  goog.dom.appendChild(goog.dom.getDocument().body, elem);
  var set = new bite.server.Set();
  set.saveSetToServer();
  var sendInstance = goog.testing.net.XhrIo.getSendInstances()[0];
  var sentUri = sendInstance.getLastUri();
  assertEquals('/suite/add', sentUri);
}


function testParseParams() {
  var elem = goog.dom.createDom('div', {'id': 'mainnav-overview',
                                        'value': 'abc',
                                        'class': 'mainnav-item'});
  goog.dom.appendChild(goog.dom.getDocument().body, elem);
  var elem2 = goog.dom.createDom('div', {'id': 'setTabDetailDiv',
                                         'value': 'abc',
                                         'innerHTML': ''});
  goog.dom.appendChild(goog.dom.getDocument().body, elem2);
  mockControl_.$replayAll();
  var set = new bite.server.Set();
  set.parseParams_(goog.Uri.QueryData.createFromMap({'suiteKey': 'abc'}));
  mockControl_.$verifyAll();
}
