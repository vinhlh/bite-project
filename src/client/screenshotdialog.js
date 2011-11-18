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
 * @fileoverview This file contains RPF's screenshot dialog.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.ScreenShotDialog');

goog.require('bite.common.mvc.helper');
goog.require('bite.console.Screenshot');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.Dialog');
goog.require('rpf.soy.Dialog');



/**
 * A class for showing screenshots.
 * @constructor
 * @export
 */
rpf.ScreenShotDialog = function() {
  /**
   * The screenshot dialog.
   * @type {Object}
   * @private
   */
  this.screenShotDialog_ = new goog.ui.Dialog();

  /**
   * The screenshot manager instance.
   * @type {bite.console.Screenshot}
   * @private
   */
  this.screenshotMgr_ = new bite.console.Screenshot();

  /**
   * Inits the screenshot dialog.
   */
  this.initScreenshotDialog_();
};


/**
 * Sets the visibility of the screenshot dialog.
 * On setting dialog visible, redraw the screenshots.
 * @param {boolean} display Whether or not to show the dialog.
 * @export
 */
rpf.ScreenShotDialog.prototype.setVisible = function(display) {
  if (display) {
    this.updateScreenshotDialog_();
  }
  this.screenShotDialog_.setVisible(display);
};


/**
 * Inits the screenshot dialog.
 * @private
 */
rpf.ScreenShotDialog.prototype.initScreenshotDialog_ =
    function() {
  this.screenShotDialog_.setTitle('Screenshots');
  this.screenShotDialog_.setButtonSet(null);
  this.screenShotDialog_.setVisible(true);
  this.screenShotDialog_.setVisible(false);
  this.resize();
};


/**
 * Updates the screenshot dialog.
 * @private
 */
rpf.ScreenShotDialog.prototype.updateScreenshotDialog_ =
    function() {
  var screenShots = this.screenshotMgr_.getScreenshots();
  var dialogContainer = this.screenShotDialog_.getContentElement();

  bite.common.mvc.helper.renderModelFor(
      dialogContainer,
      rpf.soy.Dialog.screenshotContent,
      {'screenshots': screenShots});
};


/**
 * @return {bite.console.Screenshot} The screenshot manager instance.
 * @export
 */
rpf.ScreenShotDialog.prototype.getScreenshotManager =
    function() {
  return this.screenshotMgr_;
};


/**
 * Resizes the window. This is necessary because css overflow does not
 * play nicely with percentages.
 */
rpf.ScreenShotDialog.prototype.resize = function() {
  var dialogTitleHeight = 50;
  var dialogScreenPercentage = 0.8;
  var screenHeight = goog.dom.getViewportSize().height;
  var contentElem = this.screenShotDialog_.getContentElement();
  goog.style.setHeight(
      contentElem, screenHeight * dialogScreenPercentage - dialogTitleHeight);
};

