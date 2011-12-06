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
 * @fileoverview The file provides utility functions for manipulating urls.
 *
 * Public data:
 *   Regex - An enumeration of useful regular expressions.
 *
 * Public functions:
 *   isAbsolute(url, opt_scheme) - Determines if the given url is an absolute
 *       url or not.
 *   toAbsolute(url, base, opt_scheme) - Converts url to an absolute url using
 *       base.  If the url is already absolute then do nothing.
 *
 * Usage:
 *   bite.common.net.url.Regex.VALID_SCHEME.test('http://a/'); // true
 *
 *   bite.common.net.url.isAbsolute('other://a/b/c', 'other'); // true
 *   bite.common.net.url.isAbsolute('/a/b/c');                 // false
 *
 *   bite.common.net.url.toAbsolute('/b/c', 'http:/a/'); // 'http:/a/b/c'
 *   bite.common.net.url.toAbsolute('b/c', 'http:/a');   // 'http:/a/b/c'
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.net.url');


/**
 * A regular expression representing valid url schemes.
 * @enum {RegExp}
 */
bite.common.net.url.Regex = {
  // Valid url root (scheme://).
  VALID_ROOT: /^(http|https|ftp|file)[:][/][/]/,

  // Valid url schemes (standard).
  VALID_SCHEME: /^(http|https|ftp|file)/
};


/**
 * Determines if the url is absolute by examining the beginning of the url
 * looking for a valid root (scheme://).  The function does not validate the
 * full url to ensure it is valid; it assumes the user passes a valid url.
 * @param {string} url The url to check.
 * @param {string=} opt_scheme If an optional scheme is supplied then use it
 *     to check if a url is absolute.  This is useful for non-standard urls
 *     such as chrome://.
 * @return {boolean} Whether or not the url is absolute.
 */
bite.common.net.url.isAbsolute = function(url, opt_scheme) {
  if (opt_scheme) {
    return RegExp(opt_scheme + '[:][/][/]').test(url);
  }

  return bite.common.net.url.Regex.VALID_ROOT.test(url);
};


/**
 * Converts a url to an absolute url unless the url is already an absolute url
 * in which case nothing changes.  Otherwise the base and url are concatenated
 * to form a new absolute url.  Upon invalid base url, the function will return
 * the empty string.
 * @param {string} url The original url.
 * @param {string} base The base url.
 * @param {string=} opt_scheme If an optional scheme is supplied then use it
 *     to check if a url is absolute.  This is useful for non-standard urls
 *     such as chrome://.
 * @return {string} The new url, the same if it is already absolute, or the
 *     empty string for invalid inputs.
 */
bite.common.net.url.toAbsolute = function(url, base, opt_scheme) {
  // If the url starts with a valid scheme then consider it an absolute url and
  // return it.
  if (bite.common.net.url.isAbsolute(url, opt_scheme)) {
    return url;
  }

  // Check for invalid inputs.  Testing whether the base url is absolute also
  // checks for the empty string.
  if (!bite.common.net.url.isAbsolute(base, opt_scheme)) {
    return '';
  }

  // Ensure that a single slash will join the two strings.
  return [
    base.substr(0, base.length - (base[base.length - 1] == '/' ? 1 : 0)),
    url.substr((url[0] == '/' ? 1 : 0), url.length)
  ].join('/');
};


/**
 * Converts a url to its full path meaning everything from the scheme to the
 * final slash; i.e. cut off anything after the final slash.
 * @param {string} url The url to manipulate.
 * @return {string} The full path.
 */
bite.common.net.url.getFullPath = function(url) {
  return url.replace(/[^/]+$/, '');
};

