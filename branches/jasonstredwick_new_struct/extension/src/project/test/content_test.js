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
 * @fileoverview Defines a content script stub used for testing the project
 * subsystem in a standalone fashion.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.project.ContentTest');

goog.require('bite.project.Content');
goog.require('goog.dom');
goog.require('goog.dom.TagName');


/**
 * @constructor
 * @export
 */
bite.project.ContentTest = function() {};


/**
 * @export
 */
bite.project.ContentTest.init = function() {
  var content = bite.project.Content.getInstance();
  content.init('/');

  var explore = content.getView(bite.project.Content.viewId.EXPLORE);
  var general = content.getView(bite.project.Content.viewId.GENERAL);
  var member = content.getView(bite.project.Content.viewId.MEMBER);
  var settings = content.getView(bite.project.Content.viewId.SETTINGS);

  if (!explore || !general || !member || !settings) {
    return;
  }

  goog.dom.appendChild(goog.dom.getDocument().body, explore);
  goog.dom.appendChild(goog.dom.getDocument().body, general);
  goog.dom.appendChild(goog.dom.getDocument().body, member);
  goog.dom.appendChild(goog.dom.getDocument().body, settings);
};

