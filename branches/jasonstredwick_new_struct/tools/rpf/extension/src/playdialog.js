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
 * @fileoverview This file contains RPF's playback dialog.
 * It gets popped up when user clicks playback button.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.PlayDialog');

goog.require('bite.common.mvc.helper');
goog.require('element.helper.Templates.locatorsUpdater');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.soy.Dialog');



/**
 * A class for playing back a test.
 * TODO(phu): The fault tolerant options are still not ideal.
 * We might consider adding a skip option to skip a few steps on failure.
 * So that, we don't need to automatically increase the this.currentStep_
 * while inserting in new recorded steps in playbackmanager.
 *
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event, Function=)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.PlayDialog = function(messenger, onUiEvents) {
  /**
   * The playback dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.playDialog_ = new goog.ui.Dialog();

  /**
   * The temporary command.
   * @type {string}
   */
  this.tempCmd = '';

  /**
   * The temporary data.
   * @type {string}
   */
  this.tempData = '';

  /**
   * The test ids.
   * @type {!Array.<string>}
   * @private
   */
  this.testIds_ = [];

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event, Function=)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * Inits the playback dialog.
   */
  this.initPlaybackRuntimeDialog_();
};


/**
 * Enum for image path.
 * @enum {string}
 * @export
 */
rpf.PlayDialog.Images = {
  PLAY_ALL: 'imgs/rpf/playall.png',
  PAUSE_GREY: 'imgs/rpf/pause-disabled.png',
  PLAY_STEP: 'imgs/rpf/playstep.png',
  PLAY_STOP_GREY: 'imgs/rpf/playstop-disabled.png',
  PLAY_ALL_GREY: 'imgs/rpf/playall-disabled.png',
  PLAY_STEP_GREY: 'imgs/rpf/playstep-disabled.png',
  PLAY_STOP: 'imgs/rpf/playstop.png',
  PAUSE: 'imgs/rpf/pause.png'
};


/**
 * Sets the visibility of the playback dialog.
 * @param {boolean} display Whether or not to show the dialog.
 * @export
 */
rpf.PlayDialog.prototype.setVisible = function(display) {
  this.playDialog_.setVisible(display);
};


/**
 * Automates this dialog.
 * @param {Array} testInfo The tests to be selected in selector.
 */
rpf.PlayDialog.prototype.automateDialog = function(testInfo) {
  if (testInfo) {
    var selector = goog.dom.getElement('playdialog-tests');
    for (var i = 0; i < selector.options.length; ++i) {
      if (testInfo[selector.options[i].value]) {
        selector.options[i].selected = true;
      }
    }
  }

  this.onUiEvents_(
      Bite.Constants.UiCmds.SET_PLAYBACK_ALL,
      {},
      /** @type {Event} */ ({}));
};


/**
 * Inits the playback runtime dialog.
 * @private
 */
rpf.PlayDialog.prototype.initPlaybackRuntimeDialog_ =
    function() {
  var dialogElem = this.playDialog_.getContentElement();

  bite.common.mvc.helper.renderModelFor(
      dialogElem,
      rpf.soy.Dialog.playContent);

  this.playDialog_.setTitle('Playback Runtime');
  this.playDialog_.setButtonSet(null);
  this.playDialog_.setVisible(true);
  this.playDialog_.setVisible(false);
  this.setMultipleTestsVisibility(false);
  this.setTestSelectorVisibility(false);
  goog.events.listen(
      goog.dom.getElement('playall'),
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SET_PLAYBACK_ALL,
          {}));
  goog.events.listen(
      goog.dom.getElement('playstep'),
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SET_PLAYBACK_STEP,
          {}));
  goog.events.listen(
      goog.dom.getElement('playpause'),
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SET_PLAYBACK_PAUSE,
          {}));
  goog.events.listen(
      goog.dom.getElement('playstop'),
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SET_PLAYBACK_STOP,
          {}));
  goog.events.listen(
      goog.dom.getElement('stopAllTests'),
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SET_PLAYBACK_STOP_ALL,
          {}));
};


