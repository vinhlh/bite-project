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
 * @fileoverview This file contains the recording manager,
 * which has functions to communicate with the page under
 * record, for example: init page, start recording, etc..
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.RecordManager');
goog.require('rpf.ScriptManager');



/**
 * A class for managing the recorder part of RPF.
 * @param {rpf.ScriptManager} scriptMgr The script manager.
 * @param {function()} initAllListeners To init all the listeners.
 * @param {function()} removeAllListeners To remove all the listeners.
 * @param {function()} addTestTabRemovedListener To add the test tab removed
 *     listener.
 * @param {function(Object, function(*)=)} sendMessageToConsole The
 *     function to send message to console world.
 * @param {function(Array, number, boolean, number, function()=)}
 *     executeMultipleScripts The function to execute multiple scripts.
 * @constructor
 * @export
 */
rpf.RecordManager = function(scriptMgr,
                             initAllListeners,
                             removeAllListeners,
                             addTestTabRemovedListener,
                             sendMessageToConsole,
                             executeMultipleScripts) {
  /**
   * The script manager.
   * @type {rpf.ScriptManager}
   * @private
   */
  this.scriptMgr_ = scriptMgr;

  /**
   * To init all the listeners.
   * @type {function()}
   * @private
   */
  this.initAllListeners_ = initAllListeners;

  /**
   * To remove all the listeners.
   * @type {function()}
   * @private
   */
  this.removeAllListeners_ = removeAllListeners;

  /**
   * To add the test tab removed listener.
   * @type {function()}
   * @private
   */
  this.addTestTabRemovedListener_ = addTestTabRemovedListener;

  /**
   * The function to send message to console world.
   * @type {function(Object, function(*)=)}
   * @private
   */
  this.sendMessageToConsole_ = sendMessageToConsole;

  /**
   * The function to send message to console world.
   * @type {function(Array, number, boolean, number, function()=)}
   * @private
   */
  this.executeMultipleScripts_ = executeMultipleScripts;

  /**
   * Whether the page has been initialized.
   * @type {boolean}
   * @private
   */
  this.pageInitialized_ = false;

  /**
   * The tab id of the page under test.
   * @type {number}
   * @private
   */
  this.testTabId_ = -1;

  /**
   * The window id of the page under test.
   * @type {number}
   * @private
   */
  this.testWindowId_ = 0;

  /**
   * The latest recorded event type.
   * @type {string}
   * @private
   */
  this.latestEvent_ = '';

  /**
   * Whether it is recording.
   * @type {boolean}
   * @private
   */
  this.isRecording_ = false;

  /**
   * Whether operation is done without rpf Console UI (true) or not (false).
   * @type {boolean}
   * @private
   */
  this.noConsole_ = false;

  /**
   * The recording mode.
   * @type {string}
   * @private
   */
  this.recordingMode_ = '';

  /**
   * The recording info.
   * @type {Object}
   * @private
   */
  this.recordingInfo_ = {};
};


/**
 * @const The user action related JS lib.
 * @type {string}
 * @private
 */
rpf.RecordManager.GET_ACTION_INFO_JS_ = 'getactioninfo_script.js';


/**
 * @const The element's descriptive info related JS lib.
 * @type {string}
 * @export
 */
rpf.RecordManager.ELEMENT_HELPER = 'elementhelper_script.js';


/**
 * Starts recording.
 * @param {string} url The start url.
 * @param {boolean=} opt_noConsole Whether recording is started without from
 *     rpf Console UI.
 * @param {Object=} opt_info The optional recording config info.
 * @export
 */
rpf.RecordManager.prototype.startRecording = function(
    url, opt_noConsole, opt_info) {
  this.recordingMode_ = 'rpf';
  this.recordingInfo_ = opt_info || {};
  this.noConsole_ = !!opt_noConsole;
  this.initAllListeners_();
  if (this.isRecording_) {
    console.log('Warning: call to startRecording() when recording is ' +
                'already enabled.');
  }
  this.isRecording_ = true;
  this.recordingIconOn_();
  this.scriptMgr_.startUrl = url;

  this.highlightRecordTab();
  this.executePageInit(goog.bind(this.startRecordingInPage, this));

  if (!this.noConsole_) {
    chrome.tabs.get(this.testTabId_, goog.bind(
        function(tab) {
          if (this.scriptMgr_.startUrl == '') {
            this.scriptMgr_.startUrl = tab.url;
            this.sendMessageToConsole_(
                {'command': Bite.Constants.UiCmds.SET_START_URL,
                 'params': {'url': tab.url,
                            'noConsole': this.noConsole_}});
          }
    }, this));
  }
};


