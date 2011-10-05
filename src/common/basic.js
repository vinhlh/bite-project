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
 * @fileoverview The Basic class defines a type of log class to store and
 * retrieve units of information in string form.  Each new entry is assigned a
 * timestamp and stored in order.  Internally a queue exists where new entries
 * enter one side and old entries drop off the other, but only when the maximum
 * is reach.  The class also has a few different methods of retrieving log
 * information from a iterator-like function to allowing listeners to register
 * and be signalled whenever a new entry is logged.
 *
 * The purpose of the Basic log class is to provide a method of recording
 * information without specifying an output source.  Other JavaScript code can
 * then tap into the log to retrieve information and output it to the
 * appropriate location.
 *
 * Notice that all the public functions are not exported.  That is left to the
 * user to either export the properties or create an object that maps to the
 * correct namespace.
 *
 * Public Interface:
 *   bite.common.log.Basic(opt_maxEntries) (constructor) - Constructs a Basic
 *       log object.  See the file overview for more details.
 *
 *   add(string) - Add a new entry (string) to the log.
 *   clear() - Clear the log; removes all current log entries.
 *   getNewestEntry() - Returns the newest entry or null if there are no
 *       entries.
 *   getMaxEntries() - Returns the maximum number of entries the log can hold.
 *   setMaxEntries(newMaxEntries) - Changes the maximum number of entries the
 *       log can support.
 *
 *   addListener(callback) - Add a new listener to the log that will be
 *       notified when new entries are added.
 *   hasListener(callback) - Returns whether or not the given callback is
 *       currently a listener on this log.
 *   removeListener(callback) - Removes the given callback as a listener on
 *       this log.
 *
 *   getIterNewToOld() - Get a function that iterates over the log entries from
 *       newest to oldest.
 *   getIterOldToNew() - Get a function that iterates over the log entries from
 *       oldest to newest.
 *
 * Usage:
 *   var keyName = common.log.Basic.KeyName;
 *   var callback = function(entry) { console.log(entry[keyName.VALUE]); }
 *
 *   var log = new common.log.Basic();
 *
 *   log.addListener(callback);
 *   log.add('entry1'); // Console will display 'entry1' due to callback.
 *   log.add('entry2'); // Console will display 'entry2' due to callback.
 *
 *   var entry = log.getNewestEntry();
 *   console.log(entry[keyName.VALUE]); // Console will display 'entry2'.
 *
 *   var iter = log.getIterOldToNew();
 *   // Console will display 'entry1' then 'entry2'.
 *   while (entry = iter()) {
 *     console.log(entry[keyName.VALUE]);
 *   }
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('common.log.Basic');

goog.require('common.events.Signal');
goog.require('goog.date.Date');



/**
 * Constructs a new Basic log object that can store strings with a timestamp.
 * @param {number=} opt_maxEntries The number of entries the log can store
 *     before entries are dropped.
 * @constructor
 */
common.log.Basic = function(opt_maxEntries) {
  /**
   * The maximum number of entries the log can hold before it will start
   * dropping old entries.
   * @type {number}
   * @private
   */
  this.maxEntries_ = opt_maxEntries && opt_maxEntries > 0 ? opt_maxEntries :
      common.log.Basic.DEFAULT_MAX_ENTRIES;

  /**
   * An array of entries.
   * @type {!Array.<!common.log.Basic.Entry>}
   * @private
   */
  this.entries_ = [];

  /**
   * A signal object used to track those who want to listen to the log as it
   * is created and signal when it has changed.
   * @type {common.events.Signal}
   * @private
   */
  this.signal_ = new common.events.Signal();
};


/**
 * For each entry, the timestamp is an integer in milliseconds.  Also, each
 * entry will be explicit strings for uses external to this code.
 * @typedef {{timestamp: number, value: string}}
 */
common.log.Basic.Entry;


/**
 * The default maximum number of entries the log can contain.
 * @type {number}
 */
common.log.Basic.DEFAULT_MAX_ENTRIES = 10000;


/**
 * Key names for the entry object.
 * @enum {string}
 */
common.log.Basic.KeyName = {
  TIMESTAMP: 'timestamp',
  VALUE: 'value'
};


/**
 * Add a new entry to the log.  The entry will be timestamped using
 * Date.getTime.
 * @param {string} value The string to log.
 */
