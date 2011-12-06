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
 * @fileoverview This file contains the explore page functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.View');

goog.require('bite.server.Constants');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Helper');
goog.require('bite.server.Page');
goog.require('bite.server.explore.OverviewTab');
goog.require('bite.server.explore.RunTab');
goog.require('bite.server.explore.SetTab');
goog.require('bite.server.explore.Tab');
goog.require('bite.server.templates.explore');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.positioning');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.PopupMenu');



/**
 * A class for view page.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.View = function() {
  bite.server.Page.call(this);

  /**
   * The last selected project name.
   * @type {goog.ui.ComboBox}
   * @private
   */
  this.projectSelector_ = null;

  /**
   * All of the project names.
   * @type {Array}
   * @private
   */
  this.projects_ = [];

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   * @private
   */
  this.layoutHelper_ = null;

  var getProjectName = goog.bind(this.getProjectName, this);

  /**
   * The overview tab in explore page.
   * @type {bite.server.explore.OverviewTab}
   * @private
   */
  this.overviewTab_ = new bite.server.explore.OverviewTab(getProjectName);

  /**
   * The set tab in explore page.
   * @type {bite.server.explore.SetTab}
   * @private
   */
  this.setTab_ = new bite.server.explore.SetTab(getProjectName);

  /**
   * The run tab in explore page.
   * @type {bite.server.explore.RunTab}
   * @private
   */
  this.runTab_ = new bite.server.explore.RunTab(getProjectName);

  /**
   * The selected tab in explore page.
   * @type {bite.server.explore.Tab}
   * @private
   */
  this.selectedTab_ = new bite.server.explore.Tab(getProjectName);

  /**
   * The tab id and instance map.
   * @type {Object}
   * @private
   */
  this.tabNameObjMap_ = {
      'all': this.overviewTab_,
      'suites': this.setTab_,
      'runs': this.runTab_
  };
};
goog.inherits(bite.server.View, bite.server.Page);


/**
 * Inits the page.
 * @param {Object} paramsMap The params map of the url hash.
 * @export
 */
bite.server.View.prototype.init = function(paramsMap) {
  this.layoutHelper_ = bite.server.LayoutHelper.getInstance();
  var baseHeader = goog.dom.getElement('baseHeader');
  var baseView = goog.dom.getElement('baseView');
  soy.renderElement(baseHeader, bite.server.templates.explore.showHeader);
  soy.renderElement(
      baseView,
      bite.server.templates.explore.showBodyArea,
      {'data': {
          'mainNavs': bite.server.Constants.DEFAULT_MAINNAVS_EXPLORE_PAGE}});
  this.renderProjectSelector_();
  var mainNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('mainnav-item'));
  this.handleMainNavChanges_(mainNavs[0].id);

  this.initCreateMenu();
  bite.server.Helper.addListenersToElems(
      mainNavs,
      goog.bind(this.listenToHandleMainNavChanges, this));
};


/**
 * Returns the project name.
 * @return {string} The project name.
 * @export
 */
bite.server.View.prototype.getProjectName = function() {
  if (this.projectSelector_) {
    return this.projectSelector_.getValue();
  } else {
    // TODO(phu): This should be done on server side to choose the
    // user's first project choice.
    return 'BITE';
  }
};


/**
 * Renders the project selector.
 * @private
 */
bite.server.View.prototype.renderProjectSelector_ = function() {
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/project/list',
    {});
  goog.net.XhrIo.send(
      requestUrl,
      goog.bind(this.callbackRenderProjectSelector_, this),
      'POST');
};


/**
 * Callback for Rendering the project selector.
 * @param {Event} e The event object.
 * @private
 */
bite.server.View.prototype.callbackRenderProjectSelector_ = function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);
  if (xhr.isSuccess()) {
    var projects = /** @type {Array} */ (xhr.getResponseJson());
    if (projects) {
      this.projects_ = projects;
      this.projectSelector_ = bite.server.Helper.createSelector(
        projects, 'projectSelector', 'Select a project...');
      this.projectSelector_.setValue('BITE');
    }
  } else {
    throw new Error('Failed to get the projects. Error status: ' +
                    xhr.getStatus());
  }
};


/**
 * Listens to handle main navigation changes.
 * @param {Event} event The event object.
 * @export
 */
bite.server.View.prototype.listenToHandleMainNavChanges = function(event) {
  this.handleMainNavChanges_(event.target.id);
};


/**
 * Handles main navigation changes.
 * @param {string} id The selected main nav's id.
 * @private
 */
bite.server.View.prototype.handleMainNavChanges_ = function(id) {
  var tabTitle = id.substring('mainnav-'.length);
  this.layoutHelper_.handleMainNavChanges(id);
  this.selectedTab_ = this.tabNameObjMap_[tabTitle];
  this.selectedTab_.init();
  this.selectedTab_.setUpLeftNavs();
};


/**
 * Inits the create menu.
 * @export
 */
bite.server.View.prototype.initCreateMenu = function() {
  var button = goog.dom.getElement('createButton');
  var pm = new goog.ui.PopupMenu();
  pm.addChild(new goog.ui.MenuItem('Suite'), true);
  pm.addChild(new goog.ui.MenuItem('Project'), true);
  pm.render(document.body);
  pm.attach(
      button,
      goog.positioning.Corner.BOTTOM_LEFT,
      goog.positioning.Corner.TOP_LEFT);
  goog.events.listen(pm, 'action', function(e) {
    var value = e.target.getValue();
    var url = '';
    switch (value) {
      case 'Suite':
        url = '/home#page=set_details';
        break;
      case 'Project':
        url = '/home#page=project_details';
        break;
    }
    goog.global.window.open(url);
  });
};


/**
 * Destroys this object.
 * @export
 */
bite.server.View.prototype.destroy = function() {
};
