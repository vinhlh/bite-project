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
 * @fileoverview Unit tests for the setting tab in set's page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.set.Settings');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.mockmatchers');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;

function setUp() {
  mockControl_ = new goog.testing.MockControl();
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function testSetProperties() {
  var settings = new bite.server.set.Settings(null);
  var params = {'token': 'a',
                'emailFrom': ['b'],
                'emailTo': ['c'],
                'startUrl': 'd',
                'failureThresh': 0,
                'interval': 1};
  settings.setProperties(params);
  assertEquals(settings.token_, 'a');
  assertEquals(settings.interval_, 1);
  assertEquals(settings.failureThresh_, 0);
  assertEquals(settings.startUrl_, 'd');
  assertObjectEquals(settings.emailFrom_, ['b']);
  assertObjectEquals(settings.emailTo_, ['c']);
}


function testAddProperties() {
  var settings = new bite.server.set.Settings(null);
  var params = {};
  settings.token_ = 'a';
  settings.interval_ = 1;
  settings.startUrl_ = 'd';
  settings.failureThresh_ = 0;
  settings.emailFrom_ = ['b'];
  settings.emailTo_ = ['c'];
  settings.addProperties(params);
  assertEquals(params['tokens'], 'a');
  assertEquals(params['interval'], 1);
  assertEquals(params['startUrl'], 'd');
  assertEquals(params['failureThresh'], 0);
  assertObjectEquals(params['emailFrom'], JSON.stringify(['b']));
  assertObjectEquals(params['emailTo'], JSON.stringify(['c']));
}
