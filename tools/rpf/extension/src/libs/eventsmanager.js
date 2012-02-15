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
 * @fileoverview This file contains the events manager, which
 * has all the events related functions.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.EventsManager');

goog.require('Bite.Constants');
goog.require('goog.json');
goog.require('goog.string');
goog.require('rpf.Automator');
goog.require('rpf.CodeGenerator');
goog.require('rpf.MiscHelper');
goog.require('rpf.PlayBackManager');
goog.require('rpf.RecordManager');
goog.require('rpf.SaveLoadManager');
goog.require('rpf.ScriptManager');
goog.require('rpf.WorkerManager');



/**
 * A class for managing all the events.
 *
 * @constructor
 * @export
 */
rpf.EventsManager = function() {
  /**
   * The latest created window id.
   * @type {number}
   * @private
   */
  this.latestCreatedWinId_ = 0;

  /**
   * @type {rpf.ScriptManager}
   * @private
   */
  this.scriptMgr_ = new rpf.ScriptManager();

  /**
   * @type {rpf.CodeGenerator}
   * @private
   */
  this.codeGen_ = new rpf.CodeGenerator();

  /**
   * @type {rpf.SaveLoadManager}
   * @private
   */
  this.saveLoadMgr_ = null;

  /**
   * The callback function for receiving an action event.
   * @type {Function}
   * @private
   */
  this.onReceiveActionCallback_ = null;

  /**
   * The rpf console's tab id.
   * @type {number}
   * @private
   */
  this.consoleTabId_ = -1;

  /**
   * The content script sender tab id.
   * @type {number}
   * @private
   */
  this.senderTabId_ = 0;

  /**
   * The user id.
   * @type {string}
   * @private
   */
  this.userId_ = '';

  /**
   * The latest time stamp that an enter was recorded.
   * @type {number}
   * @private
   */
  this.latestEnterTime_ = 0;

  /**
   * The map of the tabs that have content script injected.
   * @type {Object}
   * @private
   */
  this.injectedTabs_ = {};

  /**
   * Logger for logging.
   * @type {rpf.ConsoleLogger}
   * @private
   */
  this.logger_ = rpf.ConsoleLogger.getInstance();

  /**
   * The rpf automator which automates rpf actions.
   * @type {rpf.Automator}
   * @private
   */
  this.automator_ = null;

  /**
   * The rpf automator for worker manager which automates rpf actions.
   * @type {rpf.Automator}
   * @private
   */
  this.workerAutomator_ = null;

  /**
   * The manager for running multiple tests.
   * @type {rpf.WorkerManager}
   * @private
   */
  this.workerMgr_ = null;

  //These are necessary because goog.bind() returns a different
  // function each time.  As a result, when you try to do
  // chrome.extension.onRequest.removeListener() (or something
  // similar), the listener won't be removed.  These variables
  // ensure we only have one copy of each bound function.
  //
  // TODO(michaelwill):  This should probably be refactored
  // to make it a little less tedious.  e.g. using a map of
  // functions might be better.
  this.boundOnRequestFunc = goog.bind(this.callBackOnRequest, this);
  this.boundOnMessageFunc = goog.bind(this.callBackOnMessageReceived, this);
  this.boundTabUpdatedFunc = goog.bind(this.callBackTabUpdated_, this);
  this.boundOnWindowCreatedFunc = goog.bind(
      this.callBackWindowCreated_, this);
  this.boundAddTestTabRemovedFunc = goog.bind(
      this.callBackAddTestTabRemoved, this);

  /**
   * @type {rpf.PlayBackManager}
   * @private
   */
  this.playbackMgr_ = new rpf.PlayBackManager(
      this.scriptMgr_,
      rpf.EventsManager.isLoadingReadyForPlayback,
      goog.bind(this.removeTabUpdatedListener, this),
      goog.bind(this.addTabUpdatedListener, this),
      this.logger_,
      goog.bind(this.sendMessageToConsole_, this),
      this.boundOnMessageFunc);

  /**
   * @type {rpf.RecordManager}
   * @private
   */
  this.recordMgr_ = new rpf.RecordManager(
      this.scriptMgr_,
      goog.bind(this.initAllRecordListeners, this),
      goog.bind(this.removeAllListeners, this),
      goog.bind(this.addTestTabRemovedListener, this),
      goog.bind(this.sendMessageToConsole_, this),
      goog.bind(this.executeMultipleScripts, this));

  this.refresh();

  chrome.extension.onRequest.addListener(this.boundOnMessageFunc);
  chrome.extension.onRequest.addListener(this.boundOnRequestFunc);
};
goog.addSingletonGetter(rpf.EventsManager);


/**
 * Whether loading is ready for recording.
 * @type {boolean}
 * @private
 */
rpf.EventsManager.loadingReadyForRecord_ = false;


/**
 * The default URL of the tab under record.
 * @type {string}
 * @private
 */
rpf.EventsManager.defaultRecordUrl_ = 'http://www.google.com';


/**
 * @return {boolean} Whether loading is ready for recording.
 * @export
 */
rpf.EventsManager.isLoadingReadyForRecord = function() {
  return rpf.EventsManager.loadingReadyForRecord_;
};


/**
 * Whether takes screnshots or not.
 * @type {boolean}
 * @private
 */
rpf.EventsManager.isTakingScreenshots_ = true;


/**
 * Whether loading is ready for playback.
 * @type {boolean}
 * @private
 */
rpf.EventsManager.loadingReadyForPlayback_ = false;


/**
 * @return {boolean} Whether loading is ready for playback.
 * @export
 */
rpf.EventsManager.isLoadingReadyForPlayback = function() {
  return rpf.EventsManager.loadingReadyForPlayback_;
};


