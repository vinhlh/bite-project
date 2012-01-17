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
 * @fileoverview This file contains the console logger.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.ConsoleLogger');

goog.require('goog.string');



/**
 * A class for logging info on console.
 * TODO (phu@google.com): consider integration with closure logger.
 * @constructor
 */
rpf.ConsoleLogger = function() {
  /**
   * The plain logs.
   * @type Array
   */
  this.logs = [];

  /**
   * The better look logs in html formats.
   * @type Array
   */
  this.logHtmls = [];
};
goog.addSingletonGetter(rpf.ConsoleLogger);


/**
 * Enum for log levels.
 * @enum {string}
 * @export
 */
rpf.ConsoleLogger.LogLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug'
};


/**
 * Enum for the corresponding colors of different log levels.
 * @enum {string}
 * @export
 */
rpf.ConsoleLogger.Color = {
  BLACK: 'black',
  YELLOW: 'yellow',
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green'
};


/**
 * Gets the html of a given log.
 * @param {rpf.ConsoleLogger.LogLevel} logLevel Refers to saveLogAndHtml.
 * @param {rpf.ConsoleLogger.Color} logColor Refers to saveLogAndHtml.
 * @param {string} log Refers to saveLogAndHtml.
 * @return {string} The log html.
 * @private
 */
rpf.ConsoleLogger.prototype.getLogHtml_ = function(
    logLevel, logColor, log) {
  var timeStamp = rpf.MiscHelper.getTimeStamp();
  return goog.string.buildString(
      timeStamp, '[', logLevel, ']', ': ',
      '<div style="font-size:12px;color:',
      logColor, '">', log, '</div>');
};


/**
 * Clears up the logs.
 * @export
 */
rpf.ConsoleLogger.prototype.clearLogs = function() {
  this.logs = [];
  this.logHtmls = [];
};


/**
 * Get the logs as a string.
 * @return {Object} The response object.
 * @export
 */
rpf.ConsoleLogger.prototype.getLogsAsString = function() {
  var logHtmlStr = '';
  for (var i = 0; i < this.logHtmls.length; i++) {
    logHtmlStr += this.logHtmls[i];
  }
  return {'logHtml': logHtmlStr};
};


/**
 * Saves logs in both plain text and html formats.
 * @param {string} log The log string.
 * @param {rpf.ConsoleLogger.LogLevel=} opt_level The level of this log.
 * @param {rpf.ConsoleLogger.Color=} opt_color The color of the log.
 * @export
 */
rpf.ConsoleLogger.prototype.saveLogAndHtml = function(
    log, opt_level, opt_color) {
  var logLevel = rpf.ConsoleLogger.LogLevel.INFO;
  var logColor = rpf.ConsoleLogger.Color.BLACK;
  if (opt_level) {
    logLevel = opt_level;
  }
  if (opt_color) {
    logColor = opt_color;
  }
  this.logs.push(log);
  this.logHtmls.push(this.getLogHtml_(logLevel, logColor, log));
};

/**
 * Adds a debug level log.
 * @param {string} log The log string.
 * @export
 */
rpf.ConsoleLogger.prototype.debug = function(log) {
  this.saveLogAndHtml(log,
                      rpf.ConsoleLogger.LogLevel.DEBUG,
                      rpf.ConsoleLogger.Color.BLACK);
};

/**
 * Adds a info level log.
 * @param {string} log The log string.
 * @export
 */
rpf.ConsoleLogger.prototype.info = function(log) {
  this.saveLogAndHtml(log,
                      rpf.ConsoleLogger.LogLevel.INFO,
                      rpf.ConsoleLogger.Color.BLACK);
};

/**
 * Adds a warning level log.
 * @param {string} log The log string.
 * @export
 */
rpf.ConsoleLogger.prototype.warning = function(log) {
  this.saveLogAndHtml(log,
                      rpf.ConsoleLogger.LogLevel.WARNING,
                      rpf.ConsoleLogger.Color.YELLOW);
};

/**
 * Adds a error level log.
 * @param {string} log The log string.
 * @export
 */
rpf.ConsoleLogger.prototype.error = function(log) {
  this.saveLogAndHtml(log,
                      rpf.ConsoleLogger.LogLevel.ERROR,
                      rpf.ConsoleLogger.Color.RED);
};
