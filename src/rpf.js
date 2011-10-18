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
 * @fileoverview The main class for rpf.
 *
 * TODO(michaelwill): This class is a work in progress.
 * There's still a bunch of state in here that probably does not
 * belong.  If you happen to be reading this, and you notice that
 * something is particulary hacky, feel free to fix it :).
 *
 * @author phu@google.com (Po Hu)
 *         michaelwill@google.com (Michael Williamson)
 */


goog.provide('rpf.Rpf');

goog.require('bite.common.net.xhr.async');
goog.require('goog.json');
goog.require('goog.structs.Set');
goog.require('rpf.ConsoleLogger');
goog.require('rpf.EventsManager');



/**
 * The primary class for rpf.
 * Encapsulates all the sub-objects that rpf depends on.
 * @constructor
 * @export
 */
rpf.Rpf = function() {
  /**
   * @type {number}
   * @private
   */
  this.windowId_ = -1;

  // TODO(michaelwill): This is a bit of a dependency nightmare.
  // Ideally, each object would just be passed copies of the other
  // singletons that it depends on.  Unfortunately, the code right now
  // has circular depdendencies which make this impossible.
  //
  // As a result,
  // most of the objects here gain access to the others through a reference
  // back to this global object.  This is very hacky, and needs to be redone.
  // The circular dependencies in all these sub objects need to be weeded out.

  /**
   * @type {rpf.ConsoleLogger}
   * @private
   */
  this.logger_ = rpf.ConsoleLogger.getInstance();

  /**
   * @type {rpf.EventsManager}
   * @private
   */
  this.eventsMgr_ = rpf.EventsManager.getInstance();

  this.eventsMgr_.setupCommonFuncs(
      goog.bind(this.getCommonLibsAsStr, this),
      goog.bind(this.getCommonLibs, this),
      goog.bind(this.setCommonLib, this),
      goog.bind(this.callBackOnRequest, this));

  /**
   * @type {Object}
   * @private
   */
  this.commonLibs_ = {};

  this.boundOnRequestFunc = goog.bind(this.callBackOnRequest, this);

  chrome.windows.onRemoved.addListener(goog.bind(
      this.windowDestroyed_, this));

  chrome.extension.onRequest.addListener(
      this.boundOnRequestFunc);

  this.fetchCommonLibs();
};
goog.addSingletonGetter(rpf.Rpf);


/**
 * @const The console's html file.
 * @type {string}
 * @private
 */
rpf.Rpf.CONSOLE_HTML_FILE_ = 'console.html';


/**
 * @const The name of the rpf console.
 * @type {string}
 * @private
 */
rpf.Rpf.CONSOLE_NAME_ = 'Rpf';


/**
 * @const The name of the tab under record.
 * @type {string}
 */
rpf.Rpf.TAB_UNDER_RECORD_TITLE = 'TabUnderRecord';


/**
 * @const The console's left margin.
 * @type {number}
 * @private
 */
rpf.Rpf.CONSOLE_LEFT_MARGIN_ = 5;


/**
 * @const The console's top margin.
 * @type {number}
 * @private
 */
rpf.Rpf.CONSOLE_TOP_MARGIN_ = 5;


/**
 * @const The console's width.
 * @type {number}
 * @private
 */
rpf.Rpf.CONSOLE_WIDTH_ = 500;


/**
 * @const The console's height.
 * @type {number}
 * @private
 */
rpf.Rpf.CONSOLE_HEIGHT_ = 800;


/**
 * @const Whether or not the console is resizable.
 * @type {string}
 * @private
 */
rpf.Rpf.CONSOLE_RESIZABLE_ = 'yes';


/**
 * @const Whether or not to have scroll bar.
 * @type {string}
 * @private
 */
rpf.Rpf.CONSOLE_SCROLLBARS_ = 'no';


/**
 * Callback on a request received.
 * @param {Object} request The request object.
 * @param {Object} sender The sender object.
 * @param {function(Object)} sendResponse The response object.
 */
