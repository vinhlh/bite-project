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
 * @fileoverview Defines a background script stub used for testing the project
 * subsystem in a standalone fashion.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.BackgroundTest');

goog.require('bite.project.Background');


/**
 * Handler is called when the extension icon is pressed.  The function will
 * send a message to the injected content script notifying it of the action.
 * @param {Tab} tab The currently selected tab when the extension icon is
 *     pressed.
 */
bite.project.BackgroundTest.onBrowserAction = function(tab) {
  if (!tab || !tab.id) {
    return;
  }

  var msg = {
    'owner': 'bite.project',
    'action': 'turn-on'
  };

  chrome.tabs.sendRequest(tab.id, msg);
};

chrome.browserAction.onClicked.addListener(
    bite.project.BackgroundTest.onBrowserAction);

