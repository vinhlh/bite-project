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
 * @fileoverview This file contains RPF's quick commands dialog.
 * This dialog provides users with an easy way to generate certain commands,
 * like sleep and url changes.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.QuickCmdDialog');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('rpf.CodeGenerator');
goog.require('rpf.MiscHelper');



/**
 * A class for quick commands dialog.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.QuickCmdDialog = function(onUiEvents) {
  /**
   * The quick commands dialog.
   * @type Object
   * @private
   */
  this.quickCmdDialog_ = new goog.ui.Dialog();

  /**
   * The invoke test select control.
   * @type {Object}
   * @private
   */
  this.invokeSelectCtrl_ = null;

  /**
   * The invoke test ids.
   * @type {Array.<string>}
   * @private
   */
  this.testIds_ = [];

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * Inits the quick commands dialog.
   */
  this.initQuickCmdDialog_();
};


/**
 * Enum for quick commands.
 * @enum {string}
 * @export
 */
rpf.QuickCmdDialog.Commands = {
  SLEEP: 'sleep',
  CHANGE_URL: 'changeUrl',
  FUNCTION: 'function',
  INVOKE: 'invoke'
};


/**
 * Enum for quick commands description.
 * @enum {string}
 * @export
 */
rpf.QuickCmdDialog.CmdDesc = {
  SLEEP: 'Sleep (ms)',
  CHANGE_URL: 'Change Url to',
  FUNCTION: 'Add customized function',
  INVOKE: 'Invoke another test'
};


/**
 * Inits the quick commands dialog.
 * @private
 */
rpf.QuickCmdDialog.prototype.initQuickCmdDialog_ = function() {
  var dialogElem = this.quickCmdDialog_.getContentElement();
  var contentDiv = goog.dom.createDom(goog.dom.TagName.TABLE, {
    'id': 'quickCmdsTable',
    'width': '100%'
  });
  for (var key in rpf.QuickCmdDialog.Commands) {
    var row = this.addRowOfCmd_(rpf.QuickCmdDialog.CmdDesc[key],
                                key);
    contentDiv.appendChild(row);
  }
  dialogElem.appendChild(contentDiv);
  this.quickCmdDialog_.setTitle('Quick Commands');
  this.quickCmdDialog_.setButtonSet(null);
  this.quickCmdDialog_.setVisible(true);
  this.quickCmdDialog_.setVisible(false);
  this.prepareInvokeTests_();
};


/**
 * Updates the select box of tests.
 * @param {Array.<string>} names The test names.
 * @param {Array.<string>} ids The test ids.
 * @export
 */
rpf.QuickCmdDialog.prototype.updateInvokeSelect = function(
    names, ids) {
  this.testIds_ = ids;
  this.invokeSelectCtrl_.innerHTML = '';
  for (var i = 0; i < names.length; i++) {
    var opt = new Option(names[i], names[i]);
    this.invokeSelectCtrl_.add(opt, null);
  }
};


/**
 * Generates the invocation command.
 * @private
 */
rpf.QuickCmdDialog.prototype.generateInvocation_ = function() {
  for (var i = 0; i < this.invokeSelectCtrl_.options.length; i++) {
    if (this.invokeSelectCtrl_.options[i].selected == true) {
      var generatedCmd = rpf.CodeGenerator.generateInvocationCmd(
          this.testIds_[i], this.invokeSelectCtrl_.options[i].value);
      this.onUiEvents_(
          Bite.Constants.UiCmds.ADD_NEW_COMMAND,
          {'pCmd': generatedCmd,
           'dCmd': ''},
          /** @type {Event} */ ({}));
      break;
    }
  }
};


/**
 * Prepares the select box of tests.
 * @private
 */
rpf.QuickCmdDialog.prototype.prepareInvokeTests_ = function() {
  var inputId = 'INVOKE_text';
  var input = goog.dom.getElement(inputId);
  var td = input.parentNode;
  goog.dom.removeChildren(td);
  goog.dom.appendChild(td,
      this.invokeSelectCtrl_ = goog.dom.createDom(goog.dom.TagName.SELECT,
      {'id': 'selectInvokeInQuickCmd'}));
};


