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
 * @fileoverview Provides utilities for resizing and dragging a container.
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.Resizer');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.style');



/**
 * Resizing and Dragging management class. Adding a Resizer to an element
 * adds dragging capabilities as well as resizing on all 4 corners and edges.
 * The position of the element is restricted to the current viewport, and
 * the minimum size of the element is determined by MIN_WIDTH and MIN_HEIGHT.
 * @param {Element} containerElement The element to drag and resize.
 * @param {Element} dragTarget The element which should be the target for
 *    dragging, e.g. the header bar.
 * @param {boolean=} opt_dragOnly True if resizers should not be added,
 *    the container should only be dragged. Defaults to false.
 * @param {function()=} opt_dragReleaseCallback A function to call on drag
 *    release.
 * @param {function()=} opt_resizeReleaseCallback A function to call on resize
 *    release.
 * @constructor
 */
bite.client.Resizer = function(containerElement, dragTarget, opt_dragOnly,
                               opt_dragReleaseCallback,
                               opt_resizeReleaseCallback) {
  /**
   * The element to drag and resize.
   * @type {Element}
   * @private
   */
  this.containerElement_ = containerElement;

  /**
   * The HTML target for dragging.
   * @type {Element}
   * @private
   */
  this.dragTarget_ = dragTarget;

  /**
   * True if the target should only be dragged, not resized.
   * @type {boolean}
   * @private
   */
  this.dragOnly_ = opt_dragOnly || false;

  /**
   * Callback on drag release.
   * @type {function()}
   * @private
   */
  this.dragReleaseCallback_ = opt_dragReleaseCallback || function() {};

  /**
   * Callback on resize release.
   * @type {function()}
   * @private
   */
  this.resizeReleaseCallback_ = opt_resizeReleaseCallback || function() {};

  /**
   * The current side that the container is docked onto.
   * @type {bite.client.Resizer.Side}
   * @private
   */
  this.dockSide_ = bite.client.Resizer.Side.NONE;

  /**
   * Whether or not currently dragging.
   * @type {boolean}
   * @private
   */
  this.isDragging_ = false;

  /**
   * Whether or not currently resizing.
   * @type {boolean}
   * @private
   */
  this.isResizing_ = false;

  /**
   * An array of listener keys for resizing.
   * @type {Array.<number>}
   * @private
   */
  this.resizeListenerKeys_ = [];

  /**
   * An array of listener keys for dragging.
   * @type {Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = [];

  /**
   * Handles the event listeners.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * The offset of where a user originally clicked when dragging.
   * @type {{x: number, y: number}}
   * @private
   */
  this.dragOffset_ = {x: 0, y: 0};

  /**
   * The size of the container when the user originally clicked.
   * @type {{width: number, height: number}}
   * @private
   */
  this.unresizedSize_ = {width: 0, height: 0};

  /**
   * The poosition of the container when the user originally clicked.
   * @type {{x: number, y: number}}
   * @private
   */
  this.unresizedPosition_ = {x: 0, y: 0};

  /**
   * An object containing the resizer elements, keyed by their cardinal
   * direction.
   * @type {{n: Element, ne: Element, e: Element, se: Element,
   *         s: Element, sw: Element, w: Element, nw: Element}}
   * @private
   */
  this.resizers_ = {n: null, ne: null, e: null, se: null,
                    s: null, sw: null, w: null, nw: null};

  if (!this.dragOnly_) {
    this.addResizers_();
  }
  this.setHandlers_();
  this.updateResizerPosition_();
};


/**
 * The minimum width of the container element.
 * @type {number}
 */
bite.client.Resizer.MIN_WIDTH = 200;


/**
 * The minimum height of the container element.
 * @type {number}
 */
bite.client.Resizer.MIN_HEIGHT = 150;


/**
 * Sides of the screen that the console can dock onto.
 * @enum {string}
 */
bite.client.Resizer.Side = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  NONE: 'none'
};


/**
 * Resize Modes
 * @enum {string}
 * @export
 */
