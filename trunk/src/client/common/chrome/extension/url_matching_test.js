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
 * @fileoverview Unit tests for bite.common.chrome.extension.urlMatching.
 *
 * Test cases:
 *   testMatchAll
 *   testSchemeConversion
 *   testHostConversion
 *   testPathConversion
 *   testBadFormat
 *   testNoPattern
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.chrome.extension.urlMatching');


/**
 * Sets up the environment for each unit test.
 */
function setUp() {}


/**
 * Cleans up the environment for each unit test.
 */
function tearDown() {}


/**
 * Tests conversion the match all url patterns.  Match all does not match
 * no url and the scheme must be valid.
 */
function testMatchAll() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  // Match all urls and match all using wild cards gives the same result.
  var pattern = '*://*/*';
  assertTrue(convert(pattern).test('http://www.google.com/test1'));

  pattern = '<all_urls>';
  assertTrue(convert(pattern).test('http://www.google.com/test1'));
  assertTrue(convert(pattern).test('http://a/b/c/d'));
  assertTrue(convert(pattern).test('http://a/b'));
  assertTrue(convert(pattern).test('http://a/'));

  // Invalid match due to invalid scheme.
  assertFalse(convert(pattern).test('other://www.google.com/test1'));
}


/**
 * Tests the conversion and validation of scheme components including the
 * match all scheme pattern.
 */
function testSchemeConversion() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  // Invalid schemes as they must be one of the valid schemes given in
  // bite.common.chrome.extension.urlMatching.Regexp.MATCH_SCHEME_EXPLICIT.
  // The star is a valid scheme, but cannot be used in conjunction with any
  // text, it must the single star character.
  var pattern = 'bhttp://*/*';
  assertNull(convert(pattern));

  pattern = 'httpb://*/*';
  assertNull(convert(pattern));

  pattern = 'http*://*/*';
  assertNull(convert(pattern));

  pattern = 'chrome://*/*';
  assertNull(convert(pattern));

  pattern = 'other://*/*';
  assertNull(convert(pattern));

  // Valid explicit schemes; does not include match all scheme pattern.
  pattern = 'http://*/*';
  assertTrue(convert(pattern).test('http://www.google.com/'));

  pattern = 'https://*/*';
  assertTrue(convert(pattern).test('https://www.google.com/'));
  assertFalse(convert(pattern).test('http://www.google.com/'));

  pattern = 'file:///*';
  assertTrue(convert(pattern).test('file:///'));

  pattern = 'ftp://*/*';
  assertTrue(convert(pattern).test('ftp://www.google.com/'));

  // Valid match all scheme patterns.
  pattern = '*://*/*';
  assertTrue(convert(pattern).test('ftp://www.google.com/'));
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertTrue(convert(pattern).test('https://www.google.com/'));

  // Invalid match all scheme patterns.
  pattern = '*://*/*';
  assertFalse(convert(pattern).test('other://www.google.com/'));
}


/**
 * Tests the conversion and validation of host components including the
 * match all pattern.  This test examines bad wild card usage.  When examining
 * proper wild card usage it can match anything that ends with the substring
 * following the wild card.
 */
function testHostConversion() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  // Invalid pattern; the match all pattern must be the first character in the
  // host pattern if present.
  var pattern = '*://www.*/*';
  assertNull(convert(pattern));

  // Invalid pattern; only a single match all pattern is allowed in the host.
  pattern = '*://*.google.*/*';
  assertNull(convert(pattern));

  // Match an explicit host.
  pattern = '*://www.google.com/*';
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertFalse(convert(pattern).test('http://maps.google.com/'));

  // Match any hosts that ends with '.google.com'.
  pattern = '*://*.google.com/*';
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertTrue(convert(pattern).test('http://maps.google.com/'));
  assertTrue(convert(pattern).test('http://maps.google.google.com/'));
  assertFalse(convert(pattern).test('http://maps.com/'));

  // Match any host that ends with 'oogle.com'.
  pattern = '*://*oogle.com/*';
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertTrue(convert(pattern).test('http://maps.google.com/'));
  assertTrue(convert(pattern).test('http://www.froogle.com/'));
  assertTrue(convert(pattern).test('http://froogle.com/'));

  // Match any host.
  pattern = '*://*/*';
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertTrue(convert(pattern).test('http://a.b.c/'));
  assertTrue(convert(pattern).test('http://a/'));
  assertFalse(convert(pattern).test('http:///'));
}


/**
 * Tests conversion and validation of path components including the match
 * all patterns.
 */
