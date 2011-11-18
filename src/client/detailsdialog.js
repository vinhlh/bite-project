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

goog.provide('rpf.DetailsDialog');

goog.require('bite.common.mvc.helper');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.Tooltip');
goog.require('rpf.Console.Messenger');
goog.require('rpf.EditorManager');
goog.require('rpf.MiscHelper');
goog.require('rpf.ScreenShotDialog');
goog.require('rpf.soy.Dialog');



/**
 * A class for command detailed info.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @param {rpf.EditorManager} editorMgr The editor manager.
 * @param {rpf.ScreenShotDialog} scnshotMgr
 *     The screenshot manager.
 * @constructor
 * @export
 */
rpf.DetailsDialog = function(
    messenger, onUiEvents, editorMgr, scnshotMgr) {
  /**
   * The details dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.detailsDialog_ = new goog.ui.Dialog();

  /**
   * The attributes controller.
   * @type {rpf.Attributes}
   * @private
   */
  this.attrControl_ = new rpf.Attributes(
      rpf.Attributes.UITypes.DETAILS_DIALOG, onUiEvents);

  /**
   * The descriptor object.
   * @type {Object}
   * @private
   */
  this.descriptor_ = null;

  /**
   * The xpath string.
   * @type {string}
   * @private
   */
  this.xpath_ = '';

  /**
   * Whether the editor shows.
   * @type {boolean}
   * @private
   */
  this.editorShown_ = false;

  /**
   * Current line number.
   * @type {number}
   * @private
   */
  this.curLine_ = 0;

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
   * The editor manager.
   * @type {rpf.EditorManager}
   * @private
   */
  this.editorMgr_ = editorMgr;

  /**
   * The editor manager.
   * @type {rpf.ScreenShotDialog}
   * @private
   */
  this.scnshotMgr_ = scnshotMgr;

  /**
   * The screenshot div.
   * @type {Element}
   * @private
   */
  this.screenDiv_ = null;

  /**
   * The attributes div.
   * @type {Element}
   * @private
   */
  this.editorDiv_ = null;

  /**
   * The more info div.
   * @type {Element}
   * @private
   */
  this.moreInfoDiv_ = null;

  /**
   * Inits the validation dialog.
   */
  this.initDetailsnDialog_();

  goog.events.listen(
      this.detailsDialog_,
      goog.ui.Dialog.EventType.AFTER_HIDE,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.UPDATE_HIGHLIGHT_LINE,
          {'lineNum': -1}));
};


/**
 * Updates the command info on the dialog.
 * @param {Object} descriptor The descriptor object.
 * @param {number} line The line number.
 * @param {string} translation The command's translation.
 * @param {string} cmdId The command id.
 * @param {string} xpath The xpath string.
 * @param {Object} infoMap The information map of the current test.
 * @export
 */
rpf.DetailsDialog.prototype.updateInfo =
    function(descriptor, line, translation, cmdId, xpath, infoMap) {
  this.curLine_ = line;
  var dialogElem = this.detailsDialog_.getContentElement();
  var screenSrc = this.scnshotMgr_.getScreenshotManager().getScreenById(cmdId);
  bite.common.mvc.helper.renderModelFor(dialogElem,
                                        rpf.soy.Dialog.detailsContent,
                                        {'screenSrc': screenSrc,
                                         'line': line + 1});
  var prevBtn = goog.dom.getElement('rpf-prev-line');
  var nextBtn = goog.dom.getElement('rpf-next-line');
  cmdId = cmdId || line + '';
  this.screenDiv_ = goog.dom.getElement('rpf-details-screenshot');
  this.editorDiv_ = goog.dom.getElement('rpf-details-editor');
  this.moreInfoDiv_ = goog.dom.getElement('rpf-details-moreinfo');
  goog.events.listen(
      prevBtn,
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_PREV_PAGE,
          {}));
  goog.events.listen(
      nextBtn,
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_NEXT_PAGE,
          {}));
  goog.events.listen(
      goog.dom.getElement('saveStepName'),
      'click',
      goog.bind(this.saveStepName_, this, infoMap, cmdId));
  goog.events.listen(
      goog.dom.getElement('saveClassName'),
      'click',
      goog.bind(this.saveClassName_, this, infoMap, cmdId));
  this.descriptor_ = descriptor;
  this.xpath_ = xpath;
  this.drawCmdToolbar_(line);
  this.setStepInfo_(infoMap, cmdId);

  if (!this.editorShown_) {
    this.turnOnScreenView_();
  } else {
    this.turnOnAttributesView_();
  }
  this.detailsDialog_.setVisible(true);
};


