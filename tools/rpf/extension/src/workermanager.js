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
 * @fileoverview This file contains the worker mode manager.
 *
 * @author phu@google.com (Po Hu)
 * @suppress {constantProperty} TESTS_EXECUTION_SERVER_ is assigned
 *     a value more than once
 */

goog.provide('rpf.WorkerManager');

goog.require('Bite.Constants');
goog.require('bite.base.Helper');
goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.userAgent');
goog.require('rpf.MiscHelper');
goog.require('rpf.soy.Dialog');



/**
 * This class manages running multiple tests by using the given playback
 * manager instance. The tests could be from multiple sources like
 * from RPF console, a link, or polling tests from server.
 * The worker manager will use rpfautomator to execute the test one by one.
 * @param {rpf.PlayBackManager} playbackMgr The playback manager.
 * @param {rpf.Automator} automator The rpf automator.
 * @param {rpf.ConsoleLogger} logger The console logger instance.
 * @param {function(Object, Object, function(Object))} eventMgrListener
 *     The listener registered in eventsManager.
 * @param {function(Object, function(*)=)} sendMessageToConsole The
 *     function to send message to console world.
 * @constructor
 */
rpf.WorkerManager = function(
    playbackMgr, automator, logger, eventMgrListener, sendMessageToConsole) {
  /**
   * The playback manager.
   * @type {rpf.PlayBackManager}
   * @private
   */
  this.playbackMgr_ = playbackMgr;

  /**
   * The rpf automator.
   * @type {rpf.Automator}
   * @private
   */
  this.automator_ = automator;

  /**
   * The console logger.
   * @type {rpf.ConsoleLogger}
   * @private
   */
  this.logger_ = logger;

  /**
   * The event lisnener registered on event manager.
   * @type {function(Object, Object, function(Object))}
   * @private
   */
  this.eventMgrListener_ = eventMgrListener;

  /**
   * The function to send message to console world.
   * @type {function(Object, function(*)=)}
   * @private
   */
  this.sendMessageToConsole_ = sendMessageToConsole;

  /**
   * The test id.
   * @type {number}
   * @private
   */
  this.autoRunningTestId_ = 0;

  /**
   * The result's unique info string.
   * @type {string}
   * @private
   */
  this.newServerUniqueStr_ = '';

  /**
   * If the worker is working.
   * @type {boolean}
   * @private
   */
  this.isWorking_ = false;

  /**
   * Timer object for periodically polling Executor server.
   * @type {goog.Timer}
   * @private
   */
  this.workerTimer_ = new goog.Timer(
      rpf.WorkerManager.RPF_WORKER_WAITING_INTERVAL_);

  /**
   * The test config dictionary.
   * @type {Object}
   * @private
   */
  this.testConfig_ = {};

  /**
   * The current run's key string.
   * @type {string}
   * @private
   */
  this.currentRunKey_ = '';

  /**
   * The data string.
   * @type {string}
   * @private
   */
  this.dataStr_ = '';

  /**
   * Current finished tests number.
   * @private
   */
  this.finishedTestsNum_ = 0;

  this.playbackMgr_.setupWorkerCallbacks(
      goog.bind(this.getAutoRunningTestId, this),
      goog.bind(this.runNext, this));
};


/**
 * The worker token.
 * @type {string}
 * @export
 */
rpf.WorkerManager.token = '';


/**
 * @const The Tests Executor server.
 * @type {string}
 * @private
 */
rpf.WorkerManager.TESTS_EXECUTION_SERVER_ =
    bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);


/**
 * @const The period between two polling.
 * @type {number}
 * @private
 */
rpf.WorkerManager.RPF_WORKER_WAITING_INTERVAL_ = 5000;


/**
 * The handler of suite executor, which will be deprecated soon.
 * @type {string}
 * @private
 */
rpf.WorkerManager.SuiteExecutorRequestsHandlerPath_ = '/requests';


/**
 * The handler path of new bite server.
 * @type {string}
 * @private
 */
rpf.WorkerManager.BiteServerUpdateResultHandlerPath_ = '/result/update';


/**
 * The handler path of starting a new run.
 * @type {string}
 * @private
 * @constant
 */
rpf.WorkerManager.BiteServerStartNewRunHandlerPath_ = '/run/add_realtime_run';


/**
 * Whether this is pointing to the new server.
 * @type {boolean}
 * @private
 */
rpf.WorkerManager.prototype.isNewServer_ = false;


/**
 * Stops a group of tests.
 */
