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
 * @fileoverview A method for mapping mouse position to DOM Element.  The
 * approach used is to store a list of DOM Elements and associated information.
 * When a request for elements at a given (x,y) position is given the list
 * will be linearly traversed and the coordinate will be checked to see if
 * falls within the element.
 *
 * This approach was chosen for reduced space requirements.  An alternative
 * memory intensive, but quick lookup, is to keep a two-dimensional array of
 * ids that map to the element and its information.  The other issue with this
 * approach is that the data would need to be recalculated upon screen resize.
 * The current approach does not have this requirement as long as the position
 * and dimensions are explicitly recorded along with the element.
 *
 * Revisit this approach and bug overlays in general to scale to much larger
 * numbers of bugs.  Current estimates is in the hundreds per page (small).
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.client.ElementMapper');

goog.require('goog.style');



/**
 * A class that allows a mapping of window position to DOM Element.
 * @constructor
 */
bite.client.ElementMapper = function() {
  /**
   * The list of overlay elements.
   * @type {Array.<{element: !Element, info: !Object}>}
   * @private
   */
  this.elements_ = [];
};


/**
 * Adds an element to the list.  For speed, duplicates are not checked for.
 * @param {!Element} element The element to record.
 * @param {!Object} info The information to be recorded with the element.
 */
bite.client.ElementMapper.prototype.add = function(element, info) {
  this.elements_.push({element: element, info: info});
};


/**
 * Returns all Element Info objects stored in the mapper.
 * @return {Array.<!Object>} The data.
 */
bite.client.ElementMapper.prototype.all = function() {
  var data = [];

  for (var i = 0; i < this.elements_.length; ++i) {
    data.push(this.elements_[i].info);
  }

  return data;
};


/**
 * Clears the list of elements.
 */
bite.client.ElementMapper.prototype.clear = function() {
  this.elements_ = [];
};


/**
 * Retrieves the information associated with the DOM Elements at the given
 * coordinate.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @return {Array.<!Object>} An array of information objects.
 */
bite.client.ElementMapper.prototype.find = function(x, y) {
  var data = [];

  for (var i = 0; i < this.elements_.length; ++i) {
    var elementObj = this.elements_[i];
    var element = elementObj.element;

    var position = goog.style.getPageOffset(element);
    var dimension = goog.style.getSize(element);

    if (x >= position.x && x < position.x + dimension.width &&
        y >= position.y && y < position.y + dimension.height) {
      data.push(elementObj.info);
    }
  }

  return data;
};


/**
 * Remove an element from the list.
 * @param {!Element} element The element to remove.
 */
bite.client.ElementMapper.prototype.remove = function(element) {
  for (var i = 0; i < this.elements_.length; ++i) {
    if (this.elements_[i].element == element) {
      this.elements_.splice(i, 1);
      return;
    }
  }
};


/**
 * Remove duplicate element references from the list in case one did not ensure
 * this to be the case.
 */
bite.client.ElementMapper.prototype.removeDuplicates = function() {
  var oldElements = this.elements_;
  this.elements_ = [];

  for (var i = 0; i < oldElements.length; ++i) {
    var element = oldElements[i].element;

    var found = false;
    for (var j = 0; j < this.elements_.length; ++j) {
      if (this.elements_[j].element == element) {
        found = true;
        break;
      }
    }

    if (!found) {
      this.elements_.push(oldElements[i]);
    }
  }
};