/**
 * Set the step name in the details dialog.
 * @param {Object} infoMap The information map.
 * @param {string} id The command id.
 * @private
 */
rpf.DetailsDialog.prototype.setStepInfo_ = function(infoMap, id) {
  if (!infoMap || !infoMap['steps'] || !infoMap['steps'][id]) {
    return;
  }
  var stepName = infoMap['steps'][id]['stepName'];
  var className = infoMap['steps'][id]['pageName'];
  var stepNameInput = goog.dom.getElement('stepNameInput');
  var classNameInput = goog.dom.getElement('classNameInput');
  stepNameInput.value = stepName;
  classNameInput.value = className;
  new goog.ui.Tooltip(stepNameInput, 'Please follow JS naming convention.');
  new goog.ui.Tooltip(classNameInput,
      'Please set the class name that associates with the step.');
};


/**
 * Saves the step name in the details dialog.
 * @param {Object} infoMap The information map.
 * @param {string} id The command id.
 * @private
 */
rpf.DetailsDialog.prototype.saveStepName_ = function(infoMap, id) {
  var stepName = goog.dom.getElement('stepNameInput').value;
  infoMap['steps'][id]['stepName'] = stepName;
};


/**
 * Saves the class name in the details dialog.
 * @param {Object} infoMap The information map.
 * @param {string} id The command id.
 * @private
 */
rpf.DetailsDialog.prototype.saveClassName_ = function(infoMap, id) {
  var className = goog.dom.getElement('classNameInput').value;
  infoMap['steps'][id]['pageName'] = className;
};


/**
 * Draw command manipulation toolbar.
 * @param {number} line The line number of the selected line.
 * @private
 */
rpf.DetailsDialog.prototype.drawCmdToolbar_ = function(line) {
  var actionMenu = new goog.ui.ToolbarMenuButton('Actions');
  var upMenuItem = new goog.ui.MenuItem('moveUp');
  var downMenuItem = new goog.ui.MenuItem('moveDown');
  var aboveMenuItem = new goog.ui.MenuItem('insertAbove');
  var belowMenuItem = new goog.ui.MenuItem('insertBelow');
  var deleteMenuItem = new goog.ui.MenuItem('deleteRow');

  actionMenu.addItem(upMenuItem);
  actionMenu.addItem(downMenuItem);
  actionMenu.addItem(aboveMenuItem);
  actionMenu.addItem(belowMenuItem);
  actionMenu.addItem(deleteMenuItem);

  goog.events.listen(
      upMenuItem,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_CMD_MOVE_UP,
          {}));
  goog.events.listen(
      downMenuItem,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_CMD_MOVE_DOWN,
          {}));
  goog.events.listen(
      aboveMenuItem,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_INSERT_ABOVE,
          {}));
  goog.events.listen(
      belowMenuItem,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_INSERT_BELOW,
          {}));
  goog.events.listen(
      deleteMenuItem,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_REMOVE_CUR_LINE,
          {}));
  actionMenu.render(goog.dom.getElement('rpf-details-toolbar'));

  this.attr_ = new goog.ui.CustomButton('Switch to details');

  this.attrControl_.createAttrTabs(
      this.editorDiv_, this.descriptor_,
      this.xpath_, goog.bind(this.replaceLine, this), line);

  goog.events.listen(
      this.attr_,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.ON_EDIT_CMD,
          {}));
  this.attr_.render(goog.dom.getElement('rpf-details-toolbar'));
};


/**
 * Clears the UI for adding settings to command.
 * @private
 */
