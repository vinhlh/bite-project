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
 * @fileoverview This file contains the misc helper functions.
 */

goog.provide('common.client.MiscHelper');



/**
 * A class contains misc helper functions.
 * @constructor
 * @export
 */
common.client.MiscHelper = function() {
};


/**
 * Resizes a screenshot captured.
 * @param {string} url The image data url.
 * @param {Function} callback The callback function.
 * @param {number?} opt_height The new image height.
 * @export
 */
common.client.MiscHelper.resizeImage = function(url, callback, opt_height) {
  var newHeight = opt_height || 250;
  var sourceImage = new Image();
  sourceImage.onload = function() {
      // Create a canvas with the desired dimensions
      var canvas = document.createElement('canvas');
      var newWidth = sourceImage.width * newHeight / sourceImage.height;
      canvas.width = newWidth;
      canvas.height = newHeight;
      // Scale and draw the source image to the canvas
      canvas.getContext('2d').drawImage(
          sourceImage, 0, 0, newWidth, newHeight);
      // Convert the canvas to a data URL in PNG format
      callback(canvas.toDataURL());
  }
  sourceImage.src = url;
};


/**
 * Changes the cursor style for all elements on the web page.
 * @param {string} cursorStyle The predefined cursor style, e.g. 'default',
 *     'crosshair', etc.
 * @export
 */
common.client.MiscHelper.setCursorStyle = function(cursorStyle) {
  var style = document.createElement('style');
  style.innerHTML = '* {cursor: ' + cursorStyle + ' !important}\n';
  style.id = 'tempCursor';
  document.getElementsByTagName('head')[0].appendChild(style);
};


/**
 * Restores the cursor style for all elements on the web page.
 * @export
 */
common.client.MiscHelper.restoreCursorStyle = function() {
  var style = document.getElementById('tempCursor');
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
  }
};