/**
 * Enum for commands will be run in page.
 * @enum {string}
 * @export
 */
rpf.RecordManager.CmdCode = {
  CLEAR: 'recordHelper.stopRecording();',
  BLOCK_MODE: 'recordHelper.validator_.setWaitBlockElemMode();',
  ELEMS_IN_BLOCK_MODE: 'recordHelper.validator_.setWaitElemsInBlockMode();',
  CLEAR_BLOCK_MODE: 'recordHelper.validator_.clearBlockMode();',
  START: 'recordHelper.startRecording();'
};


/**
 * Clears the listeners inside the page under test.
 * @param {rpf.RecordManager.CmdCode|string} cmd
 *     The command that will be run in page.
 * @param {boolean=} opt_allFrame Whether to execute the command in all frames.
 * @export
 */
rpf.RecordManager.prototype.runCode = function(cmd, opt_allFrame) {
  var allFrame = opt_allFrame || false;
  var wrappedCmd =
      'try {' + cmd + '} catch(e) {console.log("The cmd was not found.")}';
  chrome.tabs.executeScript(
      this.testTabId_, {code: wrappedCmd, allFrames: allFrame});
};


/**
 * Stops recording.
 * @export
 */
rpf.RecordManager.prototype.stopRecording = function() {
  this.recordingIconOff_();
  this.isRecording_ = false;
  this.removeAllListeners_();
  if (this.testTabId_ > 0) {
    chrome.tabs.sendRequest(
        this.testTabId_,
        {recordAction: Bite.Constants.RECORD_ACTION.STOP_RECORDING,
         params: {}});
  }
};


/**
 * Change the tab's extension icon to indicate that the tab is being
 * recorded.
 * @private
 */
rpf.RecordManager.prototype.recordingIconOn_ = function() {
  var iconDetails = {
      'path': 'imgs/bite_logo_recording_19.png',
      'tabId': this.testTabId_};
  chrome.browserAction.setIcon(iconDetails);
  var tooltipDetails = {
      'title': 'BITE: Recording',
      'tabId': this.testTabId_};
  chrome.browserAction.setTitle(tooltipDetails);
};


/**
 * Change the tab's extension icon back to normal.
 * @private
 */
rpf.RecordManager.prototype.recordingIconOff_ = function() {
  var iconDetails = {
      'path': 'imgs/bite_logo_19.png',
      'tabId': this.testTabId_};
  chrome.browserAction.setIcon(iconDetails);
  var tooltipDetails = {
      'title': 'BITE',
      'tabId': this.testTabId_};
  chrome.browserAction.setTitle(tooltipDetails);
};


/**
 * Sets the tab and window ids of the page under test.
 * @param {number=} opt_tabId The sender tab id.
 * @param {number=} opt_windowId The sender window id.
 * @export
 */
rpf.RecordManager.prototype.setRecordingTab = function(
    opt_tabId, opt_windowId) {
  if (opt_tabId && opt_windowId) {
    this.setStatusBeforeRecording_(opt_tabId, opt_windowId);
  } else {
    chrome.tabs.getSelected(
        null, goog.bind(this.callbackSetRecordingTab_, this));
  }
};


/**
 * Sets the tab and window ids.
 * @param {Object} tab Chrome tab object.
 * @private
 */
rpf.RecordManager.prototype.callbackSetRecordingTab_ = function(tab) {
  this.setStatusBeforeRecording_(tab.id, tab.windowId);
};


/**
 * Sets status and to prepare recording.
 * @param {number} tabId The sender tab id.
 * @param {number} windowId The sender window id.
 * @private
 */
rpf.RecordManager.prototype.setStatusBeforeRecording_ = function(
    tabId, windowId) {
  this.testTabId_ = tabId;
  this.testWindowId_ = windowId;
  this.addTestTabRemovedListener_();
};


/**
 * Brings the tab under record foreground.
 * @param {(function ((Tab|null)): undefined|undefined)} opt_callback
 *     An optional callback function.
 * @export
 */
rpf.RecordManager.prototype.highlightRecordTab = function(opt_callback) {
  var callback = opt_callback || undefined;
  chrome.tabs.update(this.testTabId_, { selected: true }, callback);
  chrome.windows.update(this.testWindowId_, { focused: true }, callback);
};


/**
 * Enters updater mode.
 * @export
 */
