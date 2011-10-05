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
 * @fileoverview This file contains the console messenger.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.Console.Messenger');

goog.require('Bite.Constants');



/**
 * A class for handling messages to the background world.
 * @constructor
 * @export
 */
rpf.Console.Messenger = function() {
};
goog.addSingletonGetter(rpf.Console.Messenger);


/**
 * Sends the message to listener registered in background world.
 * @param {Object} obj The object to be sent.
 * @param {function(Object)=} opt_callback The callback function to be called.
 * @export
 */
rpf.Console.Messenger.prototype.sendMessage = function(obj, opt_callback) {
  if (!obj['command']) {
    console.log('The command parameter is missing.');
    return;
  }
  var callback = opt_callback || goog.nullFunction;
  console.log('Is sending command: ' + obj['command']);
  chrome.extension.sendRequest(obj, callback);
};


/**
 * Sends a message to notify the specified action is completed.
 * This is useful especially for automating RPF behaviors.
 * @param {Bite.Constants.COMPLETED_EVENT_TYPES} eventType The event type.
 */
rpf.Console.Messenger.prototype.sendStatusMessage = function(eventType) {
  this.sendMessage({
    'command': Bite.Constants.CONSOLE_CMDS.EVENT_COMPLETED,
    'params': {'eventType': eventType}});
};

