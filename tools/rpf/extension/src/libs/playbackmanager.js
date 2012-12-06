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
 * @fileoverview This file contains logic to playback a script.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.PlayBackManager');

goog.require('Bite.Constants');
goog.require('goog.Timer');
goog.require('goog.events');
goog.require('goog.string');
goog.require('rpf.CodeGenerator');
goog.require('rpf.ConsoleLogger');
goog.require('rpf.ScriptManager');



/**
 * A class for playing back the recorded script.
 * @param {rpf.ScriptManager} scriptMgr The script manager.
 * @param {function():boolean} isLoadingReadyForPlayback Whether loading is
 *     ready.
 * @param {function()} removeTabUpdatedListener Removes the on-tab-updated
 *     listener.
 * @param {function()} addTabUpdatedListener The function to add the
 *     onTabUpdated listener.
 * @param {rpf.ConsoleLogger} logger The console logger instance.
 * @param {function(Object, function(*)=)} sendMessageToConsole The
 *     function to send message to console world.
 * @param {function(Object, MessageSender, function(Object))} eventMgrListener
 *     The listener registered in eventsManager.
 * @constructor
 * @export
 */
rpf.PlayBackManager = function(
    scriptMgr, isLoadingReadyForPlayback, removeTabUpdatedListener,
    addTabUpdatedListener, logger, sendMessageToConsole,
    eventMgrListener) {
  /**
   * The script manager.
   * @type {rpf.ScriptManager}
   * @private
   */
  this.scriptMgr_ = scriptMgr;

  /**
   * The console logger.
   * @type {rpf.ConsoleLogger}
   * @private
   */
  this.logger_ = logger;

  /**
   * The function to send message to console world.
   * @type {function(Object, function(*)=)}
   * @private
   */
  this.sendMessageToConsole_ = sendMessageToConsole;

  /**
   * The event lisnener registered on event manager.
   * @type {function(Object, MessageSender, function(Object))}
   * @private
   */
  this.eventMgrListener_ = eventMgrListener;

  /**
   * The function to check whether loading is ready.
   * @type {function():boolean}
   * @private
   */
  this.isLoadingReadyForPlayback_ = isLoadingReadyForPlayback;

  /**
   * The function to remove the onTabUpdated listener when playback is done.
   * @type {function()}
   * @private
   */
  this.removeTabUpdatedListener_ = removeTabUpdatedListener;

  /**
   * The function to add the onTabUpdated listener.
   * @type {function()}
   * @private
   */
  this.addTabUpdatedListener_ = addTabUpdatedListener;

  /**
   * The tab id of the page under playback.
   * @type {number}
   * @private
   */
  this.playbackTabId_ = 0;

  /**
   * The start url of a playback script.
   * @type {string}
   * @private
   */
  this.playbackStartUrl_ = '';

  /**
   * The current step number.
   * @type {number}
   * @private
   */
  this.currentStep_ = 0;

  /**
   * The current running test name.
   * @type {string}
   * @private
   */
  this.currentTestName_ = '';

  /**
   * The current running project name.
   * @type {string}
   * @private
   */
  this.currentProjectName_ = '';

  /**
   * The current running test's location.
   * @type {string}
   * @private
   */
  this.currentTestLocation_ = '';

  /**
   * The current running test id.
   * @type {string}
   * @private
   */
  this.currentTestId_ = '';

  /**
   * The current run status.
   * @type {string}
   * @private
   */
  this.currentRunStatus_ = '';

  /**
   * The command of current step.
   * @type {string}
   * @private
   */
  this.currentCmd_ = '';

  /**
   * whether tab updates ready.
   * @type {boolean}
   * @private
   */
  this.replayTabReady_ = true;

  /**
   * Whether the previous command is done.
   * @type {boolean}
   * @private
   */
  this.previousCmdDone_ = true;

  /**
   * Whether ready for command after sleep.
   * @type {boolean}
   * @private
   */
  this.sleepReady_ = true;

  /**
   * Whether ready for command after user pause.
   * @type {boolean}
   * @private
   */
  this.userPauseReady_ = true;

  /**
   * Whether is in step playback mode.
   * @type {boolean}
   * @private
   */
  this.stepMode_ = false;

  /**
   * Whether user explicitly stops the run.
   * @type {boolean}
   * @private
   */
  this.userStop_ = false;

  /**
   * Whether uses xpath.
   * @type {boolean}
   * @private
   */
  this.useXpath_ = false;

  /**
   * The scripts for playback.
   * @type {Array}
   * @private
   */
  this.scripts_ = [];

  /**
   * The corresponding datafile for playback.
   * @type {string}
   * @private
   */
  this.datafile_ = '';

  /**
   * The user specified library for playback.
   * @type {string}
   * @private
   */
  this.userLib_ = '';

  /**
   * The start time for each command including overhead.
   * @type {number}
   * @private
   */
  this.startTimeEachRun_ = 0;

  /**
   * The timer object for playback.
   * @type {goog.Timer}
   * @private
   */
  this.playbackTimer_ =
      new goog.Timer(rpf.PlayBackManager.rpfPlaybackInterval_);

  /**
   * Whether is playing back a script.
   * @type {boolean}
   * @private
   */
  this.onPlayback_ = false;


  /**
   * The window id of the page under playback.
   * @type {number}
   * @private
   */
  this.playbackWinId_ = 0;

  /**
   * The retried times.
   * @type {number}
   * @private
   */
  this.failureRetryTimes_ = 0;

  /**
   * The user specified sleep time.
   * @type {number}
   * @private
   */
  this.userSetSleepTime_ = 0;

  /**
   * The user specified sleep starts time.
   * @type {number}
   * @private
   */
  this.userSetSleepStart_ = 0;

  /**
   * The user specified step for a pause.
   * @type {number}
   * @private
   */
  this.userSpecifiedPauseStep_ = -1;

  /**
   * Whether the preparation for playback is done.
   * @type {boolean}
   * @private
   */
  this.preparationDone_ = false;

  /**
   * The last matching html.
   * @type {string}
   * @private
   */
  this.lastMatchHtml_ = '';

  /**
   * The maximum retry times.
   * @type {number}
   * @private
   */
  this.maxRetryTimes_ = rpf.PlayBackManager.FAILURE_TOTAL_RETRY_TIMES_;

  /**
   * The default timeout.
   * @type {number}
   * @private
   */
  this.defaultTimeout_ = rpf.PlayBackManager.PLAYBACK_TIMEOUT_EACHRUN_;

  /**
   * The step timeout.
   * @type {number}
   * @private
   */
  this.eachCmdTimeout_ = rpf.PlayBackManager.EACH_CMD_TIMEOUT_;

  /**
   * The original datafile.
   * @type {string}
   * @private
   */
  this.originalDataFile_ = '';

  /**
   * The original user lib.
   * @type {string}
   * @private
   */
  this.originalUserLib_ = '';

  /**
   * The failure reason.
   * @type {string}
   * @private
   */
  this.failureReason_ = '';

  /**
   * The realtime parameters bag.
   * @type string
   * @private
   */
  this.realTimeBack_ = '';

  /**
   * The failure log.
   * @type {string}
   * @private
   */
  this.failureLog_ = '';

  /**
   * The failure URL.
   * @type {string}
   * @private
   */
  this.failureUrl_ = '';

  /**
   * The elapsed time.
   * @type {string}
   * @private
   */
  this.elapsedTime_ = '';

  /**
   * The newly generated code.
   * @type {string}
   * @private
   */
  this.newCode_ = '';

  /**
   * The info map.
   * @type {Object}
   * @private
   */
  this.infoMap_ = {};

  /**
   * Whether it should continue or show updating options UI on failure.
   * @type {boolean}
   * @private
   */
  this.continueOnFailure_ = false;

  /**
   * Whether to playback in incognito mode.
   * @type {boolean}
   * @private
   */
  this.playbackIncognito_ = false;
};