/**
 * Enum for tab change status.
 * @enum {string}
 * @private
 */
rpf.EventsManager.TabStatus_ = {
  LOADING: 'loading',
  COMPLETE: 'complete'
};


/**
 * Refreshes the components that need refreshes.
 * @export
 */
rpf.EventsManager.prototype.refresh = function() {
  this.scriptMgr_ = new rpf.ScriptManager();
  this.logger_.clearLogs();
  this.saveLoadMgr_ = new rpf.SaveLoadManager(
      this.scriptMgr_,
      goog.bind(this.sendMessageToConsole_, this),
      this.boundOnMessageFunc);
};


/**
 * Gets the recorder.
 * @return {rpf.RecordManager} The recording manager.
 */
rpf.EventsManager.prototype.getRecorder = function() {
  return this.recordMgr_;
};


/**
 * Tests the UI automation.
 */
rpf.EventsManager.prototype.testAutomation = function() {
  this.sendMessageToConsole_(
      {'command': Bite.Constants.UiCmds.START_RECORDING,
       'params': {}});
};


/**
 * Executes multiple scripts in sequence.
 * @param {Array} scriptsAry The scripts Array.
 * @param {number} index The current index.
 * @param {boolean} allFrame Whether executes in all frames.
 * @param {number} tabId The tab id.
 * @param {function()=} opt_callback The optional callback function.
 * @export
 */
rpf.EventsManager.prototype.executeMultipleScripts = function(
    scriptsAry, index, allFrame, tabId, opt_callback) {
  if (index < scriptsAry.length) {
    chrome.tabs.executeScript(
        tabId, {file: scriptsAry[index], allFrames: allFrame},
        goog.bind(
            this.executeMultipleScripts,
            this,
            scriptsAry, ++index, allFrame, tabId, opt_callback));
  } else {
    if (opt_callback) {
      opt_callback.apply(null);
    }
  }
};


/**
 * Sets up the common functions.
 * @param {function(Object, Object, function(Object))} rpfListener
 *     The listener in rpf.js.
 * @export
 */
rpf.EventsManager.prototype.setupCommonFuncs = function(rpfListener) {
  this.automator_ = new rpf.Automator(
      goog.bind(this.sendMessageToConsole_, this),
      this.boundOnMessageFunc,
      rpfListener);

  this.workerAutomator_ = new rpf.Automator(
      goog.bind(this.sendMessageToConsole_, this),
      this.boundOnMessageFunc,
      rpfListener);

  this.workerMgr_ = new rpf.WorkerManager(
      this.playbackMgr_,
      this.workerAutomator_,
      this.logger_,
      this.boundOnMessageFunc,
      goog.bind(this.sendMessageToConsole_, this));
};


/**
 * Inits all the listeners.
 * @export
 */
rpf.EventsManager.prototype.initAllRecordListeners = function() {
  this.removeAllListeners();
  this.addTabUpdatedListener();
};


/**
 * Adds tabUpdated listener.
 * @export
 */
rpf.EventsManager.prototype.addTabUpdatedListener = function() {
  this.removeTabUpdatedListener();
  chrome.tabs.onUpdated.addListener(this.boundTabUpdatedFunc);
};

/**
 * Removes TabUpdated listener.
 * @export
 */
rpf.EventsManager.prototype.removeTabUpdatedListener = function() {
  chrome.tabs.onUpdated.removeListener(this.boundTabUpdatedFunc);
};


/**
 * Removes all the listeners.
 * @export
 */
rpf.EventsManager.prototype.removeAllListeners = function() {
  this.removeTabUpdatedListener();
};


/**
 * Adds the onWindowCreated listener.
 * @export
 */
rpf.EventsManager.prototype.addOnWindowCreatedListener = function() {
  this.removeOnCreatedListener();
  chrome.windows.onCreated.addListener(this.boundOnWindowCreatedFunc);
};


/**
 * Removes the onCreated listener.
 * @export
 */
rpf.EventsManager.prototype.removeOnCreatedListener = function() {
  chrome.windows.onCreated.removeListener(this.boundOnWindowCreatedFunc);
};


/**
 * Adds the tabRemoved listener.
 * @export
 */
rpf.EventsManager.prototype.addTestTabRemovedListener = function() {
  chrome.tabs.onRemoved.removeListener(this.boundAddTestTabRemovedFunc);
  chrome.tabs.onRemoved.addListener(this.boundAddTestTabRemovedFunc);
};


/**
 * Callback after a tab updated.
 * @param {number} tabId The tab id.
 * @param {{status: string, url: string, pinned: boolean}}
 *     changeInfo The tab change object.
 * @param {Tab} tab The tab object.
 * @private
 */