rpf.WorkerManager.prototype.stopGroupTests = function() {
  this.automator_.finish();
  this.runFinishCallback_({});
};


/**
 * Runs a group of tests.
 * @param {Array} testNames The test names array.
 * @param {Array} tests The array of tests info.
 * @param {string} runName The run name.
 * @param {string=} opt_location Where the tests were loaded from.
 */
rpf.WorkerManager.prototype.runGroupTests = function(
    testNames, tests, runName, opt_location) {
  var location = opt_location || '';
  this.finishedTestsNum_ = 0;
  var testsToRun = [];
  for (var i = 0, len = tests.length; i < len; ++i) {
    if (goog.array.contains(testNames, tests[i]['test_name'])) {
      testsToRun.push(tests[i]);
    }
  }

  if (testsToRun.length < 1) {
    return;
  }

  var stepArr = [];
  var testInfoArr = [];
  for (var i = 0, len = testsToRun.length; i < len; ++i) {
    this.pushTest_(testsToRun[i], stepArr, testInfoArr, location);
  }

  // Sends a ping to server and starts the current run.
  // It will receive the run key which will be used to update the results.
  this.startRunOnServer_(testInfoArr, runName);

  // Starts running all of the tests.
  this.automator_.start(
      stepArr, goog.bind(this.runFinishCallback_, this));
};


/**
 * The callback function when the current run is finished.
 * @param {Object} response The response object.
 * @private
 */
rpf.WorkerManager.prototype.runFinishCallback_ = function(response) {
  var fragment = goog.Uri.QueryData.createFromMap({
    'page': 'run_details',
    'runKey': this.currentRunKey_
  });
  var fragment2 = goog.Uri.QueryData.createFromMap({
    'page': 'set_details',
    'suiteName': 'testSuite',
    'projectName': 'testProject'
  });
  var resultUrl = rpf.WorkerManager.TESTS_EXECUTION_SERVER_ +
                  '/home#' + fragment;
  var runsUrl = rpf.WorkerManager.TESTS_EXECUTION_SERVER_ +
                '/home#' + fragment2;
  var link = rpf.soy.Dialog.createRunsAndResultsLinks(
      {'links': {'runsUrl': runsUrl, 'resultUrl': resultUrl}});
  // Reset the player if it was disrupted during playing back.
  if (this.playbackMgr_.isPreparationDone()) {
    this.playbackMgr_.setPreparationDone(false);
  }
  this.automator_.getEventTarget().dispatchEvent(
      Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_CURRENT_RUN);
  // This is to notify the UI with the result link.
  // TODO(phu): Should display the link in another area.
  goog.Timer.callOnce(goog.bind(this.sendMessageToConsole_,
      this, {'command': Bite.Constants.UiCmds.UPDATE_PLAYBACK_STATUS,
             'params': {'text': link,
                        'color': 'green'}}), 1000);
};


/**
 * Gets the user agent string.
 * @return {string} The user agent string.
 * @private
 */
rpf.WorkerManager.prototype.getUserAgent_ = function() {
  return goog.userAgent.getUserAgentString() || '';
};


/**
 * Sends the tests info to server and starts a new run.
 * @param {Array} testInfoArr The tests to be run.
 * @param {string} runName The run name.
 * @private
 */
rpf.WorkerManager.prototype.startRunOnServer_ = function(
    testInfoArr, runName) {
  var requestUrl = rpf.WorkerManager.TESTS_EXECUTION_SERVER_ +
                   rpf.WorkerManager.BiteServerStartNewRunHandlerPath_;
  var parameters = goog.Uri.QueryData.createFromMap({
    'runName': runName,
    'projectName': 'testProject',
    'suiteName': 'testSuite',
    'userAgent': this.getUserAgent_(),
    'testInfoList': goog.json.serialize(testInfoArr)}).toString();
  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      this.currentRunKey_ = xhr.getResponseText();
    } else {
      alert('error');
    }
  }, this), 'POST', parameters);
};


/**
 * Pushes a test in the array that will be automatically run.
 * @param {Object.<string, string, string>} test The test object.
 * @param {Array} stepArr The step array.
 * @param {Array} testInfoArr The array contains the basic test info.
 * @param {string} location The location where the tests were from.
 * @private
 */
