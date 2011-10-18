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
 * @fileoverview  Handles login interactions between the
 * bite client and the server.
 *
 * @author michaelwill@google.com (Michael Williamson)
 */


goog.provide('bite.LoginManager');

goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.string');



/**
 * Singleton class for handling interactions with the server.
 * @constructor
 * @export
 */
bite.LoginManager = function() {};
goog.addSingletonGetter(bite.LoginManager);


/**
 * Url used to check the login status of the current user.
 * @type {string}
 * @private
 */
bite.LoginManager.CHECK_LOGIN_STATUS_PATH_ = '/check_login_status';


/**
 * Retrieves the current user, checking the server on every
 * call.
 * @param {function({success: boolean, url: string, username: string})}
 *     callback A callback which will be invoked
 *     with a loginOrOutUrl that can be used by the client and optionally
 *     the username, if it exists.
 * @export
 */
bite.LoginManager.prototype.getCurrentUser = function(callback) {
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(bite.LoginManager.CHECK_LOGIN_STATUS_PATH_);

  bite.common.net.xhr.async.get(url.toString(),
      goog.bind(this.getCurrentUserCallback_, this, callback));
};


/**
 * Callback invoked when the getCurrentUser request finishes.
 * @param {function({success: boolean, url: string, username: string})}
 *     operationFinishedCallback A callback invoked on completion.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data from the request or an error string.
 * @private
 */
bite.LoginManager.prototype.getCurrentUserCallback_ =
    function(operationFinishedCallback, success, data) {
  var responseObj = null;

  try {
    if (!success) {
      throw '';
    }

    var response = goog.json.parse(data);

    var loginOrOutUrl = response['url'] || '';
    if (!goog.string.startsWith(loginOrOutUrl, 'http')) {
      // The dev appengine server returns a login url that is simply a path
      // on the current dev server url whereas production returns
      // a path that is a fully qualified url.
      var optionId = bite.options.constants.Id.SERVER_CHANNEL;
      var server = bite.options.data.get(optionId);
      loginOrOutUrl = server + loginOrOutUrl;
    }

    // TODO(michaelwill): We should probably cache this value in the future,
    // but the sync issues will require some thought.
    var username = response['user'] || '';

    responseObj = this.buildResponseObject_(true, loginOrOutUrl, username);
  } catch (e) {
    responseObj = this.buildResponseObject_(false, '', '');
  }

  operationFinishedCallback(responseObj);
};


/**
 * Helper utility that wraps up a response object.
 * @return {{success: boolean, url: string, username: string}}
 * @private
 */
bite.LoginManager.prototype.buildResponseObject_ = function(
    success, url, username) {
  return {
    'success': success,
    'url': url,
    'username': username
  };
};

