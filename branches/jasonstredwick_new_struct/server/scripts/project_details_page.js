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
 * @fileoverview This file contains the Project's details page class.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('bite.server.ProjectDetails');

goog.require('bite.project.General');
goog.require('bite.project.Member');
goog.require('bite.project.Settings');
goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Page');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.ProjectPage');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.CustomButton');



/**
 * A class for Project's details page.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.ProjectDetails = function() {
  goog.base(this);

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   * @private
   */
  this.layoutHelper_ = null;

  /**
   * The currently selected tab.
   * @type {Object}
   * @private
   */
  this.selectedTab_ = null;

  /**
   * The general tab.
   * @type {bite.project.General}
   * @private
   */
  this.generalTab_ = bite.project.General.getInstance();

  /**
   * The results tab.
   * @type {bite.project.Member}
   * @private
   */
  this.memberTab_ = bite.project.Member.getInstance();

  /**
   * The settings tab.
   * @type {bite.project.Settings}
   * @private
   */
  this.settingsTab_ = bite.project.Settings.getInstance();

  /**
   * The tab id and instance map.
   * @type {Object}
   * @private
   */
  this.tabNameObjMap_ = {
      'general': this.generalTab_,
      'members': this.memberTab_,
      'settings': this.settingsTab_
  };
};
goog.inherits(bite.server.ProjectDetails, bite.server.Page);


/**
 * Inits the setting page.
 * @param {Object} paramsMap The params map of the url hash.
 * @export
 */
bite.server.ProjectDetails.prototype.init = function(paramsMap) {
  this.layoutHelper_ = bite.server.LayoutHelper.getInstance();
  var baseHeader = goog.dom.getElement('baseHeader');
  var baseView = goog.dom.getElement('baseView');
  baseHeader.innerHTML =
      bite.server.templates.details.ProjectPage.showHeader();
  baseView.innerHTML = bite.server.templates.details.ProjectPage.showBodyArea(
    {'data': {
        'mainNavs': bite.server.Constants.DEFAULT_MAINNAVS_PROJECT_DETAILS_PAGE
     }
    });
  this.renderSaveButton();
  var mainNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('mainnav-item'));
  this.handleShowRunTab_(mainNavs[0]);
  bite.server.Helper.addListenersToElems(
      mainNavs,
      goog.bind(this.listenToShowRunTab_, this));
  this.parseParams(paramsMap);
};


/**
 * Parses the given params and perform accordingly.
 * @param {Object} paramsMap The params map.
 * @export
 */
bite.server.ProjectDetails.prototype.parseParams = function(paramsMap) {
//  var runKey = paramsMap.get('runKey');
//  runKey = runKey ? runKey : '';
//  var setKey = paramsMap.get('setKey');
//  setKey = setKey ? setKey : '';
//  var setName = paramsMap.get('setName');
//  setName = setName ? setName : '';
//  var runTemplateKey = paramsMap.get('runTemplateKey');
//  runTemplateKey = runTemplateKey ? runTemplateKey : '';
//  this.runKey_ = runKey;
//  this.setKey_ = setKey;
//  this.setName_ = setName;
//  this.runTemplateKey_ = runTemplateKey;
//  this.showRunTab(goog.dom.getElementsByClass('mainnav-item')[0]);
//  if (runKey || runTemplateKey) {
//    this.loadRunFromServer(runKey, runTemplateKey)
//  }
};


/**
 * Renders the save button.
 * @export
 */
bite.server.ProjectDetails.prototype.renderSaveButton = function() {
  var saveButtonDiv = goog.dom.getElement('saveProjectButton');
  var button = new goog.ui.CustomButton('Save');
  button.render(saveButtonDiv);
  var that = this;
  goog.events.listen(button, goog.ui.Component.EventType.ACTION,
    function(e) {
      that.saveProjectToServer();
    });
};


/**
 * Loads the run info from server.
 * @param {string} runKey The run key string.
 * @param {string} runTemplateKey The run template key string.
 * @export
 */
bite.server.ProjectDetails.prototype.loadProjectFromServer = function(
    runKey, runTemplateKey) {
};


/**
 * Saves the run info to server.
 * @export
 */
bite.server.ProjectDetails.prototype.saveProjectToServer = function() {
};


/**
 * Saves the previous page settings.
 * @export
 */
bite.server.ProjectDetails.prototype.saveSetting = function() {
};


/**
 * Loads the page's settings.
 * @export
 */
bite.server.ProjectDetails.prototype.loadSetting = function() {
};


/**
 * Listens to show the specified run's tab.
 * @param {Object} event The event object.
 * @private
 */
bite.server.ProjectDetails.prototype.listenToShowRunTab_ = function(event) {
  this.handleShowRunTab_(event.target);
};


/**
 * Handles show the specified project's tab.
 * @param {Element} elem The tab's element.
 * @private
 */
bite.server.ProjectDetails.prototype.handleShowRunTab_ = function(elem) {
  this.layoutHelper_.handleMainNavChanges(elem.id);
  this.showRunTab(elem);
};


/**
 * Shows the specified run's tab.
 * @param {Element} elem The clicked elem.
 * @export
 */
bite.server.ProjectDetails.prototype.showRunTab = function(elem) {
  var tabDetailsDiv = goog.dom.getElement('setTabDetailDiv');
  var tabTitle = elem.id.substring('mainnav-'.length);
  this.selectedTab_ = this.tabNameObjMap_[tabTitle];
  this.selectedTab_.init();
  goog.dom.getElement('setTabDetailDiv').innerHTML = '';
  goog.dom.appendChild(
      goog.dom.getElement('setTabDetailDiv'),
      this.selectedTab_.getView());
};


/**
 * Destroys this object.
 * @export
 */
bite.server.ProjectDetails.prototype.destroy = function() {
};
