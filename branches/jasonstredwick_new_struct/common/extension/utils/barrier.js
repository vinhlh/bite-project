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
 * @fileoverview The barrier concept is a function that blocks while there are
 * outstanding users of the barrier.  Each user increments a counter on the
 * barrier to mark themselves as barrier users.  When the user is done they can
 * fire the barrier, decreasing the counter by one.  When the counter reaches
 * zero the associated callback function is called.  The barrier is considered
 * down once the count reaches zero and can continue to be fired.  Subsequent
 * calls to increment will start the counter moving up again from zero.
 *
 * When creating a new Barrier object the associated callback does not
 * receive any inputs as the Barrier has no context for the callback.  If
 * specific values are to be passed on to the callback then they should be
 * bound before creating the barrier.
 *
 * If opt_numCalls is not supplied then the barrier will fire immediately.
 * Otherwise, the barrier starts with a positive counter that must be counted
 * down before firing.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.utils.Barrier');



/**
 * Constructs a new Barrier object; see the file overview for more details.
 * @param {function()} callback The callback function to be fired when the
 *     appropriate conditions have been met.
 * @param {number=} opt_numCalls The number of calls before calling the given
 *     callback.
 * @constructor
 */
bite.common.utils.Barrier = function(callback, opt_numCalls) {
  /**
   * The callback function to fire when the barrier is down.
   * @type {function()}
   * @private
   */
  this.callback_ = callback;

  /**
   * The number of calls to fire that must occur before the associated callback
   * is fired.  Acts like a count down.
   * @type {number}
   * @private
   */
  this.numCalls_ = opt_numCalls && opt_numCalls > 0 ? opt_numCalls : 0;
};


/**
 * Increase the count before the callback is fired.
 */
bite.common.utils.Barrier.prototype.increment = function() {
  ++this.numCalls_;
};


/**
 * Subtract one from the count.  Once the count reaches zero the callback will
 * fire and will continue to fire with each subsequent call where the count
 * is zero.
 */
bite.common.utils.Barrier.prototype.fire = function() {
  this.numCalls_ && --this.numCalls_;  // Decrement if > 0.
  this.numCalls_ || this.callback_(); // Fire callback if == 0.
};

