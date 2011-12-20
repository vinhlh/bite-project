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
 * @fileoverview Handles the Tests console, which shows testing suites
 * that the user belongs to.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.TestsConsole');

goog.require('Bite.Constants');
goog.require('bite.ux.Container');
goog.require('bite.client.Templates');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('soy');



/**
 * Creates a tests console and displays it on the current page.
 * @param {?string} user The email of the current user.
 * @param {string} server The current server channel.
 * @constructor
 */
bite.client.TestsConsole = function(user, server) {
  /**
   * The tests console container.
   * @type {bite.ux.Container}
   * @private
   */
  this.container_ = null;

  /**
   * Manages events on the overlay.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * Test data.
   *
   * TODO(ralphj): Considering making this more specified than 'object'.
   * @type {Object}
   * @private
   */
  this.test_ = null;

  this.load_(user, server);
};


/**
 * Returns whether or not the console is currently visible on screen.
 * @return {boolean} True if the console is visible.
 */
bite.client.TestsConsole.prototype.isConsoleVisible = function() {
  if (this.container_) {
    return this.container_.isVisible();
  }
  return false;
};


/**
 * Updates the data stored in the test console.
 * @param {Object} test The new test data.
 * @param {?string} user The email of the current user.
 * @param {string} server The current server channel.
 */
bite.client.TestsConsole.prototype.updateData = function(test, user, server) {
  this.test_ = test;
  this.renderTestsInfo_(user, server);
};


/**
 * Removes the console element from the page.
 * @return {boolean} Whether the console was removed or not.
 */
bite.client.TestsConsole.prototype.removeConsole = function() {
  if (this.container_) {
    this.container_.remove();
    this.container_ = null;
    this.eventHandler_.removeAll();
    return true;
  }
  return false;
};


/**
 * Hides the console element from the page.
 */
bite.client.TestsConsole.prototype.hideConsole = function() {
  if (this.container_) {
    this.container_.hide();
  }
};


/**
 * Shows the console element.
 */
bite.client.TestsConsole.prototype.showConsole = function() {
  if (this.container_) {
    this.container_.show();
  }
};


/**
 * Loads the test console.
 * @param {?string} user The user's e-mail.
 * @param {string} server The server url.
 * @private
 */
bite.client.TestsConsole.prototype.load_ = function(user, server) {
  this.container_ = new bite.ux.Container(server, 'bite-tests-console',
                                          'Tests', 'Lists Available Tests',
                                          true);
  var rootFolder = chrome.extension.getURL('');
  this.container_.setContentFromHtml(bite.client.Templates.testsConsole(
      {rootFolder: rootFolder,
       serverUrl: server}));

  this.renderTestsInfo_(user, server);

  this.setConsoleHandlers_();
};


/**
 * Renders information about the available tests.
 * @param {?string} user The user's e-mail.
 * @param {string} server The server url.
 * @private
 */
bite.client.TestsConsole.prototype.renderTestsInfo_ = function(user, server) {
  if (this.test_) {
    var testId = this.test_['test_id'];
    var redirectUrl = server + '/compat/redirect?test_id=' +
        testId;

    var targetUrl = goog.dom.getElementByClass('bite-console-target-url',
                                               this.container_.getRoot());
    targetUrl.innerHTML = goog.dom.createDom(
        'a', {'href': redirectUrl}, this.test_['test_url']).outerHTML;
    var reproSteps = goog.dom.getElement('bite-tests-console-repro-steps');
    reproSteps.innerText = this.test_['verification_steps'];
  } else {
    var contentHtml = 'No tests are available. ';
    if (user) {
      contentHtml += 'You are logged in as ' + user +
          '. Not you? <a href="' + server +
          '">Please re-login.</a>';
    } else {
      contentHtml += '<b><a href="' + server +
          '">Please login.</a></b>';
    }
    var contentCanvas = goog.dom.getElement('bite-tests-content-canvas');
    contentCanvas.innerHTML = contentHtml;
  }
};


/**
 * Sets up the handlers for the tests console.
 * @private
 */
bite.client.TestsConsole.prototype.setConsoleHandlers_ = function() {
  var hideConsole = goog.dom.getElementByClass('bite-close-button',
                                               this.container_.getRoot());
  if (hideConsole) {
    this.eventHandler_.listen(hideConsole, goog.events.EventType.CLICK,
                              goog.bind(this.hideConsole, this));
  }

  var passButton = goog.dom.getElement('bite-tests-toolbar-button-pass');
  if (this.test_ && passButton) {
    this.eventHandler_.listen(passButton, goog.events.EventType.CLICK,
                              goog.bind(this.confirmAction_, this,
                                        Bite.Constants.TestResult.PASS));
  } else if (passButton) {
    goog.dom.classes.swap(passButton, 'bite-toolbar-button',
                          'bite-toolbar-button-disabled');
  }

  var failButton = goog.dom.getElement('bite-tests-toolbar-button-fail');
  if (this.test_ && failButton) {
    this.eventHandler_.listen(failButton, goog.events.EventType.CLICK,
                              goog.bind(this.confirmAction_, this,
                                        Bite.Constants.TestResult.FAIL));
  } else if (failButton) {
    goog.dom.classes.swap(failButton, 'bite-toolbar-button',
                          'bite-toolbar-button-disabled');
  }

  var skipButton = goog.dom.getElement('bite-tests-toolbar-button-skip');
  if (this.test_ && skipButton) {
    this.eventHandler_.listen(skipButton, goog.events.EventType.CLICK,
                              goog.bind(this.confirmAction_, this,
                                        Bite.Constants.TestResult.SKIP));
  } else if (skipButton) {
    goog.dom.classes.swap(skipButton, 'bite-toolbar-button',
                          'bite-toolbar-button-disabled');
  }

  var newBugButton = goog.dom.getElement('bite-tests-toolbar-button-new-bug');
  if (newBugButton) {
    this.eventHandler_.listen(newBugButton, goog.events.EventType.CLICK,
                              goog.bind(this.startNewBugHandler_, this));
  }
};


