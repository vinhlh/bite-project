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
 * @fileoverview Tests for the NewBug element selector.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.require('bite.client.ElementSelector');
goog.require('common.client.RecordModeManager');


var element = null;
var mockCaller = null;
var elementSelector = null;

/**
 * Stores the element returned by the element selector.
 * @constructor
 * @export
 */
mockCallBack = function() {
  /**
   * The element that was returned.
   * @type {Element}
   */
  this.element = null;
};


/**
 * Sets the element of the mockCallBack.
 * @param {Element} element The element to store.
 */
mockCallBack.prototype.callback = function(element) {
  this.element = element;
};


function setUp() {
  initChrome();
  element = goog.dom.createDom(
      goog.dom.TagName.DIV,
      {'id': 'test-element',
       'style': 'position:fixed;top:0;left:0;width:50px;height:50px'});
  goog.dom.appendChild(goog.dom.getDocument().body, element);
  mockCaller = new mockCallBack();

  elementSelector = new bite.client.ElementSelector();
}


function tearDown() {
  goog.dom.removeNode(element);
  element = null;
  mockCaller = null;
  elementSelector = null;
  goog.events.removeAll();
}


function testClickElement() {
  elementSelector.startRecording(
      goog.bind(mockCaller.callback, mockCaller));
  assertTrue(elementSelector.isActive());
  elementSelector.recordModeManager_.currElement_ = element;
  elementSelector.recordModeManager_.clickOverride_();
  assertEquals(element.id, mockCaller.element.id);
}


function testCancel() {
  elementSelector.startRecording(
      goog.bind(mockCaller.callback, mockCaller));
  elementSelector.cancelSelection();
  assertFalse(elementSelector.isActive());
  assertNull(mockCaller.element);
}