rpf.DetailsDialog.prototype.clearUiForSettings_ = function() {
  var screenDiv = goog.dom.getElement('screenDiv');
  var editorDiv = goog.dom.getElement('editorDiv');
  goog.dom.removeChildren(screenDiv);
  goog.dom.removeChildren(editorDiv);
};


/**
 * Remove this line of code.
 * @export
 */
rpf.DetailsDialog.prototype.onRemoveCurLine = function() {
  this.scnshotMgr_.getScreenshotManager().deleteItem(this.curLine_);
  this.editorMgr_.removeCurrentLine(this.curLine_);
  this.setVisible(false);
};


/**
 * Move the current line up by 1.
 * @export
 */
rpf.DetailsDialog.prototype.onCmdMoveUp = function() {
  if (this.curLine_ < 1) {
    console.log('Can not move up any more.');
    return;
  }
  this.editorMgr_.moveUp(this.curLine_);
  this.curLine_ -= 1;
  goog.dom.getElement('curlineInput').value = this.curLine_ + 1 + '';
  this.onUiEvents_(
      Bite.Constants.UiCmds.UPDATE_HIGHLIGHT_LINE,
      {'lineNum': this.curLine_},
      /** @type {Event} */ ({}));
};

/**
 * Move the current line down by 1.
 * @export
 */
rpf.DetailsDialog.prototype.onCmdMoveDown = function() {
  if (this.curLine_ >= this.editorMgr_.getTotalLineNum()) {
    console.log('Can not move down any more.');
    return;
  }
  this.editorMgr_.moveDown(this.curLine_);
  this.curLine_ += 1;
  goog.dom.getElement('curlineInput').value = this.curLine_ + 1 + '';
  this.onUiEvents_(
      Bite.Constants.UiCmds.UPDATE_HIGHLIGHT_LINE,
      {'lineNum': this.curLine_},
      /** @type {Event} */ ({}));
};


/**
 * Inits the details dialog.
 * @private
 */
rpf.DetailsDialog.prototype.initDetailsnDialog_ =
    function() {
  this.detailsDialog_.setTitle('Detailed info:');
  this.detailsDialog_.setButtonSet(null);
  this.detailsDialog_.setVisible(true);
  this.detailsDialog_.setVisible(false);
};


/**
 * Turns on screen view.
 * @private
 */
rpf.DetailsDialog.prototype.turnOnScreenView_ = function() {
  goog.style.showElement(this.editorDiv_, false);
  goog.style.showElement(this.moreInfoDiv_, false);
  goog.style.showElement(this.screenDiv_, true);
  this.attr_.setContent('Switch to details');
};


/**
 * Turns on attributes view.
 * @private
 */
rpf.DetailsDialog.prototype.turnOnAttributesView_ = function() {
  goog.style.showElement(this.screenDiv_, false);
  goog.style.showElement(this.editorDiv_, true);
  goog.style.showElement(this.moreInfoDiv_, true);
  this.attr_.setContent('Switch to screenshots');
};


/**
 * Edit the current line.
 * @export
 */
rpf.DetailsDialog.prototype.onEditCmd = function() {
  if (this.editorShown_) {
    this.turnOnScreenView_();
    this.editorShown_ = false;
  } else {
    this.turnOnAttributesView_();
    this.editorShown_ = true;
  }
};


/**
 * Replace the selected line of code.
 * @export
 */
rpf.DetailsDialog.prototype.replaceLine = function() {
  var oldLine = this.editorMgr_.getOriginalLineAt(this.curLine_);
  var newCode = rpf.MiscHelper.replaceDescriptor(
      oldLine, rpf.MiscHelper.getStringWithSpaces(this.descriptor_, 1));
  this.editorMgr_.replaceCommand(newCode, this.curLine_);
};


/**
 * Gets the current line number.
 * @return {number} The current line number.
 * @export
 */
rpf.DetailsDialog.prototype.getCurLineNum = function() {
  return this.curLine_;
};


/**
 * Sets the visibility of the details dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.DetailsDialog.prototype.setVisible = function(display) {
  this.detailsDialog_.setVisible(display);
};
