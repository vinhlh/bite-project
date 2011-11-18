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
 * @fileoverview This function provides functions for manipulating the BITE
 * configuration.  The functions allow get/set of individual configuration
 * options or as a group.  It also allows users to access default option
 * values and validate individual option values.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.options.data');

goog.require('bite.options.constants');
goog.require('bite.options.private_constants');
goog.require('goog.date.DateTime');
goog.require('goog.object');


/**
 * Returns an object containing the default configuration where each setting's
 * key is from bite.options.constants.Id.
 * @return {!Object} The default configuration.
 */
bite.options.data.getAllDefaults = function() {
  // Returns the entire Default enum as the Object.
  return bite.options.private_constants.Default;
};


/**
 * Returns the default value for the requested option.
 * @param {bite.options.constants.Id} id The option to lookup.
 * @return {string} The default value.
 */
bite.options.data.getDefault = function(id) {
  // Retrieve the id value used as a key in the Default enum.
  return bite.options.private_constants.Default[id];
};


/**
 * Returns an object containing the current configuration where each setting's
 * key is from bite.options.constants.Id.
 * @return {!Object} The current configuration.
 */
bite.options.data.getCurrentConfiguration = function() {
  // Retrieves all option values (or default value if not set) and adds them
  // to the data Object, which is then returned.
  var data = {};
  for (var key in bite.options.constants.Id) {
    var id = bite.options.constants.Id[key];

    // Get current value or its default if not set.
    data[id] = bite.options.data.get(id);
  }
  return data;
};


/**
 * Returns the current setting for the specified option.
 * @param {bite.options.constants.Id} id The option to lookup.
 * @return {string} The current value.
 */
bite.options.data.get = function(id) {
  // Determine the cache's key for the given id.
  var cacheKey = bite.options.private_constants.Key[id];
  // Return the cached value or the default if there is no cache value.
  return /** @type {string} */ (goog.global.localStorage.getItem(cacheKey)) ||
         bite.options.data.getDefault(id);
};


/**
 * Uses the given data to override the configuration with the given values.
 * Invalid keys are ignored, but invalid data will result in an exception
 * being thrown (in string form).
 * @param {!Object} data The data used to override the current configuration.
 * @param {string=} opt_username The name of the user making the change.  If
 *     not supplied then it is set to the default username.
 */
bite.options.data.updateConfiguration = function(data, opt_username) {
  // Loop over all possible configuration options.
  for (var key in bite.options.constants.Id) {
    var id = bite.options.constants.Id[key];

    // If the current option is not present in the data then move to the next
    // option.
    if (!(id in data)) {
      continue;
    }

    // Update the given option with the given value.  Update can throw an
    // exception if the data value being passed in is not valid.
    bite.options.data.update(id, data[id], opt_username);
  }
};


/**
 * Updates the given option with the given value.  An invalid value will
 * result in an exception being thrown (in string form).
 * @param {bite.options.constants.Id} id The option to update.
 * @param {string} value The option's new value if valid.
 * @param {string=} opt_username The name of the user making the change.  If
 *     not supplied then it is set to the default username.
 */
bite.options.data.update = function(id, value, opt_username) {
  // Before setting the current option's value, validate the given value.
  // If validation fails an exception will be thrown (in string form).
  // Otherwise, the function returns a processed version of the value
  // suitable for caching.
  var processedValue = bite.options.data.validate(id, value);

  // Determine the username to use to mark the most recent update of the
  // configuration.
  var username = opt_username ||
                 bite.options.private_constants.DEFAULT_USERNAME;

  // Determine the time stamp to use to make the most recent update of the
  // configuration.
  var date = new goog.date.DateTime();
  var timestamp = date.getTime();

  // Shortcut to the Key enum that contains the each setting's cache key.
  var keys = bite.options.private_constants.Key;

  // Cache the new option's value and a signature to mark who and when the
  // configuration was updated.
  goog.global.localStorage.setItem(keys[id], processedValue);
  goog.global.localStorage.setItem(keys.ADMIN_LAST_SAVE_TIME, timestamp);
  goog.global.localStorage.setItem(keys.ADMIN_LAST_SAVE_USER, username);
};


/**
 * Validates the given value for the given option.  If the value is invalid
 * then an exception will be thrown (in string form).
 * @param {bite.options.constants.Id} id The option to lookup.
 * @param {string} value The value to validate.
 * @return {string} The processed version of the value.
 */
bite.options.data.validate = function(id, value) {
  // By defaulting to empty, any that make it throw will automatically return
  // false for the containsValue test.
  var enumToTest = {};

  // Process each of the options to verify the value is valid.  Each option
  // will either return the processed value or throw an exception.
  switch (id) {
    case bite.options.constants.Id.BUG_RECORDING:
    case bite.options.constants.Id.BUG_SCREENSHOT:
    case bite.options.constants.Id.BUG_UI_BINDING:
      bite.options.data.validateEnum_(
          bite.options.constants.ThreeWayOption, value, id);
      break;

    case bite.options.constants.Id.BUG_STATE:
      bite.options.data.validateEnum_(
          bite.options.constants.StateOption, value, id);
      break;

    case bite.options.constants.Id.BUG_PROJECT:
      bite.options.data.validateEnum_(
          bite.options.constants.ProjectOption, value, id);
      break;

    case bite.options.constants.Id.SERVER_CHANNEL:
      bite.options.data.validateEnum_(
          bite.options.constants.ServerChannelOption, value, id);
      break;

    case bite.options.constants.Id.AUTO_RECORD:
    case bite.options.constants.Id.FEATURES_BUGS:
    case bite.options.constants.Id.FEATURES_RPF:
    case bite.options.constants.Id.FEATURES_TESTS:
      bite.options.data.validateCheckbox_(value, id);
      break;

    default:
      // If the id is invalid throw an exception.
      throw 'ERROR: Validation failed - invalid option ' +
            bite.options.constants.Id[id] + '.';
  }

  return value;
};


/**
 * Validates an enum.
 * @param {Object} enumToTest The enum that the value should be in.
 * @param {string} value The value to validate.
 * @param {bite.options.constants.Id} id The option.
 * @private
 */
bite.options.data.validateEnum_ = function(enumToTest, value, id) {
  // If the enum under test does not contain the value then throw an exception.
  if (!goog.object.containsValue(enumToTest, value)) {
    throw 'ERROR: Invalid value (' + value + ') for option ' + id + '.';
  }
};


/**
 * Validates a checkbox.
 * @param {string} value The value to validate.
 * @param {bite.options.constants.Id} id The option.
 * @private
 */
bite.options.data.validateCheckbox_ = function(value, id) {
  if (value != 'true' && value != 'false') {
    throw 'ERROR: Invalid value (' + value + ') for option ' + id + '.';
  }
};