/**
 * Sets the total Tests number.
 * @param {boolean} visible Whether set the multiple tests info visible.
 */
rpf.PlayDialog.prototype.setMultipleTestsVisibility = function(visible) {
  goog.style.showElement(goog.dom.getElement('rpf-multiple-tests-info'),
                         visible);
};


/**
 * Sets the total Tests number.
 * @param {number} totalNumber The total tests number.
 */
rpf.PlayDialog.prototype.setTotalNumber = function(totalNumber) {
  goog.dom.getElement('totalRunningTestsNumber').innerHTML =
      '/ Total: ' + totalNumber;
};


/**
 * Sets the finished Tests number.
 * @param {number} finishedNumber The finished tests number.
 */
rpf.PlayDialog.prototype.setFinishedNumber = function(finishedNumber) {
  goog.dom.getElement('finishedTestsNumber').innerHTML =
      'Finished: ' + finishedNumber;
};


/**
 * Gets all of the selected test names.
 * @return {!Array.<string>} The selected names.
 */
rpf.PlayDialog.prototype.getSelectedTests = function() {
  var selector = goog.dom.getElement('playdialog-tests');
  var results = [];
  for (var i = 0; i < selector.options.length; ++i) {
    if (selector.options[i].selected) {
      results.push(selector.options[i].value);
    }
  }
  return results;
};


/**
 * Updates the tests selector.
 * @param {!Array.<string>} names The test names.
 * @param {!Array.<string>} testIds The test ids.
 */
rpf.PlayDialog.prototype.updateTestSelection = function(names, testIds) {
  var selector = goog.dom.getElement('playdialog-tests');
  this.testIds_ = testIds || [];
  selector.innerHTML = '';
  for (var i = 0; i < names.length; i++) {
    var opt = new Option(names[i], names[i]);
    selector.add(opt, null);
  }
  this.setTestSelectorVisibility(true);
};


/**
 * Plays back all the rest steps.
 * @export
 */
rpf.PlayDialog.prototype.setPlaybackAll = function() {
  goog.dom.getElement('playall').src =
      rpf.PlayDialog.Images.PLAY_ALL_GREY;
  goog.dom.getElement('playstep').src =
      rpf.PlayDialog.Images.PLAY_STEP_GREY;
  goog.dom.getElement('playpause').src =
      rpf.PlayDialog.Images.PAUSE;
  goog.dom.getElement('playstop').src =
      rpf.PlayDialog.Images.PLAY_STOP;

  var userPauseStep = goog.string.trim(
      goog.dom.getElement('playbackcurrentstep').value);
  if (!userPauseStep) {
    userPauseStep = -1;
  } else {
    userPauseStep = parseInt(userPauseStep, 10) - 1;
  }
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_USER_SPECIFIED_PAUSE_STEP,
       'params': {'userPauseStep': userPauseStep}});
};


/**
 * Plays back step by step.
 * @export
 */
rpf.PlayDialog.prototype.setPlaybackStep = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_USER_SPECIFIED_PAUSE_STEP,
       'params': {'userPauseStep': -1}});
};


/**
 * Update comments div.
 * @param {string} id The user ID.
 * @param {string} comment The user's comment.
 * @export
 */
rpf.PlayDialog.prototype.updateComment = function(
    id, comment) {
};


/**
 * Pauses the current playback.
 * @param {boolean=} opt_uiOnly Whether to involve the call to
 *     the backend.
 * @export
 */
rpf.PlayDialog.prototype.setPlaybackPause = function(
    opt_uiOnly) {
  var uiOnly = opt_uiOnly || false;
  goog.dom.getElement('playall').src =
      rpf.PlayDialog.Images.PLAY_ALL;
  goog.dom.getElement('playstep').src =
      rpf.PlayDialog.Images.PLAY_STEP;
  goog.dom.getElement('playpause').src =
      rpf.PlayDialog.Images.PAUSE_GREY;
  if (!uiOnly) {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.USER_SET_PAUSE});
  }
};


