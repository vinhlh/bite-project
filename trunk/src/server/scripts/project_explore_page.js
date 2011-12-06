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


goog.provide('bite.server.Project');

goog.require('bite.project.Explore');
goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.LayoutHelper');
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
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.PopupMenu');



/**
 * A class for the server Project page.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.Project = function() {
  goog.base(this);

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   * @private
   */
  this.layoutHelper_ = null;

  /**
   * The project tab in project explore page.
   * @type {bite.project.Explore}
   * @private
   */
  this.projectTab_ = new bite.project.Explore();

  /**
   * The selected tab in explore page.
   * @type {bite.server.explore.Tab}
   * @private
   */
  this.selectedTab_ = new bite.server.explore.Tab(null);

  /**
   * The event listener's key.
   * @type {?number}
   * @private
   */
  this.createbtnLtnKey_ = 0;
};
goog.inherits(bite.server.Project, bite.server.Page);


/**
 * Inits the page.
 * @param {Object} paramsMap The params map of the url hash.
 * @export
 */
bite.server.Project.prototype.init = function(paramsMap) {
  this.layoutHelper_ = bite.server.LayoutHelper.getInstance();
  var baseHeader = goog.dom.getElement('baseHeader');
  var baseView = goog.dom.getElement('baseView');
  soy.renderElement(baseHeader, bite.server.templates.explore.showHeader);
  soy.renderElement(
      baseView,
      bite.server.templates.explore.showBodyArea,
      {'data': {
          'mainNavs': bite.server.Constants.MAINNAVS_PROJECT_EXPLORE_PAGE}});
  var mainNavs = /** @type {Array} */
      (goog.dom.getElementsByClass('mainnav-item'));
  this.layoutHelper_.handleMainNavChanges(mainNavs[0].id);

  var explore = bite.project.Explore.getInstance();
  explore.init();
  goog.dom.appendChild(goog.dom.getElement('main_content'), explore.getView());
  goog.dom.getElement('createButton').innerHTML = 'New Project';
  this.createbtnLtnKey_ = goog.events.listen(
      goog.dom.getElement('createButton'),
      'click',
      goog.bind(this.createNewProject_, this));
};


/**
 * Creates a new project.
 * @private
 */
bite.server.Project.prototype.createNewProject_ = function() {
  var paramsBag = {};
  paramsBag['page'] = 'project_details';
  goog.global.window.open(bite.server.Helper.getUrlHash(
      '', '/home', paramsBag));
};


/**
 * Destroys this object.
 * @export
 */
bite.server.Project.prototype.destroy = function() {
};
