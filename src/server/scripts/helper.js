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
 * @fileoverview This file contains the helper functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.Helper');

goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');
goog.require('goog.ui.ComboBox');



/**
 * A class for helper functions.
 * @constructor
 * @export
 */
bite.server.Helper = function() {
};


/**
 * Updates the selected item's css.
 * @param {Element} elem The element was clicked.
 * @param {string} normalCss The css for unselected choice.
 * @param {string} selectedCss The css for selected choice.
 * @export
 */
bite.server.Helper.updateSelectedCss = function(
    elem, normalCss, selectedCss) {
  var mainNavs = goog.dom.getElementsByClass(normalCss);
  for (var i = 0, len = mainNavs.length; i < len; i++) {
    goog.dom.setProperties(mainNavs[i], {'class': normalCss});
  }
  goog.dom.setProperties(elem, {'class': selectedCss});
};


/**
 * Gets the url string with the given parameters.
 * @param {string} serverUrl The server url.
 * @param {string} requestPath The request path of the server.
 * @param {!Object} paramMap The param map object.
 * @return {string} the request url.
 * @export
 */
bite.server.Helper.getUrl = function(
    serverUrl, requestPath, paramMap) {
  var request = goog.Uri.parse(serverUrl);
  request.setPath(requestPath);
  var data = goog.Uri.QueryData.createFromMap(paramMap);
  request.setQueryData(data);
  return request.toString();
};


/**
 * Gets the url with hash data by the given parameters.
 * @param {string} serverUrl The server url.
 * @param {string} requestPath The request path of the server.
 * @param {!Object} paramMap The param map object.
 * @return {string} the request url.
 * @export
 */
bite.server.Helper.getUrlHash = function(
    serverUrl, requestPath, paramMap) {
  var request = goog.Uri.parse(serverUrl);
  request.setPath(requestPath);
  var data = goog.Uri.QueryData.createFromMap(paramMap).toString();
  request.setFragment(data, true);
  return request.toString();
};


/**
 * Adds listeners to a group of elements.
 * @param {Array} elems The elements to be added listeners.
 * @param {Function} callback The callback function.
 * @export
 */
bite.server.Helper.addListenersToElems = function(
    elems, callback) {
  for (var i = 0, len = elems.length; i < len; i++) {
    goog.events.listen(
        elems[i], 'click', callback);
  }
};


/**
 * Adds listeners to a group of elements.
 * @param {Array} array The data array.
 * @param {string} name The sample name.
 * @param {string} value The sample value.
 * @param {string} requestedName The requested name.
 * @return {*} The requested name's value.
 * @export
 */
bite.server.Helper.getValueInArray = function(
    array, name, value, requestedName) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i][name] == value) {
      return array[i][requestedName];
    }
  }
  return null;
};


/**
 * Draws the chart.
 * @param {number} passed The passed number.
 * @param {number} failed The failed number.
 * @param {number} uncompleted The uncompleted number.
 * @suppress {missingProperties} google.visualization.DataTable and
 *                               google.visualization.ImageBarChart
 * @export
 */
bite.server.Helper.drawBarChart = function(passed, failed, uncompleted) {
  // Create and populate the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'tests');
  data.addColumn('number', 'passed');
  data.addColumn('number', 'failed');
  data.addColumn('number', 'uncompleted');
  data.addRows(1);
  data.setCell(0, 0, '');
  data.setCell(0, 1, passed);
  data.setCell(0, 2, failed);
  data.setCell(0, 3, uncompleted);

  // Create and draw the visualization.
  new google.visualization.ImageBarChart(goog.dom.getElement('visualization')).
      draw(data, {'isStacked': true, 'width': 400, 'height': 100,
                  'colors': ['00FF00', 'FF0000', 'C0C0C0']
                 });
};


/**
 * Draws the pie chart.
 * @param {number} passed The passed number.
 * @param {number} failed The failed number.
 * @param {number} uncompleted The uncompleted number.
 * @suppress {missingProperties} google.visualization.DataTable and
 *                               google.visualization.PieChart
 * @export
 */
bite.server.Helper.drawPieChart = function(passed, failed, uncompleted) {
  // Create and populate the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Status');
  data.addColumn('number', 'Number');
  data.addRows(3);

  data.setValue(0, 0, 'Passed');
  data.setValue(0, 1, passed);

  data.setValue(1, 0, 'Failed');
  data.setValue(1, 1, failed);

  data.setValue(2, 0, 'Uncompleted');
  data.setValue(2, 1, uncompleted);

  // Create and draw the visualization.
  new google.visualization.PieChart(goog.dom.getElement('visualization')).
      draw(data, {'width': 200, 'height': 200,
                  'colors': ['00FF00', 'FF0000', 'C0C0C0'],
                  'legend': 'none'
                 });
};


/**
 * Splits a string and trim each elements.
 * @param {string} str The string to be splited.
 * @param {string} delimiter Used to split the string.
 * @return {Array} The result array.
 */
bite.server.Helper.splitAndTrim = function(str, delimiter) {
  var result = [];
  var arr = str.split(delimiter);
  for (var i = 0, len = arr.length; i < len; i++) {
    result.push(goog.string.trim(arr[i]));
  }
  return result;
};


/**
 * Creates the project selector for choosing options.
 * @param {Array} options The options to be showed in selector.
 * @param {string} id The id of the div where the selector will be rendered.
 * @param {string} text The default text.
 * @return {goog.ui.ComboBox} The combobox instance.
 * @export
 */
bite.server.Helper.createSelector = function(options, id, text) {
  var projectSelector_ = new goog.ui.ComboBox();
  projectSelector_.setUseDropdownArrow(true);
  projectSelector_.setDefaultText(text);
  for (var i = 0, len = options.length; i < len; ++i) {
    var pName = '';
    var pId = '';
    if (goog.isString(options[i])) {
      pName = options[i];
      pId = options[i];
    } else {
      pName = options[i]['name'];
      pId = options[i]['id'];
    }
    var option = new goog.ui.ComboBoxItem(pName);
    goog.dom.setProperties(/** @type {Element} */ (option), {'id': pId});
    projectSelector_.addItem(option);
  }
  projectSelector_.render(goog.dom.getElement(id));
  return projectSelector_;
};


/**
 * Joins the list or returns the string directly.
 * @param {string|Array} strOrArr The given array or string.
 * @param {string} delimiter The delimiter string.
 * @return {string} The result string.
 */
bite.server.Helper.joinToStr = function(strOrArr, delimiter) {
  return typeof strOrArr == 'string' ? strOrArr : strOrArr.join(delimiter);
};


/**
 * Displays a status message in Google bar, and optionally dismiss it.
 * @param {string} message The message to be displayed.
 * @param {number} opt_timeout The optional time out to hide the message.
 */
bite.server.Helper.displayMessage = function(message, opt_timeout) {
  goog.dom.getElement('statusMessage').innerHTML = message;
  bite.server.Helper.updateSelectedCss(
      goog.dom.getElement('statusMessageDiv'),
      'kd-butterbar',
      'kd-butterbar shown');
  if (opt_timeout) {
    goog.Timer.callOnce(bite.server.Helper.dismissMessage, opt_timeout);
  }
};


/**
 * Dismisses the message.
 */
bite.server.Helper.dismissMessage = function() {
  bite.server.Helper.updateSelectedCss(
      goog.dom.getElement('statusMessageDiv'),
      'kd-butterbar shown',
      'kd-butterbar');
};