/**
 * @const The maximum retry times.
 * @type {number}
 * @private
 */
rpf.PlayBackManager.FAILURE_TOTAL_RETRY_TIMES_ = 5;


/**
 * The default playback interval.
 * @type {number}
 * @private
 */
rpf.PlayBackManager.rpfPlaybackInterval_ = Bite.Constants.RPF_PLAYBACK.INTERVAL;


/**
 * @const The default timeout for each client command.
 * @type {number}
 * @private
 */
rpf.PlayBackManager.EACH_CMD_TIMEOUT_ = 6 * 1000;


/**
 * @const The default timeout for every command including all the overheads.
 * @type {number}
 * @private
 */
rpf.PlayBackManager.PLAYBACK_TIMEOUT_EACHRUN_ =
    Bite.Constants.RPF_PLAYBACK.REDIRECTION_TIMEOUT;


/**
 * Sets up the callbacks for worker manager.
 * @param {function():number} getAutoRunningTestId Get the auto test id.
 * @param {function(Bite.Constants.WorkerResults, number, string, string=)}
 *     runNext The function to run the next job.
 * @export
 */
rpf.PlayBackManager.prototype.setupWorkerCallbacks = function(
    getAutoRunningTestId, runNext) {
  this.getAutoRunningTestId_ = getAutoRunningTestId;
  this.runNext_ = runNext;
};


/**
 * Sets the newly generated code.
 * @param {string} code The newly generated code.
 * @export
 */
rpf.PlayBackManager.prototype.setNewCode = function(code) {
  this.newCode_ = code;
};


/**
 * Sets the playback interval.
 * @param {number} sec The interval in seconds.
 * @export
 */
rpf.PlayBackManager.prototype.setPlaybackInterval = function(sec) {
  rpf.PlayBackManager.rpfPlaybackInterval_ = sec * 1000;
};


/**
 * Gets the current date.
 * @return {Date} A new date object.
 * @private
 */
rpf.PlayBackManager.prototype.getDate_ = function() {
  return new Date();
};


/**
 * Sets the start url for playback.
 * @param {string} url The start url.
 * @export
 */
rpf.PlayBackManager.prototype.setStartUrl = function(url) {
  this.playbackStartUrl_ = url;
};


/**
 * Gets all the commands from a script string.
 * @param {string} scriptStr The script string.
 * @return {Array} An array of commands.
 * @export
 */
rpf.PlayBackManager.prototype.getAllStepsFromScript = function(scriptStr) {
  // By default, assume each line is a command.
  var allSteps = [];
  var allRawSteps = scriptStr.split('\n');
  for (var i = 0; i < allRawSteps.length; i++) {
    allSteps.push(allRawSteps[i]);
  }
  return allSteps;
};


/**
 * Init the resuming playbck.
 * @private
 */
rpf.PlayBackManager.prototype.initResumePlayback_ = function() {
  this.addTabUpdatedListener_();
  this.replayTabReady_ = false;
  this.initReplayPage(this.callBackAfterTabUpdated);
  this.startTimer();
};


/**
 * Starts running a test script including the preparation.
 * @param {string} url The start url.
 * @param {string} scriptStr The raw script string.
 * @param {string} datafile The corresponding data file.
 * @param {string} userLib The user specified library.
 * @export
 */
