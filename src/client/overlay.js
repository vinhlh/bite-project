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
 * @fileoverview Displays an overlay of bugs that have been previously filed
 * on a page.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.BugOverlay');

goog.require('bite.client.BugDetailsPopup');
goog.require('bite.client.BugHelper');
goog.require('bite.client.ElementMapper');
goog.require('bite.client.MiniBugPopup');
goog.require('common.client.ElementDescriptor');
goog.require('goog.events.EventHandler');



/**
 * Manager for bug overlays.
 * @constructor
 */
bite.client.BugOverlay = function() {
  /**
   * Whether or not the overlay is visible.
   * @type {boolean}
   * @private
   */
  this.bugOverlayOn_ = false;

  /**
   * An object that can manage multiple overlapping bug overlay tiles.
   * @type {!bite.client.ElementMapper}
   * @private
   */
  this.overlayMap_ = new bite.client.ElementMapper();

  /**
   * The overlay id the mouse is currently hovering over.
   * @type {?{element: Element, bugLevel: number, bugIndex: number}}
   * @private
   */
  this.overlay_ = null;

  /**
   * The last known overlay list.
   * @type {Array.<{element: Element, bugLevel: number, bugIndex: number}>}
   * @private
   */
  this.overlayList_ = null;

  /**
   * Manages events on the overlay.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * The bugs data.
   * @type {Object}
   * @private
   */
  this.bugs_ = null;
};


/**
 * Returns whether or not the bug overlay is visible.
 * @return {boolean} The visibility of the overlay.
 */
bite.client.BugOverlay.prototype.bugOverlayOn = function() {
  return this.bugOverlayOn_;
}


/**
 * Renders the bug overlay elements on the current page.
 */
bite.client.BugOverlay.prototype.render = function() {
  // Don't display Overlay if the bugs haven't been loaded.
  if (!this.bugs_) {
    this.bugOverlayOn_ = false;
    return;
  }

  // Remove any existing overlays to avoid duplicates.  Also, clears
  // the element mapper used to identify overlapping overlays.
  this.remove();
  for (var i = 0; i < this.bugs_.length; i++) {
    // Note this.bugs_ is a list of bugs found for various urls, for each
    // member, at index i, this.bugs_[i][0] is the url the bugs are associated
    // with, while this.bugs_[i][1] is a list of the bug objects.
    for (var j = 0, bugs = this.bugs_[i][1]; j < bugs.length; ++j) {
      // Only add an overlay for this bug if it is visible.
      if (!bugs[j]['visible'] || !bugs[j]['target_element'] ||
          bugs[j]['target_element'] == 'null') {
        continue;
      }

      var parseDesc = common.client.ElementDescriptor.parseElementDescriptor;
      var targetElement = parseDesc(bugs[j]['target_element']);
      if (!targetElement) {
        continue;
      }

      var style =
          'position: absolute;' +
          'opacity: 0.4;' +
          'z-index: 50000;' +
          'background-color: ' +
          bite.client.BugHelper.getBugHighlights(bugs[j].state) + ';';

      var targetOverlay = goog.dom.createDom(goog.dom.TagName.DIV, {
        'id': 'bite-bug-overlay-' + ((i + 1) * (j + 1)),
        'class' : 'bite-bug-overlay',
        'style' : style
      });
      if (!targetOverlay) {
        continue;
      }
      goog.dom.appendChild(goog.dom.getDocument().body, targetOverlay);

      // Shape overlay Element.
      goog.style.setPosition(targetOverlay,
                             goog.style.getPageOffset(targetElement));
      goog.style.setSize(targetOverlay,
                         goog.style.getSize(targetElement));

      // Add overlay to mapper.
      this.overlayMap_.add(targetOverlay, {
        element: targetOverlay,
        bugLevel: i,
        bugIndex: j
      });

      // Hookup overlay Element.
      this.eventHandler_.listen(targetOverlay, goog.events.EventType.MOUSEMOVE,
                                goog.bind(this.overlayMouseMoveHandler_, this));
      this.eventHandler_.listen(targetOverlay, goog.events.EventType.MOUSEDOWN,
                                goog.bind(this.overlayMouseDownHandler_, this));
      this.eventHandler_.listen(targetOverlay, goog.events.EventType.MOUSEOUT,
                                goog.bind(this.overlayMouseOutHandler_, this));
      this.eventHandler_.listen(targetOverlay, goog.events.EventType.CLICK,
          goog.bind(this.overlayMouseClickHandler_, this));
    }
  }
  this.bugOverlayOn_ = true;
};