/**
 * Sets the visibility of the quick commands dialog.
 * @param {boolean} display Whether or not to show the dialog.
 * @export
 */
rpf.QuickCmdDialog.prototype.setVisible = function(display) {
  this.quickCmdDialog_.setVisible(display);
};


/**
 * Adds a row for a command.
 * @param {string} description The cmd's description.
 * @param {string} id The cmd's id.
 * @return {Element} The generated row element.
 * @private
 */
rpf.QuickCmdDialog.prototype.addRowOfCmd_ = function(
    description, id) {
  var tdOne = {};
  var tdTwo = {};
  var tdThree = {};
  var text = {};
  var buttonDiv = {};
  var input = {};
  var row = goog.dom.createDom(goog.dom.TagName.TR, {},
      tdOne = goog.dom.createDom(goog.dom.TagName.TD,
          {'align': 'right',
           'width': '40%',
           'style': 'font: bold 13px verdana;'},
           text = goog.dom.createDom(goog.dom.TagName.DIV, {})),
      tdTwo = goog.dom.createDom(goog.dom.TagName.TD,
          {'align': 'left', 'width': '40%'},
          input = goog.dom.createDom('input', {
            'id': id + '_text',
            'type': 'text'})),
      tdThree = goog.dom.createDom(goog.dom.TagName.TD,
          {'width': '20%'},
          buttonDiv = goog.dom.createDom(goog.dom.TagName.DIV,
              {'style': 'font: bold 13px verdana;'})));
  var button = new goog.ui.CustomButton('Add');
  button['id'] = id;
  button.render(buttonDiv);
  goog.events.listen(button, goog.ui.Component.EventType.ACTION,
                     this.onAddCmd_, false, this);
  goog.dom.setTextContent(text, description);
  return row;
};


/**
 * Adds a command to the editor.
 * @param {Object} e The event.
 * @private
 */
rpf.QuickCmdDialog.prototype.onAddCmd_ = function(e) {
  var id = e.target.id;
  if (id == 'INVOKE') {
    this.generateInvocation_();
    return;
  }
  var value = goog.dom.getElement(id + '_text').value;
  var cmd = rpf.QuickCmdDialog.Commands[id];
  this.writeCmd(cmd, value);
};


/**
 * Writes a command to the editor.
 * @param {rpf.QuickCmdDialog.Commands} cmd The command.
 * @param {string} value The given value for the command.
 * @export
 */
rpf.QuickCmdDialog.prototype.writeCmd = function(cmd, value) {
  if (cmd == rpf.QuickCmdDialog.Commands.SLEEP) {
    var generatedCmd = rpf.CodeGenerator.generateSleepCmd(value);
    this.onUiEvents_(
        Bite.Constants.UiCmds.ADD_NEW_COMMAND,
        {'pCmd': generatedCmd,
         'dCmd': ''},
        /** @type {Event} */ ({}));
  } else if (cmd == rpf.QuickCmdDialog.Commands.CHANGE_URL) {
    var generatedCmd = rpf.CodeGenerator.generateUrlChange(value);
    this.onUiEvents_(
        Bite.Constants.UiCmds.ADD_NEW_COMMAND,
        {'pCmd': generatedCmd,
         'dCmd': ''},
        /** @type {Event} */ ({}));
    this.onUiEvents_(
        Bite.Constants.UiCmds.ADD_NEW_COMMAND,
        {'pCmd': rpf.CodeGenerator.getRedirectUrl(value),
         'dCmd': ''},
        /** @type {Event} */ ({}));
  } else if (cmd == rpf.QuickCmdDialog.Commands.FUNCTION) {
    var generatedCmd = rpf.CodeGenerator.generateFunctionCmd(value);
    this.onUiEvents_(
        Bite.Constants.UiCmds.ADD_NEW_COMMAND,
        {'pCmd': generatedCmd,
         'dCmd': ''},
        /** @type {Event} */ ({}));
  } else {
    throw new Error('Not supported command!');
  }
};