rpf.PlayBackManager.prototype.runTest = function(
    url, scriptStr, datafile, userLib) {
  if ('string' != typeof(scriptStr)) {
    var log = 'Error: script string type is ' + typeof(scriptStr);
    this.logger_.saveLogAndHtml(log,
                                rpf.ConsoleLogger.LogLevel.ERROR,
                                rpf.ConsoleLogger.Color.RED);
    throw new Error(log);
  }

  this.setStartUrl(url);
  this.preparationDone_ = false;
  this.scripts_ = this.getAllStepsFromScript(scriptStr);
  this.datafile_ = datafile;
  this.originalDataFile_ = datafile;
  this.userLib_ = userLib;
  this.originalUserLib_ = userLib;
  if (this.playbackTimer_.enabled) {
    this.playbackTimer_.stop();
  }
  this.playbackTimer_ =
      new goog.Timer(rpf.PlayBackManager.rpfPlaybackInterval_);
  this.onPlayback_ = true;
  this.replayTabReady_ = true;
  this.previousCmdDone_ = true;
  this.realTimeBack_ = '';
  this.failureRetryTimes_ = 0;
  this.addTabUpdatedListener_();
  this.startReplay_(null);
};


/**
 * Starts replay by creating a playback window.
 * @param {?function()=} opt_callback The optional callback function.
 * @private
 */
rpf.PlayBackManager.prototype.startReplay_ = function(opt_callback) {
  // If screen.width is twice larger than screen.height,
  // then we could just use half of the screen width.
  var callback = opt_callback || null;
  var playbackWinWidth = screen.width;
  if (playbackWinWidth > 2 * screen.height) {
    playbackWinWidth = screen.width / 2;
  }
  chrome.windows.create(
      {url: this.playbackStartUrl_,
       width: playbackWinWidth - 650,
       height: screen.height - 50,
       top: 25,
       left: 650,
       incognito: this.playbackIncognito_},
      goog.bind(function(win) {
        this.callbackStartReplayOne_(callback, win);
      }, this));
};


/**
 * Sets the playback window id.
 * @param {function()} callback The callback function.
 * @param {Object} win The window object.
 * @private
 */
rpf.PlayBackManager.prototype.callbackStartReplayOne_ = function(
    callback, win) {
  this.playbackWinId_ = win.id;
  chrome.tabs.getAllInWindow(win.id,
                             goog.bind(function(tabs) {
                               this.callbackStartReplayTwo_(callback,
                                                            tabs);
                             }, this));
};


/**
 * Sets the playback tab id.
 * @param {function()} callback The callback function.
 * @param {Array} tabs The tabs of the playback window.
 * @private
 */
rpf.PlayBackManager.prototype.callbackStartReplayTwo_ = function(
    callback, tabs) {
  this.playbackTabId_ = tabs[0].id;
  if (callback) {
    callback();
  } else {
    this.initReplayPage(this.kickOffTest_);
  }
};


/**
 * Inits the playback page by executing content scripts.
 * @param {function()} callbackFunc The callback function after init.
 * @export
 */
rpf.PlayBackManager.prototype.initReplayPage = function(callbackFunc) {
  chrome.tabs.executeScript(
     this.playbackTabId_,
     {code: 'try {removeListener();} catch(e) {console.log(e.message);}',
      allFrames: true});
  this.callbackInitReplayPageTwo_(callbackFunc);
};


/**
 * Executes user library if specified.
 * @param {function()} callbackFunc The callback function after init.
 * @private
 */
rpf.PlayBackManager.prototype.callbackInitReplayPageTwo_ = function(
    callbackFunc) {
  if (this.userLib_) {
    chrome.tabs.executeScript(this.playbackTabId_,
                              {code: this.userLib_,
                               allFrames: true},
                              goog.bind(callbackFunc, this));
  } else {
    if (callbackFunc) {
      callbackFunc.apply(this, []);
    }
  }
};


/**
 * Kicks off the test after all the preparation.
 * @private
 */
rpf.PlayBackManager.prototype.kickOffTest_ = function() {
  this.currentStep_ = 0;
  // Make sure the initial page loading is also included as part of test run.
  this.startTimeEachRun_ = this.getDate_().getTime();
  this.eachCmdTimeout_ = this.defaultTimeout_;
  this.replayTabReady_ = false;
  this.preparationDone_ = true;
  this.playbackTimer_.start();
  goog.events.listen(this.playbackTimer_, goog.Timer.TICK,
                     goog.bind(this.waitForElementReadyAndExecCmds, this));
};


/**
 * Checks the tab updates ready.
 * @return {boolean} Whether the page is ready.
 * @private
 */
rpf.PlayBackManager.prototype.checkPageReady_ = function() {
  return this.replayTabReady_;
};


/**
 * Checks the previous command is done.
 * @return {boolean} Whether the previous command is done.
 * @export
 */
rpf.PlayBackManager.prototype.isPreCmdDone = function() {
  return this.previousCmdDone_;
};


/**
 * Sets the previous command is done.
 * @param {boolean} done Whether the previous command is done.
 * @export
 */
rpf.PlayBackManager.prototype.setPreCmdDone = function(done) {
  this.previousCmdDone_ = done;
};


/**
 * Sets whether to use xpath.
 * @param {boolean} use Whether uses the xpath.
 * @export
 */
rpf.PlayBackManager.prototype.setUseXpath = function(use) {
  this.useXpath_ = use;
};


/**
 * Checks the user pause is done.
 * @return {boolean} Whether the user pause is done.
 * @private
 */
rpf.PlayBackManager.prototype.checkUserPauseReady_ = function() {
  return !(this.stepMode_ && !this.userPauseReady_);
};


/**
 * @return {number} Gets the current step number.
 * @export
 */
rpf.PlayBackManager.prototype.getCurrentStep = function() {
  return this.currentStep_;
};


/**
 * @param {number} step Sets the current step number.
 * @export
 */
rpf.PlayBackManager.prototype.setCurrentStep = function(step) {
  this.currentStep_ = step;
};


/**
 * Sets the maximum retry times.
 * @param {number=} opt_times The maximum times for failure retry.
 * @export
 */
rpf.PlayBackManager.prototype.setMaximumRetryTime = function(opt_times) {
  var maxTimes = 0;
  if (opt_times != 0) {
    maxTimes = opt_times || rpf.PlayBackManager.FAILURE_TOTAL_RETRY_TIMES_;
  }
  this.maxRetryTimes_ = maxTimes;
};


