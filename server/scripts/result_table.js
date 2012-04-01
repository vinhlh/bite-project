// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview This file is the entry point of the result table page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.server.ResultTable');

goog.require('bite.server.Helper');
goog.require('bite.server.templates.details.RunResults');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.string');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');



/**
 * A class for initializing result table page.
 * @constructor
 * @export
 */
rpf.server.ResultTable = function() {
  /**
   * The platform selector.
   * @type {goog.ui.Select}
   * @private
   */
  this.platformSelector_ = null;

  /**
   * The project selector.
   * @type {goog.ui.Select}
   * @private
   */
  this.projectSelector_ = null;

  /**
   * The search button element.
   * @type {Element}
   * @private
   */
  this.searchElem_ = goog.dom.getElement('result-table-search');

  /**
   * The chrome builds from input element.
   * @type {Element}
   * @private
   */
  this.chromeFromElem_ = goog.dom.getElement('result-table-chrome-from');

  /**
   * The results table head element.
   * @type {Element}
   * @private
   */
  this.tableHeadElem_ = goog.dom.getElement('result-table-head');

  /**
   * The results table body element.
   * @type {Element}
   * @private
   */
  this.tableBodyElem_ = goog.dom.getElement('result-table-body');

  /**
   * The chrome builds to element.
   * @type {Element}
   * @private
   */
  this.chromeToElem_ = goog.dom.getElement('result-table-chrome-to');

  this.initUi_();

  this.registerHandlers_();
};


/**
 * Inits the result table page UI.
 * @private
 */
rpf.server.ResultTable.prototype.initUi_ = function() {
  this.initPlatformSelector_();
  this.initProjectSelector_();
};


/**
 * Inits the project selector.
 * @private
 */
rpf.server.ResultTable.prototype.initProjectSelector_ = function() {
  var requestUrl = bite.server.Helper.getUrl(
      '', '/storage/getprojectnames', {});
  goog.net.XhrIo.send(
      requestUrl, goog.bind(this.initProjectSelectorCallback_, this), 'GET');
};


/**
 * The project selector init callback function.
 * @private
 */
rpf.server.ResultTable.prototype.initProjectSelectorCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    var names = xhr.getResponseJson();
    if (names && names.length > 0) {
      var selector = new goog.ui.Select('Project');
      for (var i = 0, len = names.length; i < len; ++i) {
        selector.addItem(new goog.ui.MenuItem(names[i]));
      }
      selector.render(goog.dom.getElement('project-selector'));
      this.projectSelector_ = selector;
    }
  } else {
    bite.server.Helper.displayMessage(
        'Failed loading projects', 1 * 1000, true);
    throw new Error('Failed to load the project names. Error log: ' +
                    xhr.getLastError());
  }
};


/**
 * Inits the platform selector.
 * @private
 */
rpf.server.ResultTable.prototype.initPlatformSelector_ = function() {
  var selector = new goog.ui.Select('Platform');
  selector.addItem(new goog.ui.MenuItem('linux'));
  selector.addItem(new goog.ui.MenuItem('mac'));
  selector.addItem(new goog.ui.MenuItem('win'));
  selector.addItem(new goog.ui.MenuItem('all'));
  selector.render(goog.dom.getElement('platform-selector'));
  this.platformSelector_ = selector;
};


/**
 * Registers the event listeners to the buttons.
 * @private
 */
rpf.server.ResultTable.prototype.registerHandlers_ = function() {
  goog.events.listen(
      this.searchElem_,
      goog.events.EventType.CLICK,
      goog.bind(this.onSearch_, this));
};


/**
 * Handler for searching the results.
 * @private
 */
rpf.server.ResultTable.prototype.onSearch_ = function() {
  if (!this.projectSelector_.getSelectedItem()) {
    bite.server.Helper.displayMessage('Please select a project.', 0, true);
    return false;
  }
  var projectName = this.getProjectName_();
  var platform = '';
  if (this.platformSelector_.getSelectedItem()) {
    platform = /** @type {string} */ (
        this.platformSelector_.getSelectedItem().getValue());
  }
  var chromeFrom = goog.string.trim(this.chromeFromElem_.value);
  var chromeTo = goog.string.trim(this.chromeToElem_.value);
  this.searchForResults_(projectName, platform, chromeFrom, chromeTo);
};


/**
 * Gets the project name.
 * @return {string} The project name.
 * @private
 */
