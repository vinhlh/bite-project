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
 * @fileoverview The Simple class defines a type of log class to store and
 * retrieve units of information in string form.  Each new entry is assigned a
 * timestamp and stored in order.  Internally a queue exists where new entries
 * enter one side and old entries drop off the other, but only when the maximum
 * is reach.  The class also has a few different methods of retrieving log
 * information from a iterator-like function to allowing listeners to register
 * and be signalled whenever a new entry is logged.
 *
 * The purpose of the Simple log class is to provide a method of recording
 * information without specifying an output source.  Other JavaScript code can
 * then tap into the log to retrieve information and output it to the
 * appropriate location.
 *
 * Notice that all the public functions are not exported.  That is left to the
 * user to either export the properties or create an object that maps to the
 * correct namespace.
 *
 * Public Interface:
 *   bite.common.log.Simple(opt_maxEntries) (constructor) - Constructs a Simple
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
 *   var keyName = bite.common.log.Simple.KeyName;
 *   var callback = function(entry) { console.log(entry[keyName.VALUE]); }
 *
 *   var log = new bite.common.log.Simple();
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


goog.provide('bite.common.log.Simple');

goog.require('bite.common.signal.Simple');
goog.require('goog.date.Date');



/**
 * Constructs a new Simple log object that can store strings with a timestamp.
 * @param {number=} opt_maxEntries The number of entries the log can store
 *     before entries are dropped.
 * @constructor
 */
bite.common.log.Simple = function(opt_maxEntries) {
  /**
   * The maximum number of entries the log can hold before it will start
   * dropping old entries.
   * @type {number}
   * @private
   */
  this.maxEntries_ = opt_maxEntries && opt_maxEntries > 0 ? opt_maxEntries :
      bite.common.log.Simple.DEFAULT_MAX_ENTRIES;

  /**
   * An array of entries.
   * @type {!Array.<!bite.common.log.Simple.Entry>}
   * @private
   */
  this.entries_ = [];

  /**
   * A signal object used to track those who want to listen to the log as it
   * is created and signal when it has changed.
   * @type {bite.common.signal.Simple}
   * @private
   */
  this.signal_ = new bite.common.signal.Simple();
};


/**
 * For each entry, the timestamp is an integer in milliseconds.  Also, each
 * entry will be explicit strings for uses external to this code.
 * @typedef {{timestamp: number, value: string}}
 */
bite.common.log.Simple.Entry;


/**
 * The default maximum number of entries the log can contain.
 * @type {number}
 */
bite.common.log.Simple.DEFAULT_MAX_ENTRIES = 10000;


/**
 * Key names for the entry object.
 * @enum {string}
 */
bite.common.log.Simple.KeyName = {
  TIMESTAMP: 'timestamp',
  VALUE: 'value'
};


/**
 * Add a new entry to the log.  The entry will be timestamped using
 * Date.getTime.
 * @param {string} value The string to log.
 */
bite.common.log.Simple.prototype.add = function(value) {
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
  entry[bite.common.log.Simple.KeyName.TIMESTAMP] = time;
  entry[bite.common.log.Simple.KeyName.VALUE] = value;

  this.entries_.push(entry);

  // Let listeners know a new entry was logged.
  this.signal_.fire(entry);
};


/**
 * Adds a callback to the log's bite.common.signal.Simple object, which will be
 * fired when a new entry is added.
 * @param {function(!bite.common.log.Simple.Entry)} callback The callback to be
 *     fired.
 */
bite.common.log.Simple.prototype.addListener = function(callback) {
  this.signal_.addListener(callback);
};


/**
 * Clear the log.
 */
bite.common.log.Simple.prototype.clear = function() {
  this.entries_ = [];
};


/**
 * Creates the iterator function used by getIterNew and getIterOld.  The
 * function returned will move through the array of entries and will return
 * null when it has passed the Array boundary.
 * @param {number} index The index to start with.
 * @param {number} delta How many entries to move forward when the iterator is
 *     called.
 * @return {function(): bite.common.log.Simple.Entry} A function that acts like
 *     an iterator over the log.
 * @private
 */
bite.common.log.Simple.prototype.getIterFunc_ = function(index, delta) {
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
 * @return {function(): bite.common.log.Simple.Entry} A function that acts like
 *     an iterator over the log from newest to oldest.
 */
bite.common.log.Simple.prototype.getIterNewToOld = function() {
  return this.getIterFunc_(this.entries_.length - 1, -1);
};


/**
 * Returns a function that starts at the oldest entry and when called will
 * return the current entry and move to the next entry.  When the last entry is
 * reached the function will start returning null.  If changes to the state of
 * the log occur while this function exists then it can alter its behavior
 * though it will never recover once the end of the list is reached.
 * @return {function(): bite.common.log.Simple.Entry} A function that acts like
 *     an iterator over the log from oldest to newest.
 */
bite.common.log.Simple.prototype.getIterOldToNew = function() {
  return this.getIterFunc_(0, 1);
};


/**
 * Returns the maximum number of entries that can be recorded.
 * @return {number} The max number of entries.
 */
bite.common.log.Simple.prototype.getMaxEntries = function() {
  return this.maxEntries_;
};


/**
 * Returns the newest entry in the list or null if there are no entries.
 * @return {?bite.common.log.Simple.Entry} The newest entry or null if there
 *     are no entries.
 */
bite.common.log.Simple.prototype.getNewestEntry = function() {
  if (this.entries_.length == 0) {
    return null;
  }

  return this.entries_[this.entries_.length - 1];
};


/**
 * Determine if the given callback is listeneing.
 * @param {function(!bite.common.log.Simple.Entry)} callback The callback to be
 *     fired.
 * @return {boolean} Whether or not the callback is listening.
 */
bite.common.log.Simple.prototype.hasListener = function(callback) {
  return this.signal_.hasListener(callback);
};


/**
 * Removes a callback from the log's bite.common.signal.Simple object.
 * @param {function(!bite.common.log.Simple.Entry)} callback The callback to be
 *     fired.
 */
bite.common.log.Simple.prototype.removeListener = function(callback) {
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
bite.common.log.Simple.prototype.setMaxEntries = function(newMax) {
  if (newMax <= 0 || newMax == this.maxEntries_) {
    return;
  }

  this.maxEntries_ = newMax;

  var diff = this.entries_.length - this.maxEntries_;
  if (diff > 0) {
    this.entries_.splice(0, diff);
  }
};