rpf.EventsManager.prototype.callBackTabUpdated_ =
    function(tabId, changeInfo, tab) {
  if (tabId == this.recordMgr_.getTestTabId() &&
      this.recordMgr_.isRecording()) {
    if (changeInfo['status'] == rpf.EventsManager.TabStatus_.LOADING) {
      rpf.EventsManager.loadingReadyForRecord_ = true;
      console.log('Caught the url is changing to:' + changeInfo['url']);
      if (changeInfo['url'] &&
          this.recordMgr_.latestEvent && (
              this.recordMgr_.latestEvent == 'click' ||
              this.recordMgr_.latestEvent == 'change' ||
              this.recordMgr_.latestEvent == 'type' ||
              this.recordMgr_.latestEvent == 'submit')) {
        goog.Timer.callOnce(
            goog.bind(function() {
              this.writeUrlChangeToConsole(
                  rpf.CodeGenerator.getRedirectUrl(changeInfo['url']));
            }, this),
            400);
      }
    }
    if (rpf.EventsManager.loadingReadyForRecord_ &&
        changeInfo['status'] == rpf.EventsManager.TabStatus_.COMPLETE) {
      console.log('Caught the url is changed.');
      this.recordMgr_.pageInitialized = false;
      this.recordMgr_.executePageInit(
          goog.bind(this.recordMgr_.startRecordingInPage, this.recordMgr_));
      rpf.EventsManager.loadingReadyForRecord_ = false;
    }
  }

  if (tabId == this.playbackMgr_.getPlaybackTabId()) {
    if (changeInfo['status'] == rpf.EventsManager.TabStatus_.LOADING) {
      rpf.EventsManager.loadingReadyForPlayback_ = true;
      console.log('caught an event of replay tab is changing to:' +
          changeInfo['url']);
      return;
    }

    if (rpf.EventsManager.loadingReadyForPlayback_ &&
        changeInfo['status'] == rpf.EventsManager.TabStatus_.COMPLETE) {
      console.log('caught an event of replay tab is changed.');
      this.playbackMgr_.initReplayPage(
          this.playbackMgr_.callBackAfterTabUpdated);
      if (this.playbackMgr_.isReplayTabReady()) {
        console.log('Currently only the first url change is counted.');
      }
      rpf.EventsManager.loadingReadyForPlayback_ = false;
      return;
    }
  }
};


/**
 * Sets whether to take screenshots.
 * @param {boolean} takes Whether or not to take.
 * @export
 */
rpf.EventsManager.prototype.setTakeScreenshot = function(takes) {
  rpf.EventsManager.isTakingScreenshots_ = takes;
};


/**
 * Callback after a window is created.
 * @param {Window} win The window object.
 * @private
 */
rpf.EventsManager.prototype.callBackWindowCreated_ = function(win) {
  console.log('A new window was created with winId:' + win['id']);
  this.latestCreatedWinId_ = win['id'];
};


/**
 * Gets the latest created window id.
 * @return {number} The latest created windows id.
 * @export
 */
rpf.EventsManager.prototype.getLatestCreatedWinId = function() {
  return this.latestCreatedWinId_;
};


/**
 * Enum for received results types.
 * @enum {string}
 * @private
 */
rpf.EventsManager.ResultTypes_ = {
  PASS: 'passed',
  ERROR: 'Error: ',
  FAILED: 'failed'
};


/**
 * Enum for received commands.
 * @enum {string}
 * @private
 */
rpf.EventsManager.CmdTypes_ = {
  GET_ACTION_INFO: 'GetActionInfo',
  LOG: 'log',
  INIT_READY: 'initReady',
  CMD_DONE: 'cmdDone',
  ACTIVATE_VALIDATION: 'activateValidation',
  BLOCK_VALIDATE: 'blockValidate',
  MATCH_HTML: 'setLastMatchHtml',
  KEY_DOWN: 'catchKeyDown',
  KEY_UP: 'catchKeyUp'
};


/**
 * A mock function to send message to the console event handler.
 * This is used for calls from background world to console world.
 * @param {Object} request The request object.
 * @param {function(*)=} opt_callback The callback function.
 * @private
 */
rpf.EventsManager.prototype.sendMessageToConsole_ = function(
    request, opt_callback) {
  chrome.tabs.sendRequest(this.consoleTabId_, request, opt_callback);
};


/**
 * Sends a message to console UI to stop recording.
 */
rpf.EventsManager.prototype.stopRecordingFromUi = function() {
  chrome.tabs.sendRequest(
      this.consoleTabId_,
      {'command': Bite.Constants.UiCmds.STOP_RECORDING,
       'params': {}});
};


/**
 * Sends message to the content script.
 * @param {Object} request The request object.
 * @param {function(*)=} opt_callback The callback function.
 * @private
 */
rpf.EventsManager.prototype.sendMessageToContent_ = function(
    request, opt_callback) {
  chrome.tabs.sendRequest(this.senderTabId_, request, opt_callback);
};


/**
 * Writes a command to console.
 * @param {Array} selectors The element css selectors.
 * @param {string} content The input content.
 * @param {rpf.CodeGenerator.DomTags} nodeType The nodetype of the element.
 * @param {rpf.CodeGenerator.RecordActions} action The user's action.
 * @param {string} descriptor The descriptive info of the element.
 * @param {string} elemVarName The variable name of the element.
 * @param {number=} opt_index The command's index string.
 * @param {Object=} opt_iframeInfo The iframe info where the element was from.
 * @param {Array=} opt_xpaths The optional xpath array.
 * @param {string=} opt_mode The optional mode string.
 * @param {string=} opt_className The class name for the action.
 * @export
 */
rpf.EventsManager.prototype.writeUserActionToConsole = function(
    selectors, content, nodeType, action,
    descriptor, elemVarName, opt_index, opt_iframeInfo,
    opt_xpaths, opt_mode, opt_className) {
  var cmdInfo = this.codeGen_.generateScriptAndDataFileForCmd(
      selectors, content, nodeType, action, descriptor,
      elemVarName, opt_iframeInfo, opt_xpaths, opt_className);

  if (action == rpf.CodeGenerator.RecordActions.VERIFY &&
      opt_mode == 'updater') {
    if (this.onReceiveActionCallback_) {
      this.onReceiveActionCallback_({
        'cmd': cmdInfo['cmd'],
        'data': cmdInfo['data'],
        'index': opt_index,
        'cmdMap': cmdInfo['cmdMap']});
    }
    this.onReceiveActionCallback_ = null;
  } else {
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.ADD_GENERATED_CMD,
         'params': {'cmd': cmdInfo['cmd']}});
    var translation = '';
    try {
      translation = this.codeGen_.translateCmd(
          cmdInfo['cmd'], cmdInfo['data'], goog.json.parse(descriptor));
    } catch (e) {
      console.log('The translation process failed.. ' + e.message);
    }
    this.writeACmdToConsole(cmdInfo['cmd'], cmdInfo['data'],
                            opt_index, cmdInfo['cmdMap'], translation);
  }
};


