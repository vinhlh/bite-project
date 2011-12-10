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
 * @fileoverview This file contains the bite console helper functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.console.Helper');
goog.provide('bite.console.Screenshot');

goog.require('bite.base.Helper');
goog.require('goog.events');


/**
 * @type {string}
 */
bite.console.Helper.INFO_MAP_START = '/*InfoMap starts*/';


/**
 * @type {string}
 */
bite.console.Helper.INFO_MAP_END = '/*InfoMap ends*/';


/**
 * Gets the doc string of the generated code.
 * @param {string} domain The recorded page's domain.
 * @param {string} authorId The author's id.
 * @return {string} The doc string.
 * @export
 */
bite.console.Helper.getDocString = function(domain, authorId) {
  return (
      '/**\n' +
      ' * @fileoverview This is an auto-generated test on ' + domain + '.\n' +
      ' * The generated commands are in the format of:\n' +
      ' * ACTION(ELEMENT, OPT_TEXT);\n' +
      ' * @author ' + authorId + '\n' +
      ' */\n\n\n');
};


/**
 * Merges the given model files into one.
 * @param {Array} infoMaps The info map objects.
 * @return {Object} The infoMap object.
 * @export
 */
bite.console.Helper.mergeInfoMaps = function(infoMaps) {
  var infoMap = {'steps': {}, 'elems': {}};
  for (var i = 0, len = infoMaps.length; i < len; ++i) {
    var steps = infoMaps[i]['steps'];
    for (var step in steps) {
      infoMap['steps'][step] = steps[step];
    }
    var elems = infoMaps[i]['elems'];
    for (var elem in elems) {
      infoMap['elems'][elem] = elems[elem];
    }
  }
  return infoMap;
};


/**
 * InfoMap is the basic model to store all the recorded info. The model
 * could be used as a glue for all the rpf components and features.
 * @param {Object} infoMap The info map object.
 * @param {Object} cmdMap The command map.
 * @export
 */
bite.console.Helper.assignInfoMap = function(infoMap, cmdMap) {
  if (!infoMap['steps']) {
    infoMap['steps'] = {};
    infoMap['elems'] = {};
  }
  infoMap['steps'][cmdMap['id']] = {
    'elemId': cmdMap['elemId'],
    'action': cmdMap['action'],
    'varName': cmdMap['varName'],
    'stepName': cmdMap['id'],
    'tagName': cmdMap['tagName'],
    'comments': '',
    'pageName': cmdMap['className'],
    'returnPageName': '',
    'url': ''
  };
  // TODO(phu): Need to ignore duplicated elems.
  infoMap['elems'][cmdMap['elemId']] = {
    'selectors': cmdMap['selectors'],
    'xpaths': cmdMap['xpaths'],
    'descriptor': cmdMap['descriptor'],
    'iframeInfo': cmdMap['iframeInfo']
  };
};


/**
 * Appends infoMap to datafile.
 * @param {Object} infoMap The info map object.
 * @param {string} datafile The old datafile.
 * @return {string} The new datafile string.
 * @export
 */
bite.console.Helper.appendInfoMap = function(infoMap, datafile) {
  return datafile +
         bite.console.Helper.INFO_MAP_START +
         goog.json.serialize(infoMap) +
         bite.console.Helper.INFO_MAP_END;
};


/**
 * Trims infoMap from datafile.
 * @param {string} datafile The old datafile.
 * @return {Object} The object containing infoMap and datafile.
 * @export
 */
bite.console.Helper.trimInfoMap = function(datafile) {
  var infoMap = null;
  var startIndex = datafile.indexOf(bite.console.Helper.INFO_MAP_START);
  if (startIndex == -1) {
    return {'infoMap': {}, 'datafile': datafile};
  }
  var mapStartIndex = startIndex + bite.console.Helper.INFO_MAP_START.length;
  var endIndex = datafile.indexOf(bite.console.Helper.INFO_MAP_END);
  try {
    infoMap = goog.json.parse(
        datafile.substring(mapStartIndex, endIndex));
  } catch (e) {
    console.log(e.message);
  }
  endIndex += bite.console.Helper.INFO_MAP_END.length;
  datafile = datafile.substring(0, startIndex) +
             datafile.substring(endIndex, datafile.length);
  return {'infoMap': infoMap, 'datafile': datafile};
};


/**
 * @type {Object}
 */
bite.console.Helper.ID_SCREENSHOT_MAP = {};


/**
 * Change the screenshot.
 * @param {string} id The screenshot id string.
 * @param {string} elemId The element's id.
 * @export
 */
bite.console.Helper.changeScreen = function(id, elemId) {
  goog.dom.getElement(elemId).src =
      bite.console.Helper.ID_SCREENSHOT_MAP[id]['screen'];
};


/**
 * Registers the screenshot change events.
 * @param {Object} steps The steps info.
 * @param {Function} callback The callback function.
 * @export
 */
bite.console.Helper.registerScreenChangeEvents = function(steps, callback) {
  for (var index in steps) {
    var id = steps[index]['id'];
    var elem = goog.dom.getElement(id);
    if (elem) {
      goog.events.listen(elem, goog.events.EventType.MOUSEOVER, callback);
    }
  }
};


/**
 * Gets the steps info.
 * @param {bite.console.Screenshot} scnShotMgr The screenshot manager.
 * @param {Object} infoMap The info map object.
 * @param {string} code The code string.
 * @return {Object} The steps object.
 * @export
 */