rpf.Rpf.prototype.callBackOnRequest = function(
    request, sender, sendResponse) {
  if (!request['command']) {
    return;
  }

  switch (request['command']) {
    case Bite.Constants.CONTROL_CMDS.REMOVE_WINDOW:
      this.removeWindow();
      break;
    case Bite.Constants.CONTROL_CMDS.CREATE_WINDOW:
      this.createWindow(request['params']['refresh']);
      break;
    case Bite.Constants.CONTROL_CMDS.OPEN_CONSOLE_AUTO_RECORD:
      sendResponse({'result':
                    this.checkAndStartAutoRecording_(sender.tab.id, request)});
      break;
  }
};


/**
 * @return {rpf.ConsoleLogger} The logger object.
 * @export
 */
rpf.Rpf.prototype.getLogger = function() {
  return this.logger_;
};


/**
 * @return {rpf.EventsManager} Gets the events manager.
 * @export
 */
rpf.Rpf.prototype.getEventsManager = function() {
  return this.eventsMgr_;
};


/**
 * @param {string} userId Sets the user id.
 * @export
 */
rpf.Rpf.prototype.setUserId = function(userId) {
  this.eventsMgr_.setUserId(userId);
};


/**
 * Creates the physical rpf window if it does not yet
 * already exist.
 * @private
 */
rpf.Rpf.prototype.createRpfWindow_ = function() {
  this.eventsMgr_.sendMessage(
    {'command': Bite.Constants.CONSOLE_CMDS.SET_RECORDING_TAB});
  this.eventsMgr_.sendMessage(
    {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});

  var options = {
    url: rpf.Rpf.CONSOLE_HTML_FILE_,
    type: 'popup',
    left: rpf.Rpf.CONSOLE_LEFT_MARGIN_,
    top: rpf.Rpf.CONSOLE_TOP_MARGIN_,
    height: rpf.Rpf.CONSOLE_HEIGHT_,
    width: rpf.Rpf.CONSOLE_WIDTH_
  };

  var viewSet = new goog.structs.Set();
  viewSet.addAll(chrome.extension.getViews());
  chrome.windows.create(options, goog.bind(function(win) {
    this.windowId_ = win.id;
    chrome.tabs.getAllInWindow(win.id,
        goog.bind(function(tabs) {
    // Using 0 because it's the only created tab of the created window.
            this.eventsMgr_.setConsoleTabId(tabs[0].id);}, this));
    var newViews = chrome.extension.getViews();
    for (var i = 0; i < newViews.length; i++) {
      // Here we manually find the view that didn't exist before
      // the call to chrome.windows.create().  This hack is necessary
      // because of chrome bug
      // http://code.google.com/p/chromium/issues/detail?id=74958 where
      // chrome.extension.getViews() passing in the window id
      // does not work.
      var view = newViews[i];
      if (!viewSet.contains(view)) {
        // This manual resize is necessary because of chrome bug
        // http://code.google.com/p/chromium/issues/detail?id=72980
        // chrome.windows.create() ignores the size of windows
        // with type 'popup'.
        view.resizeTo(rpf.Rpf.CONSOLE_WIDTH_, rpf.Rpf.CONSOLE_HEIGHT_);
        break;
      }
    }
  }, this));

};


/**
 * Creates the physical rpf console window if it doesn't already exist.
 *
 * @param {boolean=} opt_forceRefresh An optional parameter that forces
 *     the console window to be redrawn, even if one already exists.
 * @export
 */
rpf.Rpf.prototype.createWindow = function(opt_forceRefresh) {
  if (opt_forceRefresh) {
    this.removeWindow();
    this.windowId_ = -1;
  }
  if (this.windowId_ >= 0) {
    this.eventsMgr_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});
    this.eventsMgr_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SET_RECORDING_TAB});
    this.focusRpf();
  } else {
    this.eventsMgr_.refresh();
    this.createRpfWindow_();
  }
};


/**
 * Checks and starts auto recording.
 * @param {string} tabId The tab id.
 * @param {Object} request The request object.
 * @private
 * @return Whether auto recording is on.
 */
rpf.Rpf.prototype.checkAndStartAutoRecording_ = function(tabId, request) {
  if (this.windowId_ < 0) {
    this.createWindow();
    return true;
  }
  return (this.eventsMgr_.getRecorder().getTestTabId() &&
          this.eventsMgr_.getRecorder().getTestTabId() == tabId);
};


