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
 * @fileoverview Provides utilities for resizing a container.  The resizer
 * creates it's own resizing elements that follow the element to resize.  This
 * has an issue where the element is resized or moved external to this code.
 *
 * Assumption: The element referenced by this class are not modified while
 * the resizing action is underway.  Likewise, only one resizer can be used at
 * a time.
 *
 * TODO(jason.stredwick): For now it will be on the user to ensure the resizers
 * are updated if the element changes externally.  In the future it may be
 * possible to add floating resizer elements to the element itself as children
 * with relative positions.
 * TODO(jason.stredwick): Consider making the callback a signal.
 *
 * @author ralphj@google.com (Julie Ralph)
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('bite.ux.Resizer');

goog.require('common.dom.element');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');



/**
 * Provides a class for managing resizing an element.
 * @param {!Element} element The element to add the ability to resize.
 * @param {function()=} opt_resizedCallback A callback fired when the element
 *     has been resized.
 * @constructor
 */
bite.ux.Resizer = function(element, opt_resizedCallback) {
  /**
   * The element to resize.
   * @type {!Element}
   * @private
   */
  this.element_ = element;

  /**
   * Callback on resize release.
   * @type {function()}
   * @private
   */
  this.resizedCallback_ = opt_resizedCallback || function() {};

  /**
   * Whether or not currently resizing.
   * @type {boolean}
   * @private
   */
  this.isResizing_ = false;

  /**
   * The last mouse position.
   * @type {!{x: number, y: number}}
   * @private
   */
  this.prevMousePos_ = {x: 0, y: 0};

  /**
   * An object containing the resizer elements, keyed by their cardinal
   * direction.
   * @type {!{n: !Element, ne: !Element, e: !Element, se: !Element,
   *          s: !Element, sw: !Element, w: !Element, nw: !Element}}
   * @private
   */
  this.resizers_ = bite.ux.Resizer.createResizers_();

  /**
   * The resizer div that contains all the resizer elements.
   * @type {Element}
   * @private
   */
  this.resizerDom_ = null;

  /**
   * An array of listener keys for resizing.
   * @type {!Array.<number>}
   * @private
   */
  this.resizeListenerKeys_ = [];

  /**
   * Handles the event listeners.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  this.resizersAdd_();
  this.updateResizerPosition_();
};


/**
 * The minimum width of the container element.
 * @type {number}
 * @private
 */
bite.ux.Resizer.MIN_WIDTH_ = 200;


/**
 * The minimum height of the container element.
 * @type {number}
 * @private
 */
bite.ux.Resizer.MIN_HEIGHT_ = 150;


/**
 * Resize Modes
 * @enum {string}
 * @private
 */
bite.ux.Resizer.Mode_ = {
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
 * Destroy the object by cleaning up its allocated items.
 */
bite.ux.Resizer.prototype.destroy = function() {
  // Remove callback before calling onMouseUp so an event is not fired.
  this.resizedCallback_ = function() {};
  this.onMouseUp_();
  this.resizersRemove_();
  this.element_ = /** @type {!Element} */ (null);
};
 
 
/**
 * Recalculates if the managed element is updated externally.
 */
bite.ux.Resizer.prototype.recalculate = function() {
  this.updateResizerPosition_();
};


/**
 * Handles the user initiating a resize by clicking and dragging.
 * @param {bite.ux.Resizer.Mode_} mode The resizing mode to be in.
 * @param {Element} resizer The resizer to use.
 * @param {goog.events.BrowserEvent} e A mouseEvent object from the object
 *     being dragged.
 * @private
 */
bite.ux.Resizer.prototype.onMouseDown_ = function(mode, resizer, e) {
  // Do not begin resizing if already resizing or on right click.
  if (!resizer || this.isResizing_ || !e.isMouseActionButton()) {
    return;
  }

  this.isResizing_ = true;
  this.prevMousePos_ = {x: e.clientX, y: e.clientY};

  // Setup resizer to listen for mouse move and up events.
  this.resizeListenerKeys_.push(goog.events.listen(
      goog.dom.getDocument(), goog.events.EventType.MOUSEMOVE,
      goog.bind(this.onMouseMove_, this, mode, resizer)));
  this.resizeListenerKeys_.push(goog.events.listen(
      goog.dom.getDocument(), goog.events.EventType.MOUSEUP,
      goog.bind(this.onMouseUp_, this)));

  // Prevent text from being selected while resizing.
  e.preventDefault();
};


/**
 * Handles dragging motion while the container is being resized.
 * @param {bite.ux.Resizer.Mode_} mode The resizing mode to be in.
 * @param {Element} resizer The resizer to use.
 * @param {Object} e A mouseEvent object from the object being dragged.
 * @private
 */
bite.ux.Resizer.prototype.onMouseMove_ = function(mode, resizer, e) {
  // Find position of the wrapped element's upper left and lower right corners.
  var elemDim = common.dom.element.getSize(this.element_);
  var elemP0 = common.dom.element.getPosition(this.element_);
  var elemP1 = {x: elemP0.x + elemDim.width - 1,
                y: elemP0.y + elemDim.height - 1};

  // Compute the movement delta based on the new mouse position.
  var mousePos = {x: e.clientX, y: e.clientY};
  var delta = bite.ux.Resizer.computeDelta_(this.prevMousePos_, mousePos);
  this.prevMousePos_ = mousePos;

  // Calculate the new position of the element.
  bite.ux.Resizer.updateElementPositions_(elemP0, elemP1, delta, mousePos,
                                          mode);
  bite.ux.Resizer.constrainElement_(elemP0, elemP1, mode);

  // Update the position and size of the resizable element then update the
  // resizer positions.
  common.dom.element.setPosition(this.element_, elemP0);
  common.dom.element.setSize(this.element_, {width: elemP1.x - elemP0.x - 1,
                                             height: elemP1.y - elemP0.y - 1});
  this.updateResizerPosition_();
};


/**
 * Handles a mouse up event releasing the container when it's being resized.
 * @param {Object=} opt_e A mouseEvent object from the object being dragged.
 * @private
 */
bite.ux.Resizer.prototype.onMouseUp_ = function(opt_e) {
  while (this.resizeListenerKeys_.length > 0) {
    goog.events.unlistenByKey(this.resizeListenerKeys_.pop());
  }
  this.isResizing_ = false;
  this.resizedCallback_();
};


/**
 * An object containing the resizer elements, keyed by their cardinal
 * direction.
 * @return {!{n: !Element, ne: !Element, e: !Element, se: !Element,
 *            s: !Element, sw: !Element, w: !Element, nw: !Element}} The new
 *     resizer elements.
 * @private
 */
bite.ux.Resizer.createResizers_ = function() {
  var n = goog.dom.createDom('div', 'n-resizer');
  var ne = goog.dom.createDom('div', 'ne-resizer');
  var e = goog.dom.createDom('div', 'e-resizer');
  var se = goog.dom.createDom('div', 'se-resizer');
  var s = goog.dom.createDom('div', 's-resizer');
  var sw = goog.dom.createDom('div', 'sw-resizer');
  var w = goog.dom.createDom('div', 'w-resizer');
  var nw = goog.dom.createDom('div', 'nw-resizer');
  if (!(n && ne && e && se && s && sw && w && nw)) {
    throw 'Failed to create resizers needed to implement Resizer ' +
          'functinality.';
  }
  return {
    n: /** @type {!Element} */ (n),
    ne: /** @type {!Element} */ (ne),
    e: /** @type {!Element} */ (e),
    se: /** @type {!Element} */ (se),
    s: /** @type {!Element} */ (s),
    sw: /** @type {!Element} */ (sw),
    w: /** @type {!Element} */ (w),
    nw: /** @type {!Element} */ (nw)
  };
};


/**
 * Adds edge and corner resizers to the container.
 * @private
 */
bite.ux.Resizer.prototype.resizersAdd_ = function() {
  this.resizerDom_ = goog.dom.createDom('div', 'bite-resizers',
                                        this.resizers_.n, this.resizers_.ne,
                                        this.resizers_.e, this.resizers_.se,
                                        this.resizers_.s, this.resizers_.sw,
                                        this.resizers_.w, this.resizers_.nw);

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
  this.resizerDom_.style.position = 'fixed';

  goog.dom.appendChild(this.element_, this.resizerDom_);
  this.setHandlers_();
};


/**
 * Removes edge and corner resizers to the container.
 * @private
 */
bite.ux.Resizer.prototype.resizersRemove_ = function() {
  this.eventHandler_.removeAll();
  if (this.resizerDom_) {
    goog.dom.removeNode(this.resizerDom_);
  }
};


/**
 * Sets the handlers for the resizers and the dragging target.
 * @private
 */
bite.ux.Resizer.prototype.setHandlers_ = function() {
  // Add handlers for the corner and edge resizers.
  this.eventHandler_.listen(this.resizers_.e, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.E,
                                      this.resizers_.e));
  this.eventHandler_.listen(this.resizers_.se, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.SE,
                                      this.resizers_.se));
  this.eventHandler_.listen(this.resizers_.s, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.S,
                                      this.resizers_.s));
  this.eventHandler_.listen(this.resizers_.sw, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.SW,
                                      this.resizers_.sw));
  this.eventHandler_.listen(this.resizers_.w, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.W,
                                      this.resizers_.w));
  this.eventHandler_.listen(this.resizers_.n, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.N,
                                      this.resizers_.n));
  this.eventHandler_.listen(this.resizers_.nw, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.NW,
                                      this.resizers_.nw));
  this.eventHandler_.listen(this.resizers_.ne, goog.events.EventType.MOUSEDOWN,
                            goog.bind(this.onMouseDown_, this,
                                      bite.ux.Resizer.Mode_.NE,
                                      this.resizers_.ne));
};


