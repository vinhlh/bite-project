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
goog.require('bite.client.BugTemplate');
goog.require('bite.client.TemplateManager');
goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.userAgent');
goog.require('rpf.MiscHelper');
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
   * The template manager controls loading Bug Templates from the server.
   * It will load templates directly from the server upon the first request,
   * then cache those values.
   * @type {bite.client.TemplateManager}
   * @private
   */
  this.templateManager_ = bite.client.TemplateManager.getInstance();

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

/**
 * URL path for the "get bugs for URL" API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.fetchBugsApiPath_ =
    '/get_bugs_for_url';


/**
 * URL path for the get bugs API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.getBugApiPath_ =
    '/bugs/get';


/**
 * URL path for the "update bug status" API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.bugsUpdateStatusApiPath_ =
    '/bugs/update_status';


/**
 * URL path for the "update bug binding" API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.bugsUpdateBindingApiPath_ =
    '/bugs/update_binding';


/**
 * URL path for the "update bug recording" API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.bugsUpdateRecordingApiPath_ =
    '/bugs/update_recording';


/**
 * URL path for the "get test assigned to me" API.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.fetchTestsApiPath_ =
    '/get_my_compat_test';


/**
 * The API path for submitting a test result.
 * @type {string}
 * @private
 */
bite.client.Background.prototype.submitTestResultApiPath_ =
    '/compat/test';


/**
 * Enum of events handled by the Background script.
 * @enum {string}
 * @export
 */
bite.client.Background.FetchEventType = {
  FETCH_BEGIN: 'fetchbegin',
  FETCH_END: 'fetchend'
};



/**
 * Gets the fetch bugs URL.
 * @param {string} targetUrl URL to fetch bugs for.
 * @return {string} URL to the HUD API containing the targetUrl
 *     as an encoded parameter.
 * @private
 */
bite.client.Background.prototype.getFetchBugsUrl_ = function(targetUrl) {
  var queryData = goog.Uri.QueryData.createFromMap(
      {'target_url': targetUrl});

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var result = goog.Uri.parse(server);
  result.setPath(this.fetchBugsApiPath_);
  result.setQueryData(queryData);

  return result.toString();
};


/**
 * Updates the extension's badge.
 * @param {Tab} tab Tab requesting the bugs list.
 * @param {Object} request Object data sent in the request.
 * @private
 */
bite.client.Background.prototype.updateBadge_ = function(tab, request) {
  var text = null;
  switch (request['action']) {
    case bite.client.Background.FetchEventType.FETCH_BEGIN:
      text = '...';
      break;
    case bite.client.Background.FetchEventType.FETCH_END:
      var count = request['count'];
      text = count.toString();
      break;
    default:
      throw new Error('The specified action is not valid: ' +
                      request['action']);
  }

  chrome.browserAction.setBadgeText({'text': text,
                                     'tabId': tab.id});
};


/**
 * Gets tests for a given web page.
 * @param {Tab} tab Tab requesting the tests list.
 * @param {function(!*): void} callback Function to call with the list of tests.
 * @private
 */
bite.client.Background.prototype.fetchTestData_ =
    function(tab, callback) {
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var testUrl = goog.Uri.parse(server).setPath(
      this.fetchTestsApiPath_).toString();

  bite.common.net.xhr.async.get(testUrl,
      goog.bind(this.fetchTestsDataCallback_, this, callback));
};


/**
 * Handle the callback to fetch the tests request.
 * @param {function({test: ?Object, user: ?string})} callback
 *     Callback function.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data received from the request or an error string.
 * @private
 */
bite.client.Background.prototype.fetchTestsDataCallback_ =
    function(callback, success, data) {
  var test = null;
  var user = null;

  if (success) {
    var compatTesting = goog.json.parse(data);
    test = compatTesting['test'];
    user = compatTesting['user'];
    this.currentUser_ = user;
  } else {
    console.log('Failed to fetch tests: ' + data);
  }

  callback({'test': test,
            'user': user});
};


/**
 * Gets bugs for a given webpage.
 * @param {Tab} tab Tab requesting the bugs list.
 * @param {function(!*): void} callback Function to call with the list of bugs.
 * @private
 */
bite.client.Background.prototype.fetchBugsData_ = function(tab, callback) {
  this.updateBadge_(
      tab, {'action': bite.client.Background.FetchEventType.FETCH_BEGIN});

  bite.common.net.xhr.async.get(this.getFetchBugsUrl_(tab.url),
      goog.bind(this.fetchBugsDataCallback_, this, tab, callback));
};


