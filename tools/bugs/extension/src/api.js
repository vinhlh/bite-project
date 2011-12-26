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
 * @fileoverview Defines the client calls to the Bugs API.
 *
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('bugs.api');

goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('bugs.type');


/**
 * The handlers provided by the Bugs API.
 * @enum {string}
 * @private
 */
bugs.api.Handler_ = {
  CREATE: 'bugs',  // Handler: /bugs
  GET: 'bugs/',    // Handler: /bugs/\d+
  UPDATE: 'bugs/', // Handler: /bugs/\d+
  URLS: 'urls'     // Handler: /urls
};


/**
 * Create a bug.
 * Assumption: bug is a valid object.
 * @param {!bugs.type.Bug} bug The bug details to used to create the bug.
 * @param {bugs.type.callbackReturnKey=} opt_callback See details for the
 *     callbackReturnKey type.
 */
bugs.api.create = function(bug, opt_callback) {
  try {
    var url = bite.api.constructUrl_(bugs.api.Handler_.CREATE);
    var parameters = '{"data_json_str":' + JSON.stringify(bug) + '}';
    var callback = goog.partial(bugs.api.wrapperForKey_, opt_callback);
    bite.common.net.xhr.async.post(url, parameters, callback);
  } catch (error) {
    var msg = 'bugs.api.create failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Get a bug.
 * @param {number} key The key of the bug to retrieve.
 * @param {bugs.type.callbackReturnBug=} opt_callback See details for the
 *     callbackReturnBug.
 */
bugs.api.get = function(bug, opt_callback) {
  try {
    var url = bite.api.constructUrl_(bugs.api.Handler_.GET + key);
    var callback = goog.partial(bugs.api.wrapperForBug_, opt_callback);
    bite.common.net.xhr.async.get(url, callback);
  } catch (error) {
    var msg = 'bugs.api.get failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Update a bug.
 * Assumption: bug is a valid object containing a property 'key' with either a
 * a numeric value or a string convertable into a numeric value.
 * @param {!bugs.type.Bug} bug The bug details to update.
 * @param {bugs.type.callbackWithKey=} opt_callback See details for the
 *     callbackReturnKey type.
 */
bugs.api.update = function(bug, opt_callback) {
  try {
    var url = bite.api.constructUrl_(bugs.api.Handler_.UPDATE + bug['key']);
    var parameters = '{"data_json_str":' + JSON.stringify(bug) + '}';
    var callback = goog.partial(bugs.api.wrapperForKey_, opt_callback);
    bite.common.net.xhr.async.put(url, parameters, callback);
  } catch (error) {
    var msg = 'bugs.api.update failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Requests a set of bugs by url.
 * @param {!Array.<string>} target_urls The url to get bugs for.
 * @param {bugs.type.callbackReturnUrlBugMap=} opt_callback See details for the
 *     callbackReturnUrlBugMap type.
 */
bugs.api.urls = function(target_url, opt_callback) {
  try{
    var url = bite.api.constructUrl_(bugs.api.Handler_.URLS);
    var parameters = '{"data_json_str":' + JSON.stringify(target_url) + '}';
    var callback = goog.partial(bugs.api.wrapperForUrlBugMap_, opt_callback);
    bite.common.net.xhr.async.post(url, parameters, callback);
  } catch (error) {
    var msg = 'bugs.api.urls failed: ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Constructs the url to the server using the given path.
 * @param {string} path The path from the server.
 * @returns {string} The server url including the path to the handler.
 * @private
 */
bite.api.constructUrl_ = function(path) {
  return bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL) +
         (url[url.length - 1] == '/' ? '' : '/') +
         path;
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.type.callbackReturnBug=} opt_callback See details for the
 *     callbackReturnBug type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForBug_ = function(opt_callback, success, data) {
  try {
    if (success) {
      var bug = /** @type {bugs.type.Bug} */ (JSON.parse(data));
      opt_callback && opt_callback({success: true, bug: bug});
    } else {
      throw data;
    }
  } catch (error) {
    opt_callback && opt_callback({success: false, error: error});
  }
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.type.callbackReturnKey=} opt_callback See details for the
 *     callbackReturnKey type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForKey_ = function(opt_callback, success, data) {
  if (success) {
    opt_callback && opt_callback({success: true,
                                  key: /** @type {number} */ (data)});
  } else {
    opt_callback && opt_callback({success: false, error: data});
  }
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.type.callbackReturnUrlBugMap=} opt_callback See details for the
 *     callbackReturnUrlBugMap type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForUrlBugMap_ = function(opt_callback, success, data) {
  try {
    if (success) {
      var bugMap = /** @type {bugs.type.UrlBugMap} */ (JSON.parse(data));
      opt_callback && opt_callback({success: true, bugMap: bugMap});
    } else {
      throw data;
    }
  } catch (error) {
    opt_callback && opt_callback({success: false, error: error});
  }
};
