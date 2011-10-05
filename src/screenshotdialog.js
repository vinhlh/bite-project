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

goog.require('bite.console.Screenshot');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.Dialog');



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

  goog.style.setStyle(
      this.screenShotDialog_.getElement(),
      {'height': '55%'});
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
  var dialogElem = this.screenShotDialog_.getContentElement();
  var contentDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'screenshots',
       'style': 'text-align: center; overflow-y: auto; height: 100%;'});
  dialogElem.appendChild(contentDiv);
  this.screenShotDialog_.setTitle('Screenshots');
  this.screenShotDialog_.setButtonSet(null);
  this.screenShotDialog_.setVisible(true);
  this.screenShotDialog_.setVisible(false);
};


/**
 * Updates the screenshot dialog.
 * @private
 */
rpf.ScreenShotDialog.prototype.updateScreenshotDialog_ =
    function() {
  var screenShots = this.screenshotMgr_.getScreenshots();
  var timeStamps = this.screenshotMgr_.getTimeStamps();
  var cmds = this.screenshotMgr_.getGeneratedCmds();
  var scrnShotDiv = goog.dom.getElement('screenshots');
  goog.dom.removeChildren(scrnShotDiv);
  for (var i = 0; i < screenShots.length; i++) {
    var anchor = goog.dom.createDom(goog.dom.TagName.A, {
      'href': screenShots[i],
      'target': '_blank'
    });
    var img = goog.dom.createDom(goog.dom.TagName.IMG, {
      'src': screenShots[i],
      'alt': 'na',
      'width': '80%'
    });
    var k = this.screenshotMgr_.getCmdIndices()[i];
    var id = goog.dom.createDom(goog.dom.TagName.DIV, {
      }, this.screenshotMgr_.getCmdIndices()[i]);
    goog.dom.appendChild(anchor, img);
    goog.dom.appendChild(scrnShotDiv, anchor);
    goog.dom.appendChild(scrnShotDiv, id);
    goog.dom.appendChild(scrnShotDiv, goog.dom.createDom(
        goog.dom.TagName.HR));
  }
};


/**
 * @return {bite.console.Screenshot} The screenshot manager instance.
 * @export
 */
rpf.ScreenShotDialog.prototype.getScreenshotManager =
    function() {
  return this.screenshotMgr_;
};