/**
 * Sets the default time out.
 * @param {number=} opt_timeout The default time out.
 * @export
 */
rpf.PlayBackManager.prototype.setDefaultTimeout = function(opt_timeout) {
  var timeout = opt_timeout || rpf.PlayBackManager.PLAYBACK_TIMEOUT_EACHRUN_;
  this.defaultTimeout_ = timeout;
};


/**
 * Gets the length of scripts.
 * @return {number} The length.
 * @export
 */
rpf.PlayBackManager.prototype.getScriptsLen = function() {
  return this.scripts_.length;
};


/**
 * Removes a step from scripts_.
 * @param {number} index The index to be removed from scripts.
 * @export
 */
rpf.PlayBackManager.prototype.removeStep = function(index) {
  this.scripts_.splice(index, 1);
};


/**
 * Checks the sleep is done and updates info if not.
 * @return {boolean} Whether the sleep is done.
 * @private
 */
rpf.PlayBackManager.prototype.checkSleepReady_ = function() {
  if (!this.sleepReady_) {
    var now = this.getDate_().getTime();
    if (now - this.userSetSleepStart_ >= this.userSetSleepTime_) {
      this.sleepReady_ = true;
      this.userSetSleepStart_ = 0;
      this.userSetSleepTime_ = 0;
    }
  }
  return this.sleepReady_;
};


/**
 * Creates the actual playback script which is consisted of
 * both script and test data parts.
 * @param {string} datafile The test data.
 * @return {string} The real script for playback.
 * @export
 */
rpf.PlayBackManager.prototype.createPlayBackScript = function(datafile) {
  var index = 0;
  // By default, assign the first data value.
  return goog.string.buildString(
      'var ContentMap = {};', datafile,
      'try { for (var v in ContentMap) {',
      'if (typeof(ContentMap[v]) == "object")',
      '{ ContentMap[v] = unescape(ContentMap[v][',
      index, ']);} else if (typeof(ContentMap[v]) == "string")',
      ' {ContentMap[v] = unescape(ContentMap[v]);}} } catch(e) ',
      '{console.log(e.toString())}',
      'var cmdIndex = ', this.currentStep_, ';',
      'window.ContentMap = ContentMap;');
};


/**
 * Sets the user pause status.
 * @param {boolean} ready Whether the pause is done.
 * @export
 */
rpf.PlayBackManager.prototype.setUserPauseReady = function(ready) {
  this.userPauseReady_ = ready;
  if (ready) {
    this.startTimer();
  } else {
    this.stopTimer();
  }
};


/**
 * Sets whether is in step mode.
 * @param {boolean} stepMode Whether is step mode.
 * @export
 */
rpf.PlayBackManager.prototype.setStepMode = function(stepMode) {
  this.stepMode_ = stepMode;
  if (!stepMode) {
    this.startTimeEachRun_ = this.getDate_().getTime();
  }
};


/**
 * Sets the elapsed time.
 * @private
 */
rpf.PlayBackManager.prototype.setElapseTime_ = function() {
  this.elapsedTime_ =
      parseInt((this.getDate_().getTime() -
                this.startTimeEachRun_) / 1000, 10) + ' seconds';
};


/**
 * Checks if it's ready to play the next command.
 * @return {boolean} Whether ready for the next command.
 * @private
 */
rpf.PlayBackManager.prototype.checkReadyForNext_ = function() {
  var urlChange = this.checkPageReady_();
  var preCmdDone = this.isPreCmdDone();
  var sleepReady = this.checkSleepReady_();
  var userPauseReady = this.checkUserPauseReady_();
  var logText = '';
  this.elapsedTime_ = '';
  if (this.startTimeEachRun_ != 0) {
    this.setElapseTime_();
  }

  if (!urlChange) {
    logText = ('The url change has not finished (If this is an issue, ' +
               'you could click the pause button and then delete or insert' +
               ' new recordings). Elapsed: ' +
               this.elapsedTime_);
    console.log(logText);
    this.updateRuntimeStatus_(logText, 'red');
  }
  if (!preCmdDone) {
    logText = 'The previous command has not finished. Elapsed: ' +
        this.elapsedTime_;
    console.log(logText);
    this.updateRuntimeStatus_(logText, 'red');
  }
  if (!sleepReady) {
    logText = 'Still waiting for the sleep. Elapsed: ' + this.elapsedTime_;
    console.log(logText);
    this.updateRuntimeStatus_(logText, 'black');
  }
  if (!userPauseReady) {
    console.log('Waiting for user pause');
  }
  //Make sure both loading and complete events are caught between two cmds.
  if (this.isLoadingReadyForPlayback_()) {
    console.log('The url change status is not complete yet!');
    urlChange = false;
  }
  return urlChange && preCmdDone && sleepReady && userPauseReady;
};


/**
 * Sets a user stop status.
 * @param {boolean} userStop Whether there is a user specified stop.
 * @export
 */
rpf.PlayBackManager.prototype.setUserStop = function(userStop) {
  if (this.onPlayback_) {
    this.userStop_ = userStop;
  }
};


/**
 * The cleanup part called after the playback is done.
 * @param {Bite.Constants.WorkerResults} status The result status.
 * @param {string} log The log.
 * @export
 */
rpf.PlayBackManager.prototype.finishCurrentRun = function(status, log) {
  this.currentRunStatus_ = status;
  this.removeTabUpdatedListener_();
  if (!this.getAutoRunningTestId_()) {
    // This is to make the corresponding UI change.
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.UPDATE_WHEN_RUN_FINISHED,
         'params': {'status': status,
                    'uiOnly': true}});
  }
  this.onPlayback_ = false;
  this.preparationDone_ = false;
  this.stepMode_ = false;
  this.userPauseReady_ = true;
  this.userStop_ = false;
  this.failureRetryTimes_ = 0;
  this.userSpecifiedPauseStep_ = -1;
  this.playbackTimer_.stop();

  this.eventMgrListener_(
      {'command': Bite.Constants.CONSOLE_CMDS.EVENT_COMPLETED,
       'params': {'eventType':
           Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_RUNNING_TEST}},
      /** @type {MessageSender} */ {}, goog.nullFunction);
};