bite.console.Helper.getStepsInfo = function(scnShotMgr, infoMap, code) {
  var steps = [{}];
  var index = 0;
  bite.console.Helper.ID_SCREENSHOT_MAP = scnShotMgr.getIdScreenShotMap();
  var lines = code.split('\n');
  var tempComment = '';
  var curId = '';
  bite.base.Helper.evalDatafile(goog.dom.getElement(
      Bite.Constants.RpfConsoleId.DATA_CONTAINER).value);
  for (var i = 0; i < lines.length; i++, tempComment = '') {
    while (lines[i].indexOf('//') == 0) {
      tempComment += lines[i];
      i++;
    }
    if (goog.string.trim(lines[i]) == '') {
      continue;
    }
    if (curId = bite.base.Helper.getStepId(lines[i])) {
      var stepInfo = infoMap['steps'][curId];
      var data = bite.base.Helper.dataFile[stepInfo['varName']];
      var transSurfix = data ? ' "' + data + '" ' : '';
      steps[index]['translation'] =
          stepInfo['action'].charAt(0).toUpperCase() +
          stepInfo['action'].slice(1);
      steps[index]['data'] = transSurfix;
      steps[index]['id'] = curId;
      steps[index++]['icon'] =
          bite.console.Helper.ID_SCREENSHOT_MAP[curId]['icon'];
      steps[index] = {};
    }
  }
  return steps;
};


/**
 * A class for managing the screenshots.
 * TODO (phu): Replace the arrays with a map object.
 * @constructor
 * @export
 */
bite.console.Screenshot = function() {
  /**
   * The time stamp array.
   * @type {Array}
   * @private
   */
  this.timeStamps_ = [];

  /**
   * The generated command that related with the screenshot.
   * @type {Array}
   * @private
   */
  this.generatedCmds_ = [];

  /**
   * The screen shots array, which contains a bunch of data urls.
   * @type {Array}
   * @private
   */
  this.screenshots_ = [];

  /**
   * The screen shots icon array, which contains partial image data urls.
   * @type {Array}
   * @private
   */
  this.iconShots_ = [];

  /**
   * The command index array. This is used to record the corresponding
   * index of generated command in the original script.
   * @type {Array}
   * @private
   */
  this.cmdIndices_ = [];
};


/**
 * Adds a screenshot.
 * @param {string} url The screenshot image url.
 * @param {string} iconUrl The screenshot icon url.
 * @param {string=} opt_index The command index.
 * @export
 */
bite.console.Screenshot.prototype.addScreenShot = function(
    url, iconUrl, opt_index) {
  var index = opt_index || '';
  console.log('  Added screenshot' + index);
  this.screenshots_.push(url);
  this.iconShots_.push(iconUrl);
  if (index) {
    this.addIndex(index);
  }
};


/**
 * Resets screenshots.
 * @param {Object} screenshots The screenshot objects.
 * @export
 */
bite.console.Screenshot.prototype.resetScreenShots = function(screenshots) {
  this.clear();
  for (var step in screenshots) {
    this.addScreenShot(screenshots[step]['data'],
                       screenshots[step]['icon'],
                       screenshots[step]['index']);
  }
};


/**
 * Clean up the screen shots.
 * @export
 */
bite.console.Screenshot.prototype.clear = function() {
  this.timeStamps_ = [];
  this.generatedCmds_ = [];
  this.screenshots_ = [];
  this.cmdIndices_ = [];
};


/**
 * Adds an index for the screenshot.
 * @param {string} screenshotId string.
 * @export
 */
bite.console.Screenshot.prototype.addIndex = function(screenshotId) {
  console.log('  Added screenshot index:' + screenshotId);
  this.cmdIndices_.push(screenshotId);
};


/**
 * Adds a generated command which matches the screenshot.
 * @param {string} cmd The generated command.
 * @export
 */
bite.console.Screenshot.prototype.addGeneratedCmd = function(cmd) {
  this.generatedCmds_.push(cmd);
};


/**
 * Remove the screenshot at the given line.
 * @param {number} line The line to be removed.
 * @export
 */
bite.console.Screenshot.prototype.deleteItem = function(line) {
  for (var i = 0; i < this.cmdIndices_.length; i++) {
    if (this.cmdIndices_[i] == line) {
      this.cmdIndices_.splice(i, 1);
      this.screenshots_.splice(i, 1);
    }
  }
};


/**
 * Get the screen shot by a given index.
 * @param {string} index The index.
 * @return {?string} The screenshot data url.
 * @export
 */
bite.console.Screenshot.prototype.getScreenById = function(index) {
  for (var i = 0; i < this.cmdIndices_.length; i++) {
    if (this.cmdIndices_[i] == index) {
      return this.screenshots_[i];
    }
  }
  return null;
};


/**
 * @return {Array} The time stamp array.
 * @export
 */
bite.console.Screenshot.prototype.getTimeStamps = function() {
  return this.timeStamps_;
};


/**
 * @return {Array} The generated command that related with the screenshot.
 * @export
 */
bite.console.Screenshot.prototype.getGeneratedCmds = function() {
  return this.generatedCmds_;
};


/**
 * @return {Array} The screen shots array, which contains a bunch of data urls.
 * @export
 */
bite.console.Screenshot.prototype.getScreenshots = function() {
  return this.screenshots_;
};


/**
 * @return {Array} The command index array.
 * @export
 */
bite.console.Screenshot.prototype.getCmdIndices = function() {
  return this.cmdIndices_;
};


/**
 * @return {Object} The id and screenshot map.
 * @export
 */
bite.console.Screenshot.prototype.getIdScreenShotMap = function() {
  var map = {};
  for (var i = 0, len = this.screenshots_.length; i < len; i++) {
    map[this.cmdIndices_[i]] = {};
    map[this.cmdIndices_[i]]['screen'] = this.screenshots_[i];
    map[this.cmdIndices_[i]]['icon'] = this.iconShots_[i];
  }
  return map;
};

