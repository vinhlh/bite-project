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
 * @fileoverview This file contains the bite server page's base object.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.Page');



/**
 * A base class for bite server's page object.
 * @constructor
 * @export
 */
bite.server.Page = function() {
};


/**
 * Inits the page object.
 * @param {Object} paramsMap The params map of the url hash.
 * @export
 */
bite.server.Page.prototype.init = function(paramsMap) {
};


/**
 * Destroys the page object.
 * @export
 */
bite.server.Page.prototype.destroy = function() {
};