/**
 * Removes the rpf window, if it exists.
 *
 * @export
 */
rpf.Rpf.prototype.removeWindow = function() {
  if (this.windowId_ < 0) {
    return;
  }
  rpf.MiscHelper.removeWindowById(this.windowId_);
};


/**
 * Callback used when the rpf window goes away.
 *
 * @param {number} windowId The numeric id of the window.
 * @private
 */
rpf.Rpf.prototype.windowDestroyed_ = function(windowId) {
  if (windowId != this.windowId_) {
    return;
  }
  this.windowId_ = -1;

  this.eventsMgr_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});
  chrome.tabs.onRemoved.removeListener(
      this.eventsMgr_.callBackAddTestTabRemoved);
};


/**
 * Returns true if the rpf window has previously been created
 * and is currently visible on the screen.
 *
 * @return {boolean} true if the window is created.
 * @export
 */
rpf.Rpf.prototype.windowCreated = function() {
  return this.windowId_ >= 0;
};


/**
 * @return {number} The main RPF window.
 * @export
 */
rpf.Rpf.prototype.getWindowId = function() {
  return this.windowId_;
};


/**
 * Sets the main RPF window.
 * @param {number} winId The window id.
 * @export
 */
rpf.Rpf.prototype.setWindowId = function(winId) {
  this.windowId_ = winId;
};


/**
 * Focuses the rpf window.
 */
rpf.Rpf.prototype.focusRpf = function() {
  chrome.windows.update(this.windowId_, { focused: true });
  this.eventsMgr_.stopRecordingFromUi();
};


/**
 * Get the common libs as a string.
 * @param {Array} opt_excludes The optional excluding array of lib names.
 * @return {string} The common lib string.
 * @export
 *
 * TODO(michaelwill): This and getCommonLibs() do not belong in this file.
 */
rpf.Rpf.prototype.getCommonLibsAsStr = function(opt_excludes) {
  var commonLibStr = '';
  for (var lib in this.commonLibs_) {
    if (opt_excludes && goog.array.contains(opt_excludes, lib)) {
      continue;
    }
    commonLibStr += this.commonLibs_[lib]['lib'];
  }
  return commonLibStr;
};


/**
 * @return {Object} Gets the common libs.
 * @export
 */
rpf.Rpf.prototype.getCommonLibs = function() {
  return this.commonLibs_;
};


/**
 * @param {string} name The common lib name.
 * @param {string} value The lib value.
 * @export
 */
rpf.Rpf.prototype.setCommonLib = function(name, value) {
  if (!this.commonLibs_[name]) {
    this.commonLibs_[name] = {};
  }
  this.commonLibs_[name]['lib'] = value;
};


/**
 * Fetches the common libs.
 * @param {function()=} opt_callback The optional callback function.
 * @export
 * TODO(michaelwill): This and getCommonLibs() do not belong in this file.
 */
rpf.Rpf.prototype.fetchCommonLibs = function(opt_callback) {
  var requestUrl = rpf.MiscHelper.getUrl(
      rpf.MiscHelper.COMMON_LIB_SERVER,
      '/get_common_libs', {});

  var callback = (opt_callback) ? opt_callback : goog.nullFunction;
  bite.common.net.xhr.async.get(requestUrl,
      goog.bind(this.fetchCommonLibsCallback_, this, callback));
};


/**
 * Callback for the fetch common libs server request.
 * @param {function()} callback Callback function.
 * @param {boolean} success Whether or not the request was successful.
 * @param {string} data The data string from the request or an error string if
 *     the request failed.
 * @private
 */
rpf.Rpf.prototype.fetchCommonLibsCallback_ =
    function(callback, success, data) {
  var errorStr = '';

  try {
    if (success) {
      this.commonLibs_ = goog.json.parse(data);
      callback();
      return;
    } else {
      errorStr = data;
    }
  } catch (error) {
    errorStr = error;
  }

  console.error('Getting common libs encountered: ' + errorStr);
};