/**
 * Removes the bug overlay elements on the current page.
 */
bite.client.BugOverlay.prototype.remove = function() {
  this.overlayMap_.clear();
  this.eventHandler_.removeAll();
  var currTargets =
      goog.dom.getDocument().querySelectorAll('div.bite-bug-overlay');
  for (var i = 0; i < currTargets.length; ++i) {
    goog.dom.removeNode(currTargets[i]);
  }
  this.bugOverlayOn_ = false;
};


/**
 * Updates the overlay with new data.
 * @param {Object} bugs The new bug data.
 */
bite.client.BugOverlay.prototype.updateData = function(bugs) {
  this.bugs_ = bugs;
  if (this.bugOverlayOn_) {
    this.render();
  }
};


/**
 * Retrieves the bug overlays the mouse is currently hovering over.
 * @param {!goog.events.Event} event The event that was recorded.
 * @return {Array.<!Object>} An array of overlay info.
 * @private
 */
bite.client.BugOverlay.prototype.getOverlays_ = function(event) {
  var win = goog.dom.getWindow();
  var x = win.pageXOffset + event.clientX;
  var y = win.pageYOffset + event.clientY;

  return this.overlayMap_.find(x, y);
};


/**
 * Retrieves the currently selected overlay's index in the current overlay
 * list.
 * @return {number} The index or -1 if not present.
 * @private
 */
bite.client.BugOverlay.prototype.getCurrentOverlayPosition_ = function() {
  if (this.overlay_ && this.overlayList_) {
    for (var i = 0; i < this.overlayList_.length; ++i) {
      if (this.overlayList_[i].element.id == this.overlay_.element.id) {
        return i;
      }
    }
  }

  return -1;
};


/**
 * Create a bug popup for an overlay element.
 * @param {Element=} opt_element An optional element that will override the
 *     overlay element being passed to the construction of the bug popup.
 * @private
 */
bite.client.BugOverlay.prototype.overlayCreateBugPopup_ =
    function(opt_element) {
  var position = this.getCurrentOverlayPosition_();
  if (position < 0) {
    return;
  }
  position += 1; // Convert to position order rather than index value.

  var node = opt_element ? opt_element : this.overlay_.element;
  node = /** @type {Node} */ (node);

  var bugLevel = this.overlay_.bugLevel;
  var bugIndex = this.overlay_.bugIndex;
  var bugData = this.bugs_[bugLevel][1][bugIndex];
  var popup = bite.client.BugDetailsPopup.getInstance().createElementBugPopup(
      node, bugData, this);

  if (popup) {
    var navLeft = goog.dom.getElement('bug-popup-nav-left');
    var navRight = goog.dom.getElement('bug-popup-nav-right');
    if (navLeft && navRight) {
      this.eventHandler_.listen(navLeft, goog.events.EventType.CLICK,
                                goog.bind(this.overlayChange_, this, true));
      this.eventHandler_.listen(navRight, goog.events.EventType.CLICK,
                                goog.bind(this.overlayChange_, this, false));
    }
  }

  // Update popup's overlay indicator.
  var iterationTable = goog.dom.getElement('bug-popup-iterator-table');
  var iteration = goog.dom.getElement('bug-popup-iteration');
  if (iteration && iterationTable) {
    if (this.overlayList_.length > 1) {
      goog.style.setStyle(iterationTable, 'display', 'block');
      iteration.innerText = position + ' of ' + this.overlayList_.length;
    } else {
      goog.style.setStyle(iterationTable, 'display', 'none');
    }
  }
};


