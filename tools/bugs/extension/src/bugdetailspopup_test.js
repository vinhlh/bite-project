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
 * @fileoverview Creates a popup on the page giving users details about
 * a particular bug and ways to interact with it, such as commenting
 * and changing the status.
 *
 * @author bustamante@google.com (Richard Bustamante)
 */


goog.require('Bite.Constants');
goog.require('bite.client.BugDetailsPopup');
goog.require('bite.client.Templates');
goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('goog.testing.PropertyReplacer');


var stubs_ = new goog.testing.PropertyReplacer();


// Mock the chrome namespace if it's not defined.
if (typeof(chrome) == 'undefined') {
  var chrome = {};

  /**
   * Mocking the chrome.extension namespace
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

var mockIssueTrackerBugData = {key: 98,
                               id: '12345',
                               title: 'Unit Test Issue Tracker Bug',
                               status: 'Testing',
                               state: 'active',
                               priority: 'Top',
                               details_link: 'http://test.asite.com/test',
                               provider: 'issuetracker',
                               project: 'unittest',
                               reported_on: '2010-10-10T20:00:00.123456',
                               author: 'author@bite.com',
                               author_url: 'http://code.google.com/u/author',
                               last_update: '2010-10-20T20:00:00.123456',
                               last_updater: 'test@bite.com',
                               last_updater_url: 'http://code.google.com/' +
                                                 'u/test'};


/**
 * Constructor called at the end of each test case/
 * @this The context of the unit test.
 */
function setUp() {
  this.popupClient = new bite.client.BugDetailsPopup();
  this.mockCaller = new mockCallBack();
}


/**
 * Destructor called at the end of each test case.
 * @this The context of the unit test.
 */
function tearDown() {
  stubs_.reset();
  this.popupClient.destroyBugPopup(true);
}


/**
 * Creates a fake popup if none exists;
 * @return {Element} The HTML element of the fake popup.
 */
function createPopup() {
  // Don't create duplicates.
  if (!popupExists()) {
    var mockBugPopup = goog.dom.createDom(
        goog.dom.TagName.DIV,
        {'id': bite.client.BugDetailsPopup.POPUP_CONTAINER_ID,
         'innerHTML': 'Test'});
    goog.dom.appendChild(goog.global.document.body, mockBugPopup);
    return mockBugPopup;
  }
}


/**
 * Determines whether the popup exists.
 * @return {boolean} Returns true if found, otherwise false.
 */
function popupExists() {
  if (goog.dom.getElement(
          bite.client.BugDetailsPopup.POPUP_CONTAINER_ID)) {
    return true;
  }
  return false;
}


/**
 * Empty function for mocking calls that don't need to do anything.
 */
function emptyFunction() {
}


/**
 * Mock calls for various functions.
 * @export
 */
function mockCallBack() {
}


/**
 * @type {string} The last method call.
 * @export
 */
mockCallBack.prototype.lastCall = '';


/**
 * @type {object} A list containing the parameters of the last method call.
 * @export
 */
mockCallBack.prototype.lastParameters = null;


/**
 * Resets the mockCallBack members to their default values.
 * @export
 */
mockCallBack.prototype.reset = function() {
  this.lastCall = '';
  this.lastParameters = null;
};


/**
 * Mocks goog.Timer.callOnce.
 * @param {function()} func The function callOnce would normally call.
 * @param {delay} delay The delay in milliseconds before calling the function.
 * @param {Object} context The context to call the function in.
 * @export
 */
mockCallBack.prototype.callOnce = function(func, delay, context) {
  this.lastCall = 'callOnce';
  this.lastParameters = [func, delay, context];
};


/**
 * Mocks goog.bind.
 * @param {function()} func The function goog.bind would normally call.
 * @param {Object} context The context to call the function in.
 * @param {Object} arg1 The first argument provided to func.
 * @param {Object} arg2 The second argument provided to func.
 * @param {Object} arg3 The third argument provided to func.
 * @export
 */
mockCallBack.prototype.bind = function(func, context, arg1, arg2, arg3) {
  this.lastCall = 'bind';
  this.lastParameters = [func, context, arg1, arg2, arg3];
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
 * Verifies a Soy Template is called with all the expected parameters.
 * @param {Object} expectedValues The expected values in the template call.
 * @param {Object} actualValues The actual values in the template call.
 */
function verifyTemplateCallContains(expectedValues, actualValues) {
  for (prop in expectedValues) {
    assertEquals('Verifying ' + prop, expectedValues[prop], actualValues[prop]);
  }
}


/**
 * Testing bite.client.BugDetailsPopup.flagBugPopupRemoval
 * @this The context of the unit test.
 */
function testFlagBugPopupRemoval() {
   stubs_.set(goog.Timer, 'callOnce',
              goog.bind(this.mockCaller.callOnce, this.mockCaller));

  // Test flagging the bug popup's removal.
  this.popupClient.flagBugPopupRemoval(true);
  assertEquals(popupClient.isFlaggedForRemoval(), true);
  assertEquals(this.mockCaller.lastCall, 'callOnce');
  this.mockCaller.reset();

  // Test flagging the bug popup's keep alive.
  this.popupClient.flagBugPopupRemoval(false);
  assertEquals(popupClient.isFlaggedForRemoval(), false);
  assertEquals(this.mockCaller.lastCall, '');

  stubs_.reset();
}


/**
 * Testing bite.client.BugDetailsPopup.destroyBugPopup
 * @this The context of the unit test.
 */
function testDestroyBugPopup() {
  // Test the popup isn't destroyed when removeBugPopup_ is false.
  this.popupClient.setTarget(createPopup());
  this.popupClient.setFlaggedForRemoval(false);
  this.popupClient.setLocked(false);
  this.popupClient.destroyBugPopup(false);
  assertEquals('Test popup not destroyed when removeBugPopup_ is false',
               true, popupExists());
  this.popupClient.destroyBugPopup(true);
  this.popupClient.setTarget(null);

  // Test the popup is destroyed when removeBugPopup_ is true.
  this.popupClient.setTarget(createPopup());
  this.popupClient.setFlaggedForRemoval(true);
  this.popupClient.setLocked(false);
  this.popupClient.destroyBugPopup(false);
  assertEquals('Test popup is destroyed when removeBugPopup_ is true',
               false, popupExists());
  this.popupClient.destroyBugPopup(true);
  this.popupClient.setTarget(null);

  // Test the popup isn't destroyed when the popup is locked.
  this.popupClient.setTarget(createPopup());
  this.popupClient.setFlaggedForRemoval(true);
  this.popupClient.setLocked(true);
  this.popupClient.destroyBugPopup(false);
  assertEquals('Test popup not destroyed when when the popup is locked.',
               true, popupExists());
  this.popupClient.destroyBugPopup(true);
  this.popupClient.setTarget(null);

  // Test the popup is is destroyed when the forcing parameter is used.
  this.popupClient.setTarget(createPopup());
  this.popupClient.setFlaggedForRemoval(false);
  this.popupClient.setLocked(false);
  this.popupClient.destroyBugPopup(true);
  assertEquals('Test popup is destroyed when the forcing parameter is true',
               false, popupExists());
  this.popupClient.destroyBugPopup(true);
  this.popupClient.setTarget(null);

  // Test the popup is is destroyed forced and the popup is locked.
  this.popupClient.setTarget(createPopup());
  this.popupClient.setFlaggedForRemoval(false);
  this.popupClient.setLocked(true);
  this.popupClient.destroyBugPopup(true);
  assertEquals('Test popup is destroyed when the forcing parameter is true ' +
               'and popups are locked',
               false, popupExists());
  this.popupClient.destroyBugPopup(true);
  this.popupClient.setTarget(null);
}


/**
 * Testing bite.client.BugDetailsPopup.createBugPopup
 * @this The context of the unit test.
 */
function testCreatBugPopup() {
  // Ensure the document is large enough, by default it's 8px high.
  goog.style.setSize(goog.global.document.body, 500, 500);

  // Verify a bug popup isn't created when bug popups are locked.
  this.popupClient.setLocked(true);
  this.popupClient.createBugPopup(10, 10, mockIssueTrackerBugData);
  assertEquals('Test a bug popup not created when bug popups are locked.',
               false, popupExists());
  this.popupClient.setLocked(false);

  // Verify a duplicate isn't created, if a popup with the same id exists.
  var fakeBugPopup = createPopup();
  this.popupClient.setTarget(fakeBugPopup);
  this.popupClient.bugId_ = '12345';
  this.popupClient.createBugPopup(10, 10, mockIssueTrackerBugData);
  goog.dom.removeNode(fakeBugPopup);
  assertEquals(false, popupExists());
  this.popupClient.setTarget(null);

  // Verify a new popup is created, if the existing one is for a different bug.
  var fakeBugPopup = createPopup();
  this.popupClient.setTarget(fakeBugPopup);
  this.popupClient.bugId_ = '99999';
  this.popupClient.createBugPopup(10, 10, mockIssueTrackerBugData);
  assertEquals(true, popupExists());
  assertEquals('12345', this.popupClient.bugId_);
  this.popupClient.destroyBugPopup(true);


  // Verify a popup is created at the desired coordinates.
  this.popupClient.setLocked(false);
  assertEquals(false, popupExists());
  var popupElement = popupClient.createBugPopup(80, 90,
                                                mockIssueTrackerBugData);
  var popupPosition = goog.style.getPosition(popupElement);
  assertEquals('Bug Popup element created',
               true, popupExists());

  // Expected x position is the passed in x.
  assertEquals('Bug Popup has the expected x position',
               80, popupPosition.x);
  // Expected y position is the passed in y.
  assertEquals('Bug Popup has the expected y position',
               90, popupPosition.y);

  this.popupClient.destroyBugPopup(true);
}


/**
 * Testing bite.client.BugDetailsPopup.createElementBugPopup
 * @this The context of the unit test.
 */
function testCreateElementBugPopup() {
  var mockOverlay = goog.dom.createDom(goog.dom.TagName.DIV,
                                       {'style': 'position: absolute'});
  goog.dom.appendChild(goog.global.document.body, mockOverlay);

  // Ensure the document is large enough, by default it's 8px high.
  goog.style.setSize(goog.global.document.body, 500, 500);
  goog.style.setPosition(mockOverlay, 100, 100);
  goog.style.setSize(mockOverlay, 75, 25);

  // Verify a popup is created at the desired coordinates.
  this.popupClient.setLocked(false);
  assertEquals(false, popupExists());
  var popupElement = popupClient.createElementBugPopup(mockOverlay,
                                                mockIssueTrackerBugData);
  var popupPosition = goog.style.getPosition(popupElement);
  assertEquals('Bug Popup element created',
               true, popupExists());

  // Expected x position is overlay.x + overlay.width + 3px margin.
  assertEquals('Bug Popup has the expected x position',
               100 + 75 + 3, popupPosition.x);
  // Expected y position is overlay.y - 2px margin.
  assertEquals('Bug Popup has the expected y position',
               100 - 2, popupPosition.y);

  this.popupClient.destroyBugPopup(true);
}


/**
 * Testing bite.client.BugDetailsPopup.drawBugData_
 * @this The context of the unit test.
 */
function testDrawBugData() {
  // Verify Issue Tracker bugs are displayed as expected.
  stubs_.set(bite.client.Templates, 'bugDetailsPopup',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'status': 'Testing',
                        'state': 'active',
                        'priority': 'Top',
                        'reportDate': '2010-10-10',
                        'reportBy': 'author',
                        'reportByURI': 'http://code.google.com/u/author',
                        'lastUpdateDate': '2010-10-20',
                        'lastUpdateBy': 'test',
                        'lastUpdateByURI': 'http://code.google.com/u/test',
                        'bugTitle': 'Unit Test Issue Tracker Bug',
                        'state': 'active'}));
  this.popupClient.drawBugData_(mockIssueTrackerBugData,
                                goog.global.document.body);
}