/**
 * Stops the current playback.
 * @param {boolean=} opt_uiOnly Whether to involve the call to
 *     the backend.
 * @export
 */
rpf.PlayDialog.prototype.setPlaybackStop = function(
    opt_uiOnly) {
  var uiOnly = opt_uiOnly || false;
  goog.dom.getElement('playall').src =
      rpf.PlayDialog.Images.PLAY_ALL;
  goog.dom.getElement('playstep').src =
      rpf.PlayDialog.Images.PLAY_STEP;
  goog.dom.getElement('playpause').src =
      rpf.PlayDialog.Images.PAUSE_GREY;
  goog.dom.getElement('playstop').src =
      rpf.PlayDialog.Images.PLAY_STOP;
  this.switchChoiceSet(false);
  if (!uiOnly) {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.USER_SET_STOP});
  }
};


/**
 * Shows the choices on failure.
 * @param {boolean} turnOn Whether or not to show the options.
 * @export
 */
rpf.PlayDialog.prototype.switchChoiceSet = function(turnOn) {
  if (!turnOn) {
    goog.dom.removeChildren(goog.dom.getElement('choiceset'));
    goog.dom.removeChildren(goog.dom.getElement('playbackstatus'));
    goog.dom.removeChildren(goog.dom.getElement('matchHtmlDiv'));
  } else {
    var deleteCmd = new goog.ui.CustomButton('Delete');
    var overrideCmd = new goog.ui.CustomButton('Override');
    var updateCmd = new goog.ui.CustomButton('Update');
    var insertCmd = new goog.ui.CustomButton('Insert');
    var failCmd = new goog.ui.CustomButton('Fail');
    var deleteCmdDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id': 'deleteCmd', 'style': 'display: inline'
    });
    var overrideCmdDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id': 'overrideCmd', 'style': 'display: inline'
    });
    var updateCmdDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id': 'updateCmd', 'style': 'display: inline'
    });
    var insertCmdDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id': 'insertCmd', 'style': 'display: inline'
    });
    var failCmdDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id': 'failCmd', 'style': 'display: inline'
    });
    var choiceSet = goog.dom.getElement('choiceset');
    goog.dom.removeChildren(choiceSet);
    choiceSet.appendChild(deleteCmdDiv);
    choiceSet.appendChild(overrideCmdDiv);
    choiceSet.appendChild(updateCmdDiv);
    choiceSet.appendChild(insertCmdDiv);
    choiceSet.appendChild(failCmdDiv);
    deleteCmd.render(goog.dom.getElement('deleteCmd'));
    overrideCmd.render(goog.dom.getElement('overrideCmd'));
    updateCmd.render(goog.dom.getElement('updateCmd'));
    insertCmd.render(goog.dom.getElement('insertCmd'));
    failCmd.render(goog.dom.getElement('failCmd'));
    deleteCmd.setTooltip('delete the step');
    overrideCmd.setTooltip('mark the step as passed and continue');
    updateCmd.setTooltip(
        'update the locator by right clicking the element in page');
    insertCmd.setTooltip('add one or more actions after the step');
    failCmd.setTooltip('fail the step and add or associate a bug');
    goog.events.listen(
        deleteCmd,
        goog.ui.Component.EventType.ACTION,
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.DELETE_CMD,
            {}));
    goog.events.listen(
        failCmd,
        goog.ui.Component.EventType.ACTION,
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.FAIL_CMD,
            {}));
    goog.events.listen(
        overrideCmd,
        goog.ui.Component.EventType.ACTION,
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.OVERRIDE_CMD,
            {}));
    goog.events.listen(
        updateCmd,
        goog.ui.Component.EventType.ACTION,
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.UPDATE_CMD,
            {}));
    goog.events.listen(
        insertCmd,
        goog.ui.Component.EventType.ACTION,
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.INSERT_CMD,
            {}));
  }
};


/**
 * Insert commands before this line.
 * @return {number} The line number to be inserted.
 * @export
 */