rpf.WorkerManager.prototype.pushTest_ = function(
    test, stepArr, testInfoArr, location) {
  var id = test['id'];
  var testObj = bite.base.Helper.getTestObject(test['test']);
  var result = bite.console.Helper.trimInfoMap(testObj['datafile']);
  testInfoArr.push({'id': test['id'] || '',
                    'name': testObj['name']});
  // Assume this is called by console UI for now.
  // The first step is to load the test in console UI.
  var temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.CONSOLE,
      Bite.Constants.UiCmds.UPDATE_SCRIPT_INFO,
      {'name': testObj['name'],
       'url': testObj['url'],
       'script': testObj['script'],
       'datafile': testObj['datafile'],
       'userlib': testObj['userlib'],
       'id': id,
       'projectname': testObj['projectname']},
      Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_LOAD_TEST_IN_CONSOLE);
  stepArr.push(temp);

  // The second step is to run the test.
  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.EVENT_MANAGER,
      Bite.Constants.CONSOLE_CMDS.CHECK_PLAYBACK_OPTION_AND_RUN,
      {'method': Bite.Constants.PlayMethods.ALL,
       'startUrl': testObj['url'],
       'scripts': testObj['script'],
       'infoMap': result['infoMap'],
       'datafile': result['datafile'],
       'userLib': testObj['userlib'],
       'needOverride': false,
       'continueOnFailure': true,
       'testName': testObj['name'],
       'testId': id,
       'projectName': testObj['projectname'],
       'testLocation': location},
      Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_RUNNING_TEST);
  stepArr.push(temp);

  temp = this.automator_.getStepObject(
      Bite.Constants.ListenerDestination.EVENT_MANAGER,
      Bite.Constants.CONSOLE_CMDS.UPDATE_TEST_RESULT_ON_SERVER,
      {},
      Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_UPDATE_TEST_RESULT);
  stepArr.push(temp);
};


/**
 * Logs info to logger.
 * @param {string} log Log info.
 * @param {rpf.ConsoleLogger.LogLevel} opt_level Log level.
 * @param {rpf.ConsoleLogger.Color} opt_color Log color.
 * @export
 */
rpf.WorkerManager.prototype.logInfo = function(log, opt_level, opt_color) {
  this.logger_.saveLogAndHtml(log, opt_level, opt_color);
};


/**
 * Increases the finished tests number.
 */
rpf.WorkerManager.prototype.increaseFinishedTestsNum = function() {
  ++this.finishedTestsNum_;
};


/**
 * Gets the finished tests number.
 * @return {number} The tests number.
 */
rpf.WorkerManager.prototype.getFinishedTestsNum = function() {
  return this.finishedTestsNum_;
};


/**
 * Sets the worker url.
 * @param {string} url The executor server url.
 * @export
 */
rpf.WorkerManager.prototype.setWorkerUrl = function(url) {
  rpf.WorkerManager.TESTS_EXECUTION_SERVER_ = url;
  this.isWorking_ = false;
};


/**
 * Sets the worker token.
 * @param {string} token The token string.
 * @export
 */
rpf.WorkerManager.prototype.setWorkerToken = function(token) {
  rpf.WorkerManager.token = token;
};


/**
 * Starts working in worker mode.
 * @export
 */
rpf.WorkerManager.prototype.startWorkerMode = function() {
  if (this.workerTimer_.enabled) {
    this.workerTimer_.stop();
  }
  this.workerTimer_ = new goog.Timer(
      rpf.WorkerManager.RPF_WORKER_WAITING_INTERVAL_);
  this.isWorking_ = false;
  this.autoRunningTestId_ = 0;
  this.workerTimer_.start();
  goog.events.listen(this.workerTimer_, goog.Timer.TICK,
                     this.fetchDashboardStatus, false, this);
};


/**
 * Stops worker mode.
 * @export
 */
rpf.WorkerManager.prototype.stopWorkerMode = function() {
  if (this.workerTimer_.enabled) {
    this.workerTimer_.stop();
  }
  goog.events.unlisten(this.workerTimer_, goog.Timer.TICK,
                       this.fetchDashboardStatus, false, this);
};


/**
 * Updates the Executor server with test results.
 * @param {number} testId The test id.
 * @param {Bite.Constants.WorkerResults} result The test result.
 * @param {string} dataUrl The screenshot data url.
 * @param {string} failureStr This contains relevant info of the failure.
 * @export
 */