/**
 * Testing bite.client.BugDetailsPopup.getBugIcon_
 * @this The context of the unit test.
 */
function testGetBugIcon() {
  assertEquals('Verify active state returns the correct icon.',
               bite.client.BugDetailsPopup.BugIcons.ACTIVE,
               this.popupClient.getBugIcon_('active'));
  assertEquals('Verify resolved state returns the correct icon.',
               bite.client.BugDetailsPopup.BugIcons.RESOLVED,
               this.popupClient.getBugIcon_('resolved'));
  assertEquals('Verify closed state returns the correct icon.',
               bite.client.BugDetailsPopup.BugIcons.CLOSED,
               this.popupClient.getBugIcon_('closed'));
  assertEquals('Verify unknown state returns the correct icon.',
               bite.client.BugDetailsPopup.BugIcons.UNKNOWN,
               this.popupClient.getBugIcon_('unknown'));
}


/**
 * Testing bite.client.BugDetailsPopup.drawSubmitPopup_
 * @this The context of the unit test.
 */
function testDrawSubmitPopup() {
  var container = goog.dom.createDom(goog.dom.TagName.DIV);

  goog.dom.appendChild(goog.global.document.body, container);

  // Mock out the goog.events.listen for mouse commands
  stubs_.set(goog.events, 'listen', emptyFunction);

  // Verify Issue Tracker bugs are handled as expected.
  stubs_.set(bite.client.Templates, 'bugConfirmChanges',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'command': 'activate'}));
  this.popupClient.drawSubmitPopup('activate',
                                   mockIssueTrackerBugData,
                                   container);
}


