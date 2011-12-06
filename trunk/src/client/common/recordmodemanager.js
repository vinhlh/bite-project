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
 * @fileoverview In this file, the Record Mode Manager class is defined.
 *
 * @author alexto@google.com (Alexis O. Torres)
 */

goog.provide('common.client.RecordModeManager');

goog.require('common.client.MiscHelper');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.fx.dom');
goog.require('goog.style');



/**
 * Class for managing recording sessions.
 *
 * This class is used to record user interactions with the page, specifically,
 * MouseMove and Click events. Each time the user clicks on a element, function
 * provided to the {@code enterRecordingMode()} method is called back with the
 * last element the user moused over a a parameter.
 *
 * As an example, here is a simple use of this class that caused an alert dialog
 * to show up each time the user click on an element of the page:
 *
 * {@code
 *   recordManager = new RecordModeManager();
 *   recordManager.enterRecordingMode(function(elmnt) {
 *     alert('ID of the element clicked: ' + elmnt.id);
 *   };
 * }
 *
 * While in recording mode, clicking on elements of the page should not trigger
 * the default action associated with that element (e.g. clicking on a hyperlink
 * should not cause the browser to navigate to that link's URI).
 *
 * @constructor
 */
common.client.RecordModeManager = function() {
};


/**
 * Whether or not the recording manager is in recording mode.
 * @type {boolean}
 * @private
 */
common.client.RecordModeManager.prototype.isRecording_ = false;


/**
 * ID used for the highlight box element.
 * @type {string}
 * @private
 */
common.client.RecordModeManager.prototype.highlightBoxId_ =
    'recordingHighlightBox';


/**
 * Element used as the highlight box.
 * @type {Element}
 * @private
 */
common.client.RecordModeManager.prototype.highlightDiv_ = null;


/**
 * Stores the value of document.onclick before the start of the
 *     recording session.
 * @type {?function(...)} The original value of
 *     {@code goog.global.document.onclick}.
 * @private
 */
common.client.RecordModeManager.prototype.originalOnClick_ = null;


/**
 * Stores the value of document.onmousemove before the start of the
 *     recording session.
 * @type {?function(...)} The original value of
 *     {@code goog.global.document.onmousemove}.
 * @private
 */
common.client.RecordModeManager.prototype.originalMouseMove_ = null;


/**
 * Used to track the last element the mouse was over.
 * @type {Element}
 * @private
 */
common.client.RecordModeManager.prototype.currElement_ = null;


/**
 * @return {Element} Currently selected element.
 * @export
 */
common.client.RecordModeManager.prototype.getCurrElement = function() {
  return this.currElement_;
};


/**
 * Whether or not the highlight box is being animated.
 * @type {boolean}
 * @private
 */
common.client.RecordModeManager.prototype.isAnimating_ = false;


/**
 * A callback handler called when a click action occurs.
 * The element clicked by the user is passed as an argument to the function.
 * @type {?function(Element)}
 * @private
 */
common.client.RecordModeManager.prototype.onClickCallback_ = null;


/**
 * @return {boolean} Whether or not we are currently in recording mode.
 * @export
 */
common.client.RecordModeManager.prototype.isRecording = function() {
  return this.isRecording_;
};


/**
 * Gets the string value used as the ID property of the highlight box.
 * @return {string} ID value of the highlight box.
 * @export
 */
common.client.RecordModeManager.prototype.getHighlightBoxId = function() {
  return this.highlightBoxId_;
};


/**
 * Sets string used as the ID property of the the highlight box.
 * @param {string} newId New ID value to use for the highlight box.
 * @export
 */
common.client.RecordModeManager.prototype.setHighlightBoxId = function(newId) {
  this.highlightBoxId_ = newId;
  if (this.highlightDiv_) {
    this.highlightDiv_.id = newId;
  }
};


/**
 * Enters recording mode. When recording, clicking on an Element, such a link
 * or a button, will not cause the default action to fire. Each time the use
 * clicks on the page, the clickOverride method is called with the element that
 * was clicked as an argument.
 *
 * Throws an {@code Error} if the method is called without the
 * {@code clickOverride} parameter, or it is called more than once before the
 * {@code exitRecordMode()} method is called.
 * @param {function(Element)} clickOverride A callback handler called
 *     when a click action occurs.
 * @export
 */