/**
 * Writes a url change to console.
 * @param {string} pCmd The generated command.
 * @export
 */
rpf.EventsManager.prototype.writeUrlChangeToConsole = function(pCmd) {
  this.writeACmdToConsole(pCmd + '\n');
};


/**
 * Writes a command to console. In case of recording started not from
 * rpf Console UI, it sends a command to content script.
 * @param {string} pCmd The generated command.
 * @param {string=} opt_dCmd The data file entry.
 * @param {number=} opt_index The command's index string.
 * @param {Object=} opt_cmdMap The cmd map.
 * @param {string=} opt_translation The plain English.
 */
rpf.EventsManager.prototype.writeACmdToConsole = function(
    pCmd, opt_dCmd, opt_index, opt_cmdMap, opt_translation) {
  this.sendMessageToConsole_(
      {'command': Bite.Constants.UiCmds.ADD_NEW_COMMAND,
       'params': {'pCmd': pCmd,
                  'dCmd': opt_dCmd,
                  'cmdMap': opt_cmdMap,
                  'index': opt_index,
                  'readableCmd': opt_translation}});
};


/**
 * @return {rpf.PlayBackManager} The playback manager instance.
 * @export
 */
rpf.EventsManager.prototype.getPlaybackManager = function() {
  return this.playbackMgr_;
};


/**
 * A mock function to send message to the callBackOnRequest handler.
 * This is used for calls from inside background world.
 * @param {Object} request The request object.
 * @param {function(Object)=} opt_callback The callback function.
 * @export
 */
rpf.EventsManager.prototype.sendMessage = function(request, opt_callback) {
  this.callBackOnMessageReceived(
      request, /** @type {MessageSender} */ ({}),
      opt_callback || goog.nullFunction);
};


/**
 * Captures a screenshot for the visible tab.
 * @param {number} testWindowId The id of window under test.
 * @param {function(string)} callback The callback function.
 * @param {number=} opt_delay The optional delay time.
 * @export
 */
rpf.EventsManager.prototype.captureVisibleTab = function(
    testWindowId, callback, opt_delay) {
  var delay = opt_delay || 0;
  goog.Timer.callOnce(
      goog.partial(chrome.tabs.captureVisibleTab,
                   testWindowId,
                   callback),
      delay);
};


/**
 * Executes a given script in page.
 * @param {number} id The tab id.
 * @param {string} script The script to be executed.
 * @param {boolean=} opt_allFrames Whether to run it in all of the frames.
 * @private
 */
rpf.EventsManager.prototype.executeScriptStr_ = function(
    id, script, opt_allFrames) {
  chrome.tabs.executeScript(
      id,
      {code: script, allFrames: opt_allFrames || false}
  );
};


/**
 * Generates a commmand based on the info from the page under recording.
 * @param {Object} request The request object.
 * @private
 */
rpf.EventsManager.prototype.generateCmdBasedOnRecording_ = function(
    request) {
  var content = request['content'];
  var action = request['action'];
  var selectors = request['selectors'];
  var xpaths = request['xpaths'];
  var iframeInfo = request['iframeInfo'];
  var position = request['position'];

  this.logger_.saveLogAndHtml('Caught an event: ' + action);
  if (action == 'rightclick') {
    if (request['mode'] == 'rpf') {
      this.sendMessageToConsole_(
          {'command': Bite.Constants.UiCmds.OPEN_VALIDATION_DIALOG,
           'params': {'request': request}});
      return;
    } else {
      // Rightclick corresponds to a verify command in this case.
      action = rpf.CodeGenerator.RecordActions.VERIFY;
    }
  }
  this.recordMgr_.latestEvent = action;

  var delayTime = 0;
  switch (action) {
    case 'enter':
      this.latestEnterTime_ = goog.now();
      return;
    case 'click':
      // TODO(phu): The delay is because click event always comes before the
      // onchange event. We need to figure out a way to resolve this and leave
      // no delay time here.
      delayTime = 300;
      break;
    case 'submit':
      if (goog.now() - this.latestEnterTime_ > 500) {
        // We only record submit event if it's triggered by an enter input.
        return;
      }
      break;
    default:
      break;
  }

  if (rpf.EventsManager.isTakingScreenshots_) {
    this.captureVisibleTab(
        this.recordMgr_.getTestWindowId(),
        goog.partial(
            rpf.MiscHelper.resizeImage,
            goog.bind(this.callBackCaptureTab, this),
            600,
            {'sX': position['x'],
             'sY': position['y'],
             'sWidth': position['width'],
             'sHeight': position['height']}),
        delayTime);

  }

  goog.Timer.callOnce(goog.bind(
      this.writeUserActionToConsole,
      this,
      selectors,
      content,
      request['nodeType'],
      action,
      request['descriptor'],
      request['elemVarName'],
      -1,
      iframeInfo,
      xpaths,
      request['mode'],
      request['className']), delayTime);
};


/**
 * Callback on a request received.
 * @param {Object} request The request object.
 * @param {MessageSender} sender The sender object.
 * @param {function(Object)} sendResponse The response object.
 */