/**
 * Testing bite.client.BugDetailsPopup.createBugCommandListeners_
 * @this The context of the unit test.
 */
function testCreateBugCommandListeners() {
  var mockControl = {};

  // Mock out the goog.events.listen for mouse commands
  stubs_.set(goog.events, 'listen', emptyFunction);
  stubs_.set(goog, 'bind', goog.bind(this.mockCaller.bind, this.mockCaller));

  // Verify the correct actions were included in the bind call, if it
  // got that far it also ensures the logic found the command control.
  for (action in bite.client.BugDetailsPopup.BugActions) {
    var command = bite.client.BugDetailsPopup.BugActions[action];
    mockControl = goog.dom.createDom(goog.dom.TagName.DIV,
                                     {'id': 'bug-command-' + command});
    goog.dom.appendChild(goog.global.document.body, mockControl);
    this.popupClient.createBugCommandListeners_(mockIssueTrackerBugData);
    assertEquals('Verifying ' + action, 'bind', this.mockCaller.lastCall);
    assertEquals(command, this.mockCaller.lastParameters[2]);
    goog.dom.removeNode(mockControl);
  }
}


/**
 * Testing bite.client.BugDetailsPopup.postBugUpdate_
 * @this The context of the unit test.
 */
function testPostBugUpdate() {
  var expectedQueryParams = {};
  var details = {'key': 98, 'comment': 'Unit Test Comment'};
  var testComment = goog.dom.createDom(goog.dom.TagName.DIV,
                        {'id': 'bug-popup-comment',
                         'innerHTML': 'Unit Test Comment'});
  goog.dom.appendChild(goog.dom.getDocument().body, testComment);
  stubs_.set(chrome.extension, 'sendRequest',
             goog.bind(this.mockCaller.sendRequest, this.mockCaller));

  // Mock out the disableSubmitPopup_ here, as that's tested elsewhere.
  this.popupClient.disableSubmitPopup_ = emptyFunction;
  this.popupClient.postBugUpdate_(mockIssueTrackerBugData,
                                  goog.dom.getDocument().body);

  expectedQueryParams = {action: Bite.Constants.HUD_ACTION.UPDATE_BUG_STATUS,
                         details: details};

  // Verify the expected call and query parameters were sent.
  assertEquals('Verify sendRequest was called as expected.',
               'sendRequest', this.mockCaller.lastCall);
  for (param in expectedQueryParams) {
    assertEquals('Verify the expected ' + param + ' was sent',
                 expectedQueryParams[param],
                 this.mockCaller.lastParameters[0][param]);
  }
  assertEquals('Verify a status update wasn\'t sent',
               undefined, this.mockCaller.lastParameters[0]['status']);

  details.status = 'Resolved';
  var testStatus = goog.dom.createDom(goog.dom.TagName.SELECT,
                       {'id': 'bug-update-status',
                        'innerHTML': '<OPTION>Resolved</OPTION>'});
  goog.dom.appendChild(goog.dom.getDocument().body, testStatus);
  expectedQueryParams = {action: Bite.Constants.HUD_ACTION.UPDATE_BUG_STATUS,
                         details: details};
  this.popupClient.postBugUpdate_(mockIssueTrackerBugData,
                                  goog.dom.getDocument().body);

  // Verify the expected call and query parameters were sent.
  assertEquals('Verify sendRequest was called as expected.',
               'sendRequest', this.mockCaller.lastCall);
  for (param in expectedQueryParams) {
    assertEquals('Verify the expected ' + param + ' was sent',
                 expectedQueryParams[param],
                 this.mockCaller.lastParameters[0][param]);
  }
}


