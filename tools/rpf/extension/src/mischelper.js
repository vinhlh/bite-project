// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview This file contains the misc helper, which
 * provides a bunch of handy functions.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.MiscHelper');

goog.require('bite.base.Helper');
goog.require('goog.Uri');
goog.require('goog.date.DateTime');
goog.require('goog.json');


/**
 * @const The console html.
 * @type {string}
 * @private
 */
rpf.MiscHelper.CONSOLE_HTML_ = 'console.html';


/**
 * @const The common lib server.
 * @type {string}
 */
rpf.MiscHelper.COMMON_LIB_SERVER = 'http://suite-executor.appspot.com';


/**
 * Enum for modes values.
 * @enum {string}
 * @export
 */
rpf.MiscHelper.Modes = {
  NONE: '',
  WORKER: 'worker',
  CONSOLE: 'console',
  PLAYBACK: 'playback',
  AUTORUN: 'autorun'
};


/**
 * Gets matching part of a string.
 * @param {Object} re A given regular expression.
 * @param {string} str A string.
 * @param {string=} opt_value The value by default.
 * @return {string} The matching string or the default string.
 * @export
 */
rpf.MiscHelper.getStr = function(re, str, opt_value) {
  var match = re.exec(str);
  return match ? match[1] : opt_value;
};


/**
 * Gets the chrome version.
 * @param {string} agent The user agent.
 * @return {string} The chrome version.
 * @export
 */
rpf.MiscHelper.getChromeVersion = function(agent) {
  return rpf.MiscHelper.getStr(/\bChrome\/([0-9.]*)/, agent);
};


/**
 * Resizes a screenshot captured.
 * @param {Function} callback The callback function.
 * @param {number} maxSideSize The new image height.
 * @param {Object} dimension The new dimension object.
 * @param {string} url The image data url.
 * @export
 */
rpf.MiscHelper.resizeImage = function(
    callback, maxSideSize, dimension, url) {
  var maxLen =  maxSideSize || 600;
  var sourceImage = new Image();
  sourceImage.onload = function() {
    // Create a canvas with the desired dimensions
    var canvas = document.createElement('canvas');

    var newHeight = sourceImage.height;
    var newWidth = sourceImage.width;
    // Preserve width to height ratios.
    if (newHeight > maxLen && sourceImage.height > sourceImage.width) {
      newHeight = maxLen;
      newWidth = sourceImage.width / sourceImage.height * maxLen;
    } else if(newWidth > maxLen) {
      newHeight = sourceImage.height / sourceImage.width * maxLen;
      newWidth = maxLen;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    // Scale and draw the source image to the canvas
    canvas.getContext('2d').drawImage(
        sourceImage, 0, 0, newWidth, newHeight);

    var canvas2 = document.createElement('canvas');
    // Convert the canvas to a data URL in PNG format
    callback(canvas.toDataURL('img/png'),
             rpf.MiscHelper.sliceImage(dimension, canvas2, sourceImage,
                                       {'width': 9999, 'height': 9999}));
  };
  sourceImage.src = url;
};


/**
 * Crops a screenshot captured.
 * @param {Function} callback The callback function.
 * @param {Object} dimension The new dimension object.
 * @param {string} url The image data url.
 * @export
 */
rpf.MiscHelper.cropImage = function(callback, dimension, url) {
  var sourceImage = new Image();
  sourceImage.onload = function() {
    var canvas = document.createElement('canvas');

    canvas.width = dimension['sWidth'];
    canvas.height = dimension['sHeight'];
    canvas.getContext('2d').drawImage(
        sourceImage,
        dimension['sX'], dimension['sY'],
        dimension['sWidth'], dimension['sHeight'],
        0, 0, dimension['sWidth'], dimension['sHeight']);

    // Convert the canvas to a data URL in PNG format
    callback(canvas.toDataURL('img/png'), '');
  };
  sourceImage.src = url;
};


/**
 * Slices a screenshot captured.
 * @param {Object} dimension The new dimension object.
 * @param {Object} canvas The canvas object.
 * @param {Object} sourceImage The sourceImage object.
 * @param {!Object} maxDimension The max width and length in pixel.
 * @return {string} The data url string.
 * @export
 */
rpf.MiscHelper.sliceImage = function(
    dimension, canvas, sourceImage, maxDimension) {
  if (!dimension) {
    return '';
  }
  var maxHeight = maxDimension['height'] || 100;
  var maxWidth = maxDimension['width'] || 300;
  var newHeight = dimension['sHeight'];
  var newWidth = dimension['sWidth'];
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = dimension['sWidth'] / dimension['sHeight'] * maxHeight;
  }

  if (newWidth > maxWidth) {
    newHeight = dimension['sHeight'] / dimension['sWidth'] * maxWidth;
    newWidth = maxWidth;
  }
  canvas.width = newWidth;
  canvas.height = newHeight;
  canvas.getContext('2d').drawImage(
      sourceImage,
      dimension['sX'], dimension['sY'],
      dimension['sWidth'], dimension['sHeight'],
      0, 0, newWidth, newHeight);
  return canvas.toDataURL('img/png');
};