bite.client.Resizer.ResizeModes = {
  NONE: 'none',
  E: 'east',
  SE: 'southeast',
  S: 'south',
  SW: 'southwest',
  W: 'west',
  NW: 'northwest',
  N: 'north',
  NE: 'northeast'
};


/**
 * Returns the size of the container.
 * @return {{width: number, height: number}}
 */
bite.client.Resizer.prototype.getSize = function() {
  return goog.style.getSize(this.containerElement_);
};


/**
 * Returns the position of the container.
 * @return {{x: number, y: number}}
 */
bite.client.Resizer.prototype.getPosition = function() {
  return goog.style.getPosition(this.containerElement_);
};


/**
 * Updates the size of the container.
 * @param {{width: number, height: number}} size The new size.
 */
bite.client.Resizer.prototype.updateSize = function(size) {
  goog.style.setSize(this.containerElement_, size.width, size.height);
  this.updateResizerPosition_();
};


/**
 * Updates the position of the container.
 * @param {{x: number, y: number}} position The new position.
 */
bite.client.Resizer.prototype.updatePosition = function(position) {
  goog.style.setPosition(this.containerElement_, position.x, position.y);
  this.updateResizerPosition_();
};


/**
 * Validates a value is within a specified bounds, and returns the clamped
 * value. If the upper and lower bounds are mutually exclusive, clamps to the
 * lower bound.
 * @param {number} value The value to validate.
 * @param {number} lowerBound the lower bound to check against.
 * @param {number} upperBound the upper cound to check against.
 * @return {number} validateValue the validated value.
 * @private
 */
bite.client.Resizer.prototype.validateBoundedValue_ =
    function(value, lowerBound, upperBound) {
  if (value > upperBound) {
    value = upperBound;
  }
  if (value < lowerBound) {
    value = lowerBound;
  }
  return value;
};


/**
 * Ensure the container's height and width are within the minimum parameters.
 * This function does not update the resizer positions.
 * @private
 */
bite.client.Resizer.prototype.enforceMinimumSize_ = function() {
  if (this.containerElement_.style.height < bite.client.Resizer.MIN_HEIGHT) {
    this.containerElement_.style.height =
        bite.client.Resizer.MIN_HEIGHT;
  }
  if (this.containerElement_.style.width < bite.client.Resizer.MIN_WIDTH) {
    this.containerElement_.style.width =
        bite.client.Resizer.MIN_WIDTH;
  }
};


/**
 * Changes the style of the container when it is docked to one side of the
 * screen.
 * @private
 */
bite.client.Resizer.prototype.maybeDock_ = function() {
  var x = goog.style.getPosition(this.containerElement_).x;
  var y = goog.style.getPosition(this.containerElement_).y;
  var maxTop = goog.dom.getViewportSize().height -
      goog.style.getSize(this.containerElement_).height;
  var maxLeft = goog.dom.getViewportSize().width -
      goog.style.getSize(this.containerElement_).width;

  goog.dom.classes.remove(this.containerElement_,
                          'bite-container-top-dock',
                          'bite-container-bottom-dock',
                          'bite-container-left-dock',
                          'bite-container-right-dock');
  if (x <= 0) {
    this.dockSide_ = bite.client.Resizer.Side.LEFT;
    goog.dom.classes.add(this.containerElement_, 'bite-container-left-dock');
  } else if (y <= 0) {
    this.dockSide_ = bite.client.Resizer.Side.TOP;
    goog.dom.classes.add(this.containerElement_, 'bite-container-top-dock');
  } else if (x >= maxLeft) {
    this.dockSide_ = bite.client.Resizer.Side.RIGHT;
    goog.dom.classes.add(this.containerElement_, 'bite-container-right-dock');
  } else if (y >= maxTop) {
    this.dockSide_ = bite.client.Resizer.Side.BOTTOM;
    goog.dom.classes.add(this.containerElement_, 'bite-container-bottom-dock');
  } else {
    this.dockSide_ = bite.client.Resizer.Side.NONE;
  }
};


