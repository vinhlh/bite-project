// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview Tests for the Record Mode Manager class.
 *
 * @author alexto@google.com (Alexis O. Torres)
 */


goog.require('common.client.RecordModeManager');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.testing.PropertyReplacer');



/**
 * Mock Document object used to facilitate testing
 */
MockDocument = function() {
};


/**
 * Mocks the onmousemove event handler of the document.
 */
MockDocument.prototype.onmousemove = null;


/**
 * Mocks the onclick event handler of the document.
 */
MockDocument.prototype.onclick = null;


var stubs_ = new goog.testing.PropertyReplacer();
var mockDocument_ = null;


function setUp() {
  this.stubs_.set(goog.global, 'document', new MockDocument());
}


function tearDown() {
  this.stubs_.reset();
  this.mockDocument_ = null;
}


function testEnterExitRecordingMode() {
  var recordMan = new common.client.RecordModeManager();
  assertFalse(recordMan.isRecording());
  recordMan.enterRecordingMode(goog.nullFunction);
  assertTrue(recordMan.isRecording());
  recordMan.exitRecordingMode();
  assertFalse(recordMan.isRecording());
}


function testOnClickAndMouseMove() {
  // Reset while we create a new element.
  this.stubs_.reset();
  var testElement = goog.dom.createDom(
      goog.dom.TagName.DIV, {'id': 'testDiv'});
  goog.dom.appendChild(document.body, testElement);

  // Mock the global document.
  this.stubs_.set(goog.global, 'document', new MockDocument());

  // Enter recording mode.
  var actualElement = null;
  var recordMan = new common.client.RecordModeManager();
  recordMan.enterRecordingMode(function(elmnt) {
      actualElement = elmnt;
    });

  var mockMouseEvent = {srcElement: testElement};

  // Call the mousemove and click events handlers.
  goog.global.document.onmousemove(mockMouseEvent);
  goog.global.document.onclick(mockMouseEvent);

  assertNotNull(actualElement);
  assertEquals(testElement, actualElement);
}


function testHighlightBoxId() {
  var recordMan = new common.client.RecordModeManager();
  recordMan.enterRecordingMode(function(elmnt) {});

  assertEquals('recordingHighlightBox', recordMan.getHighlightBoxId());
  recordMan.setHighlightBoxId('testingBoxId');
  assertEquals('testingBoxId', recordMan.getHighlightBoxId());
}
