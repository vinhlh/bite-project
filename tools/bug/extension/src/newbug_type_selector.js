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
 * @fileoverview New bug type selector, used to ask the user what type of
 * bug they will be filing.
 * @author ralphj@google.com (Julie Ralph)
 */

goog.provide('bite.client.console.NewBugTypeSelector');

goog.require('Bite.Constants');
goog.require('bite.client.BugTemplate');
goog.require('bite.ux.Dragger');
goog.require('bite.client.console.NewBug');
goog.require('bite.client.console.NewBugTypeSelectorTemplate');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('soy');



/**
 * Creates an instance of the NewBug type selector.
 * @param {function(string)} templateCallback
 *     The callback function to use, with the selected template as a parameter.
 * @param {function()} reportBugCallback The callback to continue the bug
 *     reporting proccess.
 * @param {function()} cancelCallback The callback for when the process
 *     is cancelled.
 * @constructor
 */
bite.client.console.NewBugTypeSelector = function(templateCallback,
                                                  reportBugCallback,
                                                  cancelCallback) {

  /**
   * The function to call with the id of the newly selected template.
   * @type {function(string)}
   * @private
   */
  this.templateCallback_ = templateCallback;

  /**
   * The callback to call to continue the bug report process.
   * @type {function()}
   * @private
   */
  this.reportBugCallback_ = reportBugCallback;

  /**
   * The callback to call to cancel the bug type selection.
   * @type {function()}
   * @private
   */
  this.cancelCallback_ = cancelCallback;

  /**
   * Whether or not the new bug type selector is currently showing an
   * interface in the viewport.
   * @type {boolean}
   * @private
   */
  this.isActive_ = false;

  /**
   * Root element for the New Bug Type Selector interface.
   * @type {?Element}
   * @private
   */
  this.rootElement_ = null;

  /**
   * Extension's root folder URL.
   * @type {string}
   * @private
   */
  this.rootFolder_ = chrome.extension.getURL('');

  /**
   * Manages the events for clicks on bug types.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.handler_ = new goog.events.EventHandler(this);

  /**
   * Manages dragging the element.
   * @type {bite.ux.Dragger}
   * @private
   */
  this.dragger_ = null;
};


/**
 * Loads the New Bug Type Selector.
 * @param {Object.<string, bite.client.BugTemplate>} templates The templates to
 *     choose from.
 */
bite.client.console.NewBugTypeSelector.prototype.load = function(templates) {
  if (this.isActive_) {
    return;
  }
  var bugTypes = [];
  for (var templateId in templates) {
    bugTypes.push(
        {bugTemplate: templateId,
         bugText: templates[templateId]['selectorText'],
         displayOrder: templates[templateId]['displayOrder']});
  }
  // If there is only one option for the template, use that and exit early.
  if (bugTypes.length == 1) {
    this.selectType_(bugTypes[0].bugTemplate);
    return;
  }
  goog.array.sortObjectsByKey(bugTypes, 'displayOrder');
  this.rootElement_ = soy.renderAsElement(
      bite.client.console.NewBugTypeSelectorTemplate.newBugTypeSelector,
      {rootFolder: this.rootFolder_,
       bugTypes: bugTypes});
  goog.dom.appendChild(goog.dom.getDocument().body, this.rootElement_);
  var top = goog.dom.getViewportSize().height;
  var left = goog.dom.getViewportSize().width;
  // Center the type selector in the viewport.
  goog.style.setPosition(
      this.rootElement_,
      (left - goog.style.getSize(this.rootElement_).width) / 2,
      (top - goog.style.getSize(this.rootElement_).height) / 2);

  var headerElement =
      this.rootElement_.querySelector('.bite-header');
  this.dragger_ = new bite.ux.Dragger(this.rootElement_, headerElement);
  this.attachHandlers_(bugTypes);
  this.isActive_ = true;
};


/**
 * Attaches handlers to the UI elements of the NewBug type selector.
 * @param {Array.<{bugTemplate: string}>} bugTypes The ids
 *     associated with the bug templates.
 * @private
 */
bite.client.console.NewBugTypeSelector.prototype.attachHandlers_ =
    function(bugTypes) {
  var cancelButton = this.rootElement_.querySelector(
      '.bite-close-button');
  this.handler_.listen(cancelButton,
                       goog.events.EventType.CLICK,
                       goog.bind(this.cancel_, this));
  for (var i = 0; i < bugTypes.length; ++i) {
    var bugTemplate = bugTypes[i].bugTemplate;
    var bugText = this.rootElement_.querySelector('#' + bugTemplate);
    this.handler_.listen(bugText,
                         goog.events.EventType.CLICK,
                         goog.bind(this.selectType_, this, bugTemplate));
  }
};


/**
 * Sets the template for the newbug and begins the newbug filing process.
 * @param {string} template The id of the template to use.
 * @private
 */
bite.client.console.NewBugTypeSelector.prototype.selectType_ =
    function(template) {
  this.templateCallback_(template);
  this.continueReportBug_();
};


/**
 * Asks the content script to continue filing a new bug and closes the
 * type selection console.
 * @private
 */
bite.client.console.NewBugTypeSelector.prototype.continueReportBug_ =
    function() {
  this.reportBugCallback_();
  this.close_();
};


/**
 * Cancels the type selection.
 * @private
 */
bite.client.console.NewBugTypeSelector.prototype.cancel_ = function() {
  this.cancelCallback_();
  this.close_();
};


/**
 * Closes the new bug type selection console.
 * @private
 */
bite.client.console.NewBugTypeSelector.prototype.close_ = function() {
  goog.dom.removeNode(this.rootElement_);
  this.handler_.removeAll();
  this.rootElement_ = null;
  this.isActive_ = false;
};