/**
 * Handles the container being dragged.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.client.Resizer.prototype.dragHandler_ = function(e) {
  var targetX = e.clientX;
  var targetY = e.clientY;

  // Set (targetX, targetY) to the coordinates of the top left corner of the
  // container.
  targetX -= this.dragOffset_.x;
  targetY -= this.dragOffset_.y;

  // Keep the container bounded within the browser viewport.
  var maxTop = goog.dom.getViewportSize().height -
      goog.style.getSize(this.containerElement_).height;
  var maxLeft = goog.dom.getViewportSize().width -
      goog.style.getSize(this.containerElement_).width;
  targetX = this.validateBoundedValue_(targetX, 0, maxLeft);
  targetY = this.validateBoundedValue_(targetY, 0, maxTop);

  this.containerElement_.style.left = targetX + 'px';
  this.containerElement_.style.top = targetY + 'px';

  this.maybeDock_();
};


/**
 * Handles a mouse up event releasing the container when it's being dragged.
 * @param {number} startX Start x coordinate of the drag.
 * @param {number} startY Start y coordinate of the drag.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.client.Resizer.prototype.dragRelease_ = function(startX, startY, e) {
  while (this.dragListenerKeys_.length > 0) {
    goog.events.unlistenByKey(this.dragListenerKeys_.pop());
  }

  this.updateResizerPosition_();

  this.isDragging_ = false;

  this.dragReleaseCallback_();
};


/**
 * Handles mouse events for drag-and-drop.
 * @param {goog.events.BrowserEvent} e A mouseEvent object from the
 *     container being clicked.
 * @private
 */
bite.client.Resizer.prototype.handleDragTarget_ = function(e) {
  // Do not begin dragging if already resizing or on right click.
  if (this.isResizing_ || !e.isMouseActionButton()) {
    return;
  }
  var offset = goog.style.getPosition(this.containerElement_);
  this.dragOffset_ = {x: e.clientX - offset.x,
                      y: e.clientY - offset.y};

  this.isDragging_ = true;

  this.dragListenerKeys_.push(goog.events.listen(
      goog.global.document, goog.events.EventType.MOUSEMOVE,
      goog.bind(this.dragHandler_, this)));
  this.dragListenerKeys_.push(goog.events.listen(
      goog.global.document, goog.events.EventType.MOUSEUP,
      goog.bind(this.dragRelease_, this, e.clientX, e.clientY)));

  // Prevent text from being selected while dragging.
  e.preventDefault();
};


/**
 * Adds edge and corner resizers to the container.
 * @private
 */
bite.client.Resizer.prototype.addResizers_ = function() {
  this.resizers_.n = goog.dom.createDom('div', 'n-resizer');
  this.resizers_.ne = goog.dom.createDom('div', 'ne-resizer');
  this.resizers_.e = goog.dom.createDom('div', 'e-resizer');
  this.resizers_.se = goog.dom.createDom('div', 'se-resizer');
  this.resizers_.s = goog.dom.createDom('div', 's-resizer');
  this.resizers_.sw = goog.dom.createDom('div', 'sw-resizer');
  this.resizers_.w = goog.dom.createDom('div', 'w-resizer');
  this.resizers_.nw = goog.dom.createDom('div', 'nw-resizer');
  var resizers = goog.dom.createDom('div', 'bite-resizers', this.resizers_.n,
                                    this.resizers_.ne, this.resizers_.e,
                                    this.resizers_.se, this.resizers_.s,
                                    this.resizers_.sw, this.resizers_.w,
                                    this.resizers_.nw);

  this.resizers_.n.style.cssText =
      'z-index: 70001; height: 7px; cursor: n-resize';
  this.resizers_.ne.style.cssText =
      'z-index: 70003; width: 15px; height: 15px; cursor: ne-resize';
  this.resizers_.e.style.cssText =
      'z-index: 70002; width: 7px; cursor: e-resize';
  this.resizers_.se.style.cssText =
      'z-index: 70003; width: 15px; height: 15px; cursor: se-resize';
  this.resizers_.s.style.cssText =
      'z-index: 70001; height: 7px; cursor: s-resize';
  this.resizers_.sw.style.cssText =
      'z-index: 70003; width: 15px; height: 15px; cursor: sw-resize';
  this.resizers_.w.style.cssText =
      'z-index: 70002; width: 7px; cursor: w-resize';
  this.resizers_.nw.style.cssText =
      'z-index: 70003; width: 15px; height: 15px; cursor: nw-resize';
  var direction;
  for (direction in this.resizers_) {
    this.resizers_[direction].style.position = 'fixed';
  }
  resizers.style.position = 'fixed';

  goog.dom.appendChild(this.containerElement_, resizers);
};


