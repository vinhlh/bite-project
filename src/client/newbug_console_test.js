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
 * @fileoverview Tests for New Bug Form which is used to log a bug.
 *
 * @author ekamenskaya@google.com (Ekaterina Kamenskaya)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');


var stubs_ = new goog.testing.PropertyReplacer();


// Mock the chrome namespace if it's not defined.
if (typeof(chrome) == 'undefined') {
  var chrome = {};

  /**
   * Mocking the chrome.extension namespace.
   * @export
   */
  chrome.extension = {};

  /**
   * Mocking chrome.extension.getURL and simply returning the relative path.
   * @param {string} img The relative path of the img to the extension.
   * @return {string} The relative path that was passed in.
   * @export
   */
  chrome.extension.getURL = function(img) {
    return img;
  };
}


/**
* Mocks bite.client.console.NewBug.TemplateDetails_.
*/
var TemplateDetails = {
  'selectedTemplateFirst':
      {project: 'test_project_first',
       path: '{test_trash_first}',
       backendProject: 'test_trash_first',
       backendProvider: Bite.Constants.Providers.ISSUETRACKER},
  'selectedTemplateSecond':
      {project: 'test_project_second',
       path: '{test_trash_second}',
       backendProject: 'test_trash_second',
       backendProvider: Bite.Constants.Providers.ISSUETRACKER}
};


/**
 * Constructor called at the end of each test case/
 * @this The context of the unit test.
 */
function setUp() {
  this.mockCaller = new mockCallBack();
  stubs_.set(chrome.extension, 'sendRequest',
             goog.bind(this.mockCaller.sendRequest, this.mockCaller));

  var user = 'test-bite@google.com';
  this.newBugConsole = new bite.client.console.NewBug(user);
  this.mockCaller.reset();
}


/**
 * Destructor called at the end of each test case.
 * @this The context of the unit test.
 */
function tearDown() {
  this.mockCaller.reset();
  stubs_.reset();
}


/**
 * Mocks calls for various functions.
 * @constructor
 * @export
 */
mockCallBack = function() {
  /**
   * The last method call.
   * @type {string}
   */
  this.lastCall = '';


  /**
   * A list containing the parameters of the last method call.
   * @type {Object}
   */
  this.lastParameters = null;
};


/**
 * Resets the mockCallBack members to their default values.
 * @export
 */
mockCallBack.prototype.reset = function() {
  this.lastCall = '';
  this.lastParameters = null;
};


/**
 * Mocks chrome.extension.sendRequest.
 * @param {Object} queryParams The query parameters for sendRequest.
 * @param {function()} callback The callback function to run when finished.
 * @export
 */
mockCallBack.prototype.sendRequest = function(queryParams, callback) {
  this.lastCall = 'sendRequest';
  this.lastParameters = [queryParams, callback];
};


/**
 * Mocks querySelector method.
 * @param {string} selectors The string containing one or more CSS selectors
 *     separated by commas.
 * @return {Node} The node returned by querySelector.
 * @export
 */
mockCallBack.prototype.querySelector = function(selectors) {
  this.lastCall = 'querySelector';
  this.lastParameters = [selectors];
  return goog.dom.createDom(goog.dom.TagName.DIV);
};


/**
 * Mocks bite.client.console.NewBug.setConsoleHandlers_.
 * @export
 */
mockCallBack.prototype.setConsoleHandlers = function() {
  this.lastCall = 'setConsoleHandlers';
  this.lastParameters = [];
};


/**
 * Mocks bite.client.console.NewBug.changeTemplateHandler_.
 * @export
 */
mockCallBack.prototype.changeTemplateHandler = function() {
  this.lastCall = 'changeTemplateHandler';
  this.lastParameters = [];
};


/**
 * Mocks goog.events.listen, stores multiple listens.
 * @param {Element} element The element to attach a listener to.
 * @param {String} command The command to listen to.
 * @param {function()} func The function to call when the event happens.
 * @export
 */
