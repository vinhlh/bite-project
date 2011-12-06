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
 * @fileoverview Tests for the code on the Options script file.
 *
 * @author alexto@google.com (Alexis O. Torres)
 */


goog.require('bite.options.Page');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.events');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var configuration = {
  'project': bite.options.constants.ProjectOption.NOT_TRASH,
  'recording': bite.options.constants.ThreeWayOption.ALL,
  'screenshot': bite.options.constants.ThreeWayOption.ALL,
  'state': bite.options.constants.StateOption.ALL,
  'uiBinding': bite.options.constants.ThreeWayOption.ALL,
  'serverChannel': bite.options.constants.ServerChannelOption.DEVELOPMENT,
  'autoRecord': 'false',
  'featuresBugs': 'false',
  'featuresRpf': 'false',
  'featuresTests': 'false'
};

function setUp() {
  initChrome();
  mockOnRequest = {addListener: goog.nullFunction,
                   hasListener: function() {return false}};
  stubs_.set(chrome.extension, 'onRequest', mockOnRequest);
}


function tearDown() {
  if (mockControl_) {
    mockControl_.$tearDown();
    mockControl_ = null;
  }
  stubs_.reset();
}


function testSaveOptions() {
  mockControl_ = new goog.testing.MockControl();

  optionsPage = new bite.options.Page();

  var mockGet = mockControl_.createFunctionMock('get');
  stubs_.set(bite.options.data, 'get', mockGet);
  var mockConfiguration = mockControl_.createFunctionMock(
      'getCurrentConfiguration');
  stubs_.set(bite.options.data, 'getCurrentConfiguration', mockConfiguration);
  var mockPrivateGet = mockControl_.createFunctionMock('get');
  stubs_.set(bite.options.private_data, 'get', mockPrivateGet);
  var mockUpdateConfiguration = mockControl_.createFunctionMock(
      'updateConfiguration');
  stubs_.set(bite.options.data, 'updateConfiguration', mockUpdateConfiguration);

  mockConfiguration().$returns(configuration);
  // The LoginManager calls bite.options.data.get for the server channel.
  mockGet('serverChannel').$anyTimes();
  mockGet('featuresBugs').$times(1);
  mockGet('serverChannel').$anyTimes();
  mockPrivateGet(goog.testing.mockmatchers.isString).$anyTimes().$returns(
      'false');
  var expectedChanges = {'featuresBugs': 'true'};
  mockUpdateConfiguration(expectedChanges, undefined).$times(1);

  mockControl_.$replayAll();

  optionsPage.init();
  assertTrue(optionsPage.isReady());

  var bugsCheckbox = goog.dom.getElement('features-bugs');
  bugsCheckbox.checked = true;
  goog.testing.events.fireClickEvent(bugsCheckbox);

  var saveButton = goog.dom.getElement('save-button');
  goog.testing.events.fireClickEvent(saveButton);

  optionsPage.stop();
  assertTrue(optionsPage.isDestroyed());
  mockControl_.$verifyAll();
}