rpf.WorkerManager.prototype.updateRunningTestStatus = function(
    testId, result, dataUrl, failureStr) {
  var log = failureStr;
  this.logger_.clearLogs();
  var handler = rpf.WorkerManager.BiteServerUpdateResultHandlerPath_;
  var paramsMap = {
    'result': goog.json.serialize({'result': {
      'runKey': this.currentRunKey_,
      'testName': this.playbackMgr_.getCurrentTestName(),
      'testId': this.playbackMgr_.getCurrentTestId()}}),
    'status': result,
    'screenshot': dataUrl,
    'log': log
  };
  var requestUrl = rpf.MiscHelper.getUrl(
      rpf.WorkerManager.TESTS_EXECUTION_SERVER_,
      handler,
      {});
  var parameters = goog.Uri.QueryData.createFromMap(paramsMap).toString();
  bite.common.net.xhr.async.post(
      requestUrl,
      parameters,
      function(success) {
        if (success) {
          console.log('Successfully updated the test result for ' + testId);
        }
      });
};


/**
 * Polls the Executor server and get back the queued job.
 * @export
 */
rpf.WorkerManager.prototype.fetchDashboardStatus = function() {
  if (!this.isWorking_) {
    this.isWorking_ = true; // Blocks the worker poller.
    var handler = '/requests';
    var parameters = {
        'cmd': '3',
        'tokens': rpf.WorkerManager.token,
        'useragent': navigator.userAgent};
    if (this.isNewServer_) {
      handler = '/result/fetch';
      parameters = {
        'tokens': rpf.WorkerManager.token
      };
    }
    var requestUrl = rpf.MiscHelper.getUrl(
        rpf.WorkerManager.TESTS_EXECUTION_SERVER_,
        handler,
        parameters);

    goog.net.XhrIo.send(requestUrl,
                        goog.bind(this.fetchDashboardStatusCallback_, this));
  }
};


/**
 * Callback handler for the fetch dashboard status.
 * @param {Event} e XhrIo event.
 * @private
 */
rpf.WorkerManager.prototype.fetchDashboardStatusCallback_ = function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);
  if (xhr.isSuccess()) {
    var resText = xhr.getResponseText();
    if (resText == 'null') {
      this.isWorking_ = false;
      return;
    }
    console.log('Got response from Executor server:' + resText);
    if (resText && !this.autoRunningTestId_) {
      var obj = goog.json.parse(resText);
      if (obj && (typeof obj == 'object') && (obj['key'] || obj['result'])) {
        var testId = '';
        if (!this.isNewServer_) {
          this.autoRunningTestId_ = obj['key'];
          this.testConfig_ = goog.json.parse(obj['config']);
          this.dataStr_ = obj['data_str'];
          testId = obj['id'];
          console.log('The data string is:' + this.dataStr_);
        } else {
          this.autoRunningTestId_ = obj['result']['id'];
          this.newServerUniqueStr_ = resText;
          testId = obj['result']['testId'];
        }
      } else {
        this.isWorking_ = false;
      }
    } else {
      this.isWorking_ = false;
      console.log('It is still running test id:' + this.autoRunningTestId_);
    }
  } else {
    this.isWorking_ = false;
    console.log('Failed to poll the tests execution server.' +
                'Error status: ' + xhr.getStatus());
  }
};

/**
 * Kicks off the playback procedure.
 * @param {string} url The start url.
 * @param {string} script The test script.
 * @param {string} datafile The test datafile.
 * @param {string} userLib The user's lib.
 * @export
 */
rpf.WorkerManager.prototype.kickOffPlayback = function(
    url, script, datafile, userLib) {
  var startUrl = this.testConfig_['startUrl'] || this.testConfig_['StartUrl'];
  if (startUrl) {
    url = startUrl;
  }
};


/**
 * Runs the next script after the previous one is done.
 * @param {Bite.Constants.WorkerResults}
 *     doneResult The result of the previous script.
 * @param {number} winId The playback window id.
 * @param {string} dataUrl The img data url string.
 * @param {string} log The result log.
 */
rpf.WorkerManager.prototype.runNext = function(
    doneResult, winId, dataUrl, log) {
  rpf.MiscHelper.removeWindowById(winId);
  this.updateRunningTestStatus(
      this.autoRunningTestId_, doneResult, dataUrl, log);
  this.autoRunningTestId_ = 0;
  this.isWorking_ = false;  // TODO(phu): Use hanging GET to solve.
  this.eventMgrListener_(
      {'command': Bite.Constants.CONSOLE_CMDS.EVENT_COMPLETED,
       'params': {'eventType':
           Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_UPDATE_TEST_RESULT}},
      {}, goog.nullFunction);
};


/**
 * @return {number} The test id.
 * @export
 */
rpf.WorkerManager.prototype.getAutoRunningTestId = function() {
  return this.autoRunningTestId_;
};
