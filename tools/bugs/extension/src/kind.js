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
 * @fileoverview Defines kind information related to the Bugs API.
 *
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('bugs.kind');


/**
 * @enum {string}
 */
bugs.kind.Kind = {
  BUG: 'bugs#bug',
  ID: 'bugs#id',
  URL_BUG_MAP: 'bugs#url-bug-map',
  URLS: 'bugs#urls'
};


/**
 * kind: bugs.kind.Kind // BUG
 * id: number // Required aftr bug is filed.
 * @typedef {{kind: bugs.kind.Kind,
 *            id: number,
 *            title: string,
 *            status: string,
 *            state: string,
 *            url: string,
 *            summary: string,
 *            added: string,
 *            modified: string,
 *            provider: string,
 *            bug_id: string,
 *            author: string,
 *            author_id: string,
 *            reported_on: string,
 *            last_update: string,
 *            last_updater: string,
 *            project: string,
 *            priority: string,
 *            details_link: string,
 *            has_target_element: boolean,
 *            target_element: string,
 *            has_screenshot: boolean,
 *            screenshot: string,
 *            has_recording: boolean,
 *            recording: string}}
 */
bugs.kind.Bug;


/**
 * kind: bugs.kind.Kind // ID
 * @typedef {{kind: bugs.kind.Kind,
 *            id: number}}
 */
bugs.kind.Id;


/**
 * kind: bugs.kind.Kind // URL_BUG_MAP
 * @typedef {{kind: bugs.kind.Kind,
 *            mappings: !Array.<{url: string, bugs: !Array.<bugs.kind.Bug>}>}}
 */
bugs.kind.UrlBugMap;


/**
 * kind: bugs.kind.Kind // URLS
 * @typedef {{kind: bugs.kind.Kind,
 *            urls: !Array.<string>}}
 */
bugs.kind.Urls;


/**
 * Callback used by create and update handlers.
 *
 * Called upon completion of the get request.  The object passed to the
 * callback will return the success of the request.  Depending on the success
 * the object will contain either an error property describing what went wrong
 * or an object containing the data for the requested bug.
 *
 * @typedef{function(!{success: boolean, error: *, bug: *})}
 */
bugs.kind.callbackReturnBug;


/**
 * Callback used by create and update handlers.
 *
 * Called upon completion of the create or update request.  The object passed
 * to the callback will return the success of the request.  Depending on the
 * success the object will contain either an error property describing what
 * went wrong or a number representing the id of the bug created or updated.
 *
 * @typedef{function(!{success: boolean, error: *, id: *})}
 */
bugs.kind.callbackReturnId;


/**
 * Callback used by the urls handlers.
 *
 * Called upon completion of the urls request.  The object passed to the
 * callback will return the success of the request.  Depending on the success
 * the object will contain either an error property describing what went wrong
 * or an object containing the data for the requested bug.
 *
 * @typedef{function(!{success: boolean, error: *,
 *                     bugMap: *})}
 */
bugs.kind.callbackReturnUrlBugMap;
