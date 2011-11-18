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
 * @fileoverview Unit tests for the explore page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.View');
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
