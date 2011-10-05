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
 * @fileoverview This file contains the RPF automator, which is used to
 * automate RPF actions like opening a new RPF console, loading a specific
 * test, etc. This will make RPF easy to use like automatically getting
 * to a RPF status based on the given parameters. Eventually, this will
 * be used to fully automate RPF. For now, the automator can serve
 * at most one request at a time, and flush the previous one if a new request
 * is received.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.Automator');

goog.require('Bite.Constants');
goog.require('goog.events');
goog.require('goog.events.EventTarget');



/**
 * A class for automating RPF behaviors.
 * @param {function(Object, function(Object)=)} consoleListener The listener
 *     registered in rpf console.
 * @param {function(Object, Object, function(Object))} eventMgrListener
 *     The listener registered in eventsManager.
 * @param {function(Object, Object, function(Object))} rpfListener
 *     The listener registered in rpf.js.
 * @param {goog.events.EventTarget} eventCompleteTarget The event target that
 *     is for registering and dispatching step completion events.
 * @constructor
 */
rpf.Automator = function(consoleListener, eventMgrListener, rpfListener,
    eventCompleteTarget) {

  /**
   * The steps in queue. Each step contains information of the message name,
   * and what event type it is expecting as the indication of execution
   * completes.
   * @type {!Array.<Object>}
   * @private
   */
  this.stepArray_ = [];

  /**
   * The callback method when the automation is done.
   * @private
   */
  this.callback_ = goog.nullFunction;

  /**
   * The current step index.
   * @type {number}
   * @private
   */
  this.currentStepIndex_ = -1;

  /**
   * See description for function parameter consoleListener.
   * @type {function(Object, function(Object)=)}
   * @private
   */
  this.consoleListener_ = consoleListener;

  /**
   * See description for function parameter eventMgrListener.
   * @type {function(Object, Object, function(Object))}
   * @private
   */
  this.eventMgrListener_ = eventMgrListener;

  /**
   * See description for function parameter rpfListener.
   * @type {function(Object, Object, function(Object))}
   * @private
   */
  this.rpfListener_ = rpfListener;

  /**
   * The currently expected event type.
   * @type {Bite.Constants.COMPLETED_EVENT_TYPES}
   * @private
   */
  this.expectedEventType_ = Bite.Constants.COMPLETED_EVENT_TYPES.DEFAULT;

  /**
   * See description for function parameter eventCompleteTarget.
   * @type {goog.events.EventTarget}
   * @private
   */
  this.eventTarget_ = eventCompleteTarget;

  /**
   * The bound function when the expected event is received.
   * @type {function()}
   * @private
   */
  this.boundOnReceiveExpectedEvent_ =
      goog.bind(this.onReceiveExpectedEvent_, this);
};


/**
 * When the expected finish event is received, it proceeds to execute the
 * next step.
 * @private
 */
rpf.Automator.prototype.onReceiveExpectedEvent_ = function() {
  goog.events.removeAll(this.eventTarget_);
  this.executeNextStep_();
};


/**
 * Returns a step object.
 * @param {Bite.Constants.ListenerDestination} destination The destination
 *     listener which includes both console and background sides.
 * @param {string} message The actual message to start an action.
 * @param {Object} params The parameters to start the action.
 * @param {Bite.Constants.COMPLETED_EVENT_TYPES} eventType The eventtype that
 *     will be sent out once the action is completed.
 * @return {Object} The step object.
 */
rpf.Automator.prototype.getStepObject = function(
    destination, message, params, eventType) {
  return {'destination': destination,
          'message': message,
          'params': params,
          'eventType': eventType};
};


/**
 * Starts the new automation run.
 * @param {Array} stepArray The steps to be run.
 * @param {function(Object)=} opt_callback The optional callback function.
 */
rpf.Automator.prototype.start = function(stepArray, opt_callback) {
  console.log('The automation is started.');
  goog.events.removeAll(this.eventTarget_);
  this.callback_ = opt_callback || goog.nullFunction;
  this.stepArray_ = stepArray || [];
  this.currentStepIndex_ = -1;
  this.expectedEventType_ = Bite.Constants.COMPLETED_EVENT_TYPES.DEFAULT;
  this.executeNextStep_();
};


/**
 * Finishes the current automation run.
 */
rpf.Automator.prototype.finish = function() {
  goog.events.removeAll(this.eventTarget_);
  this.eventTarget_.removeEventListener(
      this.expectedEventType_, this.boundOnReceiveExpectedEvent_);
  this.stepArray_ = [];
  this.callback_();
  console.log('The automation is finished.');
};


/**
 * Executes the next step in the step array.
 * @private
 */
rpf.Automator.prototype.executeNextStep_ = function() {
  ++this.currentStepIndex_;
  var currentStep = this.stepArray_[this.currentStepIndex_];
  if (this.currentStepIndex_ >= this.stepArray_.length) {
    this.finish();
    return;
  }

  var destination = currentStep['destination'];
  var message = currentStep['message'];
  var params = currentStep['params'];
  this.expectedEventType_ = currentStep['eventType'];

  console.log('The current message is: ' + message);
  this.eventTarget_.addEventListener(
      this.expectedEventType_, this.boundOnReceiveExpectedEvent_);
  switch (destination) {
    case Bite.Constants.ListenerDestination.CONSOLE:
      this.consoleListener_({'command': message,
                             'params': params});
      break;
    case Bite.Constants.ListenerDestination.EVENT_MANAGER:
      this.eventMgrListener_({'command': message,
                              'params': params}, {}, goog.nullFunction);
      break;
    case Bite.Constants.ListenerDestination.RPF:
      this.rpfListener_({'command': message,
                         'params': params}, {}, goog.nullFunction);
      break;
    case Bite.Constants.ListenerDestination.CONTENT:
      break;
  }
};

