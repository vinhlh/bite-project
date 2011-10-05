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
 * @fileoverview This file contains RPF's setting dialog.
 * It gets popped up when user clicks the settings button.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.SettingDialog');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.MiscHelper');



/**
 * A class for showing setting dialog.
 * This dialog shows user options to set playback interval,
 * or test user's specified script.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.SettingDialog = function(onUiEvents) {
  /**
   * The setting dialog.
   * @type Object
   * @private
   */
  this.settingDialog_ = new goog.ui.Dialog();

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = rpf.Console.Messenger.getInstance();

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * Inits the setting dialog.
   */
  this.initSettingDialog_();
};


/**
 * Localstorage name for whether takes screenshots.
 * @type {string}
 * @private
 */
rpf.SettingDialog.TAKE_SCREENSHOTS_ = 'takeScreenshots';


/**
 * Localstorage name for whether uses xpath.
 * @type {string}
 * @private
 */
rpf.SettingDialog.USE_XPATH_ = 'useXpath';


/**
 * Inits the setting dialog.
 * @private
 */
rpf.SettingDialog.prototype.initSettingDialog_ = function() {
  var dialogElem = this.settingDialog_.getContentElement();
  var textOne = null;
  var textFive = null;
  var nickName = null;
  var textEight = null;
  var iconUrl = null;
  var textSeven = null;
  var textNine = null;
  /*
   * <div id="settings">
   *   <div class="console-div-text">
   *   <input ...>
   *   <input ...>
   *   <div>
   *   <textarea>
   *   <input>
   * </div>
   */
  var contentDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'settings'},
      textOne = goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'console-div-text'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'text', 'id': 'playbackinterval'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'button', 'value': 'ok', 'id': 'playbackintervalbutton'}),
      textNine = goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'console-div-text'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'text', 'id': 'defaulttimeout'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'button', 'value': 'ok', 'id': 'defaulttimeoutbutton'})
      );
  var takeShots = goog.dom.createDom(goog.dom.TagName.DIV, {},
      textSeven = goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'console-div-text'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'checkbox', 'id': 'whethertakescreenshot'}));
  var useXpath = goog.dom.createDom(goog.dom.TagName.DIV, {},
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'console-div-text'}, 'Use Xpath?'),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'checkbox', 'id': 'whetherUseXpath'}));
  dialogElem.appendChild(contentDiv);
  dialogElem.appendChild(takeShots);
  dialogElem.appendChild(useXpath);
  goog.dom.setTextContent(textOne, 'Playback Interval (sec)');
  goog.dom.setTextContent(textSeven, 'Take Screenshot');
  goog.dom.setTextContent(textNine, 'Default timeout (in secs)');
  this.settingDialog_.setTitle('Settings');
  this.settingDialog_.setButtonSet(null);
  this.settingDialog_.setVisible(true);
  this.settingDialog_.setVisible(false);
  this.registerListeners_();
  this.initTakeScreenshotsCheckbox_();
  this.initUseXpath_();
};


/**
 * Generates the webdriver code directly.
 * @private
 */
rpf.SettingDialog.prototype.registerListeners_ = function() {
  goog.events.listen(
      goog.dom.getElement('playbackintervalbutton'),
      'click',
      goog.bind(this.setPlaybackInterval_, this));
  goog.events.listen(
      goog.dom.getElement('defaulttimeoutbutton'),
      'click',
      goog.bind(this.setTimeout_, this));
  goog.events.listen(
      goog.dom.getElement('whethertakescreenshot'),
      'click',
      goog.bind(this.setTakeScreenshot_, this));
  goog.events.listen(
      goog.dom.getElement('whetherUseXpath'),
      'click',
      goog.bind(this.setUseXpath_, this));
};


/**
 * Sets whether take the screenshots while recording.
 * @private
 */
rpf.SettingDialog.prototype.initTakeScreenshotsCheckbox_ =
    function() {
  var takes = goog.global.localStorage[
      rpf.SettingDialog.TAKE_SCREENSHOTS_];
  if (!takes || takes == 'true') {
    goog.dom.getElement('whethertakescreenshot').checked = true;
  } else {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SET_TAKE_SCREENSHOT,
         'params': {'isTaken': false}});
  }
};


/**
 * Sets whether take the screenshots while recording.
 * @private
 */
rpf.SettingDialog.prototype.setTakeScreenshot_ = function() {
  var checked = goog.dom.getElement('whethertakescreenshot').checked;
  goog.global.localStorage[
      rpf.SettingDialog.TAKE_SCREENSHOTS_] = checked;
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_TAKE_SCREENSHOT,
       'params': {'isTaken': checked}});
};


/**
 * Sets whether uses the xpath to replay.
 * @private
 */
rpf.SettingDialog.prototype.setUseXpath_ = function() {
  var checked = goog.dom.getElement('whetherUseXpath').checked;
  goog.global.localStorage[rpf.SettingDialog.USE_XPATH_] = checked;
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_USE_XPATH,
       'params': {'use': checked}});
};


/**
 * Sets whether uses xpath.
 * @private
 */
rpf.SettingDialog.prototype.initUseXpath_ = function() {
  var use = goog.global.localStorage[rpf.SettingDialog.USE_XPATH_];
  if (use && use == 'true') {
    goog.dom.getElement('whetherUseXpath').checked = true;
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SET_USE_XPATH,
         'params': {'use': true}});
  }
};


/**
 * Sets time out.
 * @private
 */
rpf.SettingDialog.prototype.setTimeout_ = function() {
  var time = parseInt(goog.dom.getElement('defaulttimeout').value, 10) * 1000;
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_DEFAULT_TIMEOUT,
       'params': {'time': time}});
};


/**
 * Sets the playback interval in seconds.
 * @private
 */
rpf.SettingDialog.prototype.setPlaybackInterval_ = function() {
  var interval = parseFloat(goog.dom.getElement('playbackinterval').value);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_PLAYBACK_INTERVAL,
       'params': {'interval': interval}});
};


/**
 * Sets the visibility of the setting dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.SettingDialog.prototype.setVisible = function(display) {
  this.settingDialog_.setVisible(display);
};