/**
 * Handles the response from the server to fetch bugs data.
 * @param {Tab} tab Tab requesting the bugs list.
 * @param {function({bugs: Object, filters: Object})} callback
 *     Callback function.
 * @param {boolean} success Whether the request was successful.
 * @param {string} data The data received by the request or an error string.
 * @private
 */
bite.client.Background.prototype.fetchBugsDataCallback_ =
    function(tab, callback, success, data) {
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  if (!success) {
    console.error('Failed to connect to server ' + server + ': ' + data);
  }

  var bugs = [];
  try {
    /**
     * Bugs is an array of arrays in the format:
     * [[urlPart, [bugs]], [urlPart, [bugs]]]
     * Where URL part is either the full URL, Hostname + Path, or Hostname,
     * of the target URL, and bugs is a list of bugs associated with the
     * given urlPart. For example:
     * [["www.google.com",
     *   [{"status": "duplicate", "project": "chromium",..}, ...]]]
     */
    bugs = goog.json.parse(data);
  } catch (error) {
    // One possible reason is the user hasn't logged in SSO yet.
    console.warn('The xmlhttp request failed because: ' + error);
    callback({'bugs': null, 'filters': null});
    return;
  }

  var length = 0;
  for (var i = 0; i < bugs.length; ++i) {
    // In order to count the number of bugs returned; for each result in the
    // format [urlPart, [bugs]] we need to agregate the bugs count, which
    // is the 2nd field in for each urlPart (index 1).
    length += bugs[i][1].length;
  }

  this.updateBadge_(
      tab, {'action': bite.client.Background.FetchEventType.FETCH_END,
            'count': length});

  callback({'filters': bite.options.data.getCurrentConfiguration(),
            'bugs': bugs});
};


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
 * Updates the data in the selected tab of Chrome.
 * @param {Tab} tab The created tab object.
 * @private
 */
bite.client.Background.prototype.updateData_ = function(tab) {
  this.sendRequestToTab_(Bite.Constants.HUD_ACTION.UPDATE_DATA, tab, 0);
};


/**
 * Hides the BITE consoles opened in all tabs/windows of Chrome.
 * @private
 */
bite.client.Background.prototype.hideAllConsoles_ = function() {
  chrome.windows.getAll({'populate': true},
                        goog.bind(this.hideAllConsolesInWindows_, this));
};


/**
 * Hides the BITE consoles found in the list windows provided.
 * @param {Array} windows An array of chrome.window objects.
 * @private
 */
bite.client.Background.prototype.hideAllConsolesInWindows_ = function(
    windows) {
  for (var i = 0; i < windows.length; i++) {
    for (var k = 0; k < windows[i].tabs.length; k++) {
      this.sendRequestToTab_(Bite.Constants.HUD_ACTION.HIDE_CONSOLE,
                             windows[i].tabs[k], 0);
    }
  }
};


/**
 * Sends the specified request to the content script running
 *     on the given tab.
 * @param {Bite.Constants.HUD_ACTION} action Action the content script
 *     needs to execute.
 * @param {Tab} tab Tab to toggle the visibility on.
 * @param {number} delay The number of milliseconds to wait before executing.
 * @private
 */
bite.client.Background.prototype.sendRequestToTab_ =
    function(action, tab, delay) {
  goog.Timer.callOnce(
      goog.bind(chrome.tabs.sendRequest, this, tab.id, {'action': action}),
      delay);
};


/**
 * Updates a Bug's status.
 * @param {Object} request Dictionary containing request details.
 * @param {function(!{success: boolean, error: string}): void} callback
 *     The callback function to call when done updating.
 * @private
 */
bite.client.Background.prototype.updateBugStatus_ = function(
    request, callback) {
  var queryParams = {'project': request['project'],
                     'provider': request['provider'],
                     'id': request['id'],
                     'comment': request['comment'],
                     'status': (request['status'] || '')};
  var queryData = goog.Uri.QueryData.createFromMap(queryParams);

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(this.bugsUpdateStatusApiPath_);

  bite.common.net.xhr.async.post(url.toString(), queryData.toString(),
      goog.bind(this.updateBugCallback_, this, callback));
};


