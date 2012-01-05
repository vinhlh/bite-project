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
 * @fileoverview Creates a mini popup on the page telling the user the
 * bug number and allowing the user to change the bug's binding by dragging
 * the popup. Only one popup can exist on a page at a time.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.MiniBugPopup');

goog.require('Bite.Constants');
goog.require('bite.client.BugHelper');
goog.require('bite.client.Templates');
goog.require('common.client.RecordModeManager');
goog.require('goog.dom');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('soy');



/**
 * Creates a mini bug popup on calls to 'initDragBugBinding'. The popup
 * can be dragged onto a new UI element. The popup itself displays the bug
 * status and bug number. Upon release it asks the user if they would
 * like to change the bug binding to the new UI element before destroying
 * the popup.
 * @constructor
 */
bite.client.MiniBugPopup = function() {
  /**
   * The mini bug popup being dragged.
   * @type {Element}
   * @private
   */
  this.draggedMiniBug_ = null;

  /**
   * A dialogue box that allows the user to submit or cancel a change in
   * a bug's UI binding.
   */
  this.submitCancelPopup_ = null;

  /**
   * An array of listener keys for dragging bug popups.
   * @type {Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = [];

  /**
   * Buffer for the cursor style used by the page under test. This is stored
   * so that the cursor can be restored after the bug being dragged is
   * released.
   * @type {?string}
   * @private
   */
  this.docCursor_ = null;

  /**
   * Manages the record mode for highlighting and selecting the UI element
   * underneath the dragged mini bug popup.
   * @type {common.client.RecordModeManager}
   * @private
   */
  this.recordModeManager_;
};
goog.addSingletonGetter(bite.client.MiniBugPopup);


/**
 * The cumulative margin around the text in mini bug popups.
 * @type {number}
 * @private
 */
bite.client.MiniBugPopup.MARGIN_ = 32;


/**
 * The upwards offset that the mini bug popup should have from the cursor.
 * @type {number}
 * @private
 */
bite.client.MiniBugPopup.UP_OFFSET_ = 5;


/**
 * The right offset that the mini bug popup should have from the cursor.
 * @type {number}
 * @private
 */
bite.client.MiniBugPopup.RIGHT_OFFSET_ = 8;


/**
 * Initiates the user dragging a bug binding on the current page.
 * @param {Object} bugData A dictionary of the bug data for this binding.
 * @param {Object} e A mouseEvent object from the object being dragged.
 */
bite.client.MiniBugPopup.prototype.initDragBugBinding = function(bugData, e) {
  // If the user already has a mini bug or submit cancel popup open,
  // do not create another.
  if (!this.draggedMiniBug_ && !this.submitCancelPopup_) {
    this.toggleAssociateBug_(bugData, e);
    this.draggedMiniBug_ = this.createBugMiniPopup_(
        e.clientX + bite.client.MiniBugPopup.UP_OFFSET_,
        e.clientY + bite.client.MiniBugPopup.RIGHT_OFFSET_,
        goog.dom.getDocument().body, bugData);

    this.dragListenerKeys_.push(goog.events.listen(
        goog.dom.getDocument(), goog.events.EventType.MOUSEMOVE,
        goog.bind(this.bugBindingDragHandler_, this)));
    this.dragListenerKeys_.push(goog.events.listen(
        goog.dom.getDocument(), goog.events.EventType.MOUSEUP,
        goog.bind(this.toggleAssociateBug_, this, bugData)));

    this.docCursor_ = goog.dom.getDocument().body.style.cursor;
    goog.dom.getDocument().body.style.cursor = 'pointer';

    // Prevent text from being selected while dragging.
    e.preventDefault();
  }
};


/**
 * Handles a popup being cancelled.
 * @private
 */
bite.client.MiniBugPopup.prototype.cancelBugBinding_ = function() {
  this.removeSubmitCancelPopup_();
};


/**
 * Removes the Submit/Cancel popup from the page.
 * @private
 */
bite.client.MiniBugPopup.prototype.removeSubmitCancelPopup_ = function() {
  if (this.submitCancelPopup_) {
    goog.dom.removeNode(this.submitCancelPopup_);
    this.submitCancelPopup_ = null;
  }
};


/**
 * Cleans up after the bug binding operations are complete.
 * @private
 */
bite.client.MiniBugPopup.prototype.cleanupDragBugBinding_ = function() {
  goog.dom.removeNode(this.draggedMiniBug_);
  goog.dom.getDocument().body.style.cursor = /** @type {string} */ (
      this.docCursor_);
  this.docCursor_ = null;
  this.draggedMiniBug_ = null;
  this.recordModeManager_.exitRecordingMode();
  while (this.dragListenerKeys_.length > 0) {
    goog.events.unlistenByKey(this.dragListenerKeys_.pop());
  }
};


/**
 * The drag handler for moving around the bug binding popup.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.client.MiniBugPopup.prototype.bugBindingDragHandler_ = function(e) {
  goog.style.setPosition(this.draggedMiniBug_,
                         (e.clientX + bite.client.MiniBugPopup.UP_OFFSET_),
                         (e.clientY + bite.client.MiniBugPopup.RIGHT_OFFSET_));
};


/**
 * Creates a mini bug popup at the specific coordinates, with the given data.
 * @param {number} x The x coordinate to draw the mini bug popup.
 * @param {number} y The y coordinate to draw the mini bug popup.
 * @param {Node} parent The HTML element to append this popup to.
 * @param {Object} bugData A dictionary of the bug data for this binding.
 * @return {Element} The html element of the mini bug popup.
 * @private
 */
