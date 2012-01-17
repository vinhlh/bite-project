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
 * @fileoverview This file contains a dialog for RPF validation.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.ValidateDialog');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');
goog.require('rpf.Attributes');
goog.require('rpf.CodeGenerator');
goog.require('rpf.Console.Messenger');
goog.require('rpf.MiscHelper');
goog.require('rpf.soy.Dialog');



/**
 * A class for validation.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.ValidateDialog = function(messenger, onUiEvents) {
  /**
   * The first elem to validate.
   * @type Object
   * @private
   */
  this.validationElem_ = {};

  /**
   * The descriptor got from the page under record.
   * @type *
   * @private
   */
  this.validDescriptor_ = {};

  /**
   * The xpath string.
   * @type {string}
   * @private
   */
  this.xpath_ = '';

  /**
   * The attributes controller.
   * @type Object
   * @private
   */
  this.attrControl_ = new rpf.Attributes(
      rpf.Attributes.UITypes.VALIDATION_DIALOG, onUiEvents);

  /**
   * The validation dialog.
   * @type Object
   * @private
   */
  this.validationDialog_ = new goog.ui.Dialog();

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
   * The action selector.
   * @type {goog.ui.Select}
   * @private
   */
  this.actionSelector_ = null;

  /**
   * Inits the validation dialog.
   */
  this.initValidationDialog_();
};


/**
 * Sets the visibility of the validation dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.ValidateDialog.prototype.setVisible = function(display) {
  this.validationDialog_.setVisible(display);
};


/**
 * Inits the playback runtime dialog.
 * @private
 */
rpf.ValidateDialog.prototype.initValidationDialog_ = function() {
  var dialogElem = this.validationDialog_.getContentElement();
  var contentDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'validationdialog',
       'style': 'text-align:center;'});
  dialogElem.appendChild(contentDiv);
  this.validationDialog_.setTitle('Validation');
  this.validationDialog_.setButtonSet(null);
  this.validationDialog_.setVisible(true);
  this.initValidationChoices_();
  this.validationDialog_.setVisible(false);
};


/**
 * Inits the validation dialog.
 * @private
 */
rpf.ValidateDialog.prototype.initValidationChoices_ = function() {
  var validationDialog = goog.dom.getElement('validationdialog');
  soy.renderElement(validationDialog, rpf.soy.Dialog.createValidationDialog);
};


/**
 * Inits the action selector.
 * @private
 */
rpf.ValidateDialog.prototype.initActionSelector_ = function() {
  var selectorDiv = goog.dom.getElement('actions-select');
  goog.dom.removeChildren(selectorDiv);
  this.actionSelector_ = new goog.ui.Select('Actions');
  this.actionSelector_.addItem(new goog.ui.MenuItem('verify'));
  this.actionSelector_.addItem(new goog.ui.MenuItem('verifyNot'));
  this.actionSelector_.addItem(new goog.ui.MenuItem('move'));
  this.actionSelector_.setSelectedIndex(0);
  this.actionSelector_.render(selectorDiv);
};


/**
 * Shows the validation UI for attributes.
 * @export
 */
rpf.ValidateDialog.prototype.displayAllAttributes = function() {
  this.clearChoiceView_();
  var choiceView = goog.dom.getElement('choiceViewDiv');
  this.attrControl_.createAttrTabs(
      choiceView,
      this.validDescriptor_,
      this.xpath_,
      goog.bind(this.generateDescriptor_, this));
  soy.renderElement(
      goog.dom.getElement('action-name-in-validation-dialog'),
      rpf.soy.Dialog.createActionNames);
  this.initActionSelector_();
};



/**
 * Opens the validation dialog.
 * @param {Object} request An object contains element related info.
 * @export
 */
rpf.ValidateDialog.prototype.openValidationDialog = function(request) {
  if (this.validationElem_['descriptor'] &&
      this.validationElem_['descriptor'] == request['descriptor']) {
    this.attrControl_.generateDescriptor_();
    return;
  }
  this.validationElem_ = request;
  this.validDescriptor_ = goog.json.parse(request['descriptor']);
  this.xpath_ = request['xpaths'][0];
  this.initValidationChoices_();
  this.displayAllAttributes();
  this.validationDialog_.setVisible(true);
};


/**
 * Clears the choice view div.
 * @private
 */
rpf.ValidateDialog.prototype.clearChoiceView_ = function() {
  var choiceView = goog.dom.getElement('choiceViewDiv');
  goog.dom.removeChildren(choiceView);
  var actions = goog.dom.getElement('action-name-in-validation-dialog');
  goog.dom.removeChildren(actions);
};


/**
 * Updates the editor with the new generated command.
 * @param {Object} response The response object.
 * @private
 */
rpf.ValidateDialog.prototype.updateEditorWithCommand_ = function(response) {
  var scriptInfo = response['scriptInfo'];
  this.onUiEvents_(
     Bite.Constants.UiCmds.ADD_NEW_COMMAND,
     {'pCmd': scriptInfo['cmd'],
      'dCmd': scriptInfo['data'],
      'cmdMap': scriptInfo['cmdMap']},
     /** @type {Event} */ ({}));
};


/**
 * Generates a the validation command.
 * @private
 */
rpf.ValidateDialog.prototype.generateDescriptor_ = function() {
  var content = this.validDescriptor_.elementText;
  if (typeof(content) != 'string') {
    content = content['value'];
  }
  var xpathInput = this.attrControl_.getXpathInput();
  var xpaths = this.validationElem_['xpaths'];
  if (xpathInput && typeof xpaths == 'object') {
    xpaths[0] = xpathInput.value;
  }
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.GENERATE_NEW_COMMAND,
       'params': {
         'selectors': this.validationElem_['selectors'],
         'content': escape(content),
         'nodeType': this.validationElem_.nodeType,
         'action': this.actionSelector_.getSelectedItem().getValue(),
         'descriptor': JSON.stringify(this.validDescriptor_),
         'elemVarName': this.validationElem_['elemVarName'],
         'iframeInfo': this.validationElem_['iframeInfo'],
         'xpaths': xpaths,
         'className': this.validationElem_['className']}},
      goog.bind(this.updateEditorWithCommand_, this));
  this.clearChoiceView_();
  this.setVisible(false);
  this.validationElem_ = {};
};
