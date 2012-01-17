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
 * @fileoverview Provides utilities for dragging a container and allowing an
 * element to dock with the viewport.
 *
 * Assumption: The elements referenced by this class are not modified while
 * the dragging action is underway.
 *
 * TODO(jason.stredwick): Consider making callback a signal.
 * TODO(jason.stredwick): Consider making the callback fire onMove rather than
 * onRelease.
 *
 * @author ralphj@google.com (Julie Ralph)
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('bite.ux.Dragger');

goog.require('common.dom.element');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');



/**
 * Provides a class for managing element dragging.
 * @param {!Element} relativeElement An element to move relative to the
 *     dragTarget.  This is commonly a container that has the dragTarget as a
 *     child element.  Give the dragTarget if it is the element to move.
 * @param {!Element} dragTarget The "draggable" element.  Often this is a
 *     header for a container.
 * @param {function()=} opt_draggedCallback A callback function fired upon
 *     completion of a dragging action.
 * @constructor
 */
bite.ux.Dragger = function(relativeElement, dragTarget, opt_draggedCallback) {
  /**
   * An element to move relative to the dragTarget.  This is commonly a
   * container that has the dragTarget as a child element.  Give the dragTarget
   * if it is the element to move.
   * @type {!Element}
   * @private
   */
  this.relativeElement_ = relativeElement;

  /**
   * The "draggable" element.  Often this is a header for a container.
   * @type {!Element}
   * @private
   */
  this.dragTarget_ = dragTarget;

  /**
   * Callback on drag release.
   * @type {function()}
   * @private
   */
  this.draggedCallback_ = opt_draggedCallback || function() {};

  /**
   * The current side that the container is docked onto.
   * @type {bite.ux.Dragger.Side_}
   * @private
   */
  this.dockSide_ = bite.ux.Dragger.Side_.NONE;

  /**
   * Whether or not currently dragging.
   * @type {boolean}
   * @private
   */
  this.isDragging_ = false;

  /**
   * When the user first clicks the drag target, dragOffset_ is the vector from
   * mouse to the container's upper left corner.  This vector is used to keep
   * the same relative position between the mouse and the container.  When the
   * mouse moves too close to the border, this vector is not updated in order
   * preserve original offset when the mouse in back within a valid range.
   * @type {!{x: number, y: number}}
   * @private
   */
  this.dragOffset_ = {x: 0, y: 0};

  /**
   * An array of listener keys for dragging.
   * @type {!Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = [];

  /**
   * Handles the event listeners.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();
  this.eventHandler_.listen(this.dragTarget_, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this));
};


/**
 * Sides of the screen that the console can dock onto.
 * @enum {string}
 * @private
 */
bite.ux.Dragger.Side_ = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  NONE: 'none'
};


/**
 * Destroy the object by cleaning up its allocated items.
 */
bite.ux.Dragger.prototype.destroy = function() {
  this.draggedCallback = function() {};
  this.onMouseUp_();
  this.eventHandler_.removeAll();
  this.relativeElement_ = /** @type {!Element} */ (null);
  this.dragElement_ = /** @type {!Element} */ (null);
};


/**
 * Recalculates if the managed element is updated externally.
 */
bite.ux.Dragger.prototype.recalculate = function() {
};


/**
 * Changes the style of the container when it is docked to one side of the
 * screen.
 * @private
 */
