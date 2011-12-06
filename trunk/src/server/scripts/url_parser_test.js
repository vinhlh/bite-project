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
 * @fileoverview Unit tests for the url parser script.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.UrlParser');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.mockmatchers');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var mockPage = null;
var mockPageCtor = null;

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  mockPage = mockControl_.createStrictMock(bite.server.Page);
  mockPageCtor = mockControl_.createConstructorMock(bite.server, 'Page');
  mockPageCtor().$returns(mockPage);
  mockPage.destroy().$returns();
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function testUrlParseViewPage() {
  var mockView = mockControl_.createStrictMock(bite.server.View);
  var mockViewCtor = mockControl_.createConstructorMock(bite.server, 'View');
  mockViewCtor().$returns(mockView);
  mockView.init(goog.testing.mockmatchers.isObject).$returns(true);

  mockControl_.$replayAll();
  var urlParser = new bite.server.UrlParser();
  urlParser.layoutHelper = bite.server.LayoutHelper.getInstance();
  urlParser.parseLayout('page=explore');
  assertNotNull(urlParser.setExplorePage);
  mockControl_.$verifyAll();
}



function testUrlParseDetailsPage() {
  var mockSet = mockControl_.createStrictMock(bite.server.Set);
  var mockSetCtor = mockControl_.createConstructorMock(bite.server, 'Set');
  mockSetCtor().$returns(mockSet);
  mockSet.init(goog.testing.mockmatchers.isObject).$returns(true);

  mockControl_.$replayAll();
  var urlParser = new bite.server.UrlParser();
  urlParser.layoutHelper = bite.server.LayoutHelper.getInstance();
  urlParser.parseLayout('page=set_details');
  assertNotNull(urlParser.setDetailsPage);
  mockControl_.$verifyAll();
}
