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
 * @fileoverview This file contains the Set's details page class.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('bite.server.Set');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Page');
goog.require('bite.server.set.Overview');
goog.require('bite.server.set.Runs');
goog.require('bite.server.set.Settings');
goog.require('bite.server.set.Tab');
goog.require('bite.server.set.Tests');
goog.require('bite.server.templates.details');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.CustomButton');



/**
 * A class for set functions.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.Set = function() {
  /**
   * The Set's name.
   * @type {string}
   */
  this.name = '';

  /**
   * The current Set's key string.
   * @type {string}
   */
  this.suiteKey = '';

  /**
   * The current project name.
   * @type {string}
   * @private
   */
  this.projectName_ = '';

  /**
   * The layout helper object.
   * @type {bite.server.LayoutHelper}
   */
  this.layoutHelper = null;

  /**
   * A function used to get the Set's key string.
   * @type {function():Object}
   */
  var getSetInfoFunc = goog.bind(this.getSetInfo_, this);

  /**
   * The currently selected tab.
   * @type {bite.server.set.Tab}
   */
  this.selectedTab = new bite.server.set.Tab(getSetInfoFunc);

  /**
   * The overview tab.
   * @type {bite.server.set.Tab}
   */
  this.overviewTab = new bite.server.set.Overview(getSetInfoFunc);

  /**
   * The runs tab.
   * @type {bite.server.set.Runs}
   */
  this.runsTab = new bite.server.set.Runs(getSetInfoFunc);

  /**
   * The settings tab.
   * @type {bite.server.set.Settings}
   */
  this.settingsTab = new bite.server.set.Settings(getSetInfoFunc);

  /**
   * The tests tab.
   * @type {bite.server.set.Tests}
   */
  this.testsTab = new bite.server.set.Tests(getSetInfoFunc);

  /**
   * The tab id and instance map.
   * @type {Object}
   */
  this.tabNameObjMap = {
      'overview': this.overviewTab,
      'runs': this.runsTab,
      'settings': this.settingsTab,
      'tests': this.testsTab
  };
};
goog.inherits(bite.server.Set, bite.server.Page);


/**
 * Inits the setting page.
 * @param {goog.Uri.QueryData} paramsMap The params map of the url hash.
 * @export
 */
bite.server.Set.prototype.init = function(paramsMap) {
  this.layoutHelper = bite.server.LayoutHelper.getInstance();
  var baseView = goog.dom.getElement('baseView');
  baseView.innerHTML = bite.server.templates.details.showBodyArea();
  this.parseParams_(paramsMap);
  this.selectedTab = this.tabNameObjMap['runs'];
  this.selectedTab.init(goog.dom.getElement('setTabDetailDiv'));
};


/**
 * Gets the set's info.
 * @return {Object} The set's info.
 * @private
 */
bite.server.Set.prototype.getSetInfo_ = function() {
  return {'suiteKey': this.suiteKey,
          'suiteName': this.name,
          'projectName': this.projectName_};
};


/**
 * Parses the given params and performs accordingly.
 * @param {goog.Uri.QueryData} paramsMap The params map.
 * @private
 */
bite.server.Set.prototype.parseParams_ = function(paramsMap) {
  var projectName = paramsMap.get('projectName');
  this.projectName_ = projectName ? /** @type {string} */ (projectName) : '';
  var suiteName = paramsMap.get('suiteName');
  this.name = suiteName ? /** @type {string} */ (suiteName) : '';
  var suiteKey = paramsMap.get('suiteKey');
  this.suiteKey = suiteKey ? /** @type {string} */ (suiteKey) : '';
  if (this.projectName_ && this.name || this.suiteKey) {
    this.loadSuiteFromServer(this.projectName_, this.name, this.suiteKey);
  }
};


/**
 * Renders the save button.
 * @private
 */
bite.server.Set.prototype.renderSaveButton_ = function() {
  var saveButtonDiv = goog.dom.getElement('saveSuiteButton');
  var button = new goog.ui.CustomButton('Save');
  button.render(saveButtonDiv);
  var that = this;
  goog.events.listen(
      button,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        that.saveSetToServer();
      });
};


/**
 * Renders the "create run" button.
 * @private
 */
bite.server.Set.prototype.renderCreateRunButton_ = function() {
  var createRunButtonDiv = goog.dom.getElement('createRunButtonDiv');
  var button = new goog.ui.CustomButton('Create Run');
  button.render(createRunButtonDiv);
  var that = this;
  goog.events.listen(
      button,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        goog.global.window.open(bite.server.Helper.getUrlHash(
            '', '/home',
            {'page': 'run_details',
             'setName': that.name,
             'setKey': that.suiteKey}));
      });
};


/**
 * Loads the suite info from server.
 * @param {string} projectName The project name.
 * @param {string} suiteName The suite name.
 * @param {string} suiteKey The suite key string.
 * @export
 */
bite.server.Set.prototype.loadSuiteFromServer = function(
    projectName, suiteName, suiteKey) {
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/suite/load',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'suiteKey': suiteKey,
       'suiteName': suiteName,
       'projectName': projectName}).toString();
  var that = this;
  goog.net.XhrIo.send(
      requestUrl,
      function() {
        if (this.isSuccess()) {
          var suite = this.getResponseJson();
          that.name = suite['suiteName'];
          that.suiteKey = suite['suiteKey'];
          that.projectName_ = suite['projectName'];
          for (var tab in that.tabNameObjMap) {
            that.tabNameObjMap[tab].setProperties(suite);
          }
          that.loadSetting();
        } else {
          throw new Error('Failed to get the Set. Error status: ' +
                          this.getStatus());
        }
      }, 'POST', parameters);
};


/**
 * Saves the set info to server.
 * @export
 */
bite.server.Set.prototype.saveSetToServer = function() {
  this.saveSetting();
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/suite/add',
    {});
  var paramsMap = {
      'suiteName': this.name,
      'configs': '',
      'watchdogSetting': '',
      'versionUrl': '',
      'report': '',
      'retryTimes': '',
      'defaultTimeout': '',
      'deleteDeadline': ''
  };
  for (var tab in this.tabNameObjMap) {
    this.tabNameObjMap[tab].addProperties(paramsMap);
  }
  var parameters = goog.Uri.QueryData.createFromMap(paramsMap).toString();
  goog.net.XhrIo.send(
      requestUrl,
      function() {
        if (this.isSuccess()) {
        } else {
          throw new Error('Failed to save the set to server. Error status: ' +
                          this.getStatus());
        }
      }, 'POST', parameters);
};


/**
 * Saves the previous page settings.
 * @export
 */
bite.server.Set.prototype.saveSetting = function() {
  this.name = goog.dom.getElement('setName').value;
  this.selectedTab.saveSetting();
};


/**
 * Loads the page's settings.
 * @export
 */
bite.server.Set.prototype.loadSetting = function() {
  if (this.name) {
    goog.dom.getElement('setName').value = this.name;
  }
  this.selectedTab.loadSetting();
};


/**
 * Listens to show the specified set tab.
 * @param {Object} event The event object.
 * @export
 */
bite.server.Set.prototype.listenToShowSetTab = function(event) {
  this.layoutHelper.handleMainNavChanges(event.target.id);
  this.showSetTab(event.target);
};


/**
 * Shows the specified set tab.
 * @param {Element} elem The clicked elem.
 * @export
 */
bite.server.Set.prototype.showSetTab = function(elem) {
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
bite.server.Set.prototype.destroy = function() {
  // TODO(phu): Clean up any listeners and other global objects.
};