/**
 * Gets the descriptor from a script cmd.
 * @param {string} script The generated script string.
 * @return {Object|string} The descriptor object.
 * @export
 */
rpf.MiscHelper.getDescriptor = function(script) {
  var descriptor = script.match(/parseElementDescriptor\(.*?}}\)/) + '';
  if (descriptor == 'null') {
    return 'Parser error - Invalid descriptor info';
  }
  try {
    descriptor = goog.json.parse(descriptor.substring(
        Bite.Constants.FUNCTION_PARSE_DESCRIPTOR.length + 1,
        descriptor.length - 1));
  } catch (e) {
    console.log('Parse error - ' + e.message);
    return null;
  }
  return descriptor;
};


/**
 * Gets the stringified string with spaces.
 * @param {string|Object} desc The descriptor string of object.
 * @param {number} numSpace The number of spaces.
 * @return {string} The string with spaces.
 * @export
 */
rpf.MiscHelper.getStringWithSpaces = function(desc, numSpace) {
  var objDesc = {};
  if (typeof(desc) == 'string') {
    objDesc = goog.json.parse(desc);
  } else if (typeof(desc) == 'object') {
    objDesc = desc;
  } else {
    throw new Error('Not supported type.');
  }
  var result = '';
  result = JSON.stringify(objDesc, null, numSpace);
  return result.replace(/\n/g, '');
};


/**
 * Gets the command id.
 * @param {string} cmd The to be matched line of command.
 * @return {string} The command's id.
 * @export
 */
rpf.MiscHelper.getCmdId = function(cmd) {
  var m = /\/\*"""id[^/*]*"""\*\//g;
  var tempMatch = cmd.match(m);
  if (!tempMatch) {
    return '';
  }
  var temp = tempMatch[0];
  ///*"""id(blah)"""*/
  return temp.substring(8, temp.length - 6);
};


/**
 * Replace the descriptor from a script cmd.
 * @param {string} script The generated script string.
 * @param {string} newDesc The new descriptor string.
 * @return {string} The replaced string.
 * @export
 */
rpf.MiscHelper.replaceDescriptor = function(
    script, newDesc) {
  // parseElementDescriptor({'name': 'abc', 'parent': {}})
  var descriptor = script.match(/parseElementDescriptor\(.*?}}\)/);
  if (!descriptor) {
    return script;
  }
  return script.replace(/parseElementDescriptor\(.*?}}\)/,
      'parseElementDescriptor(' + newDesc + ')');
};


/**
 * Gets the time stamp.
 * @return {string} The time stamp.
 * @export
 */
rpf.MiscHelper.getTimeStamp = function() {
  var dateTime = new goog.date.DateTime();
  return dateTime.toIsoString(true);
};


/**
 * Removes a window.
 * @param {number} winId The window's id.
 * @export
 */
rpf.MiscHelper.removeWindowById = function(winId) {
  chrome.windows.remove(winId);
};


/**
 * Returns a unique id in the given context.
 * @param {string} script The script string.
 * @return {number} The unique id.
 * @export
 */
rpf.MiscHelper.getUniqueId = function(script) {
  var existingIds = {};
  var id = 0;
  var results = script.match(/\d+\);/gi);
  if (!results) {
    return 1;
  }
  for (var i = 0, len = results.length; i < len; i++) {
    id = parseInt(results[i].substring(0, results[i].length - 2), 10);
    existingIds[id] = true;
  }
  for (var i = 2; i < 1000000; i++) {
    if (!existingIds[i]) {
      return i;
    }
  }
};


/**
 * Gets the elem info from a given cmd.
 * @param {string} cmd The cmd string.
 * @param {Object} infoMap The info map.
 * @return {Object} The elem info map.
 * @export
 */
rpf.MiscHelper.getElemMap = function(cmd, infoMap) {
  var id = bite.base.Helper.getStepId(cmd);
  return id ? infoMap['elems'][infoMap['steps'][id]['elemId']] : {};
};


/**
 * Adds id to a generated command.
 * @param {number|string} id The id.
 * @param {string} cmd The generated command.
 * @return {string} The new string.
 * @export
 */
rpf.MiscHelper.addIdToCommand = function(id, cmd) {
  var index = cmd.lastIndexOf(');');
  return cmd.substring(0, index) +
         ', ' + id +
         cmd.substring(index, cmd.length);
};


/**
 * Gets the url by the given parameters.
 * @param {string} serverUrl The server url.
 * @param {string} requestPath The request path of the server.
 * @param {!Object} paramMap The param map object.
 * @return {string} the request url.
 * @export
 */
rpf.MiscHelper.getUrl = function(
    serverUrl, requestPath, paramMap) {
  var request = goog.Uri.parse(serverUrl);
  request.setPath(requestPath);
  var data = goog.Uri.QueryData.createFromMap(paramMap);
  request.setQueryData(data);
  return request.toString();
};
