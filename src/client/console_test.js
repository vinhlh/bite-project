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
 * @fileoverview Unit tests for console UI.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('rpf.ConsoleManager');
goog.require('rpf.InfoDialog');
goog.require('rpf.LoaderDialog');
goog.require('rpf.NotesDialog');
goog.require('rpf.PlayDialog');
goog.require('rpf.QuickCmdDialog');
goog.require('rpf.SaveDialog');
goog.require('rpf.SaveLoadManager');
goog.require('rpf.ScreenShotDialog');
goog.require('rpf.SettingDialog');
goog.require('rpf.ValidateDialog');


var stubs_ = new goog.testing.PropertyReplacer();
var mockControl_ = null;
var chrome = {};
var CodeMirror = {};
var JSON = {};
var localStorage = {'getItem': function() {},
    'setItem': function() {}};

function setUp() {
  mockControl_ = new goog.testing.MockControl();
  chrome.extension = {};
  stubs_.set(goog.global, 'chrome', chrome);
}


function tearDown() {
  mockControl_.$tearDown();
  mockControl_ = null;
  stubs_.reset();
}


function initStep() {
  var mockGetBackgroundPage =
      mockControl_.createFunctionMock('getBackgroundPage');
  var mockGetTestNamesLocally_ =
      mockControl_.createFunctionMock('getTestNamesLocally');
  mockGetTestNamesLocally_().$returns('c');
  var mockGetAllFromWeb_ =
      mockControl_.createFunctionMock('getAllFromWeb');
  mockGetAllFromWeb_(goog.testing.mockmatchers.isObject,
      goog.testing.mockmatchers.isString).$returns();
  var mockGetJsonFromWTF_ =
    mockControl_.createFunctionMock('getJsonFromWTF');
  mockGetJsonFromWTF_(undefined, 'console').$returns();
  var mockGetCommonLibs =
      mockControl_.createFunctionMock('fetchCommonLibs');
  mockGetCommonLibs(goog.testing.mockmatchers.isFunction).$returns();
  mockGetBackgroundPage().$returns(
      {'logger': {},
       'fetchCommonLibs': mockGetCommonLibs,
       'saveLoadMgr': {'getTestNamesLocally': mockGetTestNamesLocally_,
                       'getAllFromWeb': mockGetAllFromWeb_,
                       'getJsonFromWTF': mockGetJsonFromWTF_}});
  mockGetBackgroundPage().$returns(
      {'logger': {},
       'fetchCommonLibs': mockGetCommonLibs,
       'saveLoadMgr': {'getTestNamesLocally': mockGetTestNamesLocally_,
                       'getAllFromWeb': mockGetAllFromWeb_,
                       'getJsonFromWTF': mockGetJsonFromWTF_}});
  mockGetBackgroundPage().$returns(
      {'logger': {},
       'fetchCommonLibs': mockGetCommonLibs,
       'saveLoadMgr': {'getTestNamesLocally': mockGetTestNamesLocally_,
                       'getAllFromWeb': mockGetAllFromWeb_,
                       'getJsonFromWTF': mockGetJsonFromWTF_}});
  return mockGetBackgroundPage;
}


function testSetVisible() {
  var mockParse_ =
    mockControl_.createFunctionMock('parse');
  mockParse_('').$returns([]);
  JSON.parse = mockParse_;
  var mockCodeMirror_ = mockControl_.createStrictMock(CodeMirror);
  var mockCodeMirrorCtor_ =
      mockControl_.createGlobalFunctionMock('CodeMirror');
  CodeMirror.replace =
      mockControl_.createFunctionMock('replace');
  CodeMirror.replace(null).$returns('b');
  mockCodeMirrorCtor_('b', goog.testing.mockmatchers.isObject).
      $returns(mockCodeMirror_);
  var mockGetBackgroundPage = initStep();
  chrome.extension.getBackgroundPage = mockGetBackgroundPage;
  var mockEditor = {'win': {'attachEvent': function() {}}};
  var mockGetCode = mockControl_.createFunctionMock('getCode');
  mockGetCode().$returns('a');
  mockEditor.getCode = mockGetCode;
  mockControl_.$replayAll();
  var validateDialog = new rpf.ConsoleManager(mockEditor);
  mockControl_.$verifyAll();
}


function testStartPlayback() {
  var mockParse_ =
    mockControl_.createFunctionMock('parse');
  mockParse_('').$returns([]);
  JSON.parse = mockParse_;
  var mockCodeMirror_ = mockControl_.createStrictMock(CodeMirror);
  var mockCodeMirrorCtor_ =
      mockControl_.createGlobalFunctionMock('CodeMirror');
  CodeMirror.replace =
      mockControl_.createFunctionMock('replace');
  CodeMirror.replace(goog.testing.mockmatchers.isObject).$returns('b');
  mockCodeMirrorCtor_('b', goog.testing.mockmatchers.isObject).
      $returns(mockCodeMirror_);
  var mockCheckRunnable = mockControl_.createMethodMock(
      rpf.ConsoleManager.prototype, 'checkRunnable_');
  mockCheckRunnable().$returns(true);
  var mockSetPlayStatus = mockControl_.createMethodMock(
      rpf.ConsoleManager.prototype, 'setPlayStatus');
  mockSetPlayStatus(true).$returns(true);
  var mockEditor = {'win': {'attachEvent': function() {}}};
  var mockGetCode = mockControl_.createFunctionMock('getCode');
  mockGetCode().$returns('a');
  mockEditor.getCode = mockGetCode;

  var mockGetBackgroundPage = initStep();
  mockGetBackgroundPage().$returns(
      {'playbackMgr': {'preparationDone_': true}});
  var mockSetStepMode = mockControl_.createFunctionMock('setStepMode');
  mockSetStepMode(false).$returns(true);
  mockGetBackgroundPage().$returns(
      {'playbackMgr': {'setStepMode': mockSetStepMode}});
  var mockSetUserPauseReady =
      mockControl_.createFunctionMock('setUserPauseReady');
  mockSetUserPauseReady(true).$returns(true);
  mockGetBackgroundPage().$returns(
      {'playbackMgr': {'setUserPauseReady': mockSetUserPauseReady}});
  chrome.extension.getBackgroundPage = mockGetBackgroundPage;
  mockControl_.$replayAll();
  var console = new rpf.ConsoleManager(mockEditor);
  console.startPlayback(Bite.Constants.PlayMethods.ALL);
  mockControl_.$verifyAll();
}