/**
 * Updates a Bug's bindings.
 * @param {Object} request Dictionary containing request details.
 * @param {function(!{success: boolean, error: string}): void} callback
 *     The callback function to call when done updating.
 * @private
 */
bite.client.Background.prototype.updateBugBinding_ = function(
    request, callback) {
  var queryParams = {'project': request['project'],
                     'provider': request['provider'],
                     'id': request['id'],
                     'action': request['update_action'],
                     'target_element': (request['target_element'] || '')};
  var queryData = goog.Uri.QueryData.createFromMap(queryParams);

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(this.bugsUpdateBindingApiPath_);

  bite.common.net.xhr.async.post(url.toString(), queryData.toString(),
      goog.bind(this.updateBugCallback_, this, callback));
};


/**
 * Updates a Bug's recording.
 * @param {Object} request Dictionary containing request details.
 * @param {function(!{success: boolean, error: string}): void} callback
 *     The callback function to call when done updating.
 * @private
 */
bite.client.Background.prototype.updateBugRecording_ = function(
    request, callback) {
  var queryParams = {'project': request['project'],
                     'provider': request['provider'],
                     'id': request['id'],
                     'action': request['update_action'],
                     'recording_link': (request['recording_link'] || '')};
  var queryData = goog.Uri.QueryData.createFromMap(queryParams);

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(this.bugsUpdateRecordingApiPath_);

  bite.common.net.xhr.async.post(url.toString(), queryData.toString(),
      goog.bind(this.updateBugCallback_, this, callback));
};


/**
 * Handles update Bug's status server callback.
 * @param {function(!{success: boolean, error: string}): void} callback
 *     The callback function to call when done updating.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data returned by the request or an error string.
 * @private
 */
bite.client.Background.prototype.updateBugCallback_ =
    function(callback, success, data) {
  if (success) {
    var response = goog.json.parse(data);
    callback({'success': response['success'],
              'error': response['error'] || ''});
  } else {
    console.error('Updating bug request encountered: ' + data);
    callback({'success': false, 'error': data});
  }
};


/**
 * Get's bug data for a specific ID.
 * @param {Object} request Dictionary containing request details.
 * @param {function(!{success: boolean, data: Object}): void} callback
 * @private
 */
bite.client.Background.prototype.getBugData_ = function(
    request, callback) {
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(this.getBugApiPath_);
  url.setParameterValue('id', request['id']);
  url.setParameterValue('provider', request['provider']);
  bite.common.net.xhr.async.get(url.toString(),
      goog.bind(this.getBugDataCallback_, this, callback));
};


/**
 * Handles get bug data server callback.
 * @param {function(!{success: boolean, data: Object}): void} callback
 * @param {boolean} success Whether or not the request was successful.
 * @param {Object} data List of dictionaries containing bug data.
 * @private
 */
bite.client.Background.prototype.getBugDataCallback_ =
    function(callback, success, data) {
  // "data" will be a list of bugs found, typically only one issue should
  // be returned, but in the case of multiple bugs with the same ID simply
  // return the first.
  callback({'success': success, 'data': goog.json.parse(data)[0]});
};


/**
 * Gets a list of templates from the server. If the request contains a
 * url, gets the templates for that url. If no url is given, returns all
 * templates.
 * @param {Object} request Dictionary containing request details.
 * @param {function(Object.<string, bite.client.BugTemplate>)} callback
 *     A callback to call with the list of templates.
 * @private
 */
bite.client.Background.prototype.getTemplates_ = function(request, callback) {
  if (request.url) {
    this.templateManager_.getTemplatesForUrl(callback, request.url);
  } else {
    this.templateManager_.getAllTemplates(callback);
  }
};


/**
 * Sends the test result back to the server.
 * @param {Object} resultData Ojbect containg the result details.
 * @param {function(): void} callback Function to call after the result is
 *     sent.
 * @private
 */
bite.client.Background.prototype.logTestResult_ =
    function(resultData, callback) {
  var result = resultData['result'];
  var testId = resultData['testId'];
  var comments = resultData['comment'];
  var bugs = resultData['bugs'];
  var name = '';
  switch (result) {
    case Bite.Constants.TestResult.PASS:
      name = 'passResult';
      break;
    case Bite.Constants.TestResult.FAIL:
      name = 'failResult';
      break;
    case Bite.Constants.TestResult.SKIP:
      name = 'skip';
      break;
    default:
      console.error('Unrecognized test result: ' + result);
      break;
  }

  var queryParams = {'name': testId};
  if (bugs) {
    queryParams['bugs_' + testId] = bugs;
  }
  if (comments) {
    queryParams['comment_' + testId] = comments;
  }
  var queryData = goog.Uri.QueryData.createFromMap(queryParams);

  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(this.submitTestResultApiPath_);

  bite.common.net.xhr.async.post(url.toString(), queryData.toString(),
      goog.bind(this.logTestResultComplete_, this, callback));
};