/**
 * Updates the test result on server.
 */
rpf.PlayBackManager.prototype.updateTestResultOnServer = function() {
  if (this.currentRunStatus_ == Bite.Constants.WorkerResults.FAILED ||
      this.currentRunStatus_ == Bite.Constants.WorkerResults.STOPPED) {
    chrome.tabs.captureVisibleTab(this.playbackWinId_, null,
        goog.bind(this.callBackAfterScreenShot_, this,
                  Bite.Constants.WorkerResults.FAILED));
  } else {
    var log = this.createLogJsonStr_(
        '', this.currentCmd_, '', '', this.currentStep_);
    this.runNext_(Bite.Constants.WorkerResults.PASS,
                  this.playbackWinId_, '', log);
  }
};


/**
 * Calls method to run the next test case.
 * @param {string} status The status of the test.
 * @param {string} dataUrl The screenshot string url.
 * @private
 */
rpf.PlayBackManager.prototype.callBackAfterScreenShot_ = function(
    status, dataUrl) {
  // TODO(phu): Add failed html in the result.
  var failureStr = this.createLogJsonStr_(
      'Failed to finish.', this.currentCmd_, 'Failed to finish.',
      '', this.currentStep_);
  this.runNext_(status, this.playbackWinId_, dataUrl, failureStr);
};


/**
 * Callback function for getting the failed html.
 * @param {string} status The status of the test.
 * @param {string} dataUrl The screenshot string url.
 * @param {Object} response The repsonse object.
 * @private
 */
rpf.PlayBackManager.prototype.getFailedHtmlCallback_ = function(
    status, dataUrl, response) {
  var failureReason = 'Error: URL change was taking too long!';
  if (this.replayTabReady_) {
    failureReason = this.getAndClearFailureLog();
  }
  var failureStr = this.createLogJsonStr_(
      response['failedHtml'], this.currentCmd_, failureReason,
      response['pageUrl'], this.currentStep_);
  this.runNext_(status, this.playbackWinId_, dataUrl, failureStr);
};


/**
 * Calls to run the next test.
 * @param {string} status The status of the test.
 * @param {string} dataUrl The screenshot string url.
 * @param {number} currentId The current running test's id.
 * @private
 */
rpf.PlayBackManager.prototype.callRunNextOnce_ = function(
    status, dataUrl, currentId) {
  if (currentId == this.getAutoRunningTestId_()) {
    console.log('No response from content script. Run next here.');
    var failureReason = 'Error: URL change was taking too long!';
    if (this.replayTabReady_) {
      failureReason = this.getAndClearFailureLog();
    }
    var failureStr = this.createLogJsonStr_(
        'no html collected.', this.currentCmd_, failureReason,
        '', this.currentStep_);
    this.runNext_(status, this.playbackWinId_, dataUrl, failureStr);
  }
};


/**
 * Creates the result log string for debugging purpose.
 * @param {string} failedHtml The failed page's html.
 * @param {string} cmd The current command.
 * @param {string} failureReason The last known failure reason.
 * @param {string} pageUrl The failed page's url.
 * @param {number} stepIndex The current step index.
 * @return {string} The failure json string.
 * @private
 */
rpf.PlayBackManager.prototype.createLogJsonStr_ = function(
    failedHtml, cmd, failureReason, pageUrl, stepIndex) {
  var timeStamp = rpf.MiscHelper.getTimeStamp();
  var result = {};
  result['timeStamp'] = timeStamp;
  result['failedHtml'] = failedHtml;
  result['cmd'] = cmd;
  result['failureReason'] = this.getAndClearFailureLog();
  result['startUrl'] = this.playbackStartUrl_;
  result['pageUrl'] = this.getAndClearFailureUrl();
  result['stepIndex'] = stepIndex;
  result['testName'] = this.currentTestName_;
  result['projectName'] = this.currentProjectName_;
  result['testLocation'] = this.currentTestLocation_;
  result['scripts'] = this.scripts_;
  result['translation'] = this.getTranslation_();
  return JSON.stringify(result);
};


/**
 * Get the translated scripts.
 * @return {Array} The translation array.
 * @private
 */
rpf.PlayBackManager.prototype.getTranslation_ = function() {
  var codeGen = new rpf.CodeGenerator();
  var readable = [];

  var descriptor = null;
  for (var i = 0; i < this.scripts_.length; i++) {
    if (this.infoMap_ && !goog.object.isEmpty(this.infoMap_)) {
      var stepId = bite.base.Helper.getStepId(this.scripts_[i]);
      if (stepId && this.infoMap_['steps'][stepId]) {
        var elemId = this.infoMap_['steps'][stepId]['elemId'];
        descriptor = this.infoMap_['elems'][elemId]['descriptor'];
      }
    }
    readable.push(codeGen.translateCmd(
        this.scripts_[i], this.datafile_, descriptor));
  }
  return readable;
};


/**
 * The playback finishes successfully.
 * @private
 */
rpf.PlayBackManager.prototype.onSuccess_ = function() {
  var log = 'Finished replay!';
  this.finishCurrentRun(Bite.Constants.WorkerResults.PASS, log);
  console.log(log);
  this.logger_.saveLogAndHtml(log,
                              rpf.ConsoleLogger.LogLevel.INFO,
                              rpf.ConsoleLogger.Color.GREEN);
};


/**
 * Stops the playback timer.
 * @export
 */
rpf.PlayBackManager.prototype.stopTimer = function() {
  if (this.playbackTimer_.enabled) {
    this.playbackTimer_.stop();
  }
};


