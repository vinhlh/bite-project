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
 * The wrapper functions for browser actions, which RPF uses to simulate
 * user's action like click, type, input, doubleclick, etc.
 * This file also contains a listener which listens
 * to commands from the background page, executes them and sends the result
 * back to the background.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('BiteRpfAction');
goog.provide('bite.rpf.ActionsHelper');


goog.require('Bite.Constants');
goog.require('common.client.ElementDescriptor');
goog.require('goog.Timer');



/**
 * The bite browser actions wrapper.
 * @constructor
 * @export
 */
bite.rpf.ActionsHelper = function() {
};


/**
 * Periodically executes a function until it returns true or timeout.
 * @param {Function} func The function to run.
 * @param {number} timeout The timeout in secs.
 * @param {Function} nextFunc The function to run on success.
 */
bite.rpf.ActionsHelper.prototype.retry = function(
    func, timeout, nextFunc) {
  var len = arguments.length;
  if (len >= 4) {
    var realArgs = [];
    for (var i = 3; i < len; i++) {
      realArgs.push(arguments[i]);
    }
    this.funcStartTime_ = goog.now();
    this.funcRunTimeout_ = timeout * 1000;
    this.retry_(func, realArgs, nextFunc);
  } else {
    console.log('Not enough arguments.');
  }
};


/**
 * Retries a function until it succeeds or timeout.
 * @param {Function} func The function to retry.
 * @param {Array} args The argument array.
 * @param {Function} nextFunc The next function to run on success.
 * @private
 */
bite.rpf.ActionsHelper.prototype.retry_ = function(
    func, args, nextFunc) {
  try {
    func.apply(this, args);
    if (nextFunc) {
      goog.Timer.callOnce(nextFunc, 1500);
    }
  } catch (e) {
    var elapsed = goog.now() - this.funcStartTime_;
    if (elapsed > this.funcRunTimeout_) {
      throw new Error('  Failed to execute ' + func.toString());
    } else {
      goog.Timer.callOnce(goog.bind(
          this.retry_, this, func, args, nextFunc), 3000);
    }
  }
};


/**
 * Clicks the given element.
 * @param {string|Element} elem The element to be clicked.
 */
bite.rpf.ActionsHelper.prototype.click = function(elem) {
};


/**
 * Selects the given element.
 * @param {string|Element} elem The element to be selected.
 * @param {string} value The value to be selected.
 */
bite.rpf.ActionsHelper.prototype.select = function(elem, value) {
};


/**
 * Drags the given element.
 * @param {string|Element} elem The element to be dragged.
 * @param {number} dX The difference of x coordinates.
 * @param {number} dY The difference of y coordinates.
 */
bite.rpf.ActionsHelper.prototype.drag = function(elem, dX, dY) {
};


/**
 * Inputs text in the given element by changing the element's value attribute.
 * @param {string|Element} elem The element to have text input.
 * @param {string} text The text input.
 */
bite.rpf.ActionsHelper.prototype.input = function(elem, text) {
};


/**
 * Inputs text character by character in the given element.
 * @param {string|Element} elem The element to have text input.
 * @param {string} text The text input.
 */
bite.rpf.ActionsHelper.prototype.type = function(elem, text) {
};


/**
 * Submits the form.
 * @param {string|Element} elem The form to be submitted.
 */
bite.rpf.ActionsHelper.prototype.submit = function(elem) {
};


/**
 * Double clicks the given element.
 * @param {string|Element} elem The element to be double clicked.
 */
bite.rpf.ActionsHelper.prototype.doubleClick = function(elem) {
};


/**
 * Verifies the specified element does not exist.
 * @param {string|Element} elem The element.
 * @param {string} content The content to verify.
 */
bite.rpf.ActionsHelper.prototype.verifyNot = function(elem, content) {
};


/**
 * Verifies the specified element exists.
 * @param {string|Element} elem The element.
 * @param {string} content The content to verify.
 */
bite.rpf.ActionsHelper.prototype.verify = function(elem, content) {
};


/**
 * The retry wrapper.
 * @type {function(Function, number, Function)}
 */
BiteRpfAction.retry = goog.nullFunction;


/**
 * The click wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.click = goog.nullFunction;


/**
 * The select wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.select = goog.nullFunction;


/**
 * The drag wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.drag = goog.nullFunction;


/**
 * The type wrapper.
 * @type {function((string|Element), string)}
 */
BiteRpfAction.type = goog.nullFunction;


/**
 * The input wrapper.
 * @type {function((string|Element), string)}
 */
BiteRpfAction.input = goog.nullFunction;


/**
 * The submit wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.submit = goog.nullFunction;


/**
 * The double click wrapper.
 * @type {function((string|Element))}
 * @export
 */