/**
 * Updates the resizers to fit the current container size and position.
 * @private
 */
bite.ux.Resizer.prototype.updateResizerPosition_ = function() {
  // Determinte the x, y coordinates of the container.
  var pos = common.dom.element.getPosition(this.element_);
  var dim = common.dom.element.getSize(this.element_);
  var winX = pos.x;
  var winY = pos.y;
  var winH = dim.height;
  var winW = dim.width;

  // Move and resize the south resizer.
  dim = common.dom.element.getSize(this.resizers_.s);
  var newPos = {x: winX, y: winY + winH - 2};
  var newDim = {width: winW, height: dim.height};
  common.dom.element.setPosition(this.resizers_.s, newPos);
  common.dom.element.setSize(this.resizers_.s, newDim);

  // Move and resize the east resizer.
  dim = common.dom.element.getSize(this.resizers_.e);
  newPos = {x: winX + winW - 10, y: winY};
  newDim = {width: dim.width, height: winH};
  common.dom.element.setPosition(this.resizers_.e, newPos);
  common.dom.element.setSize(this.resizers_.e, newDim);

  // Move the south-east resizer.
  newPos = {x: winX + winW - 10, y: winY + winH - 10};
  common.dom.element.setPosition(this.resizers_.se, newPos);

  // Move and resize the west resizer.
  dim = common.dom.element.getSize(this.resizers_.w);
  newPos = {x: winX - 2, y: winY};
  newDim = {width: dim.width, height: winH};
  common.dom.element.setPosition(this.resizers_.w, newPos);
  common.dom.element.setSize(this.resizers_.w, newDim);

  // Move the south-west resizer.
  newPos = {x: winX, y: winY + winH - 15};
  common.dom.element.setPosition(this.resizers_.sw, newPos);

  // Move and resize the north resizer.
  dim = common.dom.element.getSize(this.resizers_.n);
  newPos = {x: winX, y: winY - 2};
  newDim = {width: winW, height: dim.height};
  common.dom.element.setPosition(this.resizers_.n, newPos);
  common.dom.element.setSize(this.resizers_.n, newDim);

  // Move the north-west resizer.
  newPos = {x: winX - 2, y: winY - 5};
  common.dom.element.setPosition(this.resizers_.nw, newPos);

  // Move the north-east resizer.
  newPos = {x: winX + winW, y: winY};
  common.dom.element.setPosition(this.resizers_.ne, newPos);
};


