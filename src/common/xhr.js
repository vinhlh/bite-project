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
 * @fileoverview Provides an interface for doing XMLHttpRequests (Get/Post).
 * The mechanisms handle sending, receiving, and processing of a request
 * including error handling.  The raw data received by the request is returned
 * to the caller through an optionally provided callback.  When the caller
 * provides a callback, the callback function is expected to take two inputs; a
 * boolean success and a data string.  Upon error, the callback will be
 * provided a false value and the data string containing an error message.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('common.net.Xhr');
goog.provide('common.net.Xhr.async');

goog.require('goog.events.Event');
goog.require('goog.net.XhrIo');


/**
 * A set of messages used to communicate externally.
 * @enum {string}
 * @private
 */
common.net.Xhr.ErrorMessage_ = {
  EXCEPTION: 'Exception: ',
  MISSING_URL: 'No url supplied.',
  REQUEST_FAILED: 'Request failed.'
};


/**
 * Sends a request to the given url and returns the response.
 * @param {string} url The url.
 * @param {function(boolean, string)=} opt_callback The callback that is fired
 *     when the request is complete.  The boolean input is the success of the
 *     action.  If the action failed the string will be a simple error message.
 *     Decoding does not occur for the response string, and is up to the caller
 *     if necessary.
 */
common.net.Xhr.async.get = function(url, opt_callback) {
  var callback = opt_callback || goog.nullFunction;
  common.net.Xhr.async.send_(url, callback, 'GET', null);
}


/**
 * Posts data to the given url and returns the response.
 * @param {string} url The url.
 * @param {string} data The data to send; in string form.  Caller is
 *     responsible for encoding the string if necessary.
 * @param {function(boolean, string)=} opt_callback The callback that is fired
 *     when the request is complete.  The boolean input is the success of the
 *     action.  If the action failed the string will be a simple error message.
 *     Decoding does not occur for the response string, and is up to the caller
 *     if necessary.
 */
common.net.Xhr.async.post = function(url, data, opt_callback) {
  var callback = opt_callback || goog.nullFunction;
  common.net.Xhr.async.send_(url, callback, 'POST', data);
};


/**
 * The callback that is fired when common.net.Xhr.async.get or
 * common.net.Xhr.async.post request completes.
 * @param {goog.events.Event} event The event.
 * @param {function(boolean, string)} callback The callback will be fired
 *     when the request returns.  It will be passed a boolean for the success
 *     of the request and either the data or error message respective to that
 *     success.
 * @private
 */
common.net.Xhr.async.requestComplete_ = function(event, callback) {
  var success = false;
  var msg = common.net.Xhr.ErrorMessage_.REQUEST_FAILED;

  try {
    var xhrIo = event.target;

    if (xhrIo.isSuccess()) {
      success = true;
      msg = xhrIo.getResponseText() || '';
    } else {
      msg = xhrIo.getLastErrorCode() + ': ' + xhrIo.getLastError();
    }
  } catch (error) {
    msg = common.net.Xhr.ErrorMessage_.EXCEPTION + error;
  }

  callback(success, msg);
};


/**
 * Sends the asynchronous request given well defined inputs.
 * @param {string} url See common.net.Xhr.async.post.
 * @param {function(boolean, string)} callback The callback to be fired when
 *     the request is complete.
 * @param {string} method The method used to send the request.
 * @param {string?} data The data to send or null if no data is supplied.
 * @private
 */
common.net.Xhr.async.send_ = function(url, callback, method, data) {
  if (!url) {
    callback(false, common.net.Xhr.ErrorMessage_.MISSING_URL);
    return;
  }

  var localCallback = function(event) {
    common.net.Xhr.async.requestComplete_(event, callback);
  };

  try {
    if (method == 'POST' && data) {
      goog.net.XhrIo.send(url, localCallback, method, data);
    } else {
      goog.net.XhrIo.send(url, localCallback, method);
    }
  } catch (error) {
    var messages = common.net.Xhr.ErrorMessage_;
    callback && callback(false, messages.EXCEPTION + error);
  }
};

