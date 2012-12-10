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
 * @fileoverview Tests for the code on the background script file.
 *
 * @author alexto@google.com (Alexis O. Torres)
 */


goog.require('Bite.Constants');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Queue');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.MockUserAgent');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.net.XhrIo');
goog.require('bite.client.Background');



var mocks_ = null;
var stubs_ = null;
var mockUserAgent_ = null;
var background = null;

function setUp() {
  initChrome();
  mocks_ = new goog.testing.MockControl();
  stubs_ = new goog.testing.PropertyReplacer();

  var mockLocalStorage = {getItem: function() {return 'http://hud.test'},
                          setItem: function() {},
                          removeItem: function() {}};
  stubs_.set(goog.global, 'localStorage', mockLocalStorage);

  var mockRpf = mocks_.createStrictMock(rpf.Rpf);
  stubs_.set(rpf.Rpf, 'getInstance', function() { return mockRpf; });
  stubs_.set(bite.client.Background, 'logEvent', function() {});
  background = new bite.client.Background();
  stubs_.set(goog.net, 'XhrIo', goog.testing.net.XhrIo);
}


function tearDown() {
  stubs_.reset();
  if (mockUserAgent_) {
    mockUserAgent_.uninstall();
  }
}


function getLastXhrIo() {
  var sendInstances = goog.testing.net.XhrIo.getSendInstances();
  var xhr = sendInstances[sendInstances.length - 1];
  return xhr;
}


function testBadgeBegin() {
  background.updateBadge_(
      new ChromeTab(),
      {action: bite.client.Background.FetchEventType.FETCH_BEGIN});
  assertEquals('...', chrome.browserAction.details.text);
}


function testBadgeEndZero() {
  background.updateBadge_(
      new ChromeTab(),
      {action: bite.client.Background.FetchEventType.FETCH_END,
       count: 0});
  assertEquals('0', chrome.browserAction.details.text);
}


function testBadgeEndNotZero() {
  background.updateBadge_(
      new ChromeTab(),
      {action: bite.client.Background.FetchEventType.FETCH_END,
       count: 25});
  assertEquals('25', chrome.browserAction.details.text);
}

