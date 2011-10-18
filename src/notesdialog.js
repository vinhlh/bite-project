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

goog.require('bite.common.net.xhr.async');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.Helper');



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
   * The console helper.
   * @type {rpf.Helper}
   * @private
   */
  this.helper_ = null;

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
};


/**
 * Inits the notes dialog.
 * @private
 */
rpf.NotesDialog.prototype.initNotesDialog_ = function() {
  var dialogElem = this.notesDialog_.getContentElement();
  var editorViewDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'editorViewDivInNoteDialog'});
  this.notesDialog_.setTitle('Additional Script Info');
  this.notesDialog_.setButtonSet(null);
  this.notesDialog_.setVisible(true);
  this.notesDialog_.setVisible(false);
  var submitDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'style': 'text-align: left'},
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'style': 'display:inline'}, 'My Libraries:'),
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'style': 'display:inline',
           'id': 'mylibinputlibname'}),
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'style': 'display:inline',
           'id': 'mylibinputusername'}),
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'style': 'display:inline',
           'id': 'mylibsubmitbutton'}));
  var hr = goog.dom.createDom(goog.dom.TagName.HR);
  dialogElem.appendChild(submitDiv);
  dialogElem.appendChild(hr);
  var labelLibName = new goog.ui.LabelInput('lib name');
  labelLibName.render(goog.dom.getElement('mylibinputlibname'));
  labelLibName.getElement().id = 'mylibinputlibnameInput';
  labelLibName.getElement().size = '10';
  var labelUserName = new goog.ui.LabelInput('user name');
  labelUserName.render(goog.dom.getElement('mylibinputusername'));
  labelUserName.getElement().id = 'mylibinputusernameInput';
  labelUserName.getElement().size = '10';
  var submitButton = new goog.ui.CustomButton('Add To Common Lib');
  submitButton.render(goog.dom.getElement('mylibsubmitbutton'));
  goog.events.listen(
      submitButton,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ADD_TO_COMMON_LIB,
          {}));
  dialogElem.appendChild(editorViewDiv);
  this.helper_ = new rpf.Helper(
      goog.dom.getElement('editorViewDivInNoteDialog'),
      'editorInNoteDialog',
      this.messenger_,
      this.onUiEvents_);
  this.editor_ = this.helper_.getEditor();
  hr = goog.dom.createDom(goog.dom.TagName.HR);
  dialogElem.appendChild(hr);
};


/**
 * Adds command to common lib.
 * @export
 */
rpf.NotesDialog.prototype.addToCommonLib = function() {
  var libName = goog.dom.getElement('mylibinputlibnameInput').value;
  var userName = goog.dom.getElement('mylibinputusernameInput').value;
  if (!libName || !userName || libName == 'lib name' ||
      userName == 'user name') {
    alert('Please fill lib and user names properly.');
    return;
  }
  var confirmSubmit = confirm(
      'This will submit the lib to Common Lib. Are you sure?');
  if (confirmSubmit == true) {
    var lib = this.editor_.getCode();
    var requestUrl = rpf.MiscHelper.getUrl(
        rpf.MiscHelper.COMMON_LIB_SERVER,
        '/add_common_lib',
        {});
    var parameters = goog.Uri.QueryData.createFromMap(
        {'name': libName,
         'user': userName,
         'lib': lib}).toString();
    bite.common.net.xhr.async.post(requestUrl, parameters,
        function(success, data) { alert(data); });
  }
};


/**
 * Sets the visibility of the notes dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.NotesDialog.prototype.setVisible = function(display) {
  this.notesDialog_.setVisible(display);
  this.helper_.loadSelectedLib();
};


/**
 * Sets the current user lib.
 * @param {string} lib The current user lib.
 * @export
 */
rpf.NotesDialog.prototype.setUserLib = function(lib) {
  lib = lib || '';
  if (this.helper_.getCurrentOption() == Bite.Constants.TEST_LIB_NAME) {
    this.editor_.setCode(lib);
  } else {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SET_COMMON_LIB,
         'params': {'name': Bite.Constants.TEST_LIB_NAME,
                    'value': lib}});
  }
};


/**
 * Gets the helper instance.
 * @return {rpf.Helper} The helper instance.
 * @export
 */
rpf.NotesDialog.prototype.getHelper = function() {
  return this.helper_;
};


/**
 * Gets the current user lib.
 * @return {Object} The current user lib.
 * @export
 */
rpf.NotesDialog.prototype.getUserLib = function() {
  if (this.helper_.getCurrentOption() == Bite.Constants.TEST_LIB_NAME) {
    return {'script': this.editor_.getCode(),
            'needOverride': false};
  } else {
    return {'script': '',
            'needOverride': true};
  }
};
