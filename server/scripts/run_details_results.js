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
 * @fileoverview This file contains the run details page's results tab.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.run.Results');

goog.require('bite.server.Constants');
goog.require('bite.server.Helper');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.RunResults');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.TableSorter');



/**
 * A class for Run's page's runs tab.
 * @param {function():string} getKeyFunc The getter for set's key.
 * @extends {bite.server.set.Tab}
 * @constructor
 * @export
 */
bite.server.run.Results = function(getKeyFunc) {
  /**
   * A function to get the selected item's key string.
   * @type {function():string}
   * @private
   */
  this.getKeyFunc_ = getKeyFunc;

  /**
   * The last selected checkbox index, which will be used to handle multiple
   * selection.
   * @type {number}
   * @private
   */
  this.lastCheckboxIndex_ = 0;

  /**
   * The result checkboxes.
   * @type {NodeList}
   * @private
   */
  this.resultCheckboxes_ = null;
};
goog.inherits(bite.server.run.Results, bite.server.set.Tab);


/**
 * Inits the Run's page's results tab.
 * @param {Element=} tabDetailsDiv The tab details div.
 * @export
 */
bite.server.run.Results.prototype.init = function(tabDetailsDiv) {
  tabDetailsDiv.innerHTML =
      bite.server.templates.details.RunResults.showResultsData();
  this.loadResultsSummary_();
  this.loadResultsDetails_();
};


/**
 * Loads all the filtered results' summary from server.
 * @private
 */
bite.server.run.Results.prototype.loadResultsSummary_ = function() {
  var runKey = this.getKeyFunc_();
  if (!runKey) {
    return;
  }
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/run/load_results_summary',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'runKey': runKey}).toString();
  goog.net.XhrIo.send(requestUrl, function() {
    if (this.isSuccess()) {
      var runObj = this.getResponseJson();
      if (runObj) {
        goog.dom.getElement('summaryResultsData').innerHTML =
            bite.server.templates.details.RunResults.showResultsSummaryData(
                runObj);
        bite.server.Helper.drawPieChart(
            runObj['data']['passedNum'],
            runObj['data']['failedNum'],
            runObj['data']['uncompletedNum']);
      }
    } else {
      throw new Error('Failed to get the run summary data. Error status: ' +
                      this.getStatus());
    }
  }, 'POST', parameters);
};


/**
 * Adds the sorter in the result table.
 * @private
 */
bite.server.run.Results.prototype.addSorter_ = function() {
  var component = new goog.ui.TableSorter();
  component.decorate(goog.dom.getElement('resultTable'));
  component.setDefaultSortFunction(goog.ui.TableSorter.alphaSort);
};


/**
 * Handles the check box is clicked.
 * @private
 */
bite.server.run.Results.prototype.handleCheckboxClicked_ = function(e) {
  var curIndex = goog.array.indexOf(this.resultCheckboxes_, e.target);
  // This simulates the Gmail multiple select behavior, which sets all the
  // checkboxes from the last selected to the current selected status at
  // once.
  if (e.shiftKey) {
    var checked = e.target.checked;
    var min = Math.min(this.lastCheckboxIndex_, curIndex);
    var max = Math.max(this.lastCheckboxIndex_, curIndex) + 1;
    for (var i = min; i < max; ++i) {
      this.resultCheckboxes_[i].checked = checked;
    }
  }
  this.lastCheckboxIndex_ = curIndex;
};


/**
 * Registers the events on buttons.
 * @private
 */
bite.server.run.Results.prototype.registerEvents_ = function() {
  goog.events.listen(
      goog.dom.getElement('playbackTests'),
      goog.events.EventType.CLICK,
      this.onPlaybackTests_);
  var doc = goog.dom.getDocument();
  this.resultCheckboxes_ = doc.getElementsByName('resultCheckbox');
  for (var i = 0, len = this.resultCheckboxes_.length; i < len; ++i) {
    goog.events.listen(this.resultCheckboxes_[i], goog.events.EventType.CLICK,
                       goog.bind(this.handleCheckboxClicked_, this))
  }
  this.addSorter_();
};


/**
 * Callback function when users choose to playback tests.
 * @param {Event} e The event object.
 * @private
 */
bite.server.run.Results.prototype.onPlaybackTests_ = function(e) {
  var testsInfo = {};
  var checkboxes = goog.dom.getDocument().getElementsByName('resultCheckbox');
  for (var i = 0, len = checkboxes.length; i < len; ++i) {
    if (checkboxes[i].checked) {
      var index = checkboxes[i].id.split('-')[0];
      var testName = goog.dom.getElement(index + '_testName').innerHTML;
      testsInfo[testName] = goog.dom.getElement(index + '_log').innerHTML;
    }
  }

  var data = {'command': 'playbackMultiple',
              'data': testsInfo};

  goog.dom.getElement('rpfLaunchData').innerHTML = JSON.stringify(data);
  var evt = goog.dom.getDocument().createEvent('Event');
  evt.initEvent('rpfLaunchEvent', true, true);
  e.target.dispatchEvent(evt);
};


/**
 * Loads all the filtered results' details from server.
 * @private
 */
bite.server.run.Results.prototype.loadResultsDetails_ = function() {
  var runKey = this.getKeyFunc_();
  if (!runKey) {
    return;
  }
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/run/load_results_details',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'runKey': runKey}).toString();
  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var runs_obj = xhr.getResponseJson();
      if (runs_obj) {
        goog.dom.getElement('detailedResultsTable').innerHTML =
            bite.server.templates.details.RunResults.showDetailedResultsTable(
                runs_obj);
        this.registerEvents_();
      }
    } else {
      throw new Error('Failed to get the run details data. Error status: ' +
                      xhr.getStatus());
    }
  }, this), 'POST', parameters);
};

