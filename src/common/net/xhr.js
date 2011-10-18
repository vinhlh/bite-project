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
 * Public functions:
 *   get(url, opt_callback) - Performs a get.
 *   getMultiple(array, getUrl, app, opt_complete) - Recursively gets a number
 *       of urls asynchronously.  *Looking to refactor.*
 *   post(url, data, opt_callback) - Performs a post.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.net.xhr');
goog.provide('bite.common.net.xhr.async');

goog.require('bite.common.utils.Barrier');
goog.require('goog.net.XhrIo');


/**
 * A set of messages used to communicate externally.
 * @enum {string}
 * @private
 */
bite.common.net.xhr.ErrorMessage_ = {
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
bite.common.net.xhr.async.get = function(url, opt_callback) {
  var callback = opt_callback || null;
  bite.common.net.xhr.async.send_(url, callback, 'GET', null);
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
bite.common.net.xhr.async.post = function(url, data, opt_callback) {
  var callback = opt_callback || null;
  bite.common.net.xhr.async.send_(url, callback, 'POST', data);
};


/**
 * Start an asynchronous request for each element in the array at the same
 * time.  Each time a request completes the app function is applied to the
 * element along with the success of the request and the data, or error, from
 * the request.  Once all requests have completed the complete function will be
 * called on the entire array of elements.  If during the app call more
 * requests are sent out then the current group will also wait for those
 * requests to finish.
 * TODO (jasonstredwick): Refactor this code.  It is legacy but the design
 * could much improved and generalized.
 * @param {!Array.<*>} array An array of elements.
 * @param {function(*): string} getUrl A function that when applied to an
 *     element from the array will return a url.  If the function returns a
 *     "false" value that element will not be added to the download list.
 * @param {function(*, boolean, string)} app A function that when applied to an
 *     array element sending in the success and data from the request.
 * @param {function(Array.<*>)=} opt_complete The function to be called once
 *     all the requests and child requests have completed.  The original array
 *     is passed in.
 */
bite.common.net.xhr.async.getMultiple = function(array, getUrl, app,
                                                 opt_complete) {
  var async = bite.common.net.xhr.async;
  var openBarrier = async.getMultiple.prototype.openBarrier_;

  // If there is already a barrier in use and a new barrier is being created
  // then the current barrier needs to wait for the new one to finish thus
  // increment its count by one.
  //
  openBarrier && openBarrier.increment();

  // The completeFunc is necessary regardless of whether or not the
  // opt_complete function is given in order to handle possible hierarchical
  // requests.
  var completeFunc = function() {
    opt_complete && opt_complete(array);
    // If there was a barrier active during this call it will need to be fired
    // upon the completion of this group of events.
    openBarrier && openBarrier.fire();
  };

  // Create a new barrier and set it to fire completeFunc after one fire.  The
  // one is for this function so that if there are no elements to request this
  // function will fire at the end causing the completeFunc to fire.  Each
  // element that is requested will increase the number of fires by one.
  var barrier = new bite.common.utils.Barrier(completeFunc, 1);

  for (var i = 0, len = array.length; i < len; ++i) {
    var element = array[i];

    var url = getUrl(element);

    // The user has the ability to return null with getUrl to indicate that
    // the current element is not to be included in the set to load.
    if (!url) {
      continue;
    }

    // Create a function callback for each app(element) to ensure the proper
    // handling of hierarchical calls to getMultiple.
    var appFunc = (function(e, b, f) {
        return function(success, data) {
            async.getMultiple.prototype.openBarrier_ = b;
            f(e, success, data);
            async.getMultiple.prototype.openBarrier_ = null;
            b.fire();
        };
    })(element, barrier, app);

    barrier.increment();
    async.get(url, appFunc);
  }
  element = array[0];

  barrier.fire();
};


/**
 * If a barrier is being accessed then this variable will be set across all
 * barriers.  That way if a new barrier is created it will know that it needs
 * to ensure this one waits until it is done.
 *
 * Note that this variable is not an array.  The reason is that the creation
 * of a barrier in getMultiple does not call any user functions therefore no
 * nested calls are possible.  The only barrier that is of potential concern is
 * the one calling the app callback, all the barriers created at that point are
 * essentially on the same level and have no interaction.
 * @type {?bite.common.utils.Barrier}
 * @private
 */
bite.common.net.xhr.async.getMultiple.prototype.openBarrier_ = null;


/**
 * The callback that is fired when bite.common.net.xhr.async.get or
 * bite.common.net.xhr.async.post request completes.
 * @param {EventTarget} event The event.
 * @param {?function(boolean, string)} callback The callback will be fired
 *     when the request returns.  It will be passed a boolean for the success
 *     of the request and either the data or error message respective to that
 *     success.  If the callback is null then the response is ignored.
 * @private
 */
bite.common.net.xhr.async.requestComplete_ = function(event, callback) {
  // Ignore response if no callback was supplied.
  if (!callback) {
    return;
  }

  var success = false;
  var msg = bite.common.net.xhr.ErrorMessage_.REQUEST_FAILED;

  try {
    var xhrIo = event.target;

    if (xhrIo.isSuccess()) {
      success = true;
      msg = xhrIo.getResponseText() || '';
    } else {
      msg = '[' + xhrIo.getLastErrorCode() + '] ' + xhrIo.getLastError();
    }
  } catch (error) {
    msg = bite.common.net.xhr.ErrorMessage_.EXCEPTION + error;
  }

  callback(success, msg);
};


/**
 * Sends the asynchronous request given well defined inputs.
 * @param {string} url See bite.common.net.xhr.async.get.
 * @param {?function(boolean, string)} callback The callback to be fired when
 *     the request is complete.  Can be null if no callback was supplied.
 * @param {string} method The method used to send the request.
 * @param {string?} data The data to send or null if no data is supplied.
 * @private
 */
bite.common.net.xhr.async.send_ = function(url, callback, method, data) {
  if (!url) {
    callback && callback(false, bite.common.net.xhr.ErrorMessage_.MISSING_URL);
    return;
  }

  var localCallback = function(event) {
    bite.common.net.xhr.async.requestComplete_(event, callback);
  };

  try {
    if (method == 'POST') {
      goog.net.XhrIo.send(url, localCallback, method, data);
    } else {
      goog.net.XhrIo.send(url, localCallback, method);
    }
  } catch (error) {
    var messages = bite.common.net.xhr.ErrorMessage_;
    callback && callback(false, messages.EXCEPTION + error);
  }
};


/*---------------------------------------------------------------------------*/
/* TODO (jasonstredwick): Code below is outline for refactoring getMultiple. */
/*---------------------------------------------------------------------------*/


/**
 * Start a set of asynchronous requests for each element in an array of input
 * data.  Each element in the array holds the information necessary to send the
 * request for itself.  Once all the requests have completed, an optional all
 * complete callback will be fired given a list of objects containing the
 * success and data or potential error message corresponding with the list of
 * input data.  If the user specifies a handler for an input data element to
 * process a completed request then its data upon success will not be recorded
 * in the final output list.
 *
 * To facilitate flexibility the function takes four functions that when
 * applied to an input data element will return specific information about that
 * element.  This information is used to determine the appropriate type of
 * request for that element.
 *
 * @param {Array.<*>} inputData An array of data.
 * @param {function(*): string} getUrl A function that when applied to an
 *     input data element will return a url.  If the function returns an empty
 *     string then that request will be ignored.
 * @param {function(*): ?function(boolean, string)} getHandler A function that
 *     when applied to an input data element will return the a handler to
 *     process the results of a completed request.  If null then no handler
 *     will be applied to the results and the data will appear in the final
 *     output.  If it is present then the final output will contain an empty
 *     string.
 * @param {function(*): bite.common.net.xhr.Method} getMethod A function that
 *     when applied to an input data element will return the method to use for
 *     the request.
 * @param {function(*): string} getData A function that when applied to an
 *     input data element will return the data for the request.  If the method
 *     does not support data then this function will not be called.
 * @param {function(Array.<?{success: string, result: string}>)=} opt_complete
 *     The function to be called once all the requests are completed.  The
 *     function will be passed an array of objects containing the results of
 *     requests that correspond to the input data list; same order.  Skipped
 *     requests will have null instead of an object.
 * @param {number=} opt_max The maximum number of simultaneous requests.  If
 *     not supplied then defaults to all.
 */
/*
bite.common.net.xhr.async.multipleRequests = function(inputData,
                                                      getUrl,
                                                      getHandler,
                                                      getMethod,
                                                      getData,
                                                      opt_complete,
                                                      opt_max) {
  var onComplete = opt_complete || null;
  var maxAtOnce = opt_max || null;
  bite.common.net.xhr.async.sendMultiple_(inputData, getUrl, getHandler,
                                          getMethod, getData, onComplete,
                                          maxAtOnce);
};
*/


/**
 * See bite.common.net.xhr.async.multipeRequests for details about the function
 * and parameters.
 * @param {Array.<*>} inputData An array of data.
 * @param {function(*): string} getUrl A function.
 * @param {function(*): ?function(boolean, string)} getHandler A function.
 * @param {function(*): bite.common.net.xhr.Method} getMethod A function.
 * @param {function(*): string} getData A function.
 * @param {?function(Array.<?{success: string, result: string}>)} complete
 *     An optional callback function.
 * @param {?number} maxAtOnce The maximum number of simultaneous requests.  If
 *     null then send all at once.
 */
/*
bite.common.net.xhr.async.sendMultiple_ = function(inputData,
                                                   getUrl,
                                                   getHandler,
                                                   getMethod,
                                                   getData,
                                                   complete) {
};
*/