rpf.EventsManager.prototype.callBackOnRequest = function(
    request, sender, sendResponse) {
  if (!request['command']) {
    return;
  }
  var params = request['params'];
  switch (request['command']) {
    case rpf.EventsManager.CmdTypes_.GET_ACTION_INFO:
      this.senderTabId_ = sender.tab.id;
      this.generateCmdBasedOnRecording_(request);
      break;
    case rpf.EventsManager.CmdTypes_.LOG:
      console.log(request['log']);
      break;
    case rpf.EventsManager.CmdTypes_.INIT_READY:
      console.log('Got init ready response from PageUnderPlayback.');
      this.playbackMgr_.setReplayTabReady(true);
      // Assume this is because a following cmd is already being executing.
      if (!this.playbackMgr_.isPreCmdDone()) {
        console.log('Rerun the following cmd after another url change found.');
        this.playbackMgr_.setPreCmdDone(true);
      }
      break;
    case rpf.EventsManager.CmdTypes_.CMD_DONE:
      console.log('Result:' + request['result']);
      if (request['index'] != this.playbackMgr_.getCurrentStep()) {
        console.log('   Returned step:' + request['index'] +
                    '; Expected:' + this.playbackMgr_.getCurrentStep());
        return;
      }
      var result = rpf.EventsManager.ResultTypes_.PASS;
      if (!goog.string.contains(
          request['result'], rpf.EventsManager.ResultTypes_.PASS)) {
        result = rpf.EventsManager.ResultTypes_.FAILED;
        this.playbackMgr_.setFailureLog(request['result']);
      }

      this.playbackMgr_.callBackAfterExecCmds(result, request['result']);
      if (request['realTimeMap']) {
        this.playbackMgr_.realTimeBag = request['realTimeMap'];
      }
      break;
    case rpf.EventsManager.CmdTypes_.BLOCK_VALIDATE:
      console.log('Got block: ' + request['rtnObj']);
      break;
    case rpf.EventsManager.CmdTypes_.MATCH_HTML:
      console.log('  *** The matching html changes to:' + request['html']);
      this.playbackMgr_.setLastMatchHtml(request['html']);
      break;
    case rpf.EventsManager.CmdTypes_.KEY_DOWN:
      console.log('   caught an keydown event!!!!' + request['keyCode']);
      break;
    case rpf.EventsManager.CmdTypes_.KEY_UP:
      //console.log('   caught an keyup event!!!!' + request['keyCode']);
      break;
    default:
      break;
  }
};


/**
 * Automates RPF behaviors to simplify user's steps to update the script.
 * @param {Object} params The parameters map.
 */
rpf.EventsManager.prototype.automateRpf = function(params) {
  switch (params['command']) {
    case Bite.Constants.RPF_AUTOMATION.LOAD_AND_RUN_FROM_LOCAL:
      var stepArr = [];
      var temp = this.automator_.getStepObject(
          Bite.Constants.ListenerDestination.RPF,
          Bite.Constants.CONTROL_CMDS.CREATE_WINDOW,
          {'refresh': true},
          Bite.Constants.COMPLETED_EVENT_TYPES.RPF_CONSOLE_OPENED);
      stepArr.push(temp);

      temp = this.automator_.getStepObject(
          Bite.Constants.ListenerDestination.EVENT_MANAGER,
          Bite.Constants.CONSOLE_CMDS.LOAD_PROJECT_FROM_LOCAL_SERVER,
          {'path': params['path']},
          Bite.Constants.COMPLETED_EVENT_TYPES.PROJECT_SAVED_LOCALLY);
      stepArr.push(temp);

      temp = this.automator_.getStepObject(
          Bite.Constants.ListenerDestination.CONSOLE,
          Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_TEST,
          {'project': params['project'],
           'test': params['testName'],
           'isWeb': false},
          Bite.Constants.COMPLETED_EVENT_TYPES.TEST_LOADED);
      stepArr.push(temp);

      if (params['autoPlay']) {
        // Automatically playback the loaded script.
        temp = this.automator_.getStepObject(
            Bite.Constants.ListenerDestination.CONSOLE,
            Bite.Constants.UiCmds.SHOW_PLAYBACK_RUNTIME,
            {},
            Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_DIALOG_OPENED);
        stepArr.push(temp);

        temp = this.automator_.getStepObject(
            Bite.Constants.ListenerDestination.CONSOLE,
            Bite.Constants.UiCmds.SET_PLAYBACK_ALL,
            {},
            Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_STARTED);
        stepArr.push(temp);
      } else {
        // Highlights on a step and wait for updates.
        temp = this.automator_.getStepObject(
            Bite.Constants.ListenerDestination.CONSOLE,
            Bite.Constants.UiCmds.HIGHLIGHT_LINE,
            {'testName': params['testName'], 'stepId': params['stepId']},
            Bite.Constants.COMPLETED_EVENT_TYPES.HIGHLIGHTED_LINE);
        stepArr.push(temp);
      }
      this.automator_.start(stepArr);
      break;
    case Bite.Constants.RPF_AUTOMATION.PLAYBACK_MULTIPLE:
      if (params['projectName'] && params['location']) {
        this.startAutoPlayMultipleTests_(
            params['projectName'], params['location'], {}, true);
      } else {
        // Assume all of the tests are from the same project for now.
        // This will no longer be true once we open suite creation to users.
        var testInfo = {};
        for (var name in params['data']) {
          testInfo = params['data'][name];
        }
        testInfo = goog.json.parse(testInfo);
        this.startAutoPlayMultipleTests_(
            testInfo['projectName'], testInfo['testLocation'], params['data']);
      }
      break;
    case Bite.Constants.RPF_AUTOMATION.AUTOMATE_SINGLE_SCRIPT:
      this.automateSingleScript_(
          params['projectName'], params['location'], params['scriptName'],
          params['autoPlay']);
      break;
  }
};