/**
 * Starts the playback timer.
 * @export
 */
rpf.PlayBackManager.prototype.startTimer = function() {
  if (!this.playbackTimer_.enabled) {
    this.playbackTimer_.start();
  }
};


/**
 * User sets pause during a playback.
 * @export
 */
rpf.PlayBackManager.prototype.userSetPause = function() {
  this.stopTimer();
  if (!this.checkUserPauseReady_()) {
    return;
  }
  this.setStepMode(true);
  this.setUserPauseReady(false);
  if (!this.replayTabReady_ || !this.previousCmdDone_) {
    this.failureReason_ = 'UserPauseFailure';
    if (!this.getAutoRunningTestId_()) {
      this.sendMessageToConsole_(
          {'command': Bite.Constants.UiCmds.UPDATE_CURRENT_STEP,
           'params': {'curStep': this.currentStep_}});
    }
    this.onFailed_();
  }
};


/**
 * The playback encountered a failure.
 * @private
 */
rpf.PlayBackManager.prototype.onFailed_ = function() {
  var log = goog.string.buildString('Error: Timeout at this step(',
      this.currentStep_, '):', this.scripts_[this.currentStep_]);
  this.logger_.saveLogAndHtml(log,
                              rpf.ConsoleLogger.LogLevel.ERROR,
                              rpf.ConsoleLogger.Color.RED);
  console.log('On failed: ' + log);
  if (this.continueOnFailure_) {
    this.finishCurrentRun(Bite.Constants.WorkerResults.FAILED, log);
  } else {
    this.stopTimer();
    this.userSetPause();
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.UPDATE_WHEN_ON_FAILED,
         'params': {'failureReason': this.failureReason_,
                    'failureLog': this.getAndClearFailureLog(),
                    'currentStep': this.currentStep_,
                    'uiOnly': true}});
  }
};


/**
 * Checks if the current step is a redirection.
 * @param {string} step The current running step.
 * @private
 * @return {boolean} Whether the step is a redirection.
 */
rpf.PlayBackManager.prototype.isRedirection_ = function(step) {
  if (step.indexOf(rpf.CodeGenerator.PlaybackActions.REDIRECT) == 0 ||
      step.indexOf(rpf.CodeGenerator.PlaybackActions.REDIRECT_TO) == 0) {
    return true;
  }
  return false;
};


/**
 * Executes a client command in content script.
 * @export
 */
rpf.PlayBackManager.prototype.executeCmd = function() {
  this.previousCmdDone_ = false;
  // TODO(phu): Remove this check after making sure each run cmd can get back.
  var nextStep = this.currentStep_ + 1;
  if (nextStep < this.scripts_.length &&
      this.isRedirection_(this.scripts_[nextStep])) {
    // The redirection happens immediately after the action, so we need to
    // set the flag beforehand.
    this.replayTabReady_ = false;
    console.log('The next step is an URL change, so set ready to false');
  }

  var cmdMap = {};
  try {
    cmdMap = rpf.MiscHelper.getElemMap(this.currentCmd_, this.infoMap_);
  } catch (e) {
    console.log(e);
  }

  chrome.tabs.sendRequest(
      this.playbackTabId_,
      {script: this.createPlayBackScript(this.datafile_),
       realTimeBag: this.realTimeBack_,
       stepCommand: this.currentCmd_,
       useXpath: this.useXpath_,
       cmdMap: cmdMap},
      goog.bind(this.callBackWhileExecCmds, this));
};


/**
 * Sets the break point.
 * @param {number} step The step for a pause.
 * @export
 */
rpf.PlayBackManager.prototype.setUserSpecifiedPauseStep = function(step) {
  if (step == this.getCurrentStep()) {
    step -= 1;
  }
  this.userSpecifiedPauseStep_ = step;
};


/**
 * Enum for command types.
 * @enum {string}
 * @export
 */
rpf.PlayBackManager.CmdTypes = {
  CLIENT_CMD: 'run(',
  SLEEP: 'sleep',
  CHANGE_URL: 'changeUrl'
};


/**
 * Sets the timeout for this step.
 * @private
 */
rpf.PlayBackManager.prototype.setStepTimeout_ = function() {
  // TODO(phu): Get the cmd timeout value.
  var temp = 0;
  this.eachCmdTimeout_ = temp + rpf.PlayBackManager.rpfPlaybackInterval_ * 2;
  if (this.isLoadingReadyForPlayback_() &&
      this.eachCmdTimeout_ < this.defaultTimeout_) {
    this.eachCmdTimeout_ = this.defaultTimeout_;
  }
  console.log('The specified timeout for this command is: ' +
      this.eachCmdTimeout_ + ' ms');
};


/**
 * User explicitly stops the current playback.
 * @export
 */
rpf.PlayBackManager.prototype.userSetStop = function() {
  if (this.userStop_) {
    return;
  }
  this.userStop_ = true;
  var log = 'Run has been stopped.';
  this.finishCurrentRun(Bite.Constants.WorkerResults.STOPPED, log);
  this.logger_.saveLogAndHtml(log);
};


/**
 * Waits for ready and executes a command.
 * @export
 */