/**
 * Updates the resizers to fit the current container size and position.
 * @private
 */
bite.client.Resizer.prototype.updateResizerPosition_ = function() {
  if (this.dragOnly_) {
    return;
  }
  // Determinte the x, y coordinates of the container.
  var winX = this.getPosition().x;
  var winY = this.getPosition().y;
  var winH = this.getSize().height;
  var winW = this.getSize().width;

  // Move and resize the south resizer.
  this.resizers_.s.style.top = (winY + winH - 2) + 'px';
  this.resizers_.s.style.left = winX + 'px';
  this.resizers_.s.style.width = winW + 'px';

  // Move and resize the east resizer.
  this.resizers_.e.style.top = winY + 'px';
  this.resizers_.e.style.left = (winX + winW - 2) + 'px';
  this.resizers_.e.style.height = winH + 'px';

  // Move the south-east resizer.
  this.resizers_.se.style.top = (winY + winH - 10) + 'px';
  this.resizers_.se.style.left = (winX + winW - 10) + 'px';

  // Move and resize the west resizer.
  this.resizers_.w.style.top = winY + 'px';
  this.resizers_.w.style.left = (winX - 2) + 'px';
  this.resizers_.w.style.height = winH + 'px';

  // Move the south-west resizer.
  this.resizers_.sw.style.top = (winY + winH - 15) + 'px';
  this.resizers_.sw.style.left = winX + 'px';

  // Move and resize the north resizer.
  this.resizers_.n.style.top = (winY - 2) + 'px';
  this.resizers_.n.style.left = winX + 'px';
  this.resizers_.n.style.width = winW + 'px';

  // Move the north-west resizer.
  this.resizers_.nw.style.top = (winY - 5) + 'px';
  this.resizers_.nw.style.left = (winX - 2) + 'px';

  // Move the north-east resizer.
  this.resizers_.ne.style.top = winY + 'px';
  this.resizers_.ne.style.left = (winX + winW) + 'px';
};


