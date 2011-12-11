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
 * @fileoverview This file contains the closure helper functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.closure.Helper');

goog.require('goog.style');
goog.require('goog.ui.ComboBox');


/**
 * Removes the selector items.
 * @param {goog.ui.ComboBox} selector The combo box.
 */
bite.closure.Helper.removeItemsFromSelector = function(selector) {
  selector.removeAllItems();
};


/**
 * Adds the selector items.
 * @param {goog.ui.ComboBox} selector The combo box.
 * @param {Array} items The menu items.
 */
bite.closure.Helper.addItemsToSelector = function(selector, items) {
  for (var i = 0, len = items.length; i < len; ++i) {
    var menuItem = new goog.ui.MenuItem(items[i]);
    selector.addItem(menuItem);
  }
};


/**
 * Sets the given group of elements visibilities.
 * @param {Array.<Element>} elements The elements.
 * @param {boolean} visible Whether the elements should be visible.
 */
bite.closure.Helper.setElementsVisibility = function(elements, visible) {
  for (var i = 0, len = elements.length; i < len; ++i) {
    goog.style.showElement(elements[i], visible);
  }
};

