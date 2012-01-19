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
goog.require('bugs.kind');
goog.require('goog.Uri.QueryData');


/**
 * The handlers provided by the Bugs API.
 * @enum {string}
 * @private
 */
bugs.api.Handler_ = {
  CREATE: 'bugs',    // Handler: /bugs
  GET: 'bugs/',      // Handler: /bugs/\d+
  UPDATE: 'bugs/',   // Handler: /bugs/\d+
  URLS: 'bugs/urls'  // Handler: /urls
};


/**
 * Create a bug.
 * Assumption: bug is a valid object.
 * @param {!bugs.kind.Bug} bug The bug details to used to create the bug.
 * @param {bugs.kind.callbackReturnId=} opt_callback See details for the
 *     callbackReturnId type.
 */
bugs.api.create = function(bug, opt_callback) {
  opt_callback = opt_callback || function() {};
  try {
    var url = bugs.api.constructUrl_(bugs.api.Handler_.CREATE);
    bug['kind'] = bugs.kind.Kind.BUG;
    var data = JSON.stringify(bug);
    var callback = goog.partial(bugs.api.wrapperForId_,
        /** @type {function(boolean, string, number)} */ (opt_callback));
    var headers = {'Content-Type': 'application/json'};
    bite.common.net.xhr.async.post(url, data, callback, headers);
  } catch (error) {
    var msg = 'bugs.api.create failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Get a bug.
 * @param {number} id The id of the bug to retrieve.
 * @param {bugs.kind.callbackReturnBug=} opt_callback See details for the
 *     callbackReturnBug.
 */
bugs.api.get = function(id, opt_callback) {
  opt_callback = opt_callback || function() {};
  try {
    var url = bugs.api.constructUrl_(bugs.api.Handler_.GET + id);
    var callback = goog.partial(bugs.api.wrapperForBug_,
        /** @type {function(boolean, string, number)} */ (opt_callback));
    bite.common.net.xhr.async.get(url, callback);
  } catch (error) {
    var msg = 'bugs.api.get failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Update a bug.
 * Assumption: bug is a valid object containing a property 'id' with either a
 * a numeric value or a string convertable into a numeric value.
 * @param {!bugs.kind.Bug} bug The bug details to update.
 * @param {bugs.kind.callbackReturnId=} opt_callback See details for the
 *     callbackReturnId type.
 */
bugs.api.update = function(bug, opt_callback) {
  opt_callback = opt_callback || function() {};
  try {
    var url = bugs.api.constructUrl_(bugs.api.Handler_.UPDATE + bug['id']);
    if (!('kind' in bug)) {
      bug['kind'] = bugs.kind.Kind.BUG;
    }
    var data = JSON.stringify(bug);
    var callback = goog.partial(bugs.api.wrapperForId_,
        /** @type {function(boolean, string, number)} */ (opt_callback));
    var headers = {'Content-Type': 'application/json'};
    bite.common.net.xhr.async.put(url, data, callback, headers);
  } catch (error) {
    var msg = 'bugs.api.update failed; ' + error;
    opt_callback && opt_callback({success: false, error: msg});
  }
};


/**
 * Requests a set of bugs by url.
 * @param {!Array.<string>} target_urls The url to get bugs for.
 * @param {bugs.kind.callbackReturnUrlBugMap=} opt_callback See details for the
 *     callbackReturnUrlBugMap type.
 */
bugs.api.urls = function(target_urls, opt_callback) {
  opt_callback = opt_callback || function() {};
  try{
    var url = bugs.api.constructUrl_(bugs.api.Handler_.URLS);
    var data = JSON.stringify({'kind': bugs.kind.Kind.URLS,
                               'urls': target_urls});
    var callback = goog.partial(bugs.api.wrapperForUrlBugMap_,
        /** @type {function(boolean, string, number)} */ (opt_callback));
    var headers = {'Content-Type': 'application/json'};
    bite.common.net.xhr.async.post(url, data, callback, headers);
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
bugs.api.constructUrl_ = function(path) {
  var url = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  return url + (url[url.length - 1] == '/' ? '' : '/') + path;
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.kind.callbackReturnBug} callback See details for the
 *     callbackReturnBug type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForBug_ = function(callback, success, data) {
  try {
    if (success) {
      var bug = /** @type {bugs.kind.Bug} */ (JSON.parse(data));
      if (!('kind' in bug)) {
        throw 'Missing kind information';
      } else if (bug['kind'] != bugs.kind.Kind.BUG) {
        throw 'Invalid kind; [kind=' + bug['kind'] + ']';
      }

      callback && callback({success: true, bug: bug});
    } else {
      throw data; // Contains error message from server.
    }
  } catch (error) {
    var msg = 'Invalid bug data received; ' + error;
    callback && callback({success: false, error: msg});
  }
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.kind.callbackReturnId} callback See details for the
 *     callbackReturnId type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForId_ = function(callback, success, data) {
  try {
    if (success) {
      var id_data = /** @type {bugs.kind.Id} */ (JSON.parse(data));
      if (!('kind' in id_data)) {
        throw 'Missing kind information';
      } else if (id_data['kind'] != bugs.kind.Kind.ID) {
        throw 'Invalid kind; [kind=' + id_data['kind'] + ']';
      }

      var id = /** @type {number} */ (id_data['id']);
      callback && callback({success: true, id: id});
    } else {
      throw data; // Contains error message from server.
    }
  } catch (error) {
    var msg = 'Invalid id data received; ' + error;
    callback && callback({success: false, error: msg});
  }
};


/**
 * Wraps the user-defined callback to ensure the return of an object with the
 * proper data and type information.
 * @param {bugs.kind.callbackReturnUrlBugMap} callback See details for the
 *     callbackReturnUrlBugMap type.
 * @param {boolean} success Whether or not the request was a success.
 * @param {string} data The error message or data string returned from server.
 * @private
 */
bugs.api.wrapperForUrlBugMap_ = function(callback, success, data) {
  try {
    if (success) {
      var bugMap = /** @type {bugs.kind.UrlBugMap} */ (JSON.parse(data));
      if (!('kind' in bugMap)) {
        throw 'Missing kind information';
      } else if (bugMap['kind'] != bugs.kind.Kind.URL_BUG_MAP) {
        throw 'Invalid kind; [kind=' + bugMap['kind'] + ']';
      }
      callback && callback({success: true, bugMap: bugMap});
    } else {
      throw data; // Contains error message from server.
    }
  } catch (error) {
    var msg = 'Invalid UrlBugMap data received; ' + error;
    callback && callback({success: false, error: msg});
  }
};
