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
 * @fileoverview This file contains RPF's additional info dialog.
 * It gets popped up when user clicks on the notes button in console.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.NotesDialog');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.Constants');



/**
 * A class for writing additional test info including project name,
 * test name, start url, test data and user's own library.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.NotesDialog = function(messenger, onUiEvents) {
  /**
   * The notes dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.notesDialog_ = new goog.ui.Dialog();

  /**
   * The editor in notes dialog.
   * @type {Object}
   * @private
   */
  this.editor_ = null;

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * Inits the notes dialog.
   */
  this.initNotesDialog_();

  /**
   * The editor manager.
   * @type {rpf.EditorManager}
   * @private
   */
  this.editorMngr_ = new rpf.EditorManager(
      'rpf-console-js-functions',
      goog.nullFunction,
      goog.nullFunction,
      goog.nullFunction);

};


/**
 * Inits the toolbar.
 * @private
 */
rpf.NotesDialog.prototype.initToolbar_ = function() {
  var toolbar = new goog.ui.Toolbar();

  var playBtn = new goog.ui.ToolbarButton(
      goog.dom.getElement('rpf-js-play-button'));
  var generateBtn = new goog.ui.ToolbarButton(
      goog.dom.getElement('rpf-js-generate-button'));
  var storeBtn = new goog.ui.ToolbarButton(
      goog.dom.getElement('rpf-js-store-button'));
  var depsBtn = new goog.ui.ToolbarButton(
      goog.dom.getElement('rpf-js-deps-button'));

  goog.events.listen(
      playBtn,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.playJsFile_, this));

  goog.events.listen(
      generateBtn,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.popToGenerateJsCall_, this));

  goog.events.listen(
      storeBtn,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.openStoreTab_, this));

  goog.events.listen(
      depsBtn,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.popDependencyDialog_, this));

  toolbar.addChild(playBtn, true);
  toolbar.addChild(generateBtn, true);
  toolbar.addChild(storeBtn, true);
  toolbar.addChild(depsBtn, true);

  toolbar.render(goog.dom.getElement('rpf-console-js-functions-toolbar'));
};


/**
 * Opens the methods store page in a new tab.
 * @private
 */
rpf.NotesDialog.prototype.openStoreTab_ = function() {
  chrome.windows.create(
      {url: rpf.Constants.DEFAULT_SERVER + '/store/view',
       width: 1000,
       height: 800,
       top: 10,
       left: 10});
};


/**
 * Opens the dialog to show the common methods dependency.
 * @private
 */
rpf.NotesDialog.prototype.popDependencyDialog_ = function() {
  this.onUiEvents_(
      Bite.Constants.UiCmds.OPEN_COMMON_METHODS_DEPS,
      {},
      /** @type {Event} */ ({}));
};


/**
 * Plays the JS file in the tab under record.
 * @private
 */
rpf.NotesDialog.prototype.playJsFile_ = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.EXECUTE_SCRIPT_IN_RECORD_PAGE,
       'params': {'code': this.editorMngr_.getCode(),
                  'allFrames': false}});
};


/**
 * Pops up the dialog for generating an invocation.
 * @private
 */
rpf.NotesDialog.prototype.popToGenerateJsCall_ = function() {
  this.onUiEvents_(
      Bite.Constants.UiCmds.OPEN_GENERATE_INVOCATION,
      {},
      /** @type {Event} */ ({}));
};


/**
 * Replaces the current JS content.
 * @param {string} code The JS code.
 */
rpf.NotesDialog.prototype.replaceContent = function(code) {
  this.editorMngr_.setCode(code);
};


/**
 * Inits the notes dialog.
 * @private
 */
rpf.NotesDialog.prototype.initNotesDialog_ = function() {
  var dialogElem = this.notesDialog_.getContentElement();
  this.notesDialog_.setTitle('Javascript functions');
  this.notesDialog_.setButtonSet(null);
  this.notesDialog_.setVisible(true);
  this.notesDialog_.setVisible(false);
  bite.common.mvc.helper.renderModelFor(dialogElem, rpf.soy.Dialog.jsContent);
  this.initToolbar_();
};


/**
 * Resizes the window. This is necessary because css overflow does not
 * play nicely with percentages.
 */
rpf.NotesDialog.prototype.resize = function() {
  var dialogTitleHeight = 50;
  var dialogScreenPercentage = 0.8;
  var screenHeight = goog.dom.getViewportSize().height;
  var contentElem = this.notesDialog_.getContentElement();
  var newHeight = screenHeight * dialogScreenPercentage - dialogTitleHeight;
  goog.style.setStyle(
      contentElem, {'padding': '0', 'height': newHeight});
  goog.style.setStyle(
      goog.dom.getElement('rpf-console-js-functions'),
      {'width': goog.dom.getViewportSize().width,
       'height': screenHeight * dialogScreenPercentage - dialogTitleHeight,
       'font-size': '14px'});
  this.editorMngr_.resize();
};


/**
 * Sets the visibility of the notes dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.NotesDialog.prototype.setVisible = function(display) {
  this.notesDialog_.setVisible(display);
  if (display) {
    this.resize();
  }
};


/**
 * Gets the current user lib in Json format.
 * @return {string} The current user lib.
 */
rpf.NotesDialog.prototype.getUserLib = function() {
  var defaultFiles = [{'name': 'default', 'code': this.editorMngr_.getCode()}];
  return goog.json.serialize(defaultFiles);
};


/**
 * Gets the current user lib as a runnable string.
 * @return {string} The current user lib.
 */
rpf.NotesDialog.prototype.getUserLibAsRunnable = function() {
  return this.editorMngr_.getCode();
};

