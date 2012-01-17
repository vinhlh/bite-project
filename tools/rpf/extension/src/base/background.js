// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview Background script containing code to handle tasks
 * invoked elsewhere in the extension code.
 *
 * @author alexto@google.com (Alexis O. Torres)
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.client.Background');

goog.require('Bite.Constants');
goog.require('bite.LoginManager');
goog.require('bite.common.net.xhr.async');
goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.userAgent');
goog.require('rpf.Rpf');



/**
 * The Background Class is a singleton that manages all of BITE's background
 * operations and data.
 * @constructor
 * @export
 */
bite.client.Background = function() {
  /**
   * @type {string}
   * @private
   */
  this.currentUser_ = '';

  /**
   * @type {bite.LoginManager}
   * @private
   */
  this.loginManager_ = bite.LoginManager.getInstance();

  /**
   * @type {rpf.Rpf}
   * @private
   */
  this.rpf_ = rpf.Rpf.getInstance();

  // If this is the first time a user opens BITE, log an event.
  var firstRun = (
      goog.global.localStorage.getItem(bite.client.Background.PREVIOUS_USE_KEY)
      != 'true');
  if (firstRun) {
    // Analytics may not be loaded, so delay the logging until after the
    // next batch of browser event processing.
    goog.Timer.callOnce(goog.partial(bite.client.Background.logEvent,
                                     'Background', 'FirstUse', ''), 0);
    goog.global.localStorage.setItem(bite.client.Background.PREVIOUS_USE_KEY,
                                     'true');
  }
};
goog.addSingletonGetter(bite.client.Background);


/**
 * Key used to keep track of first time use of BITE. The value of this key in
 * localStorage will be set to 'true' once the application is loaded for the
 * first time.
 * @type {string}
 */
bite.client.Background.PREVIOUS_USE_KEY = 'bite-client-background-previous-use';


/**
 * @return {rpf.Rpf} The RPF object.
 * @export
 */
bite.client.Background.prototype.getRpfObj = function() {
  return this.rpf_;
};


/**
 * Sets a new RPF object.
 * @param {rpf.Rpf} rpfObj The new RPF obj.
 * @export
 */
bite.client.Background.prototype.setRpfObj = function(rpfObj) {
  this.rpf_ = rpfObj;
};


/**
 * Gets a value from localStorage, or 'null' if no value is stored.
 * @param {string} key The localStorage key of the item.
 * @param {function(?string)} callback The function to call with the value
 *     from localStorage.
 * @private
 */
bite.client.Background.prototype.getLocalStorage_ = function(key, callback) {
  var data = /** @type {?string} */ (goog.global.localStorage.getItem(key));
  callback(data);
};


/**
 * Sets a value in localStorage.
 * @param {string} key The localStorage key to set.
 * @param {string} value The value to set into localStorage.
 * @param {function()} callback A function to callback.
 * @private
 */
bite.client.Background.prototype.setLocalStorage_ =
    function(key, value, callback) {
  goog.global.localStorage.setItem(key, value);
  callback();
};


/**
 * Removes a value in localStorage.
 * @param {string} key The localStorage key to remove.
 * @param {function()} callback A function to callback.
 * @private
 */
bite.client.Background.prototype.removeLocalStorage_ = function(key, callback) {
  goog.global.localStorage.removeItem(key);
  callback();
};


/**
 * Logs an instrumentation event. NOTE(alexto): This method assumes that
 * Google Analytics code is already loaded.
 * @param {string} category Main of the main feture serving the event.
 * @param {string} action Action that trigger the event.
 * @param {string} label Additional information to log about the action.
 * @export
 */
bite.client.Background.logEvent = function(category, action, label) {
  var gaq = goog.global['_gaq'];
  if (gaq) {
    gaq.push(['_trackEvent', category, action, label]);
  } else {
    console.warn('Google Analytics is not ready.');
  }
};


/**
 * Handles request sent via chrome.extension.sendRequest().
 * @param {!Object} request Object data sent in the request.
 * @param {MessageSender} sender An object containing information about the
 *     script context that sent the request.
 * @param {function(!*): void} callback Function to call when the request
 *     completes.
 * @export
 */
bite.client.Background.prototype.onRequest =
    function(request, sender, callback) {
  // If the request contains a command or the request does not handle requests
  // from the specified request's owner then do nothing (i.e. don't process
  // this request).
  if (request['command']) {
    return;
  }

  switch (request['action']) {
    case Bite.Constants.HUD_ACTION.GET_LOCAL_STORAGE:
      this.getLocalStorage_(request['key'], callback);
      break;
    case Bite.Constants.HUD_ACTION.SET_LOCAL_STORAGE:
      this.setLocalStorage_(request['key'], request['value'], callback);
      break;
    case Bite.Constants.HUD_ACTION.REMOVE_LOCAL_STORAGE:
      this.removeLocalStorage_(request['key'], callback);
      break;
    case Bite.Constants.HUD_ACTION.LOG_EVENT:
      bite.client.Background.logEvent(
          request['category'], request['event_action'], request['label']);
      break;
    case Bite.Constants.HUD_ACTION.CREATE_RPF_WINDOW:
      this.rpf_.setUserId(request['userId']);
      this.rpf_.createWindow();
      break;
    case Bite.Constants.HUD_ACTION.CHANGE_RECORD_TAB:
      this.rpf_.focusRpf();
      break;
    case Bite.Constants.HUD_ACTION.GET_CURRENT_USER:
      this.loginManager_.getCurrentUser(callback);
      break;
    default:
      throw new Error('The specified action is not valid: ' +
                      request['action']);
  }
};


// Wire up the listener.
chrome.extension.onRequest.addListener(
    goog.bind(bite.client.Background.getInstance().onRequest,
              bite.client.Background.getInstance()));

