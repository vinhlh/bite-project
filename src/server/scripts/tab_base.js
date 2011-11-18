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
 * @fileoverview This file contains the tab base class, which is the
 * base class for all the tabs in details page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.set.Tab');



/**
 * A class for set tab functions.
 * @param {Function} getKeyFunc The getter for set's key.
 * @constructor
 * @export
 */
bite.server.set.Tab = function(getKeyFunc) {
  this.getKeyFunc = getKeyFunc;
};


/**
 * Saves the previous page settings.
 * @export
 */
bite.server.set.Tab.prototype.saveSetting = function() {
};


/**
 * Inits the UI.
 * @export
 */
bite.server.set.Tab.prototype.init = function() {
};


/**
 * Sets the default properties.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Tab.prototype.setProperties = function(params) {
};


/**
 * Adds the properties to the given map.
 * @param {Object} params The parameter map.
 * @export
 */
bite.server.set.Tab.prototype.addProperties = function(params) {
};
