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
 * @fileoverview This file contains the details page's runs tab.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.set.Runs');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.explore.RunTab');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.SetRuns');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');



/**
 * A class for the runs tab in the set page.
 * @param {function():Object} getInfoFunc The getter for set's info.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.set.Runs = function(getInfoFunc) {
  /**
   * A function to get the selected item's info.
   * @type {function():Object}
   * @private
   */
  this.getInfoFunc_ = getInfoFunc;

  /**
   * The instance of bite.server.explore.RunTab.
   * @type {bite.server.explore.RunTab}
   * @private
   */
  this.testsExploreRunHelper_ = new bite.server.explore.RunTab(
      goog.bind(this.getProjectName_, this));
};
goog.inherits(bite.server.set.Runs, bite.server.set.Tab);


/**
 * Inits the setting's overview page.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.set.Runs.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML = bite.server.templates.details.SetRuns.showTabRuns(
      {'data': bite.server.Constants.DETAILS_RUNS_LEFT_NAVIGATION});
  var leftNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('kd-sidebarlistitem'));
  bite.server.Helper.addListenersToElems(
      leftNavs,
      goog.bind(this.listenFilterRuns, this));
  this.filterRuns('all', goog.dom.getElement('all'));
};


/**
 * Gets the project name.
 * @return {string} The project name.
 * @private
 */
bite.server.set.Runs.prototype.getProjectName_ = function() {
  return this.getInfoFunc_()['projectName'];
};


/**
 * Listens to select a choice to filter the runs.
 * @param {Object} event The event object.
 * @export
 */
bite.server.set.Runs.prototype.listenFilterRuns = function(event) {
  this.filterRuns(event.currentTarget.id, event.currentTarget);
};


/**
 * Selects a choice to filter the runs.
 * @param {string} filter The filter choice.
 * @param {Element} elem The filter element was clicked.
 * @export
 */
bite.server.set.Runs.prototype.filterRuns = function(filter, elem) {
  goog.dom.getElement('main_preview').innerHTML = '';
  bite.server.Helper.updateSelectedCss(
      elem, 'kd-sidebarlistitem',
      'kd-sidebarlistitem selected');
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/run/same_suite',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'suiteKey': this.getInfoFunc_()['suiteKey'],
       'suiteName': this.getInfoFunc_()['suiteName'],
       'projectName': this.getInfoFunc_()['projectName'],
       'filter': filter}).toString();
  goog.net.XhrIo.send(
      requestUrl,
      goog.bind(this.filterRunsCallback_, this),
      'POST',
      parameters);
  bite.server.Helper.displayMessage('Loading runs...', 30 * 1000);
};


/**
 * Callback after selecting a choice to filter the runs.
 * @param {Event} event The event object.
 * @private
 */
bite.server.set.Runs.prototype.filterRunsCallback_ = function(event) {
  var xhr = /** @type {goog.net.XhrIo} */ (event.target);
  if (xhr.isSuccess()) {
    var runs_obj = xhr.getResponseJson();
    if (runs_obj) {
      goog.dom.getElement('filteredRuns').innerHTML =
          bite.server.templates.details.SetRuns.showFilteredRuns(runs_obj);
      var dataRows = /** @type {Array} */
          (goog.dom.getElementsByClass('data-row'));
      var layoutHelper = bite.server.LayoutHelper.getInstance();
      bite.server.Helper.addListenersToElems(
          dataRows,
          goog.bind(layoutHelper.selectArtifact,
                    layoutHelper,
                    goog.bind(this.testsExploreRunHelper_.onArtifactSelected,
                              this.testsExploreRunHelper_)));
      var dataActions = /** @type {Array} */
          (goog.dom.getElementsByClass('data-action'));
      bite.server.Helper.addListenersToElems(
          dataActions,
          goog.bind(
              this.testsExploreRunHelper_.handleUserOperation,
              this.testsExploreRunHelper_));
    }
    bite.server.Helper.dismissMessage();
  } else {
    throw new Error('Failed to get the runs. Error status: ' +
                    xhr.getStatus());
  }
};
