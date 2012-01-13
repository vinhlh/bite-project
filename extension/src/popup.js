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
 * @fileoverview This file contains the popup JS which opens the console.
 * @author michaelwill@google.com (Michael Williamson)
 */

goog.provide('bite.Popup');

goog.require('Bite.Constants');
goog.require('bite.client.Templates.popup');
goog.require('bite.client.messages');
goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.json');
goog.require('goog.string');
goog.require('goog.ui.ToggleButton');



/**
 * Constructs a singleton popup instance.
 * Note that init() must be called on the instance
 * before it's usable.
 * @constructor
 * @export
 */
bite.Popup = function() {
  /**
   * Records the extension version.
   * @type {string}
   * @private
   */
  this.browserVersion_ = 'NaN';

  /**
   * This value will be true when the asynchronous initialization has finished.
   * @type {boolean}
   * @private
   */
  this.initComplete_ = false;


  /**
   * The user id.
   * @type {string}
   * @private
   */
  this.userId_ = '';

  /**
   * The last error message recorded.  This is only valid if initComplete_ is
   * false.
   * @type {string}
   * @private
   */
  this.lastError_ = 'Not initialized.';
};
goog.addSingletonGetter(bite.Popup);


/**
 * Css class used by each menu item.
 * @type {string}
 * @private
 */
bite.Popup.POPUP_ITEM_ROW_CLASS_ = 'menuitem-row';


/**
 * Each of these options is displayed in the
 * bite popup, and each should have a corresponding
 * entry in the onclick handler below.
 * @type {Object}
 * @private
 */
bite.Popup.CONSOLE_OPTIONS_ = {
  FLUX: {
    name: MSG_POPUP_OPTION_FLUX_NAME,
    img: '/imgs/popup/rpf_32.png',
    description: MSG_POPUP_OPTION_FLUX_DESC
  },
  REPORT_BUG: {
    name: MSG_POPUP_OPTION_REPORT_BUG_NAME,
    img: '/imgs/popup/new_bug_32.png',
    description: MSG_POPUP_OPTION_REPORT_BUG_DESC
  },
  BUGS: {
    name: MSG_POPUP_OPTION_BUGS_NAME,
    img: '/imgs/popup/bugs_32.png',
    description: MSG_POPUP_OPTION_BUGS_DESC
  },
  TESTS: {
    name: MSG_POPUP_OPTION_TEST_NAME,
    img: '/imgs/popup/tests_32.png',
    description: MSG_POPUP_OPTION_TEST_DESC
  },
  // TODO(ralphj): Make a dedicated close image.
  CLOSE: {
    name: MSG_POPUP_OPTION_CLOSE_NAME,
    img: '/imgs/bug-unknown-32.png',
    description: MSG_POPUP_OPTION_CLOSE_DESC
  },
  SETTINGS: {
    name: MSG_POPUP_OPTION_SETTINGS_NAME,
    img: '/imgs/popup/help_32.png',
    description: MSG_POPUP_OPTION_SETTINGS_DESC
  }
};


/**
 * Installs onclick event handlers on each menu item.
 * @private
 */
bite.Popup.prototype.installEventHandlers_ = function() {
  var menuElements = goog.dom.getElementsByTagNameAndClass(
      'tr', bite.Popup.POPUP_ITEM_ROW_CLASS_);

  for (var i = 0; i < menuElements.length; i++) {
    var el = menuElements[i];
    var optionName = el.title;
    goog.events.listen(el, goog.events.EventType.CLICK,
                       goog.bind(this.onClickCallback_, this, optionName));
  }
};


/**
 * Returns the initialization status.
 * @return {boolean} Whether or not initialization has finished.
 * @export
 */
bite.Popup.prototype.getInitComplete = function() {
  return this.initComplete_;
};


/**
 * Return the last recorded error message for this object.
 * @return {string} The last recorded error message or an empty string if there
 *     is no valid error.
 * @export
 */
bite.Popup.prototype.getLastError = function() {
  return this.lastError_;
};


/**
 * Returns the version of the currently installed extension.
 * @return {string} The version of the extension.
 * @export
 */
bite.Popup.prototype.getVersion = function() {
  return this.browserVersion_;
};


/**
 * Initializes the popup instance by checking the login status
 * of the user and rendering the appropriate soy template.
 * @param {function()=} opt_initCallback An optional callback
 *     that is invoked when initialization is finished.
 * @export
 */
bite.Popup.prototype.init = function(opt_initCallback) {
  var callback = opt_initCallback || goog.nullFunction;

  if (this.initComplete_) {
    callback();
    return;
  }

  var body = goog.dom.getDocument().body;
  soy.renderElement(body, bite.client.Templates.popup.loading);

  this.initData_(callback);
};


/**
 * Initializes data necessary for the functioning of this object.
 * @param {function()} callback The callback to invoke when initialization
 *     is complete.
 * @private
 */
bite.Popup.prototype.initData_ = function(callback) {
  var url = chrome.extension.getURL('manifest.json');
  console.log('initData_: url='+url);
  bite.common.net.xhr.async.get(url,
      goog.bind(this.initDataComplete_, this, callback));
};


