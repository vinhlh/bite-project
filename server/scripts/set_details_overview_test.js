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
 * @fileoverview Unit tests for the overview tab in set's page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('bite.server.set.Overview');
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
  var overview = new bite.server.set.Overview(null);
  var params = {'description': 'a',
                'labels': JSON.stringify({'labels': ['b']}),
                'projectName': 'c'};
  overview.setProperties(params);
  assertEquals(overview.description, 'a');
  assertObjectEquals(overview.labels, ['b']);
  assertEquals(overview.biteProject, 'c');
}


function testAddProperties() {
  var overview = new bite.server.set.Overview(null);
  var params = {};
  overview.biteProject = 'c';
  overview.description = 'a';
  overview.labels = ['b'];
  overview.addProperties(params);
  assertEquals(params['description'], 'a');
  assertEquals(params['projectName'], 'c');
  assertObjectEquals(params['labels'], JSON.stringify({'labels': ['b']}));
}