rpf.PlayDialog.prototype.insertCmd = function() {
  var line =
      parseInt(goog.dom.getElement('playbackcurrentstep').value, 10);
  this.setVisible(false);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.PREPARE_RECORD_PLAYBACK_PAGE},
      goog.bind(this.callbackRecordPup_, this));
  return line;
};


/**
 * Updates the corresponding element of the current command.
 * @export
 */
rpf.PlayDialog.prototype.updateCmd = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.PREPARE_RECORD_PLAYBACK_PAGE},
      goog.bind(this.callbackStartUpdateMode_, this));
};


/**
 * Callback when receiving the event for updating element.
 * @param {Object} response The response object.
 * @private
 */
rpf.PlayDialog.prototype.callbackStartUpdateMode_ = function(response) {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.ENTER_UPDATER_MODE,
       'params': {}});
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_ACTION_CALLBACK},
      goog.bind(this.callbackOnReceiveAction_, this));
};


/**
 * Sets the matchHtmlDiv field.
 * @param {string} html The html string.
 * @export
 */
rpf.PlayDialog.prototype.setHtmlDiv = function(html) {
  var matchHtmlDiv = goog.dom.getElement('matchHtmlDiv');
  matchHtmlDiv.innerHTML = html;
};


/**
 * Callback when receiving the event for updating element.
 * @param {Object} response The response object.
 * @private
 */
rpf.PlayDialog.prototype.callbackOnReceiveAction_ = function(response) {
  var line =
      parseInt(goog.dom.getElement('playbackcurrentstep').value, 10);
  var message = 'The xpath was updated to: ' + response['cmdMap']['xpaths'][0];
  this.updatePlaybackStatus(message, 'green');

  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.END_UPDATER_MODE,
       'params': {}});
  this.onUiEvents_(
      Bite.Constants.UiCmds.UPDATE_ELEMENT_AT_LINE,
      {'line': line - 1,
       'cmdMap': response['cmdMap']},
      /** @type {Event} */ ({}),
      goog.bind(this.showUpdateAllUI_, this));
};


/**
 * Callback when prepare record the playback page is ready.
 * @param {Object} response The response object.
 * @private
 */
rpf.PlayDialog.prototype.callbackRecordPup_ = function(
    response) {
  this.onUiEvents_(
      Bite.Constants.UiCmds.START_RECORDING,
      {'passChecking': true},
      /** @type {Event} */ ({}));
};


/**
 * Mark the step as passed and continue.
 * @export
 */
rpf.PlayDialog.prototype.overrideCmd = function() {
  this.switchChoiceSet(false);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.CALLBACK_AFTER_EXEC_CMDS,
       'params': {'status': 'passed'}});
};


/**
 * Callback on deleting a cmd.
 * @param {Object} response The response object.
 * @private
 */
rpf.PlayDialog.prototype.callbackDeleteCmd_ = function(
    response) {
  if (response['needOverride']) {
    this.overrideCmd();
  }
};


/**
 * Deletes the current command.
 * @return {number} The line number to be deleted.
 * @export
 */
rpf.PlayDialog.prototype.deleteCmd = function() {
  goog.dom.removeChildren(goog.dom.getElement('playbackstatus'));
  goog.dom.removeChildren(goog.dom.getElement('matchHtmlDiv'));
  var deleteLine =
      parseInt(goog.dom.getElement('playbackcurrentstep').value, 10);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.DELETE_CMD,
       'params': {'deleteLine': deleteLine}},
      goog.bind(this.callbackDeleteCmd_, this));
  return deleteLine;
};


/**
 * Stops the current playback.
 * @export
 */
rpf.PlayDialog.prototype.failCmd = function() {
  this.switchChoiceSet(false);
  var userLibDiv = goog.dom.getElement('playbackstatus');
  goog.dom.removeChildren(userLibDiv);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.FINISH_CURRENT_RUN,
       'params': {'status': Bite.Constants.WorkerResults.STOPPED,
                  'log': 'Set stop from playback.'}});
  this.setPlaybackStop();
};


