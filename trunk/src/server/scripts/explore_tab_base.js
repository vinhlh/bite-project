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
 * @fileoverview This file contains the tab base class in explore page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.explore.Tab');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.templates.explore');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');


/**
 * A class for tab base in explore page.
 * @param {?function()} getDataFunc The function to get data.
 * @constructor
 * @export
 */
bite.server.explore.Tab = function(getDataFunc) {
  /**
   * The last selected artifact name.
   * @type {string}
   * @private
   */
  this.lastSelectedName_ = '';

  /**
   * The last selected artifact key string.
   * @type {string}
   * @protected
   */
  this.lastSelectedKey = '';

  /**
   * The last selected artifact's type.
   * @type {string}
   * @protected
   */
  this.lastSelectedArtType = '';

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   * @private
   */
  this.layoutHelper_ = bite.server.LayoutHelper.getInstance();


  /**
   * The function to get data.
   * @type {?function()}
   * @protected
   */
  this.getDataFunc = getDataFunc;
};


/**
 * Inits the UI.
 * @export
 */
bite.server.explore.Tab.prototype.init = function() {
};


/**
 * Sets up the left navigations.
 * @export
 */
bite.server.explore.Tab.prototype.setUpLeftNavs = function() {
};


/**
 * Sets the common values when artifact is selected.
 * @param {string} name The selected item name.
 * @param {string} id The selected item id.
 * @param {string} artType The selected item type.
 * @export
 */
bite.server.explore.Tab.prototype.setArtifactValues = function(
    name, id, artType) {
  this.lastSelectedName = name;
  this.lastSelectedKey = id;
  this.lastSelectedArtType = artType;
};


/**
 * Shows the left navs.
 * @param {string} project The project name string.
 * @param {function()} callbackOnSelect The callback function when selected.
 * @param {function()} callbackOnAction The callback for an action.
 * @export
 */
bite.server.explore.Tab.prototype.showLeftNavs = function(
    project, callbackOnSelect, callbackOnAction) {
  var leftNavBar = goog.dom.getElement('leftnav-bar');
  leftNavBar.innerHTML =
      bite.server.templates.explore.showLeftNavs(
          {'data': bite.server.Constants.NAV_DETAILS_MAP[
              this.layoutHelper_.getMainNavId()]});
  var leftNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('leftnav-item'));
  this.layoutHelper_.handleLeftNavChanges(
      leftNavs[0].id,
      bite.server.Constants.DEFAULT_MAINNAVS_EXPLORE_PAGE,
      callbackOnSelect,
      callbackOnAction,
      project);
  bite.server.Helper.addListenersToElems(
      leftNavs,
      goog.bind(this.listenToHandleLeftNavChanges, this,
                callbackOnSelect, callbackOnAction, project));
  goog.dom.getElement('main_content').innerHTML =
      bite.server.templates.explore.showContent(
          {'data': {'artifactHeader': bite.server.Constants.NAV_DETAILS_MAP[
              this.layoutHelper_.getMainNavId()]}});
};


/**
 * Listens to handle left navigation changes.
 * @param {function()} callbackOnSelect The callback function when selected.
 * @param {function()} callbackOnAction The callback for an action.
 * @param {string} project The project name string.
 * @param {Event} event The event object.
 * @export
 */
bite.server.explore.Tab.prototype.listenToHandleLeftNavChanges = function(
  callbackOnSelect, callbackOnAction, project, event) {
  this.layoutHelper_.handleLeftNavChanges(
      event.target.id,
      bite.server.Constants.DEFAULT_MAINNAVS_EXPLORE_PAGE,
      callbackOnSelect,
      callbackOnAction,
      project);
};


/**
 * Gets the details info for the given run key.
 * @param {string} run_key_str The specified run's key string.
 * @export
 */
bite.server.explore.Tab.prototype.getDetailsInfo = function(run_key_str) {
  var requestUrl = bite.server.Helper.getUrl(
      '',
      '/run/get_details',
      {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'runKey': run_key_str}).toString();
  var that = this;
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      var details = null;
      var details_obj = this.getResponseJson();
      if (details_obj) {
        details = details_obj['details'];
      } else {
        alert('Failed to get associated run info.');
      }
      that.updateDetailsInfo(details);
    } else {
      throw new Error('Failed to get the details. Error status: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
};


/**
 * Updates the details info for the given run key.
 * @param {Object} details The specified run's details info.
 * @export
 */
bite.server.explore.Tab.prototype.updateDetailsInfo = function(details) {
  var getE = goog.dom.getElement;
  getE('main_preview').innerHTML = bite.server.templates.explore.showPreview();
  getE('detailCompleted').innerHTML = details['completed_str'];
  getE('detailPassed').innerHTML = details['passed_str'];
  getE('detailFailed').innerHTML = details['failed_str'];
  getE('detailDuration').innerHTML = details['elapsed_time_str'];
  getE('detailStartTime').innerHTML = details['start_time_str'];
  getE('detailLead').innerHTML = details['run_lead'];
  bite.server.Helper.drawBarChart(details['passed_num'],
                                  details['failed_num'],
                                  details['uncompleted_num']);
  getE('detailsPanel').style.display = 'block';
};
