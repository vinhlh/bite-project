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
 * @fileoverview Unit tests for bite.common.net.url.
 *
 * Test cases:
 *   testGetFullPath
 *   testToAbsolute
 *   testIsAbsolute
 *   testRegex
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.net.url');


/**
 * Tests that getFullPath works as expected.
 */
 function testGetFullPath() {
  var getFullPath = bite.common.net.url.getFullPath;

  assertEquals('1', '', getFullPath(''));
  assertEquals('2', '', getFullPath('a'));
  assertEquals('3', '/', getFullPath('/b'));
  assertEquals('4', '/', getFullPath('/'));
  assertEquals('5', 'a/', getFullPath('a/b'));

  assertEquals('6', 'http://', getFullPath('http://'));
  assertEquals('7', 'http://', getFullPath('http://a'));
  assertEquals('8', 'http://a/', getFullPath('http://a/b'));
  assertEquals('9', 'http://a/', getFullPath('http://a/b.html'));
}


/**
 * Tests that the given url can be correctly converted to an absolute url.
 */
function testToAbsolute() {
  var toAbsolute = bite.common.net.url.toAbsolute;

  // Valid tests.
  assertEquals('1', 'http://a/b', toAbsolute('b', 'http://a'));
  assertEquals('2', 'http://a/b', toAbsolute('a/b', 'http://'));
  assertEquals('3', 'http://a/b/', toAbsolute('', 'http://a/b'));

  // Test valid slash concatenation.
  assertEquals('4', 'http://a/b', toAbsolute('b', 'http://a'));
  assertEquals('5', 'http://a/b', toAbsolute('/b', 'http://a'));
  assertEquals('6', 'http://a/b', toAbsolute('b', 'http://a/'));
  assertEquals('7', 'http://a/b', toAbsolute('/b', 'http://a/'));

  // Test optional scheme.
  assertEquals('8', 'other://a/b', toAbsolute('b', 'other://a', 'other'));

  // Invalid tests.
  assertEquals('9', '', toAbsolute('b', 'other://a'));
  assertEquals('10', '', toAbsolute('b', ''));
  assertEquals('11', '', toAbsolute('b', 'text'));
}


/**
 * Tests that isAbsolute correctly matches urls with the appropriate scheme and
 * the optional scheme.
 */
function testIsAbsolute() {
  // Valid tests.
  assertTrue('1', bite.common.net.url.isAbsolute('http://a/'));
  assertTrue('2', bite.common.net.url.isAbsolute('https://a/'));
  assertTrue('3', bite.common.net.url.isAbsolute('ftp://a/'));
  assertTrue('4', bite.common.net.url.isAbsolute('file:///'));
  assertTrue('5', bite.common.net.url.isAbsolute('other://a/', 'other'));

  // Invalid tests.
  // Invalid due to space before http.
  assertFalse('6', bite.common.net.url.isAbsolute(' http://a/'));
  // Invalid due to missing '/'.
  assertFalse('7', bite.common.net.url.isAbsolute('http:/a/'));
  // Invalid due to invalid scheme.
  assertFalse('8', bite.common.net.url.isAbsolute('other://a/'));
}


/**
 * Tests the regular expressions to ensure they match properly.
 */
function testRegex() {
  // Test bite.common.net.url.Regex.VALID_ROOT.
  // Valid tests.
  assertTrue('1', bite.common.net.url.Regex.VALID_ROOT.test('http://'));
  assertTrue('2', bite.common.net.url.Regex.VALID_ROOT.test('https://'));
  assertTrue('3', bite.common.net.url.Regex.VALID_ROOT.test('ftp://'));
  assertTrue('4', bite.common.net.url.Regex.VALID_ROOT.test('file://'));

  // Invalid tests.
  // Invalid due to space before http.
  assertFalse('5', bite.common.net.url.Regex.VALID_ROOT.test(' http://'));
  // Invalid due to missing '/'.
  assertFalse('6', bite.common.net.url.Regex.VALID_ROOT.test('http:/'));
  // Invalid due to invalid scheme.
  assertFalse('7', bite.common.net.url.Regex.VALID_ROOT.test('other://'));

  // Test bite.common.net.url.Regex.VALID_SCHEME.
  // Valid tests.
  assertTrue('8', bite.common.net.url.Regex.VALID_SCHEME.test('http'));
  assertTrue('9', bite.common.net.url.Regex.VALID_SCHEME.test('https'));
  assertTrue('10', bite.common.net.url.Regex.VALID_SCHEME.test('ftp'));
  assertTrue('11', bite.common.net.url.Regex.VALID_SCHEME.test('file'));

  // Invalid tests.
  // Invalid due to space before http.
  assertFalse('12', bite.common.net.url.Regex.VALID_SCHEME.test(' http'));
  // Invalid due to invalid scheme.
  assertFalse('13', bite.common.net.url.Regex.VALID_SCHEME.test('other'));
}

