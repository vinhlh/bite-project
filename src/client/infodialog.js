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
 * @fileoverview This file contains RPF's info dialog.
 * It gets popped up when user clicks the log info button.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.InfoDialog');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.Dialog');



/**
 * A class for showing info dialog for playback logs.
 * @constructor
 * @export
 */
rpf.InfoDialog = function() {
  /**
   * The info dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.infoDialog_ = new goog.ui.Dialog();

  /**
   * Inits the info dialog.
   */
  this.initInfoDialog_();
};


/**
 * Sets the visibility of the info dialog.
 * @param {boolean} display Whether to show the dialog.
 * @export
 */
rpf.InfoDialog.prototype.setVisible = function(display) {
  this.infoDialog_.setVisible(display);
};


/**
 * Inits the info dialog.
 * @private
 */
rpf.InfoDialog.prototype.initInfoDialog_ = function() {
  var dialogElem = this.infoDialog_.getContentElement();
  var contentDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'logs', 'style': 'height: 300px; overflow: scroll;'});
  dialogElem.appendChild(contentDiv);
  this.infoDialog_.setTitle('Logs');
  this.infoDialog_.setButtonSet(null);
  // The dialog seems not initializing before setting it visible.
  this.infoDialog_.setVisible(true);
  // Hide the dialog afterwards.
  this.infoDialog_.setVisible(false);
};