mockCallBack.prototype.listen = function(element, command, func) {
  this.lastCall += 'listen,';
  if (!this.lastParameters) {
    this.lastParameters = [[element, command, func]];
  } else {
    this.lastParameters.push([element, command, func]);
  }
};


/**
 * Mocks goog.dom.appendChild.
 * @param {Node} parent The parent element.
 * @param {Node} child The child element.
 * @export
 */
mockCallBack.prototype.appendChild = function(parent, child) {
  this.lastCall = 'appendChild';
  this.lastParameters = [parent, child];
};


/**
 * Mocks goog.dom.removeChildren.
 * @param {Node} parent The parent element.
 * @export
 */
mockCallBack.prototype.removeChildren = function(parent) {
  this.lastCall = 'removeChildren';
  this.lastParameters = [parent];
};


/**
 * Mocks submit method.
 * @export
 */
mockCallBack.prototype.submit = function() {
  this.lastCall = 'submit';
  this.lastParameters = [];
};


/**
 * Mocks common.client.ElementDescriptor.generateElementDescriptorNAncestors
 * method.
 * @param {Element} element The selected element.
 * @param {number} level The level to generate descriptor.
 * @return {string} The resulted descriptor.
 * @export
 */
mockCallBack.prototype.generateElementDescriptorNAncestors = function(element,
                                                                      level) {
  this.lastCall = 'generateElementDescriptorNAncestors';
  this.lastParameters = [element, level];
  return 'descriptor';
};


/**
 * Testing bite.client.console.NewBug.prototype.getCurrentUrl_.
 * @this The context of the unit test.
 */
function testGetCurrentUrl() {
  assertEquals(goog.global.location.href, this.newBugConsole.getCurrentUrl_());
  assertEquals('', this.mockCaller.lastCall);
}


/**
 * Testing bite.client.console.NewBug.prototype.show.
 * @this The context of the unit test.
 */
function testShow() {
  var mocks = new goog.testing.MockControl();
  var selectedElement = goog.dom.createDom(goog.dom.TagName.DIV);
  this.newBugConsole.templatesList_ = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': 'fakeTemplatesList_'});
  this.newBugConsole.templates_ = TemplateDetails;

  stubs_.set(this.newBugConsole.templatesList_, 'querySelector',
             goog.bind(this.mockCaller.querySelector, this.mockCaller));
  stubs_.set(this.newBugConsole, 'setConsoleHandlers_',
             goog.bind(this.mockCaller.setConsoleHandlers, this.mockCaller));
  stubs_.set(this.newBugConsole, 'changeTemplateHandler_',
             goog.bind(this.mockCaller.changeTemplateHandler, this.mockCaller));
  stubs_.set(goog.dom, 'getElement',
             goog.bind(this.mockCaller.querySelector, this.mockCaller));
  var mockContainer = mocks.createLooseMock(bite.client.Container);
  var mockContainerConstructor = mocks.createConstructorMock(
      bite.client, 'Container');
  mockContainerConstructor(goog.testing.mockmatchers.ignoreArgument,
                           goog.testing.mockmatchers.ignoreArgument,
                           goog.testing.mockmatchers.ignoreArgument,
                           goog.testing.mockmatchers.ignoreArgument,
                           false, true).$returns(mockContainer);
  mockContainer.setContentFromHtml(
      goog.testing.mockmatchers.ignoreArgument).$times(1);
  mockContainer.showInfoMessageOnce(
      goog.testing.mockmatchers.isString,
      goog.testing.mockmatchers.isString).$times(1);
  mockContainer.getRoot().$anyTimes().$returns(this.mockCaller);
  mocks.$replayAll();
  assertEquals(this.newBugConsole.rootElement_,
      this.newBugConsole.show(selectedElement));
  assertEquals('Verify changeTemplateHandler_ was called',
               'changeTemplateHandler', this.mockCaller.lastCall);
  mocks.$verifyAll();
  mocks.$tearDown();
}