/**
 * Fires when the log request completes.  Ignores request response.
 * @param {function(): void} callback Function to call after the result is
 *     sent.
 * @private
 */
bite.client.Background.prototype.logTestResultComplete_ = function(callback) {
  callback();
};


/**
 * Loads the content script into the specified tab.
 * @param {Tab} tab The tab to load the content_script into.
 * @private
 */
bite.client.Background.prototype.loadContentScript_ = function(tab) {
  // The content is dependent on the puppet script for element selection
  // in bug filing, so load it first.  Then load the content script.
  chrome.tabs.executeScript(tab.id, {file: 'content_script.js'});
};


/**
 * Ensure the BITE console content script has been loaded.
 * @param {Tab} tab The tab to ensure the content script is loaded in.
 * @private
 */
bite.client.Background.prototype.startEnsureContentScriptLoaded_ = function(
    tab) {
  // Create a script that checks for the BITE lock and sends a
  // loadContentScript command if it isn't there.  This intentionally
  // doesn't use closure due to not having the closure libraries available
  // when executing.
  var contentScriptChecker = '//Checking the content script\n' +
      'var biteLock=document.getElementById("' +
      Bite.Constants.BITE_CONSOLE_LOCK + '");' +
      'if(!biteLock){chrome.extension.sendRequest({action: "' +
      Bite.Constants.HUD_ACTION.LOAD_CONTENT_SCRIPT +
      '"});}';
  chrome.tabs.executeScript(tab.id, {code: contentScriptChecker});
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
 * Captures the current page's screenshot.
 * @param {function(string)} callback The callback function.
 * @private
 */
bite.client.Background.prototype.captureVisibleTab_ = function(callback) {
  chrome.tabs.captureVisibleTab(
      null, null,
      goog.partial(rpf.MiscHelper.resizeImage, callback, 600, null));
};


/**
 * Callback function that begins the new bug filing process.
 * @param {Tab} tab The created tab object.
 * @private
 */
bite.client.Background.prototype.startNewBug_ = function(tab) {
  this.startEnsureContentScriptLoaded_(tab);

  // Wait 100 ms for the BITE content script to get kicked off.
  this.sendRequestToTab_(Bite.Constants.HUD_ACTION.START_NEW_BUG, tab, 100);
};


/**
 * Callback function that toggles the bugs console.
 * @param {Tab} tab The created tab object.
 * @private
 */
bite.client.Background.prototype.toggleBugsConsole_ = function(tab) {
  this.startEnsureContentScriptLoaded_(tab);

  // Wait 100 ms for the BITE content script to get kicked off.
  this.sendRequestToTab_(Bite.Constants.HUD_ACTION.TOGGLE_BUGS, tab, 100);
};


/**
 * Callback function that toggles the tests console.
 * @param {Tab} tab The created tab object.
 * @private
 */
bite.client.Background.prototype.toggleTestsConsole_ = function(tab) {
  this.startEnsureContentScriptLoaded_(tab);

  // Wait 100 ms for the BITE content script to get kicked off.
  this.sendRequestToTab_(Bite.Constants.HUD_ACTION.TOGGLE_TESTS, tab, 100);
};


/**
 * Return the url of the current server channel.
 * @return {string} The url of the current server channel.
 * @private
 */
bite.client.Background.prototype.getServerChannel_ = function() {
  return bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
};


/**
 * Returns the current configuration of the BITE settings/options.
 * @return {!Object} The current configuration.
 * @private
 */
bite.client.Background.prototype.getSettingsConfiguration_ = function() {
  return bite.options.data.getCurrentConfiguration();
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
    case Bite.Constants.HUD_ACTION.FETCH_TEST_DATA:
      this.fetchTestData_(sender.tab, callback);
      break;
    case Bite.Constants.HUD_ACTION.FETCH_BUGS_DATA:
      this.fetchBugsData_(sender.tab, callback);
      break;
    case Bite.Constants.HUD_ACTION.LOG_TEST_RESULT:
      this.logTestResult_(request, callback);
      break;
    case Bite.Constants.HUD_ACTION.TOGGLE_BUGS:
      chrome.tabs.getSelected(null, goog.bind(this.toggleBugsConsole_, this));
      break;
    case Bite.Constants.HUD_ACTION.TOGGLE_TESTS:
      chrome.tabs.getSelected(null, goog.bind(this.toggleTestsConsole_, this));
      break;
    case Bite.Constants.HUD_ACTION.HIDE_ALL_CONSOLES:
      this.hideAllConsoles_();
      break;
    case Bite.Constants.HUD_ACTION.UPDATE_BUG_STATUS:
      this.updateBugStatus_(request, callback);
      break;
    case Bite.Constants.HUD_ACTION.GET_BUG:
      this.getBugData_(request, callback);
      break;
    case Bite.Constants.HUD_ACTION.UPDATE_BUG_BINDING:
      this.updateBugBinding_(request, callback);
      break;
    case Bite.Constants.HUD_ACTION.UPDATE_BUG_RECORDING:
      this.updateBugRecording_(request, callback);
      break;
    // UPDATE_DATA updates the data (such as bugs and tests) on the current
    // tab.
    case Bite.Constants.HUD_ACTION.UPDATE_DATA:
      chrome.tabs.getSelected(null, goog.bind(this.updateData_, this));
      break;
    case Bite.Constants.HUD_ACTION.GET_LOCAL_STORAGE:
      this.getLocalStorage_(request['key'], callback);
      break;
    case Bite.Constants.HUD_ACTION.SET_LOCAL_STORAGE:
      this.setLocalStorage_(request['key'], request['value'], callback);
      break;
    case Bite.Constants.HUD_ACTION.REMOVE_LOCAL_STORAGE:
      this.removeLocalStorage_(request['key'], callback);
      break;
    case Bite.Constants.HUD_ACTION.GET_TEMPLATES:
      this.getTemplates_(request, callback);
      break;
    case Bite.Constants.HUD_ACTION.START_NEW_BUG:
      chrome.tabs.getSelected(null, goog.bind(this.startNewBug_, this));
      break;
    case Bite.Constants.HUD_ACTION.ENSURE_CONTENT_SCRIPT_LOADED:
      chrome.tabs.getSelected(
          null, goog.bind(this.startEnsureContentScriptLoaded_, this));
      break;
    case Bite.Constants.HUD_ACTION.LOAD_CONTENT_SCRIPT:
      chrome.tabs.getSelected(
          null, goog.bind(this.loadContentScript_, this));
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
    case Bite.Constants.HUD_ACTION.GET_SERVER_CHANNEL:
      callback(this.getServerChannel_());
      break;
    case Bite.Constants.HUD_ACTION.GET_SETTINGS:
      callback(this.getSettingsConfiguration_());
      break;
    case Bite.Constants.HUD_ACTION.GET_SCREENSHOT:
      this.captureVisibleTab_(callback);
      break;
    // UPDATE updates the data from BITE options.
    case bite.options.constants.Message.UPDATE:
      chrome.windows.getAll({'populate': true},
          goog.bind(this.broadcastConfigurationChange_, this));
      break;
    default:
      throw new Error('The specified action is not valid: ' +
                      request['action']);
  }
};


/**
 * Broadcast the current configuration to all content scripts.
 * @param {Array.<Object>} windows An Array of Chrome windows.
 * @private
 */
bite.client.Background.prototype.broadcastConfigurationChange_ =
    function(windows) {
  var configuration = bite.options.data.getCurrentConfiguration();
  var msg = {};
  msg['action'] = bite.options.constants.Message.UPDATE;
  msg['data'] = goog.json.serialize(configuration);

  // For each window, loop over its tabs and send a message with the current
  // configuration.
  for (var i = 0; i < windows.length; ++i) {
    var window = windows[i];
    var tabs = window.tabs;
    if (!tabs) {
      continue;
    }

    for (var j = 0; j < tabs.length; ++j) {
      var tab = tabs[j];
      chrome.tabs.sendRequest(tab.id, msg, goog.nullFunction);
    }
  }
};


// Wire up the listener.
chrome.extension.onRequest.addListener(
    goog.bind(bite.client.Background.getInstance().onRequest,
              bite.client.Background.getInstance()));