/**
 * Handles starting a new bug.
 * @private
 */
bite.client.TestsConsole.prototype.startNewBugHandler_ = function() {
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.START_NEW_BUG});
};


/**
 * Called to show the confirmation screen to the user.
 * @param {Bite.Constants.TestResult} result Test result.
 * @private
 */
bite.client.TestsConsole.prototype.confirmAction_ = function(result) {
  var messageDiv = goog.dom.createDom('div');

  if (result == Bite.Constants.TestResult.PASS ||
      result == Bite.Constants.TestResult.FAIL) {
    messageDiv.innerHTML = '<b>Confirm Test Results:' +
        '</b><br><b>URL</b>: ' + this.test_['test_url'];

    if (result == Bite.Constants.TestResult.PASS) {
      messageDiv.innerHTML += '<br><b>Result:</b>' +
          '<span style="color:green; margin: 4px"> PASS</span><br>';
    } else {
      messageDiv.innerHTML += '<br><b>Result:</b><span style="color:' +
          'red; margin: 4px">  FAIL</span><br>';
      var bugsArea = goog.dom.createDom(
          goog.dom.TagName.DIV, {'style': 'display:block'});
      goog.dom.appendChild(bugsArea, goog.dom.createDom(
          goog.dom.TagName.LABEL, {'for': 'failure_bugs'},
          goog.dom.createTextNode('Bug Ids (eg: 1245, 1223): ')));
      goog.dom.appendChild(bugsArea, goog.dom.createDom(
          goog.dom.TagName.INPUT,
          {'type': 'text', 'id': 'failure_bugs', 'style': 'display:block'}));
      var commentArea = goog.dom.createDom(
          goog.dom.TagName.DIV, {'style': 'display:block'});
      goog.dom.appendChild(commentArea, goog.dom.createDom(
          goog.dom.TagName.LABEL, {'for': 'failure_comment'},
          goog.dom.createTextNode(
              'Comments (eg: fails on first load only): ')));
      goog.dom.appendChild(commentArea, goog.dom.createDom(
          goog.dom.TagName.TEXTAREA,
          {'id': 'failure_comment', 'style': 'display:block'}));

      goog.dom.appendChild(messageDiv, bugsArea);
      goog.dom.appendChild(messageDiv, commentArea);
    }
  } else if (result == Bite.Constants.TestResult.SKIP) {
    messageDiv.innerHTML = '<b>Confirm skip test.<b>';
  } else {
    console.error('Unrecognized result: ' + result);
    return;
  }

  messageDiv.appendChild(goog.dom.createDom(
      goog.dom.TagName.INPUT,
      {'type': 'button',
       'value': 'Submit',
       'onclick': goog.bind(this.logTestResult_, this, result)}));
  messageDiv.appendChild(goog.dom.createDom(
      goog.dom.TagName.INPUT,
      {'type': 'button',
       'value': 'Cancel',
       'onclick': goog.bind(this.cancelAction_, this)}));
  var contentCanvas = goog.dom.getElement('bite-tests-content-canvas');
  contentCanvas.innerHTML = '';
  contentCanvas.appendChild(messageDiv);
};


/**
 * Cancels the action confirmation screen.
 * @private
 */
bite.client.TestsConsole.prototype.cancelAction_ = function() {
  this.requestUpdate_();
};


/**
 * Logs the test result back to the server.
 * @param {Bite.Constants.TestResult} result Test result.
 * @private
 */
bite.client.TestsConsole.prototype.logTestResult_ = function(result) {
  var params = {action: Bite.Constants.HUD_ACTION.LOG_TEST_RESULT,
                result: result,
                testId: this.test_['test_id']};
  if (result == Bite.Constants.TestResult.FAIL) {
    var comment = goog.dom.getElement('failure_comment').value;
    var bugs = goog.dom.getElement('failure_bugs').value;
    params['comment'] = comment;
    params['bugs'] = bugs;
  }

  var contentCanvas = goog.dom.getElement('bite-tests-content-canvas');
  contentCanvas.innerText = 'Submitting result, please wait...';

  chrome.extension.sendRequest(params, this.requestUpdate_);
};


/**
 * Requests that the background script update the test data for this tab.
 * @private
 */
bite.client.TestsConsole.prototype.requestUpdate_ = function() {
  chrome.extension.sendRequest({action: Bite.Constants.HUD_ACTION.UPDATE_DATA});
};