/**
 * Testing bite.client.BugDetailsPopup.disableSubmitPopup_
 * @this The context of the unit test.
 */
function testDisableSubmitPopup() {
  var testComment = goog.dom.createDom(goog.dom.TagName.DIV,
                        {'id': 'bug-popup-comment'});
  goog.dom.appendChild(goog.global.document.body, testComment);
  var testCancel = goog.dom.createDom(goog.dom.TagName.SPAN,
                        {'id': 'bug-command-cancel'});
  goog.dom.appendChild(goog.global.document.body, testCancel);
  var testSubmit = goog.dom.createDom(goog.dom.TagName.SPAN,
                        {'id': 'bug-command-submit'});
  goog.dom.appendChild(goog.global.document.body, testSubmit);
  var testUpdateStatus = goog.dom.createDom(goog.dom.TagName.SELECT,
                                            {'id': 'bug-update-status'});
  goog.dom.appendChild(goog.global.document.body, testUpdateStatus);
  this.popupClient.disableSubmitPopup_();

  assertEquals('Verify the comment is grayed out',
               testComment.style.color, 'rgb(102, 102, 102)');
  assertEquals('Verify the comment is no longer editable',
               testComment.contentEditable, false);
  assertEquals('Verify the cancel link is grayed out',
               goog.dom.classes.get(testCancel)[0], 'pseudo-link-disabled');
  assertEquals('Verify the submit link is grayed out',
               goog.dom.classes.get(testSubmit)[0], 'pseudo-link-disabled');
  assertEquals('Verify the status drop down is disabled',
               testUpdateStatus.disabled, true);

  goog.dom.removeNode(testComment);
  goog.dom.removeNode(testCancel);
  goog.dom.removeNode(testSubmit);
  goog.dom.removeNode(testUpdateStatus);
}