function testPathConversion() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  // Match exact path that only matches a single slash.
  var pattern = '*://*/';
  assertTrue(convert(pattern).test('http://www.google.com/'));
  assertFalse(convert(pattern).test('http://www.google.com'));
  assertFalse(convert(pattern).test('http://www.google.com/x'));

  // Match any path that starts with '/test'.
  pattern = '*://*/test*';
  assertTrue(convert(pattern).test('http://www.google.com/test'));
  assertTrue(convert(pattern).test('http://www.google.com/test/'));
  assertTrue(convert(pattern).test('http://www.google.com/test/*'));
  assertTrue(convert(pattern).test('http://www.google.com/testing'));
  assertTrue(convert(pattern).test('http://www.google.com/test/test1/test'));

  // Match any path that starts with a slash and ends with 'test'.
  pattern = '*://*/*test';
  assertTrue(convert(pattern).test('http://www.google.com/test'));
  assertTrue(convert(pattern).test('http://www.google.com/testtest'));
  assertTrue(convert(pattern).test('http://www.google.com/footest'));
  assertTrue(convert(pattern).test('http://www.google.com/foo/test'));
  assertFalse(convert(pattern).test('http://www.google.com/foo/test/'));

  // Match any path that starts with a slash and contains 'test'.
  pattern = '*://*/*test*';
  assertTrue(convert(pattern).test('http://www.google.com/test'));
  assertTrue(convert(pattern).test('http://www.google.com/testtest'));
  assertTrue(convert(pattern).test('http://www.google.com/footestbar'));
  assertTrue(convert(pattern).test('http://www.google.com/foo/test/bar'));

  // Match any path that contains a partial path of '/test1/'.
  pattern = '*://*/test1/*';
  assertFalse(convert(pattern).test('http://www.google.com/test1'));
  assertTrue(convert(pattern).test('http://www.google.com/test1/'));
  assertTrue(convert(pattern).test('http://www.google.com/test1/foo/bar/x'));

  // Match any path bounded by two exact path fragments.
  pattern = '*://*/test1/*/test2';
  assertFalse(convert(pattern).test('http://www.google.com/test1/test2'));
  assertTrue(convert(pattern).test('http://www.google.com/test1/foo/test2'));
  assertTrue(convert(pattern).test(
      'http://www.google.com/test1/foo/bar/test2'));

  // Match any path that begins with a specific path fragment and ends with a
  // slash.
  pattern = '*://*/test1/*/';
  assertTrue(convert(pattern).test('http://www.google.com/test1/foo/'));
  assertTrue(convert(pattern).test('http://www.google.com/test1/foo/bar/x/'));
  assertFalse(convert(pattern).test('http://www.google.com/test1/'));

  // Match a path that begins with a specific path fragment and the pattern
  // contains multiple consecutive stars.
  pattern = '*://*/test1**';
  assertTrue(convert(pattern).test('http://www.google.com/test1'));
  assertTrue(convert(pattern).test('http://www.google.com/test1/foo/bar'));
}


/**
 * Tests conversion of Chrome Extension match patterns into a RegExp when
 * supplied with invalid patterns.
 */
function testBadFormat() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  var pattern = '*'; // Attempt to match everything.
  assertNull(convert(pattern));

  pattern = '*//*/*'; // Missing ':' after scheme.
  assertNull(convert(pattern));

  pattern = '*:*/*'; // Missing '//' after scheme.
  assertNull(convert(pattern));

  pattern = '*:/*/*'; // Missing '/' after scheme.
  assertNull(convert(pattern));

  pattern = '*://*'; // Missing path.
  assertNull(convert(pattern));

  pattern = '*:///*'; // Only valid when scheme is file.
  assertNull(convert(pattern));

  pattern = '*://**/*'; // Second star in host is invalid.
  assertNull(convert(pattern));

  pattern = '*://*.google.*/*'; // Second star in host is invalid.
  assertNull(convert(pattern));

  pattern = '*://www.google.*/*'; // Star in host is invalid, must be first
  assertNull(convert(pattern));   // character.

  pattern = 'file://*/*'; // Host is invalid, file scheme cannot have a host.
  assertNull(convert(pattern));

  pattern = ' <all_urls>'; // Space before <all_urls> is invalid.
  assertNull(convert(pattern));

  pattern = '<all_urls> '; // Space after <all_urls> is invalid.
  assertNull(convert(pattern));

  pattern = '<ALL_URLS>'; // Capitalization invalid, test is case sensitive.
  assertNull(convert(pattern));
}


/**
 * Tests conversion when given nothing; i.e. undefined, null, and the empty
 * string.
 */
function testNoPattern() {
  var convert = bite.common.chrome.extension.urlMatching.convertToRegExp;

  assertNull(convert(undefined));
  assertNull(convert(null));
  assertNull(convert(''));
}

