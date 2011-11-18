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


goog.require('bite.server.Helper');
goog.require('goog.testing.asserts');


function setUp() {
}


function tearDown() {
}


function testGetUrl() {
  var serverUrl = '';
  var requestPath = '/run/get';
  var paramMap = {'page': 'set'};
  var url = bite.server.Helper.getUrl(serverUrl, requestPath, paramMap);
  assertEquals('/run/get?page=set', url);
}


function testGetUrlHash() {
  var serverUrl = '';
  var requestPath = '/run/get';
  var paramMap = {'page': 'set'};
  var url = bite.server.Helper.getUrlHash(serverUrl, requestPath, paramMap);
  assertEquals('/run/get#page=set', url);
}


function testSplitAndTrim() {
  var str = 'hello, yes,  hi  ';
  var delimiter = ',';
  var results = bite.server.Helper.splitAndTrim(str, delimiter);
  assertObjectEquals(['hello', 'yes', 'hi'], results);
}