BiteRpfAction.doubleClick = goog.nullFunction;


/**
 * The verify wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.verify = goog.nullFunction;


/**
 * The verify not wrapper.
 * @type {function((string|Element))}
 */
BiteRpfAction.verifyNot = goog.nullFunction;


/**
 * The current step's information map which contains descriptor, xpath, etc.
 * @type {!Object}
 */
BiteRpfAction.currCmdMap = {};


/**
 * The locator finding method.
 * @type {string}
 */
BiteRpfAction.locatorMethodString = '';


/**
 * The element info.
 * @type {!Object}
 */
BiteRpfAction.elemInfo = {};


/**
 * Whether it's currently working without rpf Console UI.
 * @type {boolean}
 */
BiteRpfAction.noConsole = false;


/**
 * The onRequest callback handler.
 * @param {Object} request The request object.
 * @param {MessageSender} sender The sender object.
 * @param {function(Object)} sendResponse The response object.
 */
function onRequestCallback(request, sender, sendResponse) {
  var win = goog.global.window;
  if (request['getFailedHtml']) {
    var outerHtml = goog.dom.getDocument().documentElement.outerHTML;
    if (win == win.parent) {
      sendResponse({failedHtml: outerHtml,
                    pageUrl: document.location.href});
    }
  } else if (request['script']) {
    try {
      function checkCorrectWindow() {
        // For legacy code.
        if (!request['cmdMap']) {
          return true;
        }
        var iframeInfo = request['cmdMap']['iframeInfo'];
        // For main window.
        if (win == win.parent && !iframeInfo) {
          return true;
        }
        var host = win.location.host;
        var pathname = win.location.pathname;
        // For iframe window.
        if (iframeInfo &&
            host == iframeInfo['host'] &&
            pathname == iframeInfo['pathname']) {
          return true;
        }
        return false;
      }

      if (!checkCorrectWindow()) {
        return;
      }

      // Executes the contentMap code.
      eval(request['script']);
      if (request['realTimeBag']) {
        var bagObj = goog.json.parse(request['realTimeBag']);
        for (var key in bagObj) {
          ContentMap[key] = bagObj[key];
        }
      }
      var locatorMethodString = request['useXpath'] ? 'xpath' : 'descriptor';
      BiteRpfAction.currCmdMap = request['cmdMap'];
      BiteRpfAction.locatorMethodString = locatorMethodString;
      var cmd = common.client.ElementDescriptor.parseCommandToRunnable(
          request['stepCommand']);
      eval(cmd);
      chrome.extension.sendRequest(
          {command: 'cmdDone', result: 'passed: ' + cmd,
           index: cmdIndex, realTimeMap: goog.json.serialize(ContentMap),
           noConsole: BiteRpfAction.noConsole});
      console.log('Succesfully executed the command.');
    } catch (e) {
      if (!e) {
        var errorMessage = BiteRpfAction.elemInfo['log'];
      } else {
        var errorMessage = e.message;
      }
      var resultStr = 'Error: ' + errorMessage;
      console.log(resultStr);
      chrome.extension.sendRequest(
          {command: 'cmdDone', result: resultStr, index: cmdIndex,
           noConsole: BiteRpfAction.noConsole});
    } finally {
      // The sendResponse is called to close the request.
      // TODO(phu): Use it to send back the results.
      sendResponse({});
    }
  }
}


/**
 * Gets the element.
 * @param {string} stepId The step id.
 * @return {!Element} The result element.
 * @export
 */
function getElem(stepId) {
  BiteRpfAction.elemInfo = common.client.ElementDescriptor.getElement(
      BiteRpfAction.currCmdMap, BiteRpfAction.locatorMethodString) || {};
  var elem = BiteRpfAction.elemInfo['elem'];
  if (!elem) {
    throw new Error(BiteRpfAction.elemInfo['log']);
  }
  return elem;
}


/**
 * Starts to listen to requests.
 * @param {boolean=} opt_noConsole Whether it's currently working without rpf
 *     Console UI.
 * @export
 */
function startListener(opt_noConsole) {
  BiteRpfAction.noConsole = !!opt_noConsole;
  chrome.extension.onRequest.removeListener(onRequestCallback);
  chrome.extension.onRequest.addListener(onRequestCallback);
  chrome.extension.sendRequest({command: 'initReady', result: true});
}


/**
 * Stops listening to requests.
 * @param {boolean=} opt_noConsole Whether it's currently working without rpf
 *     Console UI.
 * @export
 */
function removeListener(opt_noConsole) {
  BiteRpfAction.noConsole = !!opt_noConsole;
  chrome.extension.onRequest.removeListener(onRequestCallback);
}