/**
 * Start the automation to load and possibly playback a script.
 * @param {string} project The project name.
 * @param {string} location Where the project comes from.
 * @param {string} script The script name.
 * @param {boolean} autoPlay Whether to auto play the script.
 * @private
 */
rpf.EventsManager.prototype.automateSingleScript_ = function(
    project, location, script, autoPlay) {
  var stepArr = [];
  var temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.RPF,
      Bite.Constants.CONTROL_CMDS.CREATE_WINDOW,
      {'refresh': true},
      Bite.Constants.COMPLETED_EVENT_TYPES.RPF_CONSOLE_OPENED);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.EVENT_MANAGER,
      Bite.Constants.CONSOLE_CMDS.STOP_GROUP_TESTS,
      {},
      Bite.Constants.COMPLETED_EVENT_TYPES.STOPPED_GROUP_TESTS);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.CONSOLE,
      Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_TEST,
      {'project': project,
       'test': script,
       'isWeb': location == 'web'},
      Bite.Constants.COMPLETED_EVENT_TYPES.TEST_LOADED);
  stepArr.push(temp);

  if (autoPlay) {
    // Automatically playback the loaded script.
    temp = this.automator_.getStepObject(
        Bite.Constants.ListenerDestination.CONSOLE,
        Bite.Constants.UiCmds.SHOW_PLAYBACK_RUNTIME,
        {},
        Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_DIALOG_OPENED);
    stepArr.push(temp);

    temp = this.automator_.getStepObject(
        Bite.Constants.ListenerDestination.CONSOLE,
        Bite.Constants.UiCmds.SET_PLAYBACK_ALL,
        {},
        Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_STARTED);
    stepArr.push(temp);
  }
  this.automator_.start(stepArr);
};


/**
 * Start the automation to playback multiple tests.
 * @param {string} project The project name.
 * @param {string} location Where the project comes from.
 * @param {Object} testInfo The tests info.
 * @param {boolean=} opt_runAll Whether to run all of the tests.
 * @private
 */
rpf.EventsManager.prototype.startAutoPlayMultipleTests_ = function(
    project, location, testInfo, opt_runAll) {
  var stepArr = [];
  var temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.RPF,
      Bite.Constants.CONTROL_CMDS.CREATE_WINDOW,
      {'refresh': true},
      Bite.Constants.COMPLETED_EVENT_TYPES.RPF_CONSOLE_OPENED);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.EVENT_MANAGER,
      Bite.Constants.CONSOLE_CMDS.STOP_GROUP_TESTS,
      {},
      Bite.Constants.COMPLETED_EVENT_TYPES.STOPPED_GROUP_TESTS);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.CONSOLE,
      Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_PROJECT,
      {'project': project,
       'isWeb': location == 'web'},
      Bite.Constants.COMPLETED_EVENT_TYPES.PROJECT_LOADED);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.CONSOLE,
      Bite.Constants.UiCmds.AUTOMATE_PLAY_MULTIPLE_TESTS,
      {'testInfo': testInfo,
       'runAll': opt_runAll || false},
      Bite.Constants.COMPLETED_EVENT_TYPES.RUN_PLAYBACK_STARTED);
  stepArr.push(temp);
  this.automator_.start(stepArr);
};


/**
 * Dispatches the given event.
 * @param {Bite.Constants.COMPLETED_EVENT_TYPES} eventType The event type.
 */
rpf.EventsManager.prototype.dispatchEventOnAutomator_ = function(eventType) {
  this.automator_.getEventTarget().dispatchEvent(eventType);
  this.workerAutomator_.getEventTarget().dispatchEvent(eventType);
};


/**
 * Callback on the controlling messages received.
 * @param {Object} request The request object.
 * @param {MessageSender} sender The sender object.
 * @param {function(Object)} sendResponse The response function.
 */
