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
 * @fileoverview Defines type information related to the Bugs API.
 *
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('bugs.type');


/**
 * Defines the bug details retrieved from the server.
 * @typedef {{key: number,        // Required aftr bug is filed.
 *            title: string,
 *            status: string,
 *            state: string,
 *            url: string,
 *            summary: string,
 *            provider: string,
 *            bug_id: string,
 *            author: string,
 *            project: string,
 *            priority: string,
 *            details_link: string}}
 */
bugs.type.Bug;


/**
 * Defines the data returned when requesting bugs by url.
 * @typedef {Array.<{url: string, bugs: !Array.<bugs.type.Bug>}>}
 */
bugs.type.UrlBugMap;


/**
 * Callback used by create and update handlers.
 *
 * Called upon completion of the get request.  The object passed to the
 * callback will return the success of the request.  Depending on the success
 * the object will contain either an error property describing what went wrong
 * or an object containing the data for the requested bug.
 *
 * @typedef{function(!{success: boolean, error: string, bug: bugs.type.Bug})}
 */
bugs.type.callbackReturnBug;


/**
 * Callback used by create and update handlers.
 *
 * Called upon completion of the create or update request.  The object passed
 * to the callback will return the success of the request.  Depending on the
 * success the object will contain either an error property describing what
 * went wrong or a number representing the key of the bug created or updated.
 *
 * @typedef{function(!{success: boolean, error: string, key: number})}
 */
bugs.type.callbackReturnKey;


/**
 * Callback used by the urls handlers.
 *
 * Called upon completion of the urls request.  The object passed to the
 * callback will return the success of the request.  Depending on the success
 * the object will contain either an error property describing what went wrong
 * or an object containing the data for the requested bug.
 *
 * @typedef{function(!{success: boolean, error: string,
 *                     bugMap: bugs.type.UrlBugMap})}
 */
bugs.type.callbackReturnUrlBugMap;