/**
 * Async callback that gathers data before the final rendering of the popup.
 * @param {function()} callback The callback to invoke when initialization
 *     is complete.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data retrieved from the request or an error string.
 * @private
 */
bite.Popup.prototype.initDataComplete_ = function(callback, success, data) {
  try {
    if (!success) {
      throw data;
    }

    var manifest = goog.json.parse(data);
    this.browserVersion_ = manifest['version'];
  } catch (error) {
    this.browserVersion_ = '';
    console.error('Popup [initDataComplete_]: Failed retrieval of version; ' +
                  'setting to "unknown" and continuing.');
  }

  this.initLogin_(callback);
};


/**
 * Performs the login initialization process.
 * @param {function()} callback The callback to invoke when initialization
 *     is complete.
 * @private
 */
bite.Popup.prototype.initLogin_ = function(callback) {
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.GET_CURRENT_USER},
      goog.bind(this.initLoginComplete_, this, callback));
};


/**
 * Async callback used when the user login status request has finished.
 * @param {function()} callback The callback to invoke when initialization
 *     is complete.
 * @param {{success: boolean, username: string, url: string}} responseObj
 *     An object that contains the login
 *     or logout url and optionally the username of the user.
 * @private
 */
bite.Popup.prototype.initLoginComplete_ = function(callback, responseObj) {
  // Should only occur if LoginManager fails.
  if (!responseObj) {
    console.error('Popup [initLoginComplete_]: LoginManager failed to ' +
                  'provide a valid response.');
    responseObj = {'success': false, 'username': '', 'url': ''};
  }

  var consoleOptions = [];
  // Only display console options if logged in.
  if (responseObj['success']) {
    // Flatten the object into an array.
    // Alias for bite.options.data namespace
    var data = bite.options.data;
    for (var key in bite.Popup.CONSOLE_OPTIONS_) {
      var display = false;
      switch (key) {
        case 'BUGS':
          if (data.get(bite.options.constants.Id.FEATURES_BUGS) == 'true') {
            display = true;
          }
          break;
        case 'FLUX':
          if (data.get(bite.options.constants.Id.FEATURES_RPF) == 'true') {
            display = true;
          }
          break;
        case 'TESTS':
          if (data.get(bite.options.constants.Id.FEATURES_TESTS) == 'true') {
            display = true;
          }
          break;
        case 'REPORT_BUG':
          if (data.get(bite.options.constants.Id.FEATURES_REPORT) == 'true') {
            display = true;
          }
          break;
        case 'CLOSE':
          if (data.get(bite.options.constants.Id.FEATURES_CLOSE) == 'true') {
            display = true;
          }
          break;
        default:
          display = true;
      }
      if (display) {
        consoleOptions.push(bite.Popup.CONSOLE_OPTIONS_[key]);
      }
    }
  }

  var body = goog.dom.getDocument().body;
  soy.renderElement(body, bite.client.Templates.popup.all, {
    version: this.getVersion(),
    username: responseObj['username'],
    consoleOptions: consoleOptions,
    url: responseObj['url']
  });
  this.installEventHandlers_();
  this.initComplete_ = true;
  // TODO (jaosn.stredwick): Remove cast to 'unknown user'.  It is legacy
  // for RPF code.  Instead RPF should be converted to get the user itself
  // directly rather than from the popup.
  this.userId_ = responseObj['username'] || 'unknown user';
  callback();
};


/**
 * A callback used when the popup menu is clicked on.
 * @param {string} optionName The name of the option that was clicked on.
 * @private
 */
bite.Popup.prototype.onClickCallback_ = function(optionName) {
  switch (optionName) {
    case bite.Popup.CONSOLE_OPTIONS_.REPORT_BUG.name:
      chrome.extension.sendRequest(
          {'action': Bite.Constants.HUD_ACTION.START_NEW_BUG});
      break;

    case bite.Popup.CONSOLE_OPTIONS_.BUGS.name:
      chrome.extension.sendRequest(
          {'action': Bite.Constants.HUD_ACTION.TOGGLE_BUGS});
      break;

    case bite.Popup.CONSOLE_OPTIONS_.TESTS.name:
      chrome.extension.sendRequest(
          {'action': Bite.Constants.HUD_ACTION.TOGGLE_TESTS});
      break;

    case bite.Popup.CONSOLE_OPTIONS_.CLOSE.name:
      chrome.extension.sendRequest(
          {'action': Bite.Constants.HUD_ACTION.HIDE_ALL_CONSOLES});
      break;

    case bite.Popup.CONSOLE_OPTIONS_.FLUX.name:
      chrome.extension.sendRequest(
          {'action': Bite.Constants.HUD_ACTION.CREATE_RPF_WINDOW,
           'userId': this.userId_});
      break;

    case bite.Popup.CONSOLE_OPTIONS_.SETTINGS.name:
      chrome.tabs.create({'url': Bite.Constants.getOptionsPageUrl()});
      break;

    default:
      // TODO (jasonstredwick): Examine throw as I suspect that this callback
      // is only invoked from DOM Element interaction which means that
      // catching this exception is outside of BITE's ability as it should be
      // in the global scope.
      throw Error('Not a valid popup option: ' + optionName);
  }
  goog.global.close();
};

