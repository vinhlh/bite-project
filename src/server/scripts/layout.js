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
 * @fileoverview This file contains the layout functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.LayoutHelper');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.templates.explore');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');



/**
 * A class for initializing layouts.
 * @constructor
 * @export
 */
bite.server.LayoutHelper = function() {
  /**
   * The main navigation id.
   * @type {string}
   * @private
   */
  this.mainNavId_ = '';

  /**
   * The left navigation id.
   * @type {string}
   * @private
   */
  this.leftNavId_ = '';

  /**
   * The selected artifact.
   * @type {Element}
   * @private
   */
  this.selectedArtifact_ = null;
};
goog.addSingletonGetter(bite.server.LayoutHelper);


/**
 * Inits the layout based on the params.
 * @export
 * @suppress {missingProperties} google.load
 */
bite.server.LayoutHelper.prototype.init = function() {
  google.load('visualization', '1', {packages: ['corechart',
                                                'imagechart']});
  soy.renderElement(
      goog.dom.getElement('topRow'),
      bite.server.templates.explore.showPageTopRow,
      {'data': {'topnavs': bite.server.Constants.TOP_NAV_DEFAULT_DATA}});
  var topNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('topnav-item'));
  if (topNavs.length > 0) {
    this.handleTopNavChanges(topNavs[0].id);
    bite.server.Helper.addListenersToElems(
        topNavs,
        goog.bind(this.listenToHandleTopNavChanges, this));
  }
  this.fetchLoginCredential_();
};


/**
 * Gets the login credentials.
 * @private
 */
bite.server.LayoutHelper.prototype.fetchLoginCredential_ = function() {
  var requestUrl = bite.server.Helper.getUrl(
      '',
      '/check_login_status',
      {});
  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var result = xhr.getResponseJson();
      var userDiv = goog.dom.getDocument().querySelector('.topnav-username');
      userDiv.innerText = result['user'];
    } else {
      throw new Error('Failed to get the login credentials: ' +
                      xhr.getStatus());
    }
  }, this), 'GET');
};


/**
 * Gets the mainnav id.
 * @export
 */
bite.server.LayoutHelper.prototype.getMainNavId = function() {
  return this.mainNavId_;
};


/**
 * Listens to handle top navigation changes.
 * @param {Event} event The event object.
 * @export
 */
bite.server.LayoutHelper.prototype.listenToHandleTopNavChanges = function(
    event) {
  this.handleTopNavChanges(event.target.id);
};


/**
 * Handles top navigation changes.
 * @param {string} id The top nav's id.
 * @export
 */
bite.server.LayoutHelper.prototype.handleTopNavChanges = function(id) {
  this.topNavId = id.substring('topnav-'.length);
  bite.server.Helper.updateSelectedCss(
      goog.dom.getElement(id),
      'topnav-item',
      'topnav-item topnav-item-selected');
  var newHref = bite.server.Helper.getValueInArray(
      bite.server.Constants.TOP_NAV_DEFAULT_DATA,
      'name', this.topNavId, 'href');
  if (newHref) {
    goog.global.window.location.href = /** @type {string} */ (newHref);
  }
};


/**
 * Handles main navigation changes.
 * @param {string} id The main nav's id.
 * @export
 */
bite.server.LayoutHelper.prototype.handleMainNavChanges = function(id) {
  this.mainNavId_ = id.substring('mainnav-'.length);
  bite.server.Helper.updateSelectedCss(
      goog.dom.getElement(id),
      'mainnav-item',
      'mainnav-item mainnav-item-selected');
};


/**
 * Handles left navigation changes.
 * @param {string} id The left nav id.
 * @param {Object} mainNavInfo The main nav info map.
 * @param {function()} callbackOnSelect The callback function when selected.
 * @param {function()} callbackOnAction The callback for an action.
 * @param {string} project The project name string.
 * @export
 */
bite.server.LayoutHelper.prototype.handleLeftNavChanges = function(
    id, mainNavInfo, callbackOnSelect, callbackOnAction, project) {
  this.leftNavId_ = id.substring('leftnav-'.length);
  bite.server.Helper.updateSelectedCss(
      goog.dom.getElement(id),
      'leftnav-item',
      'leftnav-item leftnav-item-selected');
  var handler = '';
  for (var i = 0, len = mainNavInfo.length; i < len; i++) {
    if (mainNavInfo[i]['name'] == this.mainNavId_) {
      handler = mainNavInfo[i]['path'];
    }
  }
  var requestUrl = bite.server.Helper.getUrl(
      '',
      handler,
      {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'filter': this.leftNavId_,
       'projectName': project}).toString();
  var that = this;
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      var details = null;
      var details_obj = this.getResponseJson();
      if (details_obj) {
        details = details_obj['details'];
        goog.dom.getElement('artifactItems').innerHTML =
            bite.server.templates.explore.showArtifactContent(
                {'data': {'artifacts': details}});
        var dataRows = /** @type {Array} */
            (goog.dom.getElementsByClass('data-row'));
        bite.server.Helper.addListenersToElems(
            dataRows,
            goog.bind(that.selectArtifact, that, callbackOnSelect));
        var dataActions = /** @type {Array} */
            (goog.dom.getElementsByClass('data-action'));
        bite.server.Helper.addListenersToElems(
            dataActions,
            callbackOnAction);
      } else {
        alert('Failed to get associated results info.');
      }
    } else {
      throw new Error('Failed to get the results. Error status: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
  this.clearMainArea();
};


/**
 * Clears the preview view.
 * @export
 */
bite.server.LayoutHelper.prototype.clearPreview = function() {
  var detailsPanel = goog.dom.getElement('detailsPanel');
  if (detailsPanel) {
    detailsPanel.style.display = 'none';
  }
};


/**
 * Clears the main view.
 * @export
 */
bite.server.LayoutHelper.prototype.clearMainArea = function() {
  this.selectedArtifact_ = null;
  this.clearPreview();
};


/**
 * Unselects an artifact.
 * @param {Element} target The element that was selected.
 * @export
 */
bite.server.LayoutHelper.prototype.unselectArtifact = function(target) {
  if (!target) {
    return;
  }
  goog.dom.setProperties(this.selectedArtifact_, {'class': 'data-row'});
  var moreContent = goog.dom.getElement(target.id + 'more');
  if (moreContent) {
    goog.dom.setProperties(moreContent, {'style': 'display: none'});
  }
  this.selectedArtifact_ = null;
};


/**
 * Selects an artifact.
 * @param {Function} callback The callback function.
 * @param {Object} event The event object.
 * @export
 */
bite.server.LayoutHelper.prototype.selectArtifact = function(
    callback, event) {
  var target = event.currentTarget;
  if (this.selectedArtifact_ == target) {
    this.unselectArtifact(null);
    return;
  }
  var id = target.id.split('_')[1];
  var artType = target.id.split('_')[0].substring('artifact'.length);
  var name = target.getAttribute('name');
  if (callback) {
    callback(name, id, artType);
  }
  if (this.selectedArtifact_) {
    this.unselectArtifact(this.selectedArtifact_);
  }
  this.selectedArtifact_ = target;
  goog.dom.setProperties(target, {'class': 'data-row data-row-selected'});

  var moreContent = goog.dom.getElement(target.id + 'more');
  goog.dom.setProperties(moreContent, {'style': 'display: block'});
};


/**
 * Clears the status.
 * @export
 */
bite.server.LayoutHelper.prototype.clearStatus = function() {
  this.mainNavId_ = '';
  this.leftNavId_ = '';
  this.selectedArtifact_ = null;
};