rpf.server.ResultTable.prototype.getProjectName_ = function() {
  return /** @type {string} */ (
      this.projectSelector_.getSelectedItem().getValue());
};


/**
 * Searches the results.
 * @param {string} projectName The project name.
 * @param {string} platform The platform.
 * @param {string} chromeFrom The minimum build of the Chrome browser.
 * @param {string} chromeTo The maximum build of the Chrome browser.
 * @private
 */
rpf.server.ResultTable.prototype.searchForResults_ = function(
    projectName, platform, chromeFrom, chromeTo) {
  var requestUrl = bite.server.Helper.getUrl(
      '', '/result/get_result_table', {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'projectName': projectName,
       'platform': platform,
       'chromeFrom': chromeFrom,
       'chromeTo': chromeTo}).toString();
  bite.server.Helper.displayMessage('Searching...');
  goog.net.XhrIo.send(
      requestUrl, goog.bind(this.searchForResultsCallback_, this),
      'POST', parameters);
};


/**
 * The search results callback function.
 * @private
 */
rpf.server.ResultTable.prototype.searchForResultsCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    var results = xhr.getResponseJson();
    bite.server.Helper.displayMessage('Loaded successfully', 0.6 * 1000);
    this.clearResultsTable_();
    this.updateAndDrawTable_(results);
  } else {
    bite.server.Helper.displayMessage(
        'Failed loading results', 1 * 1000, true);
    throw new Error('Failed to load the results. Error log: ' +
                    xhr.getLastError());
  }
};


/**
 * Clears the results table.
 * @private
 */
rpf.server.ResultTable.prototype.clearResultsTable_ = function() {
  this.tableHeadElem_.innerHTML = '';
  this.tableBodyElem_.innerHTML = '';
};


/**
 * Renders the results table head.
 * @param {Array} columns The columns array.
 * @private
 */
rpf.server.ResultTable.prototype.renderResultsTableHead_ = function(columns) {
  var projectName = this.getProjectName_();
  soy.renderElement(
      this.tableHeadElem_,
      bite.server.templates.details.RunResults.getResultsTableHeadRow,
      {'columns': columns,
       'projectName': projectName});
};


/**
 * Renders the results table body.
 * @param {Array} names The test names.
 * @param {Array} columns The columns array.
 * @param {Object} resultsTable The results table object.
 * @private
 */
rpf.server.ResultTable.prototype.renderResultsTableBody_ = function(
    names, columns, resultsTable) {
  for (var i = 0, lenI = names.length; i < lenI; ++i) {
    var dataColumns = [];
    dataColumns.push({'displayName': names[i]});
    for (var j = 0, lenJ = columns.length; j < lenJ; ++j) {
      var cell = resultsTable[names[i]][columns[j]['id']];
      if (cell) {
        dataColumns.push(cell);
      } else {
        dataColumns.push({'result': 'N.A.',
                          'platform': columns[j]['result']['platform']});
      }
    }
    var tempRow = bite.server.templates.details.RunResults.getResultsTableRow(
        {'columns': dataColumns});
    this.tableBodyElem_.innerHTML += tempRow;
  }
};


/**
 * Draws the result table.
 * @param {Array} results The array of results.
 * @private
 */
rpf.server.ResultTable.prototype.updateAndDrawTable_ = function(results) {
  // The column depends on three things chrome build number, platform, and time.
  var columns = [];
  // The key is test name, and the value is an object of columns.
  var resultsTable = {};
  var currentBuildPlatformTime = '';
  for (var i = 0, len = results.length; i < len; ++i) {
    var chromeVersion = results[i]['chromeVersion'];
    if (!chromeVersion) {
      continue;
    }
    var platform = results[i]['platform'];
    if (!platform) {
      platform = 'unknown';
    }
    var time = results[i]['createdTime'];
    var testName = results[i]['testName'];
    if (!resultsTable[testName]) {
      resultsTable[testName] = {};
    }
    var newBuildPlatformTime = chromeVersion + platform + time;
    // The results sequence is based on chromeVersion->platform->time->test name
    if (newBuildPlatformTime != currentBuildPlatformTime) {
      columns.push({'id': newBuildPlatformTime,
                    'result': results[i]});
      currentBuildPlatformTime = newBuildPlatformTime;
    }
    resultsTable[testName][newBuildPlatformTime] = results[i];
  }

  var names = goog.object.getKeys(resultsTable);
  goog.array.sort(names);

  this.renderResultsTableHead_(columns);
  this.renderResultsTableBody_(names, columns, resultsTable);
};