/**
 * Testing bite.client.BugDetailsPopup.postBugUpdateHandler_
 * @this The context of the unit test.
 */
function testBugUpdateHandler() {
  this.popupClient.contentClient_ = {};
  this.popupClient.contentClient_.getBugData_ = function(id) {
    return mockIssueTrackerBugData;
  }
  stubs_.set(chrome.extension, 'sendRequest',
             goog.bind(this.mockCaller.sendRequest, this.mockCaller));
  this.popupClient.postBugUpdateHandler_('assigned', mockIssueTrackerBugData,
                                         goog.global.document.body, '{}');
  assertEquals('Verify sendRequest was called as expected.',
               'sendRequest', this.mockCaller.lastCall);
}

/**
 * Testing bite.client.BugDetailsPopup.drawConfirmationPopup_
 * @this The context of the unit test.
 */
function testDrawConfirmationPopup() {
  var container = goog.dom.createDom(goog.dom.TagName.DIV);
  this.popupClient.contentClient_ = {};
  this.popupClient.contentClient_.getBugData_ = function(id) {
    return mockIssueTrackerBugData;
  };

  var successJson = JSON.parse('{"success": true}');
  var errorJson = JSON.parse('{"success": false}');
  var accessDeniedJson = JSON.parse('{"success": false, "error": "403, No ' +
                                    'permission to edit issue"}');
  // Mock out the goog.events.listen for mouse commands.
  stubs_.set(goog.events, 'listen', emptyFunction);
  goog.dom.appendChild(goog.global.document.body, container);

  stubs_.set(bite.client.Templates, 'bugResultPopup',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'resultMessage': 'Your comment has been ' +
                                         'successfully posted.'}));
  this.popupClient.drawConfirmationPopup_(undefined, mockIssueTrackerBugData,
                                          container, successJson);

  stubs_.set(bite.client.Templates, 'bugResultPopup',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'resultMessage': 'This issue has been marked as <b>' +
                                         'assigned</b>'}));
  this.popupClient.drawConfirmationPopup_('assigned', mockIssueTrackerBugData,
                                     container, successJson);

  stubs_.set(bite.client.Templates, 'bugResultPopup',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'resultMessage': 'Unable to submit update'}));
  this.popupClient.drawConfirmationPopup_('assigned', mockIssueTrackerBugData,
                                     container, errorJson);

  stubs_.set(bite.client.Templates, 'bugResultPopup',
             goog.bind(verifyTemplateCallContains, this,
                       {'bugID': '12345',
                        'bugLink': 'http://test.asite.com/test',
                        'resultMessage': 'Unable to submit update - Access ' +
                                         'Denied<br><span style="color: ' +
                                         '#6F6F6F; font-size: 7pt">Please ' +
                                         'contact the appropiate team for ' +
                                         'access to<br>update these issues.' +
                                         '</span>'}));
  this.popupClient.drawConfirmationPopup_('assigned', mockIssueTrackerBugData,
                                     container, accessDeniedJson);
}