rpf.PlayBackManager.prototype.waitForElementReadyAndExecCmds = function() {
  console.log('This run elapsed:' +
              (this.getDate_().getTime() - this.startTimeEachRun_));
  if (this.userStop_) {
    console.log('This is going to be removed, if this line' +
                'will not show up any more.');
    this.userSetStop();
    return;
  }
  if (this.userSpecifiedPauseStep_ == this.currentStep_) {
    this.userSetPause();
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.SET_PLAYBACK_PAUSE,
         'params': {'uiOnly': true}});
  }
  if (!this.stepMode_ && this.startTimeEachRun_ != 0 &&
      this.getDate_().getTime() - this.startTimeEachRun_ >
      this.eachCmdTimeout_) {
    this.checkFailureCondition();
  }
  if (this.checkReadyForNext_()) {
    this.eachCmdTimeout_ = rpf.PlayBackManager.EACH_CMD_TIMEOUT_;
    this.currentCmd_ = this.scripts_[this.currentStep_];
    console.log('Running:' + this.currentCmd_ + '//' + this.currentStep_ +
                '//' + this.scripts_.length);
    if (!this.getAutoRunningTestId_()) {
      this.sendMessageToConsole_(
          {'command': Bite.Constants.UiCmds.UPDATE_CURRENT_STEP,
           'params': {'curStep': this.currentStep_}});
    }
    if (!this.failureRetryTimes_) {
      this.startTimeEachRun_ = this.getDate_().getTime();
    }
    if (this.stepMode_) {
      this.setUserPauseReady(false);
    }
    var commandType = rpf.CodeGenerator.testCmdType(this.currentCmd_);
    if (commandType == 0 || commandType == 1) {
      this.executeCmd();
    } else if (this.currentCmd_.indexOf(
        rpf.CodeGenerator.PlaybackActions.REDIRECT) === 0 ||
        this.currentCmd_.indexOf(
            rpf.CodeGenerator.PlaybackActions.REDIRECT_TO) === 0) {
      this.callBackAfterExecCmds('');
    } else if (this.currentCmd_.indexOf(
        rpf.PlayBackManager.CmdTypes.SLEEP) === 0) {
      this.userSetSleepTime_ = parseInt(this.currentCmd_.match(/\d+/), 10);
      this.eachCmdTimeout_ = this.userSetSleepTime_ +
          rpf.PlayBackManager.rpfPlaybackInterval_ * 2;
      this.userSetSleepStart_ = this.getDate_().getTime();
      console.log('The current step will sleep for ' + this.userSetSleepTime_);
      this.sleepReady_ = false;
      this.callBackAfterExecCmds('');
    } else if (this.currentCmd_.indexOf(
        rpf.PlayBackManager.CmdTypes.CHANGE_URL) === 0) {
      var newUrl = this.currentCmd_.substring(10, this.currentCmd_.length - 2);
      console.log('The new url is: ' + newUrl);
      this.replayTabReady_ = false;
      chrome.tabs.update(this.playbackTabId_, {url: newUrl});
      this.callBackAfterExecCmds('');
    } else {
      console.log('Encountered an unknown line.' + this.currentCmd_);
      this.callBackAfterExecCmds('');
    }
    // this.setStepTimeout_();
  } else {
    console.log('waiting...');
  }
};


/**
 * Callback from client content script (not necessary done).
 * @param {*} response Contains the result.
 * @export
 */
rpf.PlayBackManager.prototype.callBackWhileExecCmds = function(response) {
};


/**
 * Sets the failure log.
 * @param {string} log The failure log.
 * @export
 */
rpf.PlayBackManager.prototype.setFailureLog = function(log) {
  this.failureLog_ = log;
};


/**
 * Sets the failure URL.
 * @param {string} url The failure URL.
 */
rpf.PlayBackManager.prototype.setFailureUrl = function(url) {
  this.failureUrl_ = url;
};


/**
 * Gets and clears the failure log.
 * @return {string} The failure log.
 * @export
 */
rpf.PlayBackManager.prototype.getAndClearFailureLog = function() {
  var failureLog = this.failureLog_;
  this.failureLog_ = '';
  return failureLog;
};


/**
 * Gets and clears the failure URL.
 * @return {string} The failure url.
 */
rpf.PlayBackManager.prototype.getAndClearFailureUrl = function() {
  var failureUrl = this.failureUrl_;
  this.failureUrl_ = '';
  return failureUrl;
};


/**
 * Updates the playback runtime status.
 * @param {string} text The status text.
 * @param {string} color The text color.
 * @private
 */
rpf.PlayBackManager.prototype.updateRuntimeStatus_ = function(text, color) {
  if (!this.getAutoRunningTestId_()) {
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.UPDATE_PLAYBACK_STATUS,
         'params': {'text': text,
                    'color': color}});
  }
};


/**
 * Checks post condition when a step fails.
 * @export
 */
rpf.PlayBackManager.prototype.checkFailureCondition = function() {
  console.log('Replay was forced out because of failures!');
  this.failureReason_ = 'MultipleRetryFindElemFailure';
  if (!this.checkPageReady_()) {
    this.setFailureLog('Likely a timeout waiting for a page to be loaded.');
  }
  this.onFailed_();
};


/**
 * The callback after the executing a command.
 * @param {string} result The result string.
 * @param {string=} opt_log The optional log.
 * @export
 */
rpf.PlayBackManager.prototype.callBackAfterExecCmds =
    function(result, opt_log) {
  var log = 'Result for:' + this.currentStep_ + 'is:' + result;
  console.log(log);
  this.logger_.saveLogAndHtml(log,
                              rpf.ConsoleLogger.LogLevel.INFO,
                              rpf.ConsoleLogger.Color.BLUE);
  this.previousCmdDone_ = true;
  if (result == 'failed') {
    this.failureRetryTimes_ += 1;
    this.replayTabReady_ = true;
    var logText = 'Failed because "' + opt_log + '"\n' +
                  'Already elapsed: ' + this.elapsedTime_;
    console.log(logText);
    this.updateRuntimeStatus_(logText, 'red');
    return;
  }
  this.updateRuntimeStatus_('Successfully finished the current step.', 'green');
  this.failureRetryTimes_ = 0;

  this.setNextRunnableCmd_();
  if (this.currentStep_ >= this.scripts_.length) {
    this.onSuccess_();
    return;
  }

  if (this.isRedirection_(this.scripts_[this.currentStep_])) {
    this.eachCmdTimeout_ = this.defaultTimeout_;
  }
};


