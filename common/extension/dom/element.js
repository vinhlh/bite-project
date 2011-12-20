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
 * @fileoverview Provides functionality related to DOM elements.
 *
 * @author ralphj@google.com (Julie Ralph)
 * @author jason.stredwick@gmail.com (Jason Stredwick)
 */


goog.provide('common.dom.element');

goog.require('goog.style');


/**
 * Returns the position of the element.
 * @param {!Element} element The element to access.
 * @return {!{x: number, y: number}} The position of the element.
 */
common.dom.element.getPosition = function(element) {
  return goog.style.getPosition(element);
};


/**
 * Returns the size of the element.
 * @param {!Element} element The element to access.
 * @return {!{width: number, height: number}} The dimensions of the element.
 */
common.dom.element.getSize = function(element) {
  return goog.style.getSize(element);
};


/**
 * Set the position of the element.
 * @param {!Element} element The element to access.
 * @param {!{x: number, y: number}} position The new position.
 */
common.dom.element.setPosition = function(element, position) {
  goog.style.setPosition(element, position.x, position.y);
};


/**
 * Set the size of the element.
 * @param {!Element} element The element to access.
 * @param {!{width: number, height: number}} size The new size.
 */
common.dom.element.setSize = function(element, size) {
  goog.style.setSize(element, size.width, size.height);
};