/**
 * Testing bite.client.BugDetailsPopup.createBoundCommandListeners_
 * @this The context of the unit test.
 */
function testCreateBoundCommandListeners() {
  this.popupClient.eventHandler_.listen = goog.bind(this.mockCaller.listen,
                                                    this.mockCaller);

  // Test the case the "Bound" label hasn't been created yet.
  this.popupClient.createBoundCommandListeners_(mockIssueTrackerBugData,
                                                mockPopup);
  assertEquals('Verify listen was not called as no previous labels existed.',
               '', this.mockCaller.lastCall);

  // Test the main case of adding a listener to the "Bound" label.
  var mockLabel = goog.dom.createDom(goog.dom.TagName.DIV,
                                     {'id': 'bug-popup-bound-label'});
  var mockPopup = goog.dom.createDom(goog.dom.TagName.DIV,
                                     {'id': 'bug-popup-container'});
  goog.dom.appendChild(goog.global.document.body, mockLabel);
  goog.dom.appendChild(goog.global.document.body, mockPopup);
  var bindMocker = new mockCallBack();
  stubs_.set(goog, 'bind', goog.bind(bindMocker.bind, bindMocker));
  this.popupClient.createBoundCommandListeners_(mockIssueTrackerBugData,
                                                mockPopup);
  assertEquals('Verify listen was called.',
               'listen,', this.mockCaller.lastCall);
  assertEquals('Verify the correct element was used.',
               'bug-popup-bound-label',
               this.mockCaller.lastParameters[0][0]['id']);
  assertEquals('Verify the correct command was listened to.',
               goog.events.EventType.CLICK,
               this.mockCaller.lastParameters[0][1]);
  goog.dom.removeNode(mockLabel);
  goog.dom.removeNode(mockPopup);
}


/**
 * Testing bite.client.BugDetailsPopup.showBoundLabelMenu_
 * @this The context of the unit test.
 */
function testShowBoundLabelMenu() {
  // Mock out the calls for removing bug popups.
  this.popupClient.contentClient_ = {};
  this.popupClient.contentClient_.submitRemoveBugBinding_ = emptyFunction;
  var mockLabel = goog.dom.createDom(goog.dom.TagName.DIV,
                                     {'id': 'bug-popup-bound-label'});
  var mockPopup = goog.dom.createDom(goog.dom.TagName.DIV,
                                     {'id': 'bug-popup-container'});
  goog.dom.appendChild(goog.global.document.body, mockLabel);
  goog.dom.appendChild(goog.global.document.body, mockPopup);
  this.popupClient.eventHandler_.listen = goog.bind(this.mockCaller.listen,
                                                    this.mockCaller);
  this.popupClient.showBoundLabelMenu_(mockIssueTrackerBugData, mockPopup,
                                       mockLabel);

  // Verify the two listeners were added, for each control.
  assertEquals('Verify listen was called.',
               'listen,listen,', this.mockCaller.lastCall);
  assertEquals('Verify the correct element was used.',
               'bug-popup-bound-menu-remove',
               this.mockCaller.lastParameters[0][0]['id']);
  assertEquals('Verify the correct command was listened to.',
               goog.events.EventType.CLICK,
               this.mockCaller.lastParameters[0][1]);
  assertEquals('Verify the correct element was used.',
               'bug-popup-bound-menu-cancel',
               this.mockCaller.lastParameters[1][0]['id']);
  assertEquals('Verify the correct command was listened to.',
               goog.events.EventType.CLICK,
               this.mockCaller.lastParameters[1][1]);

  goog.dom.removeNode(mockLabel);
  goog.dom.removeNode(mockPopup);
}

/**
 * Testing bite.client.BugDetailsPopup.toProperCase_
 * @this The context of the unit test.
 */
function testStrToProperCase() {
  assertEquals('Test', this.popupClient.strToProperCase('Test'));
  assertEquals('Test', this.popupClient.strToProperCase('test'));
  assertEquals('Test Message',
               this.popupClient.strToProperCase('test message'));
  assertEquals('', this.popupClient.strToProperCase(''));
}