bite.ux.Dragger.prototype.dock_ = function() {
  var pos = common.dom.element.getPosition(this.relativeElement_);
  var dim = common.dom.element.getSize(this.relativeElement_);
  var viewportDim = goog.dom.getViewportSize();

  var maxTop = viewportDim.height - dim.height;
  var maxLeft = viewportDim.width - dim.width;

  // Remove all docking styles from the element.
  goog.dom.classes.remove(this.relativeElement_,
                          'bite-container-top-dock',
                          'bite-container-bottom-dock',
                          'bite-container-left-dock',
                          'bite-container-right-dock');

  // Add appropriate docking style for element.
  if (pos.x <= 0) {
    this.dockSide_ = bite.ux.Dragger.Side_.LEFT;
    goog.dom.classes.add(this.relativeElement_, 'bite-container-left-dock');
  } else if (pos.y <= 0) {
    this.dockSide_ = bite.ux.Dragger.Side_.TOP;
    goog.dom.classes.add(this.relativeElement_, 'bite-container-top-dock');
  } else if (pos.x >= maxLeft) {
    this.dockSide_ = bite.ux.Dragger.Side_.RIGHT;
    goog.dom.classes.add(this.relativeElement_, 'bite-container-right-dock');
  } else if (pos.y >= maxTop) {
    this.dockSide_ = bite.ux.Dragger.Side_.BOTTOM;
    goog.dom.classes.add(this.relativeElement_, 'bite-container-bottom-dock');
  } else {
    this.dockSide_ = bite.ux.Dragger.Side_.NONE;
  }
};


/**
 * Handles mouse down event on the drag target; i.e. select the associated
 * container for dragging.
 * @param {!Event} e A mouse event from the drag target being clicked.
 * @private
 */
bite.ux.Dragger.prototype.onMouseDown_ = function(e) {
  // Do not begin dragging if already resizing or on right click.
  if (this.isDragging_ || !e.isMouseActionButton()) {
    return;
  }
  
  this.isDragging_ = true;

  /**
   * When the user first clicks the drag target, dragOffset_ is the vector from
   * mouse to the container's upper left corner.  This vector is used to keep
   * the same relative position between the mouse and the container.  When the
   * mouse moves too close to the border, this vector is not updated in order
   * preserve original offset when the mouse in back within a valid range.
   */
  var pos = common.dom.element.getPosition(this.relativeElement_);
  this.dragOffset_ = {x: pos.x - e.clientX,
                      y: pos.y - e.clientY};

  // Set handlers for moving and releasing the mouse while the mouse button
  // is down.
  this.dragListenerKeys_.push(goog.events.listen(
      goog.dom.getDocument(), goog.events.EventType.MOUSEMOVE,
      goog.bind(this.onMouseMove_, this)));
  this.dragListenerKeys_.push(goog.events.listen(
      goog.dom.getDocument(), goog.events.EventType.MOUSEUP,
      goog.bind(this.onMouseUp_, this, e.clientX, e.clientY)));

  // Prevent text from being selected while dragging.
  e.preventDefault();
};


/**
 * Handles the container being dragged.
 * @param {!Event} e A mouse event from the drag target.
 * @private
 */
bite.ux.Dragger.prototype.onMouseMove_ = function(e) {
  // Compute the new position of the container.
  var targetX = e.clientX + this.dragOffset_.x;
  var targetY = e.clientY + this.dragOffset_.y;

  // Keep the container bounded within the browser viewport.
  var dim = common.dom.element.getSize(this.relativeElement_);
  var viewportDim = goog.dom.getViewportSize();
  var maxTop = viewportDim.height - dim.height;
  var maxLeft = viewportDim.width - dim.width;

  if (targetX < 0) {
    targetX = 0;
  } else if (targetX > maxLeft) {
    targetX = maxLeft;
  }
  if (targetY < 0) {
    targetY = 0;
  } else if (targetY > maxTop) {
    targetY = maxTop;
  }

  // Update the target's position.
  common.dom.element.setPosition(this.relativeElement_,
                                 {x: targetX, y: targetY});

  // Dock/undock container if appropriate.
  this.dock_();
};


/**
 * Handles a mouse up event releasing the container when it's being dragged.
 * @param {number} startX Start x coordinate of the drag.
 * @param {number} startY Start y coordinate of the drag.
 * @param {!Event} e A mouse event from the drag target.
 * @private
 */
bite.ux.Dragger.prototype.onMouseUp_ = function(startX, startY, e) {
  while (this.dragListenerKeys_.length > 0) {
    goog.events.unlistenByKey(this.dragListenerKeys_.pop());
  }

  this.isDragging_ = false;
  this.draggedCallback_(); // Call user-specified release callback.
};