/**
 * Handles an overlay being moused out.
 * @param {boolean} moveDown Whether or not to process the overlay list down
 *     (or up if false).
 * @private
 */
bite.client.BugOverlay.prototype.overlayChange_ = function(moveDown) {
  var position = this.getCurrentOverlayPosition_();

  // If the currently selected overlay is in the current overlay list then
  // position will be non-negative.
  if (position >= 0) {
    // Calculate the next overlay in the list.
    if (moveDown) {
      position = position - 1;
      if (position < 0) {
        position = this.overlayList_.length - 1;
      }
    } else {
      position = (position + 1) % this.overlayList_.length;
    }

    this.overlay_ = this.overlayList_[position];
  } else if (this.overlayList_ && this.overlayList_.length > 0) {
    this.overlay_ = this.overlayList_[0];
  } else {
    return;
  }

  // Don't change the popup's position while cycling through overlays
  // therefore will have to compensate for calculations done in createBugPopup.
  var bugPopup =
      goog.dom.getElement(bite.client.BugDetailsPopup.POPUP_CONTAINER_ID);
  var left = parseInt(bugPopup.style.left, 10) - 3;
  var top = parseInt(bugPopup.style.top, 10) + 2;
  var location = {
    style: {
      left: left,
      top: top,
      width: 0,
      height: 0
    }
  };
  location = /** @type {Element} */ (location);

  this.overlayCreateBugPopup_(location);
};


/**
 * Handles an overlay being moused out.
 * @param {!goog.events.Event} event The event fired.
 * @private
 */
bite.client.BugOverlay.prototype.overlayMouseClickHandler_ = function(event) {
  var win = goog.dom.getWindow();
  var x = win.pageXOffset + event.clientX;
  var y = win.pageYOffset + event.clientY;

  var location = {
    style: {
      left: x - 5,
      top: y - 5,
      width: 0,
      height: 0
    }
  };
  location = /** @type {Element} */ (location);

  this.overlayCreateBugPopup_(location);
};


/**
 * Handles an overlay being moused over.
 * @param {!goog.events.Event} event The event fired.
 * @private
 */
bite.client.BugOverlay.prototype.overlayMouseOutHandler_ = function(event) {
  var overlays = this.getOverlays_(event);
  if (overlays.length == 0) {
    // Only completely remove the popup when we are no longer over any
    // bug overlay elements.
    bite.client.BugDetailsPopup.getInstance().flagBugPopupRemoval(true);
  }
};


/**
 * Handles a user clicking down on the overlay.
 * @param {!goog.events.Event} event The event fired.
 * @private
 */
bite.client.BugOverlay.prototype.overlayMouseDownHandler_ = function(event) {
  if (this.overlay_) {
    var overlay = this.overlay_;
    var bugLevel = overlay.bugLevel;
    var bugIndex = overlay.bugIndex;
    var bugData = this.bugs_[bugLevel][1][bugIndex];
    bite.client.MiniBugPopup.getInstance().initDragBugBinding(bugData, event);
  }
};


/**
 * Handles the mouse moving over at least one overlay.
 * @param {!goog.events.Event} event The event fired.
 * @private
 */
bite.client.BugOverlay.prototype.overlayMouseMoveHandler_ = function(event) {
  // Get a list of overlays under the current mouse position.
  var overlays = this.getOverlays_(event);
  this.overlayList_ = overlays;

  var position = this.getCurrentOverlayPosition_();
  // If the current overlay is not part of the list set the current overlay to
  // the first overlay in the list if available.
  if (position < 0) {
    if (this.overlayList_.length == 0) {
      return;
    }

    position = 1;
    this.overlay_ =
        /** @type {{element: Element, bugLevel: number, bugIndex: number}} */
        (this.overlayList_[0]);
  }

  this.overlayCreateBugPopup_();
};