/**
 * Set to the next runnable step.
 * @private
 */
rpf.PlayBackManager.prototype.setNextRunnableCmd_ = function() {
  while (true) {
    this.currentStep_++;
    if (this.currentStep_ == this.scripts_.length) {
      return;
    }
    var cmd = this.scripts_[this.currentStep_];
    if (rpf.CodeGenerator.testCmdType(cmd) != 3) {
      return;
    }
  }
};




/**
 * Starts the listeners inside content script.
 * @export
 */
rpf.PlayBackManager.prototype.callBackAfterTabUpdated = function() {
  console.log('finished page init and set replay tab ready.' +
              'Now it should be able to run the next CMD!');
  chrome.tabs.executeScript(this.playbackTabId_,
                            {code: 'startListener();',
                             allFrames: true});
};


/**
 * Checks the playback option and starts playing back.
 * @param {string} method The method of playback.
 * @param {string} startUrl The start url.
 * @param {string} scripts The raw script string.
 * @param {string} datafile The corresponding data file.
 * @param {string} userLib The user specified library.
 * @param {Object=} opt_infoMap The info map.
 * @param {boolean=} opt_continueOnFailure Whether should continue or
 *     show update UI on failure.
 * @param {string=} opt_testName The test name.
 * @param {string=} opt_testId The test id.
 * @param {string=} opt_projectName The project name.
 * @param {string=} opt_testLocation The test location.
 */
rpf.PlayBackManager.prototype.checkPlaybackOptionAndRun = function(
    method, startUrl, scripts, datafile, userLib, opt_infoMap,
    opt_continueOnFailure, opt_testName, opt_testId, opt_projectName,
    opt_testLocation) {
  this.continueOnFailure_ = opt_continueOnFailure || false;
  this.currentTestName_ = opt_testName || '';
  this.currentProjectName_ = opt_projectName || '';
  this.currentTestLocation_ = opt_testLocation || '';
  this.currentTestId_ = opt_testId || '';
  this.infoMap_ = opt_infoMap || {};
  if (this.isPreparationDone()) {
    this.initResumePlayback_();
    if (method == Bite.Constants.PlayMethods.ALL) {
      this.setStepMode(false);
    } else {
      this.setStepMode(true);
    }
    this.setUserPauseReady(true);
  } else {
    if (method == Bite.Constants.PlayMethods.STEP) {
      this.setStepMode(true);
      this.setUserPauseReady(true);
    }
    this.runTest(startUrl, scripts, datafile, userLib);
  }
};


/**
 * Sets the infoMap object.
 * @param {Object} infoMap The info map.
 */
rpf.PlayBackManager.prototype.setInfoMap = function(infoMap) {
  this.infoMap_ = infoMap;
};


/**
 * Inserts commands while playing back a script.
 * @param {string} scriptStr The script string.
 * @param {string} data The data file string.
 * @export
 */
rpf.PlayBackManager.prototype.insertCmdsWhilePlayback =
    function(scriptStr, data) {
  var newScripts = this.getAllStepsFromScript(scriptStr);
  for (var i = newScripts.length - 1; i >= 0; i--) {
    this.scripts_.splice(this.currentStep_, 0, newScripts[i]);
  }
  this.datafile_ += data;
  this.currentStep_ += newScripts.length;
};


/**
 * @return {string} The current test name.
 * @export
 */
rpf.PlayBackManager.prototype.getCurrentTestName = function() {
  return this.currentTestName_;
};


/**
 * @return {string} The current project name.
 */
rpf.PlayBackManager.prototype.getCurrentProjectName = function() {
  return this.currentProjectName_;
};


/**
 * @return {string} The current test id.
 * @export
 */
rpf.PlayBackManager.prototype.getCurrentTestId = function() {
  return this.currentTestId_;
};


/**
 * @return {string} The last matched html.
 * @export
 */
rpf.PlayBackManager.prototype.getLastMatchHtml = function() {
  return this.lastMatchHtml_;
};


/**
 * @param {string} html The last matches html.
 * @export
 */
rpf.PlayBackManager.prototype.setLastMatchHtml = function(html) {
  this.lastMatchHtml_ = html;
};


/**
 * @return {number} The tab id of the page under playback.
 * @export
 */
rpf.PlayBackManager.prototype.getPlaybackTabId = function() {
  return this.playbackTabId_;
};


/**
 * @param {number} tabId The tab id of the page under playback.
 * @export
 */
rpf.PlayBackManager.prototype.setPlaybackTabId = function(tabId) {
  this.playbackTabId_ = tabId;
};


/**
 * @return {number} The window id of the page under playback.
 * @export
 */
rpf.PlayBackManager.prototype.getPlaybackWindowId = function() {
  return this.playbackWinId_;
};


/**
 * @return {boolean} Whether the preparation for playback is done.
 * @export
 */
rpf.PlayBackManager.prototype.isPreparationDone = function() {
  return this.preparationDone_;
};


/**
 * @param {boolean} done Sets the preparationDone variable.
 * @export
 */
rpf.PlayBackManager.prototype.setPreparationDone = function(done) {
  this.preparationDone_ = done;
};


/**
 * @return {string} The command of current step.
 * @export
 */
rpf.PlayBackManager.prototype.getCurrentCmd = function() {
  return this.currentCmd_;
};


/**
 * @return {boolean} whether tab updates ready.
 * @export
 */
rpf.PlayBackManager.prototype.isReplayTabReady = function() {
  return this.replayTabReady_;
};


/**
 * @param {boolean} isReady whether tab updates ready.
 * @export
 */
rpf.PlayBackManager.prototype.setReplayTabReady = function(isReady) {
  this.replayTabReady_ = isReady;
};

/**
 * @param {boolean} use whether to use incognito window.
 */
rpf.PlayBackManager.prototype.setPlaybackIncognito = function(use) {
  this.playbackIncognito_ = use;
}

