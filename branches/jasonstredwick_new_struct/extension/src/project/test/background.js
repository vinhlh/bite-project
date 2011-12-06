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
 * @fileoverview Unifies the bite.project subsystem within the context of a
 * background script.  The constructor as a the initializer for the subsystem
 * causes the rest of the system to initialize.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.Background');



/**
 * Constructs an object that manages the project UX within the background.
 * @constructor
 * @export
 */
bite.project.Background = function() {
};
goog.addSingletonGetter(bite.project.Background);


/**
 * Handles messages for the project subsystem and redirects as appropriate.
 * @param {!Object} request The data sent.
 * @param {MessageSender} sender An object containing information about the
 *     script context that sent the request.
 * @param {function(!*): void} response Optional function to call when the
 *     request completes; only call when appropriate.
 * @private
 */
bite.project.Background.prototype.onRequest_ =
    function(request, sender, response) {
};


/**
 * Create the content instance to initialize the project subsystem in the
 * context of a content script.
 */
bite.project.Background.getInstance();