rpf.RecordManager.prototype.enterUpdaterMode = function() {
  this.recordingMode_ = 'updater';
  chrome.tabs.executeScript(this.testTabId_,
      {code: 'recordHelper.enterUpdaterMode();'});
};


/**
 * Ends updater mode.
 * @export
 */
rpf.RecordManager.prototype.endUpdaterMode = function() {
  chrome.tabs.executeScript(this.testTabId_,
      {code: 'recordHelper.endUpdaterMode();'});
};


/**
 * Tests a locator.
 * @param {Array} locators The locator array.
 * @param {function(Object)} callback The callback function.
 * @export
 */
rpf.RecordManager.prototype.testLocator = function(locators, callback) {
  chrome.tabs.sendRequest(
      this.testTabId_,
      {command: 'testLocator',
       locators: locators},
      /** @type {function(*)} */ (callback));
};


/**
 * Tests a descriptor in the page under test.
 * @param {Object} descriptor A descriptor object for an element.
 * @private
 */
rpf.RecordManager.prototype.testDescriptor_ = function(descriptor) {
  chrome.tabs.executeScript(this.testTabId_,
      {code: 'recordHelper.outlineElems_(' + descriptor + ');'});
};


/**
 * Tests a descriptor in the page under test.
 * @param {Object} descriptor A descriptor object for an element.
 * @export
 */
rpf.RecordManager.prototype.testDescriptor = function(descriptor) {
  var descStr = JSON.stringify(descriptor);
  console.log('Test descriptor in page!');
  this.executePageInit(goog.bind(this.testDescriptor_, this, descStr));
};


/**
 * Tests block validation in the page under test.
 * @param {Object} blockObj An object of block info.
 * @export
 */
rpf.RecordManager.prototype.testBlockValidation = function(blockObj) {
  var blockStr = JSON.stringify(blockObj);
  chrome.tabs.sendRequest(
      this.testTabId_,
      {command: 'testValidateBlock',
       descriptor: blockStr},
      function(response) {
        if (response.result != Bite.Constants.WorkerResults.PASS) {
          console.log('Testing Error:' + response.result);
        }
      });
};


/**
 * Gets the root array.
 * @return {Array} The root element array.
 * @private
 */
rpf.RecordManager.prototype.getRoots_ = function() {
  var results = [];
  if (this.recordingInfo_ && this.recordingInfo_['pageMap']) {
    var pageMap = goog.json.parse(this.recordingInfo_['pageMap']);
    for (var item in pageMap) {
      results.push(
          {'xpath': item, 'className': pageMap[item]});
    }
  }
  return results;
};


/**
 * Starts recording in content script.
 * @export
 */
rpf.RecordManager.prototype.startRecordingInPage = function() {
  if (this.recordingMode_ == 'updater') {
    this.enterUpdaterMode();
  } else {
    var roots = this.getRoots_();
    chrome.tabs.sendRequest(
        this.testTabId_,
        {recordAction: Bite.Constants.RECORD_ACTION.START_RECORDING,
         params: {'noConsole': this.noConsole_,
                  'rootArr': roots,
                  'xpathFinderOn': this.recordingInfo_['xpathFinderOn']}});
  }
};


/**
 * Executes three content scripts to initialize recording on a page.
 * @param {function()=} opt_callback An optional callback function.
 * @export
 */
rpf.RecordManager.prototype.executePageInit = function(opt_callback) {
  if (this.pageInitialized_) {
    this.pageInitialized_ = false;
    this.runCode(rpf.RecordManager.CmdCode.CLEAR, true);
  }
  this.pageInitialized_ = true;
  if (opt_callback) {
    opt_callback();
  }
};


/**
 * @return {boolean} Whether is recording.
 * @export
 */
rpf.RecordManager.prototype.isRecording = function() {
  return this.isRecording_;
};


/**
 * @return {number} The tab id of the page under test.
 * @export
 */
rpf.RecordManager.prototype.getTestTabId = function() {
  return this.testTabId_;
};


/**
 * @param {number} tabId The tab id of the page under test.
 * @export
 */
rpf.RecordManager.prototype.setTestTabId = function(tabId) {
  this.testTabId_ = tabId;
};


/**
 * @return {number} The tab id of the page under test.
 * @export
 */
rpf.RecordManager.prototype.getTestWindowId = function() {
  return this.testWindowId_;
};


/**
 * @param {number} windowId The tab id of the page under test.
 * @export
 */
rpf.RecordManager.prototype.setTestWindowId = function(windowId) {
  this.testWindowId_ = windowId;
};

