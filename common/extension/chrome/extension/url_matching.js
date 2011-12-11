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
 * @fileoverview Define functions for processing url match patterns as
 * specified by the chrome extensions API, see
 *
 *     http://code.google.com/chrome/extensions/match_patterns.html (Oct 2011)
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.chrome.extension.urlMatching');


/**
 * Various replacement patterns that are used to covert from extension format
 * to RegExp format.
 * @enum {string}
 */
bite.common.chrome.extension.urlMatching.MatchPatterns = {
  ALL_URLS: '<all_urls>',
  MATCH_ALL_HOST: '*',
  MATCH_ALL_PATH: '[/]*',
  MATCH_ALL_SCHEME: '*',
  STAR_HOST: '[^/*]+',
  STAR_PATH: '.*',
  STAR_SCHEME: '(http|https|file|ftp)'
};


/**
 * Various regular expressions for parsing extension match patterns.
 * @enum {RegExp}
 */
bite.common.chrome.extension.urlMatching.Regexp = {
  ALL_EXPRESSIONS_TRUE: /^<all_urls>$/, // matches everything except no match
  CONVERT_HOST: /^[*]/,
  CONVERT_PATH_ALL: /([^.])[*]/g,
  CONVERT_SCHEME_ALL: /^[*]$/,
  MATCH_ALL:
      /^([*]|http|https|file|ftp):[/][/]([*]|[*]?[^/*]+)?([/].*)$/,
  MATCH_HOST: /^[*]$|^[*]?[^/*]+$/,
  MATCH_HOST_ALL: /^[*]$/,
  MATCH_PATH: /([/].*)$/,
  MATCH_SCHEME: /^([*]|http|https|file|ftp)/,
  MATCH_SCHEME_EXPLICIT: /^(http|https|file|ftp)/
};


/**
 * Converts the chrome extension match pattern into a RegExp. Can throw an
 * exception with an error string.
 * @param {string} pattern The extension-based pattern.
 * @return {RegExp} Either a RegExp or null if the match is not valid.
 */
bite.common.chrome.extension.urlMatching.convertToRegExp = function(pattern) {
  try {
    var urlMatching = bite.common.chrome.extension.urlMatching;

    var data = null;
    if (pattern == urlMatching.MatchPatterns.ALL_URLS) {
      data = {
          scheme: urlMatching.MatchPatterns.MATCH_ALL_SCHEME,
          host: urlMatching.MatchPatterns.MATCH_ALL_HOST,
          path: urlMatching.MatchPatterns.MATCH_ALL_PATH
      };
    } else {
      var matches = urlMatching.Regexp.MATCH_ALL.exec(pattern);
      if (matches) {
        // matches[0] == matched text for the entire expression.
        // matches[1..3] correlate to substrings found by the subpatterns in
        // MATCH_ALL.
        // Note: Subpattern matching will return undefined if not matched.
        data = {
            scheme: matches[1],
            host: matches[2],
            path: matches[3]
        };
      }
    }

    return urlMatching.formRegExp_(data);

  } catch (error) {
    throw 'ERROR (bite.common.chrome.extension.urlMatching.convertToRegExp):' +
          ' Given pattern: ' + pattern + ' - Exception was thrown: ' + error;
  }
};


/**
 * Converts the piece-wise match patterns from convertToRegExp into a single
 * regular expression that will match correct urls, using correct regular
 * expression syntax.  Can throw an exception when creating a new RegExp.  Host
 * data is optional since it should be undefined when the scheme is 'file'.
 * @param {?{scheme: string, host: string, path: string}} input An object
 *     containing the components of a match: scheme, host, and path.
 * @return {RegExp} A regular expression that captures the match, or null if
 *     inputs are not valid.
 * @private
 */
bite.common.chrome.extension.urlMatching.formRegExp_ = function(input) {
  // A valid expression must have a scheme and path.
  // If the scheme is not a file then it must have a component.
  // If the scheme is file then it cannot have a host component.
  if (!input || !input.scheme || !input.path ||
      (input.scheme != 'file' && !input.host) ||
      (input.scheme == 'file' && input.host)) {
    return null;
  }

  var urlMatching = bite.common.chrome.extension.urlMatching;

  // If scheme can be any scheme (*) then convert the scheme match into
  // specific valid options as specified in STAR_SCHEME.
  var scheme = input.scheme.replace(urlMatching.Regexp.CONVERT_SCHEME_ALL,
                                    urlMatching.MatchPatterns.STAR_SCHEME);

  var host = '';
  if (input.host) {
    if (urlMatching.Regexp.MATCH_HOST_ALL.test(input.host)) {
      host = input.host.replace(urlMatching.Regexp.CONVERT_HOST,
                                urlMatching.MatchPatterns.STAR_HOST);
    } else if (urlMatching.Regexp.MATCH_HOST.test(input.host)) {
      host = input.host.replace(urlMatching.Regexp.CONVERT_HOST,
                                urlMatching.MatchPatterns.STAR_HOST);
    } else {
      return null;
    }
  }

  // Replace consecutive *s with a single * first then replace all *s with
  // '.*'.  $1 is required to conserve the character before the * otherwise it
  // would be stripped out during the replace.
  var path = input.path.replace(/[*]+/g, '*');
  path = path.replace(urlMatching.Regexp.CONVERT_PATH_ALL,
                      '$1' + urlMatching.MatchPatterns.STAR_PATH);

  return new RegExp('^' + scheme + '://' + host + path + '$');
};