/**
 * Set the visibility of the tests selector.
 * @param {boolean} visible Whether to show the selector.
 */
rpf.PlayDialog.prototype.setTestSelectorVisibility = function(visible) {
  goog.style.showElement(
      goog.dom.getElement('rpf-multiple-test-selector'), visible);
};


/**
 * Clears the match html field.
 * @export
 */
rpf.PlayDialog.prototype.clearMatchHtml = function() {
  var matchHtmlDiv = goog.dom.getElement('matchHtmlDiv');
  matchHtmlDiv.innerHTML = '';
};


/**
 * Sets visibility of choiceset area.
 * @param {boolean} visible Whether is visible.
 * @export
 */
rpf.PlayDialog.prototype.setChoiceSetVisibility = function(visible) {
  var choiceset = goog.dom.getElement('choiceset');
  goog.style.showElement(choiceset, visible);
};


/**
 * Cancels the current batch updates.
 * @private
 */
rpf.PlayDialog.prototype.cancelUpdateAllUi_ = function() {
  this.setHtmlDiv('');
  this.setChoiceSetVisibility(true);
};


/**
 * Shows the UI for suggesting the users to update all of the similar steps.
 * @param {Function} registerEvents The function to register events on
 *     buttons in the UI.
 * @param {string} html The html string of the UI.
 * @private
 */
rpf.PlayDialog.prototype.showUpdateAllUI_ = function(registerEvents, html) {
  this.setHtmlDiv(html);
  registerEvents(goog.bind(this.cancelUpdateAllUi_, this));
  this.setChoiceSetVisibility(false);
};


/**
 * Updates the playback status.
 * @param {string} status The status string.
 * @param {string} color The color code.
 * @export
 */
rpf.PlayDialog.prototype.updatePlaybackStatus = function(
    status, color) {
  var userLibDiv = goog.dom.getElement('playbackstatus');
  var statusStyle = 'text-align:center;padding-top:10px;' +
                    'padding-bottom:10px;color:' +
                    color;
  goog.dom.setProperties(userLibDiv, {'style': statusStyle});
  userLibDiv.innerHTML = status;
};


/**
 * Shows the UI to create a new command on failure.
 * @param {string} failureReason The failure reason.
 * @param {string=} opt_failureLog The failure log.
 * @export
 */
rpf.PlayDialog.prototype.makeChoiceAfterFailure =
    function(failureReason, opt_failureLog) {
  var matchHtmlDiv = goog.dom.getElement('matchHtmlDiv');
  switch (failureReason) {
    case Bite.Constants.PlaybackFailures.MULTIPLE_RETRY_FIND_ELEM:
      if (opt_failureLog) {
        goog.dom.getElement('matchHtmlDiv').innerHTML = opt_failureLog;
      }
      this.updatePlaybackStatus(
          'This step failed finding element:', 'red');
      break;
    case Bite.Constants.PlaybackFailures.MULTIPLE_RETRY_CUSTOM_JS:
      matchHtmlDiv.innerHTML = '';
      this.updatePlaybackStatus(
          'Customized function failed.', 'red');
      break;
    case Bite.Constants.PlaybackFailures.TIMEOUT:
      matchHtmlDiv.innerHTML = '';
      this.updatePlaybackStatus(
          'This step failed because deadline exceeded.', 'red');
      break;
    case Bite.Constants.PlaybackFailures.UNSUPPORTED_COMMAND_FAILURE:
      matchHtmlDiv.innerHTML = '';
      this.updatePlaybackStatus(
          'Failed because this step is unsupported.', 'red');
      break;
    case Bite.Constants.PlaybackFailures.USER_PAUSE_FAILURE:
      matchHtmlDiv.innerHTML = '';
      this.updatePlaybackStatus(
          'Manually pause the failure.', 'red');
      break;
    default:
      this.updatePlaybackStatus(
        'Unknown playback error.', 'red');
  }
  this.switchChoiceSet(true);
};
