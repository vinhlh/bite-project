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
 * @fileoverview This file contains the overview tab class in explore page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.explore.OverviewTab');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.explore.Tab');
goog.require('bite.server.templates.explore');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');



/**
 * A class for the overview tab in explore page.
 * @param {function()} getDataFunc The function to get data.
 * @extends {bite.server.explore.Tab}
 * @constructor
 * @export
 */
bite.server.explore.OverviewTab = function(getDataFunc) {
  goog.base(this, getDataFunc);

  /**
   * The function to get data.
   * @type {function()}
   * @protected
   */
  this.getDataFunc = getDataFunc;
};
goog.inherits(bite.server.explore.OverviewTab, bite.server.explore.Tab);


/**
 * Inits the UI.
 * @export
 */
bite.server.explore.OverviewTab.prototype.init = function() {
  goog.base(this, 'init');
};


/**
 * Sets up the left navigations.
 * @export
 */
bite.server.explore.OverviewTab.prototype.setUpLeftNavs = function() {
  this.showLeftNavs(
      this.getDataFunc(),
      goog.bind(/** @type {function()} */ (this.onArtifactSelected), this),
      goog.bind(/** @type {function()} */ (this.handleUserOperation), this));
};


/**
 * Callback funtion when an artifact was selected.
 * @param {string} name The selected item name.
 * @param {string} id The selected item id.
 * @param {string} artType The selected item type.
 * @export
 */
bite.server.explore.OverviewTab.prototype.onArtifactSelected = function(
    name, id, artType) {
  this.setArtifactValues(name, id, artType);
};


/**
 * Handles the operation triggered by user.
 * @param {Event} event The event object.
 * @export
 */
bite.server.explore.OverviewTab.prototype.handleUserOperation = function(
    event) {
  var operationValue = event.target.id;
  var page = '';
  var keyType = '';
  switch (this.lastSelectedArtType) {
    case 'project':
      page = 'project_details';
      keyType = 'projectKey';
      break;
    case 'set':
      page = 'set_details';
      keyType = 'suiteKey';
      break;
    case 'run':
      page = 'run_details';
      keyType = 'runKey';
      break;
    case 'runTemplate':
      page = 'run_details';
      keyType = 'runTemplateKey';
      break;
    default:
      page = 'notSupported';
  }
  var keyValue = this.lastSelectedKey;
  var paramsBag = {};
  paramsBag['page'] = page;
  paramsBag[keyType] = keyValue;
  if (operationValue == 'viewDetails') {
    goog.global.window.open(bite.server.Helper.getUrlHash(
        '', '/home', paramsBag));
  }
};