bite.client.MiniBugPopup.prototype.createBugMiniPopup_ = function(
    x, y, parent, bugData) {
  var miniBugIconURL = bite.client.BugHelper.getBugIcon(bugData['state']);
  var miniBug = soy.renderAsElement(
      bite.client.Templates.bugMiniPopup,
      {bugID: bugData['id'],
       imgURI: miniBugIconURL});
  goog.dom.appendChild(parent, miniBug);
  goog.style.setPosition(miniBug, x, y);

  // Resize to fit the text within the popup.
  var miniBugText = miniBug.childNodes[1];
  goog.style.setWidth(
      miniBug,
      miniBugText.clientWidth + bite.client.MiniBugPopup.MARGIN_);

  return miniBug;
};


/**
 * Creates a submit/cancel popup at the specific coordinates with the given
 * data.
 * @param {Node} parent The HTML element to append this popup to.
 * @param {string} iconUrl A url to a 16x16 img (will stretch) for this popup.
 * @param {string} title The title text to put in this popup.
 * @param {string} content The message contents to put in this content.
 * @param {goog.math.Coordinate} coord The coordinates to draw the popup
 *     container at.
 * @param {function(): void} submitCallback Function to call when the
 *     user clicks Submit.
 * @param {function(): void} cancelCallback Function to call when the
 *     user clicks Cancel.
 * @private
 */
bite.client.MiniBugPopup.prototype.createSubmitCancelPopup_ = function(
    parent, iconUrl, title, content, coord,
    submitCallback, cancelCallback) {

  this.submitCancelPopup_ = soy.renderAsElement(
      bite.client.Templates.submitCancelPopup,
      {imgURI: iconUrl, title: title, message: content});

  goog.style.setPosition(this.submitCancelPopup_, coord);
  goog.dom.appendChild(parent, this.submitCancelPopup_);

  goog.events.listenOnce(goog.dom.getElement('confirmSubmit'),
                         goog.events.EventType.CLICK,
                         submitCallback);
  goog.events.listenOnce(goog.dom.getElement('confirmCancel'),
                         goog.events.EventType.CLICK,
                         cancelCallback);
};


/**
 * Submits a new bug binding to the server.
 * @param {Object} bugData A dictionary of the bug data for this binding.
 * @param {string} descriptor The HTML element descriptor to
 *     bind the bug to.
 * @private
 */
bite.client.MiniBugPopup.prototype.submitBugBinding_ = function(
    bugData, descriptor) {
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.LOG_EVENT,
       'category': Bite.Constants.TestConsole.NONE,
       'event_action': 'SubmitBugBinding',
       'label': 'SUBMIT: Bug ' + bugData['id']});

  var requestData = {'action': Bite.Constants.HUD_ACTION.UPDATE_BUG,
                     'details': {'kind': bugData['kind'],
                                 'id': bugData['id'],
                                 'target_element': descriptor}};

  chrome.extension.sendRequest(requestData,
      goog.bind(this.refreshLocalBugData_, this,
                goog.bind(this.removeSubmitCancelPopup_, this)));
};


/**
 * Returns true if the element is part of the BITE console.
 * @param {Element} element The element to check.
 * @return {boolean} Returns true if the element appear is in the BITE console,
 *     otherwise false.
 * @private
 */
bite.client.MiniBugPopup.prototype.isBITEElement_ = function(element) {
  if (!element) {
    return false;
  }

  if (element == this.draggedMiniBug_ ||
      goog.dom.getAncestorByClass(element, 'bite-container') != null) {
    // TODO(ralphj): Make sure all BITE elements are in a container
    // with class bite-container.
    return true;
  }
  return false;
};


/**
 * Toggle the bug association highlighting.
 * @param {Object} bugData A dictionary of the bug data for this binding.
 * @param {Object} e A mouseEvent object from the user's cursor.
 * @private
 */
bite.client.MiniBugPopup.prototype.toggleAssociateBug_ = function(bugData, e) {
  if (!this.recordModeManager_) {
    this.recordModeManager_ = new common.client.RecordModeManager();
  }

  if (this.recordModeManager_.isRecording()) {
    // If the user hasn't selected an element, or if they drop a bug on a
    // BITE element, then cancel the attempt.
    var currElement = this.recordModeManager_.getCurrElement();
    if (!currElement || this.isBITEElement_(currElement)) {
      this.cleanupDragBugBinding_();
      this.cancelBugBinding_();
    } else {
      var elementDescriptor =
          common.client.ElementDescriptor.generateElementDescriptorNAncestors(
              this.recordModeManager_.getCurrElement(), 3);

      this.createSubmitCancelPopup_(goog.dom.getDocument().body,
          bite.client.BugHelper.getBugIcon(bugData['state']),
          'Bug ' + bugData['id'], 'Bind to this element?',
          new goog.math.Coordinate(e.clientX, e.clientY),
          goog.bind(this.submitBugBinding_, this, bugData, elementDescriptor),
          goog.bind(this.cancelBugBinding_, this));
      this.cleanupDragBugBinding_();
    }
  } else {
    this.recordModeManager_.enterRecordingMode(function() {return true;});
  }
};


/**
 * Refreshes the local bug data with data on the server.
 * @param {function()=} opt_callback Function to call after requesting
 *     refresh.
 * @private
 */
bite.client.MiniBugPopup.prototype.refreshLocalBugData_ =
    function(opt_callback) {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.UPDATE_DATA,
       target_url: goog.global.location.href});
  if (opt_callback) {
    opt_callback();
  }
};