rpf.EventsManager.prototype.callBackOnMessageReceived = function(
    request, sender, sendResponse) {
  if (!request['command']) {
    return;
  }
  var params = request['params'];
  switch (request['command']) {
    case Bite.Constants.CONSOLE_CMDS.EVENT_COMPLETED:
      this.dispatchEventOnAutomator_(params['eventType']);
      break;
    case Bite.Constants.CONSOLE_CMDS.AUTOMATE_RPF:
      this.automateRpf(params);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_CONSOLE_TAB_ID:
      this.setConsoleTabId(params['id']);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_LOGS_AS_STRING:
      sendResponse(this.logger_.getLogsAsString());
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_LOG_AND_HTML:
      this.logger_.saveLogAndHtml(
          params['log'], params['level'], params['color']);
      break;
    case Bite.Constants.CONSOLE_CMDS.EXECUTE_SCRIPT_IN_RECORD_PAGE:
      this.executeScriptStr_(
          this.recordMgr_.getTestTabId(),
          params['code'],
          params['allFrames']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_PLAYBACK_INTERVAL:
      this.playbackMgr_.setPlaybackInterval(params['interval']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_DEFAULT_TIMEOUT:
      this.playbackMgr_.setDefaultTimeout(params['time']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_MAXIMUM_RETRY_TIME:
      this.playbackMgr_.setMaximumRetryTime(params['time']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_TAKE_SCREENSHOT:
      this.setTakeScreenshot(params['isTaken']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_USE_XPATH:
      this.playbackMgr_.setUseXpath(params['use']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT_LOCALLY:
      this.saveLoadMgr_.saveProjectLocally(sendResponse || goog.nullFunction,
                                           params['project']);
      break;
    case Bite.Constants.CONSOLE_CMDS.LOAD_PROJECT_FROM_LOCAL_SERVER:
      this.saveLoadMgr_.loadProjectFromLocalServer(
          params['path'],
          goog.bind(this.saveLoadMgr_.saveProjectLocally,
                    this.saveLoadMgr_,
                    sendResponse || goog.nullFunction));
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_JSON_LOCALLY:
      this.saveLoadMgr_.saveJsonLocally(
          params['testName'],
          this.scriptMgr_.createJsonObj(
              params['testName'],
              params['startUrl'],
              params['scripts'],
              params['datafile'],
              '',
              params['projectName'],
              []),
          params['projectName'],
          sendResponse,
          params['userLib']);
      break;
    case Bite.Constants.CONSOLE_CMDS.UPDATE_ON_WEB:
      this.saveLoadMgr_.updateOnWeb(
          params['testName'],
          params['startUrl'],
          params['scripts'],
          params['datafile'],
          params['userLib'],
          params['projectName'],
          params['screenshots'],
          params['scriptId'],
          sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.DELETE_CMD:
      var scriptLen = this.playbackMgr_.getScriptsLen();
      this.playbackMgr_.removeStep(params['deleteLine'] - 1);
      sendResponse(
          {'needOverride': scriptLen == params['deleteLine']});
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_LAST_MATCH_HTML:
      sendResponse({'html': this.playbackMgr_.getLastMatchHtml()});
      break;
    case Bite.Constants.CONSOLE_CMDS.FINISH_CURRENT_RUN:
      this.playbackMgr_.finishCurrentRun(
          params['status'],
          params['log']);
      break;
    case Bite.Constants.CONSOLE_CMDS.CALLBACK_AFTER_EXEC_CMDS:
      this.playbackMgr_.callBackAfterExecCmds(
          params['status']);
      break;
    case Bite.Constants.CONSOLE_CMDS.PREPARE_RECORD_PLAYBACK_PAGE:
      this.recordMgr_.setTestTabId(this.playbackMgr_.getPlaybackTabId());
      this.recordMgr_.setTestWindowId(this.playbackMgr_.getPlaybackWindowId());
      sendResponse({});
      break;
    case Bite.Constants.CONSOLE_CMDS.USER_SET_STOP:
      this.playbackMgr_.userSetStop();
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_INFO_MAP_IN_PLAYBACK:
      this.playbackMgr_.setInfoMap(params['infoMap']);
      break;
    case Bite.Constants.CONSOLE_CMDS.USER_SET_PAUSE:
      this.playbackMgr_.userSetPause();
      break;
    case Bite.Constants.CONSOLE_CMDS.FETCH_DATA_FROM_BACKGROUND:
      sendResponse({'userId': this.getUserId()});
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_USER_SPECIFIED_PAUSE_STEP:
      this.playbackMgr_.setUserSpecifiedPauseStep(
          params['userPauseStep']);
      break;
    case Bite.Constants.CONSOLE_CMDS.UPDATE_TEST_RESULT_ON_SERVER:
      this.workerMgr_.increaseFinishedTestsNum();
      this.sendMessageToConsole_(
          {'command': Bite.Constants.UiCmds.SET_FINISHED_TESTS_NUMBER,
           'params': {'num': this.workerMgr_.getFinishedTestsNum()}});
      this.playbackMgr_.updateTestResultOnServer();
      break;
    case Bite.Constants.CONSOLE_CMDS.CHECK_PLAYBACK_OPTION_AND_RUN:
      if (params['preparationDone']) {
        this.playbackMgr_.setPreparationDone(!!params['preparationDone']);
      }
      this.playbackMgr_.checkPlaybackOptionAndRun(
          params['method'],
          params['startUrl'],
          params['scripts'],
          params['datafile'],
          params['userLib'],
          params['infoMap'],
          params['continueOnFailure'],
          params['testName'],
          params['testId'],
          params['projectName'],
          params['testLocation']);
      sendResponse({'isPrepDone': this.playbackMgr_.isPreparationDone()});
      break;
    case Bite.Constants.CONSOLE_CMDS.INSERT_CMDS_WHILE_PLAYBACK:
      this.playbackMgr_.insertCmdsWhilePlayback(
          params['scriptStr'],
          params['data']);
      break;
    case Bite.Constants.CONSOLE_CMDS.START_RECORDING:
      this.recordMgr_.startRecording(params['info']);
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_TAB_AND_START_RECORDING:
      var started = this.recordMgr_.startRecording(
          null, sender.tab.id, sender.tab.windowId);
      if (started) {
        this.setConsoleTabId(sender.tab.id);
      }
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_ZIP:
      this.saveLoadMgr_.saveZip(params['files'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_JSON_LOCALLY:
      this.saveLoadMgr_.getJsonLocally(
          params['name'], params['projectName'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_PROJECT_NAMES_FROM_WEB:
      this.saveLoadMgr_.getProjectNamesFromWeb(sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_PROJECT_NAMES_FROM_LOCAL:
      this.saveLoadMgr_.getProjectNamesFromLocal(sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_ALL_FROM_WEB:
      this.saveLoadMgr_.getAllFromWeb(
          params['project'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_PROJECT:
      this.saveLoadMgr_.getProject(params['name'], this.userId_, sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_LOCAL_PROJECT:
      this.saveLoadMgr_.getLocalProject(
          params['name'], this.userId_, sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT_METADATA_LOCALLY:
      this.saveLoadMgr_.saveProjectMetadataLocally(
          params['name'], params['data'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT:
      this.saveLoadMgr_.saveProject(params['name'], params['data'],
                                    sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_TEST_NAMES_LOCALLY:
      sendResponse(
          {'name': params['project'],
           'tests': this.saveLoadMgr_.getTestNamesLocally(params['project'])});
      break;
    case Bite.Constants.CONSOLE_CMDS.TEST_DESCRIPTOR:
      this.recordMgr_.testDescriptor(params['descriptor']);
      break;
    case Bite.Constants.CONSOLE_CMDS.RUN_TEST:
      this.playbackMgr_.runTest(
          params['startUrl'],
          params['scripts'],
          params['datafile'],
          params['userLib']);
      break;
    case Bite.Constants.CONSOLE_CMDS.RUN_GROUP_TESTS:
      this.workerMgr_.runGroupTests(params['testNames'], params['tests'],
                                    params['runName'], params['location']);
      break;
    case Bite.Constants.CONSOLE_CMDS.STOP_GROUP_TESTS:
      this.workerMgr_.stopGroupTests();
      this.dispatchEventOnAutomator_(
          Bite.Constants.COMPLETED_EVENT_TYPES.STOPPED_GROUP_TESTS);
      break;
    case Bite.Constants.CONSOLE_CMDS.GENERATE_NEW_COMMAND:
      var scriptInfo = this.codeGen_.generateScriptAndDataFileForCmd(
          params['selectors'],
          params['content'],
          params['nodeType'],
          params['action'],
          params['descriptor'],
          params['elemVarName'],
          params['iframeInfo'],
          params['xpaths'],
          params['className']);
      sendResponse({'scriptInfo': scriptInfo});
      break;
    case Bite.Constants.CONSOLE_CMDS.DELETE_TEST_ON_WTF:
      this.saveLoadMgr_.deleteTestOnWtf(params['jsonIds'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.DELETE_TEST_LOCAL:
      this.saveLoadMgr_.deleteLocalTest(
          params['project'], params['testNames'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.GET_JSON_FROM_WTF:
      this.saveLoadMgr_.getJsonFromWTF(params['jsonId'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.STOP_RECORDING:
      this.recordMgr_.stopRecording();
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_RECORDING_TAB:
      this.recordMgr_.setRecordingTab();
      break;
    case Bite.Constants.CONSOLE_CMDS.ENTER_UPDATER_MODE:
      this.initAllRecordListeners();
      this.recordMgr_.enterUpdaterMode();
      break;
    case Bite.Constants.CONSOLE_CMDS.SET_ACTION_CALLBACK:
      this.onReceiveActionCallback_ = sendResponse;
      break;
    case Bite.Constants.CONSOLE_CMDS.END_UPDATER_MODE:
      this.removeAllListeners();
      this.recordMgr_.endUpdaterMode();
      break;
    case Bite.Constants.CONSOLE_CMDS.RECORD_PAGE_LOADED_COMPLETE:
      this.setInjectedTab_(sender.tab.id);
      break;
    case Bite.Constants.CONSOLE_CMDS.TEST_LOCATOR:
      this.recordMgr_.testLocator(params['locators'], sendResponse);
      break;
    case Bite.Constants.CONSOLE_CMDS.START_AUTO_RECORD:
      goog.Timer.callOnce(goog.bind(this.testAutomation, this), 1500);
      break;
    case Bite.Constants.CONSOLE_CMDS.CHECK_READY_TO_RECORD:
      this.recordMgr_.checkTestTabExists(sendResponse, this.injectedTabs_);
      break;
  }
};


/**
 * Sets the console tab id.
 * @param {number} id The tab id.
 * @private
 */
rpf.EventsManager.prototype.setInjectedTab_ = function(id) {
  if (id) {
    this.injectedTabs_[id] = true;
  }
};


/**
 * Sets the console tab id.
 * @param {number} id The console's tab id.
 * @export
 */
rpf.EventsManager.prototype.setConsoleTabId = function(id) {
  this.consoleTabId_ = id;
};


/**
 * Gets the console tab id.
 * @return {number} The console's tab id.
 * @export
 */
rpf.EventsManager.prototype.getConsoleTabId = function() {
  return this.consoleTabId_;
};


/**
 * Gets the user id.
 * @return {string} The user id.
 * @export
 */
rpf.EventsManager.prototype.getUserId = function() {
  return this.userId_;
};


/**
 * Sets the user id.
 * @param {string} id The user id.
 * @export
 */
rpf.EventsManager.prototype.setUserId = function(id) {
  this.userId_ = id;
};


/**
 * Callback after capturing a tab screenshot.
 * @param {string} dataUrl The screenshot data url.
 * @param {string} iconUrl The icon data url.
 * @export
 */
rpf.EventsManager.prototype.callBackCaptureTab = function(dataUrl, iconUrl) {
  this.sendMessageToConsole_(
      {'command': Bite.Constants.UiCmds.ADD_SCREENSHOT,
       'params': {'dataUrl': dataUrl,
                  'iconUrl': iconUrl}});
};


/**
 * Callback after the tab under record is created.
 * @param {Tab} tab The tab.
 * @private
 */
rpf.EventsManager.prototype.recordTabCreatedCallback_ = function(tab) {
  this.recordMgr_.setRecordingTab(tab.id, tab.windowId);
};


/**
 * Creates a new tab for recording.
 * @private
 */
rpf.EventsManager.prototype.createTabUnderRecord_ = function() {
  chrome.tabs.create(
      {'url': rpf.EventsManager.defaultRecordUrl_,
       'selected': true},
      goog.bind(this.recordTabCreatedCallback_, this));
};


/**
 * Callback after the tab under test is removed.
 * @param {number} tabId The tab id.
 * @export
 */
rpf.EventsManager.prototype.callBackAddTestTabRemoved = function(tabId) {
  if (this.recordMgr_.getTestTabId() == tabId) {
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.RECORD_TAB_CLOSED,
         'params': {}});
  }
};

