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
goog.require('rpf.Console.Messenger');
goog.require('rpf.EditorManager');
goog.require('rpf.MiscHelper');
goog.require('rpf.ScreenShotDialog');



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
 * @export
 */
rpf.DetailsDialog.prototype.updateInfo =
    function(descriptor, line, translation, cmdId, xpath) {
  var prevBtn = null;
  var nextBtn = null;
  var edit = null;
  this.curLine_ = line;
  var dialogElem = this.detailsDialog_.getContentElement();
  goog.dom.removeChildren(dialogElem);

  cmdId = cmdId || line + '';
  var screenSrc = this.scnshotMgr_.getScreenshotManager().getScreenById(cmdId);
  if (!screenSrc) {
    this.screenDiv_ = goog.dom.createDom(goog.dom.TagName.DIV);
  } else {
    this.screenDiv_ = goog.dom.createDom(goog.dom.TagName.DIV,
        {'id': 'screenDiv',
         'class': 'console-details-div-screen'},
        goog.dom.createDom(goog.dom.TagName.IMG,
            {'src': screenSrc,
             'width': '80%',
             'class': 'console-details-div-screen-img'}));
  }
  var controlDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'ctrlDiv', 'style': 'text-align: center; margin-bottom: 10px;'},
      prevBtn = goog.dom.createDom(goog.dom.TagName.IMG,
          {'src': 'imgs/rpf/prevpage.png',
           'width': '22',
           'height': '22', 'style': 'vertical-align: middle;'}),
      goog.dom.createDom(goog.dom.TagName.INPUT,
          {'type': 'text', 'size': '1', 'id': 'curlineInput',
           'style': 'vertical-align: middle;',
           'value': '' + (line + 1)}),
      nextBtn = goog.dom.createDom(goog.dom.TagName.IMG,
          {'src': 'imgs/rpf/nextpage.png',
           'width': '22', 'height': '22',
           'style': 'vertical-align: middle;'}));
  var toolbarDiv = goog.dom.createDom(goog.dom.TagName.CENTER,
      {},
      goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'toolbarDiv',
       'class': 'console-details-div-toolbar'}));
  goog.dom.appendChild(dialogElem, toolbarDiv);
  goog.dom.appendChild(dialogElem, controlDiv);
  goog.dom.appendChild(dialogElem, this.screenDiv_);
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
  this.descriptor_ = descriptor;
  this.xpath_ = xpath;

  this.editorDiv_ = goog.dom.createDom(goog.dom.TagName.CENTER, {},
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'id': 'editorDiv',
           'class': 'console-details-div-editor'}));
  dialogElem.appendChild(this.editorDiv_);
  this.drawCmdToolbar_(line);

  if (!this.editorShown_) {
    this.turnOnScreenView_();
  } else {
    this.turnOnAttributesView_();
  }
  this.detailsDialog_.setVisible(true);
};


/**
 * Draw command manipulation toolbar.
 * @param {number} line The line number of the selected line.
 * @private
 */
rpf.DetailsDialog.prototype.drawCmdToolbar_ = function(line) {
  var toolbar = new goog.ui.Toolbar();

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
  actionMenu.setTooltip('Actions can be performed');
  toolbar.addChild(actionMenu, true);

  this.attr_ = new goog.ui.ToolbarButton('Switch to attributes');
  this.attr_.setTooltip('Show the attributes of this command');

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
  toolbar.addChild(this.attr_, true);
  toolbar.render(goog.dom.getElement('toolbarDiv'));
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
  goog.style.showElement(this.screenDiv_, true);
  this.attr_.setContent('Switch to attributes');
};


/**
 * Turns on attributes view.
 * @private
 */
rpf.DetailsDialog.prototype.turnOnAttributesView_ = function() {
  goog.style.showElement(this.screenDiv_, false);
  goog.style.showElement(this.editorDiv_, true);
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
