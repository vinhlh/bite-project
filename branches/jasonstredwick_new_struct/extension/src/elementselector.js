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
 * @fileoverview The element selector asks the user to pick a UI element
 * from the website, and highlights the element under their cursor in yellow
 * until they choose one. It will then call a callback with the selected
 * element.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.ElementSelector');

goog.require('bite.client.Resizer');
goog.require('bite.client.console.NewBugTemplate');
goog.require('common.client.RecordModeManager');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('soy');



/**
 * Element selector constructor.
 * @param {function()=} opt_cancelCallback A function to call if the element
 *     selector is cancelled.
 * @constructor
 */
bite.client.ElementSelector = function(opt_cancelCallback) {
  /**
   * Manages the selection of a UI element and highlighting the element.
   * @type {common.client.RecordModeManager}
   * @private
   */
  this.recordModeManager_ = new common.client.RecordModeManager();

  /**
   * A function to call if the element selector is cancelled.
   * @type {function()}
   * @private
   */
  this.cancelCallback_ = opt_cancelCallback || goog.nullFunction;

  /**
   * A popup telling the user to select an element on the page.
   * @type {Element}
   * @private
   */
  this.popup_ = null;

  /**
   * A function to callback on the selected element.
   * @type {?function(Element)}
   * @private
   */
  this.callback_ = null;

  /**
   * Whether or not the element selector is active.
   * @type {boolean}
   * @private
   */
  this.isActive_ = false;

  /**
   * Manages events for the element selector popup.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * Manages dragging the popup.
   * @type {bite.client.Resizer}
   * @private
   */
  this.dragger_ = null;
};


/**
 * Instructs the element selector to start recording.
 * @param {function(Element)} callback A callback that is called
 *     when the user clicks on an element. If no element is selected,
 *     the element will be null.
 * @return {boolean} Whether or not the element selector succesfully began
 *     recording.
 */
bite.client.ElementSelector.prototype.startRecording = function(callback) {
  if (this.isActive_) {
    return false;
  }
  this.callback_ = callback;
  this.recordModeManager_.enterRecordingMode(
      goog.bind(this.onSelection_, this));
  this.isActive_ = true;
  var rootFolder = chrome.extension.getURL('');
  this.popup_ = soy.renderAsElement(
      bite.client.console.NewBugTemplate.newBugPrompt,
      {rootFolder: rootFolder});
  goog.dom.appendChild(goog.dom.getDocument().body, this.popup_);
  var headerElement = goog.dom.getElementByClass('bite-header', this.popup_);
  // Center the element selector in the viewport.
  var viewport = goog.dom.getViewportSize();
  var popupSize = goog.style.getSize(this.popup_);
  goog.style.setPosition(
      this.popup_,
      (viewport.width - popupSize.width) / 2,
      (viewport.height - popupSize.height) / 2);
  this.dragger_ = new bite.client.Resizer(this.popup_, headerElement, true);
  this.setHandlers_();
  return true;
};


/**
 * Cancels the element selector if currently recording.
 */
bite.client.ElementSelector.prototype.cancelSelection = function() {
  this.cancelCallback_();
  this.cleanUp_();
};


/**
 * Returns whether or not the element selector is currently active.
 * @return {boolean} Whether the selector is active.
 */
bite.client.ElementSelector.prototype.isActive = function() {
  return this.isActive_;
};


/**
 * Handler for when the user clicks on an element.
 * @param {Element} element The element which was clicked.
 * @private
 */
bite.client.ElementSelector.prototype.onSelection_ =
    function(element) {
  this.cleanUp_();
  this.callback_(element);
};


/**
 * Handles the case where the user indicates that there is no specific
 * UI element related to the issue.
 * @private
 */
bite.client.ElementSelector.prototype.noSelection_ = function() {
  this.cleanUp_();
  this.callback_(null);
};


/**
 * Turns off the record mode manager when mouse is over the popup. This
 * prevents the popup from being highlighted.
 * @private
 */
bite.client.ElementSelector.prototype.mouseOverHandler_ = function() {
  this.recordModeManager_.exitRecordingMode();
};


/**
 * Turns the record mode manager back on when the mouse leaves the popup.
 * @private
 */
bite.client.ElementSelector.prototype.mouseOutHandler_ = function() {
  this.recordModeManager_.enterRecordingMode(
      goog.bind(this.onSelection_, this));
};


/**
 * Exits recording mode if applicable and removes the popup.
 * @private
 */
bite.client.ElementSelector.prototype.cleanUp_ = function() {
  if (this.recordModeManager_.isRecording()) {
    this.recordModeManager_.exitRecordingMode();
  }
  goog.dom.getDocument().body.removeChild(this.popup_);
  this.popup_ = null;
  this.dragger_ = null;
  this.isActive_ = false;
};


/**
 * Sets up the event listeners for the event selector popup.
 * @private
 */
bite.client.ElementSelector.prototype.setHandlers_ = function() {
  var cancelButton = goog.dom.getElementByClass('bite-close-button',
                                                this.popup_);
  this.eventHandler_.listen(cancelButton,
                            goog.events.EventType.CLICK,
                            goog.bind(this.cancelSelection, this));

  var noSelectionButton = goog.dom.getElementByClass(
      'bite-newbug-prompt-no-ui', this.popup_);
  this.eventHandler_.listen(noSelectionButton,
                            goog.events.EventType.CLICK,
                            goog.bind(this.noSelection_, this));

  this.eventHandler_.listen(this.popup_,
                            goog.events.EventType.MOUSEOVER,
                            goog.bind(this.mouseOverHandler_, this));
  this.eventHandler_.listen(this.popup_,
                            goog.events.EventType.MOUSEOUT,
                            goog.bind(this.mouseOutHandler_, this));
};