common.client.RecordModeManager.prototype.enterRecordingMode =
    function(clickOverride) {
  if (!clickOverride) {
    throw new Error(
        'enterRecordingMode: clickOverride parameter is required ' +
        'and cannot be null.');
  }
  if (this.isRecording_) {
    throw new Error(
        'enterRecordingMode: cannot start another recording session. Call ' +
        'exitRecordMode() before calling enterRecordingMode a second time.');
  }
  this.isRecording_ = true;
  this.originalOnClick_ = goog.global.document.onclick;
  this.originalMouseMove_ = goog.global.document.onmousemove;
  this.onClickCallback_ = clickOverride;
  goog.global.document.onclick = goog.bind(this.clickOverride_, this);
  goog.global.document.onmousemove = goog.bind(this.onMouseMove_, this);
  common.client.MiscHelper.setCursorStyle('crosshair');
};


/**
 * Used to override all onclick event handling while in recording mode.
 * @return {boolean} Always returns false, which prevents the click event from
 *     propagating.
 * @private
 */
common.client.RecordModeManager.prototype.clickOverride_ = function() {
  if (this.currElement_) {
    this.onClickCallback_(this.currElement_);
  }
  return false;
};


/**
 * Used to override all onmousemove event handling while in recording mode.
 * @param {MouseEvent} evt MouseEvent object containing, among other things, the
 *     source element that generated the event.
 * @private
 */
common.client.RecordModeManager.prototype.onMouseMove_ = function(evt) {
  if (this.highlightDiv_ && evt.srcElement == this.highlightDiv_) {
    goog.style.showElement(this.highlightDiv_, false);
    var elementUnderMouse = goog.dom.getDocument().elementFromPoint(
        evt.clientX, evt.clientY);
    goog.style.showElement(this.highlightDiv_, true);
    if (this.currElement_ == elementUnderMouse) {
      // Nothing to do, end early.
      return;
    }
    this.currElement_ = elementUnderMouse;
  } else {
    this.currElement_ = evt.srcElement;
  }
  if (!this.highlightDiv_) {
    // Init the highlight box if none is available.
    this.highlightDiv_ = goog.dom.createDom(goog.dom.TagName.DIV, {
        'id' : this.highlightBoxId_,
        'style' : 'position:absolute;'
    });
    goog.dom.appendChild(document.body, this.highlightDiv_);
  }

  this.positionHighlightBox_();
};


/**
 * Positions the highlight box on top of the last element moused over.
 * @private
 */
common.client.RecordModeManager.prototype.positionHighlightBox_ = function() {
  goog.style.setPosition(
      this.highlightDiv_, goog.style.getPageOffset(this.currElement_));
  goog.style.setSize(
      this.highlightDiv_, goog.style.getSize(this.currElement_));
};


/**
 * Exits the recording mode. This restores window.document.onmousemove and
 * window.document.onclick to it's original values (those set before the
 * recording session was entered) and restore the dom to the state it was
 * before the recording started.
 * Throws an {@code Error} when this method is called before the
 * {@code enterRecordingMode()} is called.
 * @export
 */
common.client.RecordModeManager.prototype.exitRecordingMode = function() {
  if (!this.isRecording_) {
    throw new Error(
        'exitRecordingMode: cannot end a non-started recording session. ' +
        'Call enterRecordingMode() before calling exitRecordingMode.');
  }
  goog.global.document.onclick = this.originalOnClick_;
  goog.global.document.onmousemove = this.originalMouseMove_;
  if (this.highlightDiv_) {
    goog.dom.removeNode(this.highlightDiv_);
  }
  this.currElement_ = null;
  this.onClickCallback_ = null;
  this.highlightDiv_ = null;
  this.isRecording_ = false;
  common.client.MiscHelper.restoreCursorStyle();
};


goog.exportSymbol(
    'common.client.RecordModeManager', common.client.RecordModeManager);
goog.exportProperty(
    common.client.RecordModeManager.prototype, 'isRecording',
    common.client.RecordModeManager.prototype.isRecording);
goog.exportProperty(
    common.client.RecordModeManager.prototype, 'enterRecordingMode',
    common.client.RecordModeManager.prototype.enterRecordingMode);
goog.exportProperty(
    common.client.RecordModeManager.prototype, 'exitRecordingMode',
    common.client.RecordModeManager.prototype.exitRecordingMode);
goog.exportProperty(
    common.client.RecordModeManager.prototype, 'getHighlightBoxId',
    common.client.RecordModeManager.prototype.getHighlightBoxId);
goog.exportProperty(
    common.client.RecordModeManager.prototype, 'setHighlightBoxId',
    common.client.RecordModeManager.prototype.setHighlightBoxId);
