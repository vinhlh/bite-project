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
 * @fileoverview This file is the entry point of the client scripts, which
 * parses the url and perform accordingly.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.UrlParser');

goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Page');
goog.require('bite.server.Project');
goog.require('bite.server.ProjectDetails');
goog.require('bite.server.Result');
goog.require('bite.server.Run');
goog.require('bite.server.Set');
goog.require('bite.server.View');
goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.string');



/**
 * A class for initializing layouts.
 * @constructor
 * @export
 */
bite.server.UrlParser = function() {
  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   */
  this.layoutHelper = null;

  /**
   * The selected page object.
   * @type {bite.server.Page}
   */
  this.selectedPage = new bite.server.Page();
};
goog.addSingletonGetter(bite.server.UrlParser);


/**
 * Inits the layout based on the params.
 * @export
 */
bite.server.UrlParser.prototype.init = function() {
  this.layoutHelper = bite.server.LayoutHelper.getInstance();
  this.layoutHelper.init();
  this.parseLayout();
  goog.events.listen(
      goog.global.window,
      goog.events.EventType.HASHCHANGE,
      goog.bind(this.parseLayout, this, null));
};


/**
 * Parses and inits the layouts.
 * @param {string=} opt_fragment The optional fragment.
 * @export
 */
bite.server.UrlParser.prototype.parseLayout = function(opt_fragment) {
  var fragment = opt_fragment ||
                 (new goog.Uri(goog.global.window.location.href)).getFragment();
  var paramsMap = new goog.Uri.QueryData(fragment);
  if (paramsMap.containsKey('page')) {
    this.layoutHelper.clearStatus();
    this.selectedPage.destroy();
    switch (paramsMap.get('page')) {
      case 'explore':
        this.selectedPage = new bite.server.View();
        break;
      case 'set_details':
        this.selectedPage = new bite.server.Set();
        break;
      case 'run_details':
        this.selectedPage = new bite.server.Run();
        break;
      case 'project_explore':
        this.selectedPage = new bite.server.Project();
        break;
      case 'project_details':
        this.selectedPage = new bite.server.ProjectDetails();
        break;
      case 'result':
        this.selectedPage = new bite.server.Result();
        break;
    }
    this.selectedPage.init(paramsMap);
  }
};
