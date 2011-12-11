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
 * @fileoverview Define an event that also passes out data in the form of an
 * optional object.
 *
 * This is a generic event beyond that which is provided by goog.events.Event.
 * However, at a later time there may be a desire for more events.  In that
 * case, this file will need to be altered to reflect a more specific usage.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.events.DataBearingEvent');

goog.require('goog.events.Event');



/**
 * See fileoverview.
 * @param {string} type The Event type.
 * @param {Object=} opt_data The data to pass on.
 * @extends {goog.events.Event}
 * @constructor
 * @export
 */
bite.common.events.DataBearingEvent = function(type, opt_data) {
  goog.base(this, type);

  /**
   * The data passed on by the EventTarget.
   * @type {?Object}
   * @private
   */
  this.data_ = opt_data || null;
};
goog.inherits(bite.common.events.DataBearingEvent, goog.events.Event);


/**
 * Retrieve the data from the event.
 * @return {Object} The data encompassed by the event.
 * @export
 */
bite.common.events.DataBearingEvent.prototype.getData = function() {
  return this.data_;
};