common.log.Basic.prototype.add = function(value) {
  var time;
  try {
    time = new goog.date.Date().getTime();
  } catch (error) {
    time = -1;
  }

  // Make sure there is room in the queue.
  if (this.entries_.length + 1 > this.maxEntries_) {
    this.entries_.shift();
  }

  // Preserve the key names for external use.
  var entry = {};
  entry[common.log.Basic.KeyName.TIMESTAMP] = time;
  entry[common.log.Basic.KeyName.VALUE] = value;

  this.entries_.push(entry);

  // Let listeners know a new entry was logged.
  this.signal_.fire(entry);
};


/**
 * Adds a callback to the log's common.events.Signal object, which will be
 * fired when a new entry is added.
 * @param {function(!common.log.Basic.Entry)} callback The callback to be
 *     fired.
 */
common.log.Basic.prototype.addListener = function(callback) {
  this.signal_.addListener(callback);
};


/**
 * Clear the log.
 */
common.log.Basic.prototype.clear = function() {
  this.entries_ = [];
};


/**
 * Creates the iterator function used by getIterNew and getIterOld.  The
 * function returned will move through the array of entries and will return
 * null when it has passed the Array boundary.
 * @param {number} index The index to start with.
 * @param {number} delta How many entries to move forward when the iterator is
 *     called.
 * @return {function(): common.log.Basic.Entry} A function that acts like an
 *     iterator over the log.
 * @private
 */
common.log.Basic.prototype.getIterFunc_ = function(index, delta) {
  var iter = goog.partial(function(entries) {
    if (index < 0 || index >= entries.length) {
      index = -1;
      return null;
    }

    var data = entries[index];
    index += delta;
    return data;
  }, this.entries_);

  return iter;
};


/**
 * Returns a function that starts at the newest entry and when called will
 * return the current entry and move to the next entry.  When the last entry is
 * reached the function will start returning null.  If changes to the state of
 * the log occur while this function exists then it can alter its behavior
 * though it will never recover once the end of the list is reached.
 * @return {function(): common.log.Basic.Entry} A function that acts like an
 *     iterator over the log from newest to oldest.
 */
common.log.Basic.prototype.getIterNewToOld = function() {
  return this.getIterFunc_(this.entries_.length - 1, -1);
};


/**
 * Returns a function that starts at the oldest entry and when called will
 * return the current entry and move to the next entry.  When the last entry is
 * reached the function will start returning null.  If changes to the state of
 * the log occur while this function exists then it can alter its behavior
 * though it will never recover once the end of the list is reached.
 * @return {function(): common.log.Basic.Entry} A function that acts like an
 *     iterator over the log from oldest to newest.
 */
common.log.Basic.prototype.getIterOldToNew = function() {
  return this.getIterFunc_(0, 1);
};


/**
 * Returns the maximum number of entries that can be recorded.
 * @return {number} The max number of entries.
 */
common.log.Basic.prototype.getMaxEntries = function() {
  return this.maxEntries_;
};


/**
 * Returns the newest entry in the list or null if there are no entries.
 * @return {?common.log.Basic.Entry} The newest entry or null if there
 *     are no entries.
 */
common.log.Basic.prototype.getNewestEntry = function() {
  if (this.entries_.length == 0) {
    return null;
  }

  return this.entries_[this.entries_.length - 1];
};


/**
 * Determine if the given callback is listeneing.
 * @param {function(!common.log.Basic.Entry)} callback The callback to be
 *     fired.
 * @return {boolean} Whether or not the callback is listening.
 */
common.log.Basic.prototype.hasListener = function(callback) {
  return this.signal_.hasListener(callback);
};


/**
 * Removes a callback from the log's common.events.Signal object.
 * @param {function(!common.log.Basic.Entry)} callback The callback to be
 *     fired.
 */
common.log.Basic.prototype.removeListener = function(callback) {
  this.signal_.removeListener(callback);
};


/**
 * Change the maximum number of entries that can be logged.  newMax is ignored
 * if it is less than or equal to zero, or is the same as the current max
 * entries.  If the new max entries is less than the current number of entries
 * then the oldest entries will be removed to make the queue equal to the new
 * maximum.
 * @param {number} newMax The new maximum number of entries to allow.
 */
common.log.Basic.prototype.setMaxEntries = function(newMax) {
  if (newMax <= 0 || newMax == this.maxEntries_) {
    return;
  }

  this.maxEntries_ = newMax;

  var diff = this.entries_.length - this.maxEntries_;
  if (diff > 0) {
    this.entries_.splice(0, diff);
  }
};