/**
 * Compute the movement delta based on the new mouse position.  If the mouse
 * has a component outside the viewport that component is zeroed in the
 * movement vector.  Give flexibility to the constraints of 10 pixels in order
 * to prevent issues where the mouse is able to get ahead of the edge being
 * dragged.
 * @param {!{x: number, y: number}} p0 The previous mouse position.
 * @param {!{x: number, y: number}} p1 The current mouse position.
 * @return {!{x: number, y: number}} The movement vector of the mouse.
 * @private
 */
bite.ux.Resizer.computeDelta_ = function(p0, p1) {
  var viewportDim = goog.dom.getViewportSize();
  var delta = {x: p1.x - p0.x, y: p1.y - p0.y};
  if (p1.x < -10 || p1.x > viewportDim.width + 10) {
    delta.x = 0;
  }
  if (p1.y < -10 || p1.y > viewportDim.height + 10) {
    delta.y = 0;
  }
  return delta;
};


/**
 * Updates the given element positions to their new values based on the mouse
 * movement vector.  The positions are passed by reference, so nothing is
 * returned.
 * @param {!{x: number, y: number}} p0 The upper left corner.
 * @param {!{x: number, y: number}} p1 The lower right corner.
 * @param {!{x: number, y: number}} delta The movement vector of the mouse.
 * @param {!{x: number, y: number}} mousePos The position of the mouse.
 * @param {bite.ux.Resizer.Mode_} mode Id for the resizer that was moved.
 * @private
 */
