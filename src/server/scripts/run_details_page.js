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
 * @fileoverview This file contains the Run's details page class.
 * TODO(phu): Move the tab related logic to its parent class.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('bite.server.Run');

goog.require('bite.server.Constants');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Page');
goog.require('bite.server.Helper');
goog.require('bite.server.run.Overview');
goog.require('bite.server.run.Settings');
goog.require('bite.server.run.Results');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.RunPage');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.CustomButton');



/**
 * A class for run's details page.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.Run = function() {
  /**
   * The current Run's key string.
   * @type {string}
   * @private
   */
  this.runKey_ = '';

  /**
   * The current Set's key string.
   * @type {string}
   * @private
   */
  this.setKey_ = '';

  /**
   * The current Set's name string.
   * @type {string}
   * @private
   */
  this.setName_ = '';

  /**
   * The current Run template's key string.
   * @type {string}
   * @private
   */
  this.runTemplateKey_ = '';

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   */
  this.layoutHelper = null;

  var getRunKeyFunc = goog.bind(this.getRunKey, this);

  /**
   * The currently selected tab.
   * @type {bite.server.set.Tab}
   */
  this.selectedTab = new bite.server.set.Tab(getRunKeyFunc);

  /**
   * The overview tab.
   * @type {bite.server.run.Overview}
   */
  this.overviewTab = new bite.server.run.Overview(getRunKeyFunc);

  /**
   * The results tab.
   * @type {bite.server.run.Results}
   */
  this.resultsTab = new bite.server.run.Results(getRunKeyFunc);

  /**
   * The settings tab.
   * @type {bite.server.run.Settings}
   */
  this.settingsTab = new bite.server.run.Settings(getRunKeyFunc);

  /**
   * The tab id and instance map.
   * @type {Object}
   */
  this.tabNameObjMap = {
      'overview': this.overviewTab,
      'results': this.resultsTab,
      'settings': this.settingsTab
  };
};
goog.inherits(bite.server.Run, bite.server.Page);


/**
 * Inits the setting page.
 * @param {Object} paramsMap The params map of the url hash.
 * @export
 */
bite.server.Run.prototype.init = function(paramsMap) {
  this.layoutHelper = bite.server.LayoutHelper.getInstance();
  var baseHeader = goog.dom.getElement('baseHeader');
  var baseView = goog.dom.getElement('baseView');
  baseHeader.innerHTML =
      bite.server.templates.details.RunPage.showHeader();
  baseView.innerHTML = bite.server.templates.details.RunPage.showBodyArea();
  this.parseParams(paramsMap);
  this.selectedTab = this.tabNameObjMap['results'];
  this.selectedTab.init(goog.dom.getElement('setTabDetailDiv'));
};


/**
 * Gets the set's key.
 * @export
 */
bite.server.Run.prototype.getRunKey = function() {
  return this.runKey_;
};


/**
 * Parses the given params and perform accordingly.
 * @param {Object} paramsMap The params map.
 * @export
 */
bite.server.Run.prototype.parseParams = function(paramsMap) {
  var runKey = paramsMap.get('runKey') || '';
  var setKey = paramsMap.get('setKey') || '';
  var setName = paramsMap.get('setName') || '';
  var runTemplateKey = paramsMap.get('runTemplateKey') || '';
  this.runKey_ = runKey;
  this.setKey_ = setKey;
  this.setName_ = setName;
  this.runTemplateKey_ = runTemplateKey;
  if (runKey || runTemplateKey) {
    this.loadRunFromServer(runKey, runTemplateKey)
  }
};


/**
 * Renders the save button.
 * @export
 */
bite.server.Run.prototype.renderSaveButton = function() {
  var saveButtonDiv = goog.dom.getElement('saveRunButton');
  var button = new goog.ui.CustomButton('Save');
  button.render(saveButtonDiv);
  var that = this;
  goog.events.listen(button, goog.ui.Component.EventType.ACTION,
    function(e) {
      that.saveRunToServer();
    });
};


/**
 * Loads the run info from server.
 * @param {string} runKey The run key string.
 * @param {string} runTemplateKey The run template key string.
 * @export
 */
bite.server.Run.prototype.loadRunFromServer = function(
    runKey, runTemplateKey) {
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/run/load_template',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'runKey': runKey,
       'runTemplateKey': runTemplateKey}).toString();
  var that = this;
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      var run = this.getResponseJson();
      that.runKey_ = run['runKey'];
      that.runTemplateKey_ = run['runTemplateKey'];
      for (var tab in that.tabNameObjMap) {
        that.tabNameObjMap[tab].setProperties(run);
      }
      that.loadSetting();
    } else {
      throw new Error('Failed to get the Run template: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
};


/**
 * Saves the run info to server.
 * @export
 */
bite.server.Run.prototype.saveRunToServer = function() {
  this.saveSetting();
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/run/add_template',
    {});
  var paramsMap = {
      'suiteKey': this.setKey_,
      'runTemplateKey': this.runTemplateKey_};
  for (var tab in this.tabNameObjMap) {
    this.tabNameObjMap[tab].addProperties(paramsMap);
  }
  var parameters = goog.Uri.QueryData.createFromMap(paramsMap).toString();
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      alert(this.getResponseText());
    } else {
      throw new Error('Failed to save the run templates to server: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
};


/**
 * Saves the previous page settings.
 * @export
 */
bite.server.Run.prototype.saveSetting = function() {
  this.selectedTab.saveSetting();
};


/**
 * Loads the page's settings.
 * @export
 */
bite.server.Run.prototype.loadSetting = function() {
  this.selectedTab.loadSetting();
};


/**
 * Listens to show the specified run's tab.
 * @param {Object} event The event object.
 * @export
 */
bite.server.Run.prototype.listenToShowRunTab = function(event) {
  this.layoutHelper.handleMainNavChanges(event.target.id);
  this.showRunTab(event.target);
};


/**
 * Shows the specified run's tab.
 * @param {Element} elem The clicked elem.
 * @export
 */
bite.server.Run.prototype.showRunTab = function(elem) {
  this.selectedTab.saveSetting();
  var tabDetailsDiv = goog.dom.getElement('setTabDetailDiv');
  var tabTitle = elem.id.substring('mainnav-'.length);
  this.selectedTab = this.tabNameObjMap[tabTitle];
  this.selectedTab.init(tabDetailsDiv);
};


/**
 * Destroys this object.
 * @export
 */
bite.server.Run.prototype.destroy = function() {
};
