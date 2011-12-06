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
 * @fileoverview Unit tests for validatedialog.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('rpf.ValidateDialog');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var chrome = {};
var JSON = {};

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  chrome.extension = {};
  stubs_.set(goog.global, 'chrome', chrome);
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function testSetVisible() {
}


function testOpenValidationDialog() {
}
