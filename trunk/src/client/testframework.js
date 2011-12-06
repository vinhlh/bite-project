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
 * @fileoverview This file contains testing framework to test multiple bite
 * related functionalities. ex. The accuracy of descriptor, etc.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.TestFramework');

goog.require('goog.Timer');
goog.require('goog.dom');



/**
 * The class for test framework.
 * @constructor
 * @export
 */
bite.TestFramework = function() {
  this.elemDescriptor_ = null;
  if (!common.client.ElementDescriptor) {
    alert('elementhelper not exists.');
    return;
  } else {
    this.elemDescriptor_ = new common.client.ElementDescriptor();
  }
  goog.Timer.callOnce(goog.bind(this.testSelectors_, this), 5000);
};


/**
 * The tag names that will be ignored.
 * @type {Object}
 * @private
 */
bite.TestFramework.IGNORE_TAG_ARRAY_ = {
  'script': true,
  'style': true,
  'meta': true,
  'html': true,
  'embed': true
};


/**
 * Tests descriptors, which represents the JSON format info string we collect.
 * @private
 */
bite.TestFramework.prototype.testDescriptors_ = function() {
  var elems = this.getElements_();
  console.log('The elems number is: ' + elems.length);
  var descriptor = null;
  var failedNum = 0;
  var startTime = goog.now();
  for (var i = 0, len = elems.length; i < len; i++) {
    if (bite.TestFramework.IGNORE_TAG_ARRAY_[elems[i].tagName.toLowerCase()]) {
      continue;
    }
    descriptor = this.elemDescriptor_.generateElementDescriptor(elems[i], 2);
    failedNum += this.checkDescriptor_(elems[i], descriptor);
  }
  console.log('It took secs: ' + (goog.now() - startTime) / 1000);
  console.log('Failed number is: ' + failedNum);
};


/**
 * Tests selectors, which represents the css selectors we collect for elements.
 * @private
 */
bite.TestFramework.prototype.testSelectors_ = function() {
  var elems = this.getElements_();
  console.log('The elems number is: ' + elems.length);
  var failedNum = 0;
  var startTime = goog.now();
  for (var i = 0, len = elems.length; i < len; i++) {
    if (bite.TestFramework.IGNORE_TAG_ARRAY_[elems[i].tagName.toLowerCase()]) {
      continue;
    }
    var selector = this.elemDescriptor_.generateSelector(elems[i]);
    var result = this.checkSelector_(elems[i], selector);
    if (result) {
      console.log('Failed elem selector is: ' + selector);
      console.log(elems[i]);
    }
    failedNum += result;
  }
  console.log('It took secs: ' + (goog.now() - startTime) / 1000);
  console.log('Failed number is: ' + failedNum);
};


/**
 * Checks whether the given selector is correct.
 * @param {Node} elem The element node.
 * @param {string} selector The selector string.
 * @return {number} 0: success 1: failed.
 * @private
 */
bite.TestFramework.prototype.checkSelector_ = function(elem, selector) {
  var nodes = null;
  try {
    nodes = document.querySelectorAll(selector);
  } catch (e) {
    console.log('Failed selector is: ' + selector);
    console.log(elem);
    return 1;
  }
  return nodes && nodes.length == 1 && nodes[0].isSameNode(elem) ? 0 : 1;
};


/**
 * Checks whether the given descriptor is correct.
 * @param {Node} elem The element node.
 * @param {string} descriptor The descriptor string.
 * @return {number} 0: success 1: failed.
 * @private
 */
bite.TestFramework.prototype.checkDescriptor_ = function(elem, descriptor) {
  var result = parseElementDescriptor(descriptor, true);
  if (result){
    if (elem.isSameNode(result[0])) {
      return 0;
    } else {
      console.log('Found one elem, but not the one: ');
    }
  } else {
    console.log('Found multiple results: ');
  }
  console.log('The descriptor: ' + descriptor);
  console.log('Was looking for: ');
  console.log(elem);
  console.log('Actually found: ');
  console.log(result[0]);
  this.markElement_(elem);
  return 1;
};


/**
 * Marks the element.
 * @param {Node} elem The element to be marked.
 * @private
 */
bite.TestFramework.prototype.markElement_ = function(elem) {
  elem.style.outline = 'medium solid yellow';
  elem.onmouseover = function() {
    console.log(elem.outerHTML);
  };
};


/**
 * Gets an array from a given nodelist.
 * @param {Object} nodeList The nodeList.
 * @return {Array} The element array.
 * @private
 */
bite.TestFramework.prototype.getArrayFromNodeList_ = function(nodeList) {
  var elemArray = [];
  for (var i = 0, len = nodeList.length; i < len; i++) {
    elemArray.push(nodeList[i]);
  }
  return elemArray;
};


/**
 * Gets a group of elements.
 * @return {Array} Returns a list of elements.
 * @private
 */
bite.TestFramework.prototype.getElements_ = function() {
  return this.getArrayFromNodeList_(
      goog.dom.getDocument().querySelectorAll('*'));
};


new bite.TestFramework();
