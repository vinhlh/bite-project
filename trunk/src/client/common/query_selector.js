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
 * @fileoverview This file contains functions for extracting a query selector
 * for string that can be used to uniquely identify a DOM Element.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('common.dom.querySelector');

goog.require('goog.dom.TagName');


/**
 * Finds a selector that uniquely identifies the given DOM Node.
 * A selector will traverse from the body tag to the given node.  Each DOM
 * Element's portion of the selector is
 *     <node.nodeName>([id=node.id])?(:nth-child([0-9]+))?
 * and each of the DOM Element's selectors are separated by '>' giving:
 *     selector(>selector)*.
 * @param {!Node} node The DOM Node requiring identification.
 * @returns {string} A string containing the selector.
 */
common.dom.querySelector.getSelector = function(node) {
  var nodeName = node.nodeName;
  var id = node.id;
  var parent = node.parentNode;

  if (node.nodeName.toLowerCase() == goog.dom.TagName.BODY.toLowerCase()) {
    return goog.dom.TagName.BODY;
  }

  var selector = nodeName + (id ? '[id=' + id + ']' : '');
  if (!parent) {
    return selector;
  }

  for (var i = 0; i < parent.childNodes.length; ++i) {
    var child = parent.childNodes[i];
    if (child == node) {
      selector = selector + ':nth-child(' + (i + 1) + ')';
      break;
    }
  }

  var parentSelector = common.dom.querySelector.getSelector(parent);
  if (parentSelector) {
    selector = parentSelector + '>' + selector;
  }

  return selector;
};

