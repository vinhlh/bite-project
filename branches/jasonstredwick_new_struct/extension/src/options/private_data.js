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
 * @fileoverview This function provides functions for manipulating private BITE
 * configuration data.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.options.private_data');

goog.require('bite.options.private_constants');
goog.require('goog.date.DateTime');
goog.require('goog.object');


/**
 * Returns the current setting for the specified option.
 * @param {string} key The option's cache key.
 * @return {?string} The current value.
 */
bite.options.private_data.get = function(key) {
  if (!goog.object.contains(bite.options.private_constants.Key, key)) {
    console.log('ERROR: Trying to get a configuration option with invalid ' +
                'key ' + key + '.');
    return null;
  }

  // Return the cached value or the default if there is no cache value.
  return /** @type {string} */ (goog.global.localStorage.getItem(key)) || null;
};


/**
 * Updates the given option with the given value.  This is a private function
 * and expects the user to validate their own inputs.
 * @param {string} key The option's cache key.
 * @param {string} value The option's new value if valid.
 */
bite.options.private_data.update = function(key, value) {
  if (!goog.object.contains(bite.options.private_constants.Key, key)) {
    console.log('ERROR: Trying to get a configuration option with invalid ' +
                'key ' + key + '.');
    return;
  }

  // Cache the specified option's new value.
  goog.global.localStorage.setItem(key, value);
};

