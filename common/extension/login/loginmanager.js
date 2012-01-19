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
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.string');



/**
 * Singleton class for handling interactions with the server.
 * @constructor
 * @export
 */
bite.LoginManager = function() {
  /**
   * The current logged in user.
   * @type {string}
   * @private
   */
  this.username_ = '';

  /**
   * The login or out url.
   * @type {string}
   * @private
   */
  this.loginOrOutUrl_ = '';
};
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
 * @param {string} server The server URL.
 * @export
 */
bite.LoginManager.prototype.getCurrentUser = function(callback, server) {
  if (this.username_) {
    // If the username exists, no need to send an additional ping to server,
    // if the sync issue happens, we should periodically ping server to
    // refresh.
    callback(this.buildResponseObject_(
        true, this.loginOrOutUrl_, this.username_));
    return;
  }
  var url = goog.Uri.parse(server);
  url.setPath(bite.LoginManager.CHECK_LOGIN_STATUS_PATH_);

  bite.common.net.xhr.async.get(url.toString(),
      goog.bind(this.getCurrentUserCallback_, this, callback, server));
};


/**
 * Callback invoked when the getCurrentUser request finishes.
 * @param {function({success: boolean, url: string, username: string})}
 *     operationFinishedCallback A callback invoked on completion.
 * @param {string} server The server URL.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data from the request or an error string.
 * @private
 */
bite.LoginManager.prototype.getCurrentUserCallback_ =
    function(operationFinishedCallback, server, success, data) {
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
      loginOrOutUrl = server + loginOrOutUrl;
    }

    this.username_ = response['user'] || '';
    this.loginOrOutUrl_ = loginOrOutUrl;

    responseObj = this.buildResponseObject_(
        true, loginOrOutUrl, this.username_);
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

