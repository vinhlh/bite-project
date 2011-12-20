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
 * @fileoverview Tests for the New Bug Type Selector.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');


var mocks_ = null;
var stubs_ = new goog.testing.PropertyReplacer();

/**
 * Example single template.
 */
var singleTemplate = {
  templateOne: {
    name: 'templateOne',
    url: 'http://www.google.com',
    project: 'project_test',
    path: 'Projects > Test',
    backendProject: 'test',
    backendProvider: Bite.Constants.Providers.ISSUETRACKER,
    selectorText: 'test',
    displayOrder: 4,
    noteText: 'test'
  }
};


/**
 *Example multiple templates.
 */
var testTemplates = {
  templateOne: {
    name: 'templateOne',
    url: 'http://www.google.com',
    project: 'project_test',
    path: 'Projects > Test',
    backendProject: 'test',
    backendProvider: Bite.Constants.Providers.ISSUETRACKER,
    selectorText: 'test',
    displayOrder: 1,
    noteText: 'test'
  },
  templateTwo: {
    name: 'templateTwo',
    url: 'http://www.google.com',
    project: 'project_test_2',
    path: 'Projects > Test2',
    backendProject: 'test2',
    backendProvider: Bite.Constants.Providers.ISSUETRACKER,
    selectorText: 'test2',
    displayOrder: 2,
    noteText: 'test2'
  }
};


/**
 * Stores the template returned by the New Bug Type Selector when it
 * exits.
 * @constructor
 * @export
 */
mockCallBack = function() {
  /**
   * The template name that was returned.
   * @type {string}
   */
  this.storedTemplate = null;

  /**
   * Whether continue has been called.
   * @type {boolean}
   */
  this.continueCalled = false;
};


/**
 * Resets storedTemplate back to its default.
 * @export
 */
mockCallBack.prototype.reset = function() {
  this.storedTemplate = null;
  this.continueCalled = false;
};


/**
 * The actual callback to pass to NewBugTypeSelector.
 * @param {string} template The template name to store.
 * @export
 */
mockCallBack.prototype.templateCallback = function(template) {
  this.storedTemplate = template;
};


/**
 * The continue bug callback.
 */
mockCallBack.prototype.continueCallback = function() {
  this.continueCalled = true;
};


function setUp() {
  initChrome();
  mocks_ = new goog.testing.MockControl();
  this.mockCaller = new mockCallBack();
  this.newBugTypeSelector =
      new bite.client.console.NewBugTypeSelector(
          goog.bind(this.mockCaller.templateCallback, this.mockCaller),
          goog.bind(this.mockCaller.continueCallback, this.mockCaller));
}

function tearDown() {
  stubs_.reset();
  mocks_.$tearDown();
  this.mockCaller.reset();
}

function testLoad() {
  var fakeRoot =
      goog.dom.createDom(goog.dom.TagName.DIV, {'id': 'fakeRootElement'});
  var fakeElement =
      goog.dom.createDom(goog.dom.TagName.DIV, {'id': 'fakeElement'});
  stubs_.set(soy, 'renderAsElement', function() {return fakeRoot});
  fakeRoot.querySelector = function() {return fakeElement;};
  var mockListen = mocks_.createFunctionMock('listen');
  mockListen(goog.testing.mockmatchers.isObject,
             goog.testing.mockmatchers.isString,
             goog.testing.mockmatchers.isFunction).$times(3);
  stubs_.set(goog.events.EventHandler.prototype, 'listen', mockListen);
  var mockDragger = mocks_.createStrictMock(bite.ux.Dragger);
  var mockDraggerCtor = mocks_.createConstructorMock(bite.client, 'Dragger');
  mockDraggerCtor(fakeRoot, fakeElement, true).$returns(mockDragger);
  mocks_.$replayAll();
  this.newBugTypeSelector.load(testTemplates);
  mocks_.$verifyAll();
}

function testSingleTemplateExitsEarly() {
  this.newBugTypeSelector.load(singleTemplate);
  assertEquals('templateOne', this.mockCaller.storedTemplate);
}

function testSelectType() {
  stubs_.set(this.newBugTypeSelector, 'close_', function() {});
  this.newBugTypeSelector.selectType_('test1');
  assertEquals('test1', this.mockCaller.storedTemplate);

  this.newBugTypeSelector.selectType_('test2');
  assertEquals('test2', this.mockCaller.storedTemplate);

  assertTrue(this.mockCaller.continueCalled);
}