/**
 * Handles dragging motion while the container is being resized.
 * @param {bite.client.Resizer.ResizeModes} mode The resizing mode to be in.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.client.Resizer.prototype.resizeHandler_ = function(mode, e) {
  // Keep the coordinates within the browser viewport and apply an offset.
  var targetX = this.validateBoundedValue_(
      e.clientX, 0,
      goog.dom.getViewportSize().width - 7) -
      this.dragOffset_.x;
  var targetY = this.validateBoundedValue_(
      e.clientY, 0,
      goog.dom.getViewportSize().height - 7) -
      this.dragOffset_.y;

  // Identify and validate the target width and height.
  var targetWidth = (targetX + this.unresizedSize_.width);
  var targetHeight = (targetY + this.unresizedSize_.height);

  if (targetWidth < bite.client.Resizer.MIN_WIDTH) {
    targetWidth = bite.client.Resizer.MIN_WIDTH;
  }
  if (targetHeight < bite.client.Resizer.MIN_HEIGHT) {
    targetHeight = bite.client.Resizer.MIN_HEIGHT;
  }

  // Applying any applicable transformations.
  if ((mode == bite.client.Resizer.ResizeModes.S) ||
      (mode == bite.client.Resizer.ResizeModes.SE) ||
      (mode == bite.client.Resizer.ResizeModes.SW)) {
    this.containerElement_.style.height = targetHeight + 'px';
  }
  if ((mode == bite.client.Resizer.ResizeModes.E) ||
      (mode == bite.client.Resizer.ResizeModes.NE) ||
      (mode == bite.client.Resizer.ResizeModes.SE)) {
    this.containerElement_.style.width = targetWidth + 'px';
  }
  if ((mode == bite.client.Resizer.ResizeModes.W) ||
      (mode == bite.client.Resizer.ResizeModes.NW) ||
      (mode == bite.client.Resizer.ResizeModes.SW)) {
    // If the window width is going to be too small, ignore resizing.
    targetWidth = (this.unresizedSize_.width - targetX);
    if (targetWidth >= bite.client.Resizer.MIN_WIDTH) {
      this.containerElement_.style.left =
          (this.unresizedPosition_.x + targetX) + 'px';
      this.containerElement_.style.width = targetWidth + 'px';
    }
  }
  if ((mode == bite.client.Resizer.ResizeModes.N) ||
      (mode == bite.client.Resizer.ResizeModes.NW) ||
      (mode == bite.client.Resizer.ResizeModes.NE)) {
    // If the window height is going to be too small, ignore resizing.
    targetHeight = (this.unresizedSize_.height - targetY);
    if (targetHeight >= bite.client.Resizer.MIN_HEIGHT) {
      this.containerElement_.style.top =
          (this.unresizedPosition_.y + targetY) + 'px';
      this.containerElement_.style.height = targetHeight + 'px';
    }
  }

  this.maybeDock_();
};


/**
 * Handles the user initiating a resize by clicking and dragging.
 * @param {bite.client.Resizer.ResizeModes} mode The resizing mode to be in.
 * @param {goog.events.BrowserEvent} e A mouseEvent object from the object
 *     being dragged.
 * @private
 */
bite.client.Resizer.prototype.handleResizeTarget_ = function(mode, e) {
  // Do not begin resizing if already dragging or on right click.
  if (this.isDragging_ || !e.isMouseActionButton()) {
    return;
  }
  this.dragOffset_ = {x: e.clientX, y: e.clientY};
  this.unresizedSize_ = this.getSize();
  this.unresizedPosition_ = this.getPosition();

  this.isResizing_ = true;

  this.resizeListenerKeys_.push(goog.events.listen(
      goog.global.document, goog.events.EventType.MOUSEMOVE,
      goog.bind(this.resizeHandler_, this, mode)));
  this.resizeListenerKeys_.push(goog.events.listen(
      goog.global.document, goog.events.EventType.MOUSEUP,
      goog.bind(this.resizeRelease_, this)));

  // Prevent text from being selected while resizing.
  e.preventDefault();
};


/**
 * Handles a mouse up event releasing the container when it's being resized.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.client.Resizer.prototype.resizeRelease_ = function(e) {
  this.updateResizerPosition_();

  while (this.resizeListenerKeys_.length > 0) {
    goog.events.unlistenByKey(this.resizeListenerKeys_.pop());
  }

  this.isResizing_ = false;
  this.resizeReleaseCallback_();
};


/**
 * Sets the handlers for the resizers and the dragging target.
 * @private
 */
bite.client.Resizer.prototype.setHandlers_ = function() {
  // Add handler for the drag target.
  this.eventHandler_.listen(this.dragTarget_, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleDragTarget_, this));

  // All events set below are only if resizing is being used.
  if (this.dragOnly_) {
    return;
  }

  // Add handlers for the corner and edge resizers.
  this.eventHandler_.listen(this.resizers_.e, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.E));
  this.eventHandler_.listen(this.resizers_.se, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.SE));
  this.eventHandler_.listen(this.resizers_.s, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.S));
  this.eventHandler_.listen(this.resizers_.sw, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.SW));
  this.eventHandler_.listen(this.resizers_.w, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.W));
  this.eventHandler_.listen(this.resizers_.n, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.N));
  this.eventHandler_.listen(this.resizers_.nw, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.NW));
  this.eventHandler_.listen(this.resizers_.ne, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.handleResizeTarget_, this,
                                      bite.client.Resizer.ResizeModes.NE));
};

