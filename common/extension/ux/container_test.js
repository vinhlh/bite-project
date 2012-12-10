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
 * @fileoverview Tests for the BITE container.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.require('Bite.Constants');
goog.require('bite.ux.Container');
goog.require('goog.dom');
goog.require('goog.testing.PropertyReplacer');


var stubs = new goog.testing.PropertyReplacer();
var container = null;

/**
 * Mocks the background script's GET_LOCAL_STORAGE.
 * @param {Object} data Used to determine the action being requested.
 * @param {Function} callback The callback.
 */
var mockSendRequest = function(data, callback) {
  if (data['action'] == Bite.Constants.HUD_ACTION.GET_LOCAL_STORAGE) {
    if (data['key'] ==
        bite.ux.Container.Keys_.CONSOLE_LOCATION + 'test_console') {
      var positionData = JSON.stringify(
          {position: {x: 20, y: 20},
           size: {height: 450, width: 350}});
      callback(positionData);
    } else if (data['key'] == bite.ux.Container.Keys_.SHOWN_MESSAGES +
               'shown_message') {
      callback('t');
    } else {
      callback(null);
    }
  }
};


function setUp() {
  initChrome();
  stubs.set(chrome.extension, 'sendRequest', mockSendRequest);
}


function tearDown() {
  if (container) {
    container.remove();
    container = null;
  }
  stubs.reset();
}


function testSetContentFromHtml() {
  container = new bite.ux.Container('dev.biteserver.prom.google.com',
                                    'test_console',
                                    'Header',
                                    'Subheader',
                                    false);
  assertEquals('test_console', container.getRoot().id);

  container.setContentFromHtml('Test Paragraph');

  assertEquals(
      'Test Paragraph',
      goog.dom.getElementByClass('bite-console-content').innerHTML);

  container.remove();
  assertNull(goog.dom.getElement('test_console'));
  container = null;
}


function testSetContentFromElement() {
  container = new bite.ux.Container('dev.biteserver.prom.google.com',
                                    'test_console',
                                    'Header',
                                    'Subheader',
                                    false);
  var element = goog.dom.createDom('p', null, 'Test Paragraph');
  container.setContentFromElement(element);
  assertEquals(
      'Test Paragraph',
      goog.dom.getElementByClass('bite-console-content').innerHTML);
}


function testConsoleWithSavedLocation() {
  var mockUpdatePosition = function(position) {
    assertEquals(20, position.x);
    assertEquals(20, position.y);
  };
  stubs.set(bite.client.Resizer, 'updatePosition', mockUpdatePosition);

  container = new bite.ux.Container('dev.biteserver.prom.google.com',
                                    'test_console',
                                    'Header',
                                    'Subheader',
                                    true);
  assertEquals(450, container.getRoot().clientHeight);
  assertEquals(350, container.getRoot().clientWidth);
}


function testShowInfoMessage() {
  container = new bite.ux.Container('dev.biteserver.prom.google.com',
                                    'test_console',
                                    'Header',
                                    'Subheader',
                                    false);
  container.showInfoMessage('Message a');
  container.showInfoMessage('Message b');
  infobarInnerHTML =
      goog.dom.getElementByClass('bite-console-infobar').innerHTML;
  assertNotNull(infobarInnerHTML.match(/Message a/));
  assertNotNull(infobarInnerHTML.match(/Message b/));
}


function testShowInfoMessageOnce() {
  container = new bite.ux.Container('dev.biteserver.prom.google.com',
                                    'test_console',
                                    'Header',
                                    'Subheader',
                                    false);
  container.showInfoMessageOnce('shown_message', 'Shown before');
  container.showInfoMessageOnce('new_message', 'Never shown before');
  infobarInnerHTML =
      goog.dom.getElementByClass('bite-console-infobar').innerHTML;
  assertNull(infobarInnerHTML.match(/Shown before/));
  assertNotNull(infobarInnerHTML.match(/Never shown before/));
}