bite.ux.Resizer.updateElementPositions_ = function(p0, p1, delta, mousePos,
                                                   mode) {
  var width = p1.x - p0.x - 1;
  var height = p1.y - p0.y - 1;

  // Update element x positions
  switch (mode) {
    case bite.ux.Resizer.Mode_.NW:
    case bite.ux.Resizer.Mode_.SW:
    case bite.ux.Resizer.Mode_.W:
      if (width > bite.ux.Resizer.MIN_WIDTH_ || mousePos.x <= p0.x) {
        p0.x += delta.x;
      }
      break;

    case bite.ux.Resizer.Mode_.E:
    case bite.ux.Resizer.Mode_.NE:
    case bite.ux.Resizer.Mode_.SE:
      if (width > bite.ux.Resizer.MIN_WIDTH_ || mousePos.x >= p1.x) {
        p1.x += delta.x;
      }
      break;
  }

  // Update element y positions
  switch (mode) {
    case bite.ux.Resizer.Mode_.N:
    case bite.ux.Resizer.Mode_.NE:
    case bite.ux.Resizer.Mode_.NW:
      if (height > bite.ux.Resizer.MIN_HEIGHT_ || mousePos.y <= p0.y) {
        p0.y += delta.y;
      }
      break;

    case bite.ux.Resizer.Mode_.S:
    case bite.ux.Resizer.Mode_.SE:
    case bite.ux.Resizer.Mode_.SW:
      if (height > bite.ux.Resizer.MIN_HEIGHT_ || mousePos.y >= p1.y) {
        p1.y += delta.y;
      }
      break;
  }
};


/**
 * Constrains the element positions to within the viewport and maintain minimum
 * dimensions.
 * @param {!{x: number, y: number}} p0 The upper left corener.
 * @param {!{x: number, y: number}} p1 The lower right corner.
 * @param {bite.ux.Resizer.Mode_} mode Id for the resizer that moved.
 * @private
 */
bite.ux.Resizer.constrainElement_ = function(p0, p1, mode) {
  // Compute the screen size.
  var viewportDim = goog.dom.getViewportSize();

  // Constrain positions.
  if (p0.x < 0) {
    p0.x = 0;
  }
  if (p1.x > viewportDim.width) {
    p1.x = viewportDim.width - 1; // Compensate for pixels starting at 0.
  }
  if (p0.y < 0) {
    p0.y = 0;
  }
  if (p1.y > viewportDim.height) {
    p1.y = viewportDim.height - 1; // Compensate for pixels starting at 0.
  }

  // Constrain dimensions
  var dim = {width: p1.x - p0.x - 1, height: p1.y - p0.y - 1};

  // By checking the mode, I can guarantee the change in size will not
  // invalidate the positions of the corners relative to the viewport.  This
  // assumes the element is properly positioned and sized to begin with.
  if (dim.width < bite.ux.Resizer.MIN_WIDTH_) {
    switch (mode) {
      case bite.ux.Resizer.Mode_.NW:
      case bite.ux.Resizer.Mode_.SW:
      case bite.ux.Resizer.Mode_.W:
        p0.x = p1.x - bite.ux.Resizer.MIN_WIDTH_ + 1;
        break;

      case bite.ux.Resizer.Mode_.E:
      case bite.ux.Resizer.Mode_.NE:
      case bite.ux.Resizer.Mode_.SE:
        p1.x = p0.x + bite.ux.Resizer.MIN_WIDTH_ - 1;
        break;
    }
  }
  if (dim.height < bite.ux.Resizer.MIN_HEIGHT_) {
    switch (mode) {
      case bite.ux.Resizer.Mode_.N:
      case bite.ux.Resizer.Mode_.NE:
      case bite.ux.Resizer.Mode_.NW:
        p0.y = p1.y - bite.ux.Resizer.MIN_HEIGHT_ + 1;
        break;

      case bite.ux.Resizer.Mode_.S:
      case bite.ux.Resizer.Mode_.SE:
      case bite.ux.Resizer.Mode_.SW:
        p1.y = p0.y + bite.ux.Resizer.MIN_HEIGHT_ - 1;
        break;
    }
  }
};
