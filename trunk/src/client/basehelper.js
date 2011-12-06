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
 * @fileoverview This file contains the basic helper functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.base.Helper');


/**
 * Evals the current datafile.
 * @param {string} datafile The datafile string.
 * @export
 */
bite.base.Helper.evalDatafile = function(datafile) {
  datafile = 'var ContentMap = {};' +
       datafile +
       'bite.base.Helper.dataFile = ContentMap;';
  // TODO(phu): Use goog.json.parse instead of eval.
  eval(datafile);
};


/**
 * Returns the string without non-word chars.
 * @param {string|Object.<string, string>} strOrObj The input raw string.
 * @param {number=} opt_len The optional length of the returned string.
 * @return {string} The string without non word chars.
 * @export
 */
bite.base.Helper.getNonWordRemoved = function(strOrObj, opt_len) {
  if (!strOrObj) {
    return '';
  }
  var str = strOrObj;
  if (typeof(strOrObj) == 'object') {
    str = strOrObj['value'];
  }
  var newStr = str.replace(/\W+/g, '');
  var len = newStr.length;
  var givenLen = opt_len ? opt_len : len;
  givenLen = givenLen < len ? givenLen : len;
  return newStr.substring(0, givenLen);
};


/**
 * The global temp datafile object.
 * @export
 */
bite.base.Helper.dataFile = {};


/**
 * Gets the step id from a given cmd.
 * @param {string} cmd The cmd string.
 * @return {string} The step id.
 * @export
 */
bite.base.Helper.getStepId = function(cmd) {
  var result = /getElem\(\"(.+)\"\)/i.exec(cmd);
  return result ? result[1] : '';
};


/**
 * Gets the test object given the information from server or local.
 * @param {string|Object} testInfo The test info either an object or json.
 * @return {Object} The test object.
 */
bite.base.Helper.getTestObject = function(testInfo) {
  var testType = typeof testInfo;
  if (testType == 'string') {
    testInfo = goog.json.parse(testInfo);
  }
  if (testInfo['active']) {
    testInfo = testInfo['active'];
    if (typeof testInfo == 'string') {
      testInfo = goog.json.parse(testInfo);
    }
  }
  return testInfo;
};


/**
 * This is originated from online source, which is used to pretty print xml.
 * @param {number} len The length of the indentation.
 * @return {string} The spaces.
 * @export
 */
bite.base.Helper.spaces = function(len) {
  var s = '';
  for (var i = 0; i < len; ++i) {
    s += ' ';
  }
  return s;
};


/**
 * This is originated from online source, which is used to pretty print xml.
 * http://stackoverflow.com/questions/376373/pretty-printing-xml-with-javascript
 * @param {string} str The raw xml string.
 * @return {string} The formatted string.
 * TODO(phu): Rewrite the method if necessary.
 * @export
 */
bite.base.Helper.formatXml = function(str) {
  var xml = '';
  // add newlines
  str = str.replace(/(>)(<)(\/*)/g, '$1\r$2$3');
  // add indents
  var pad = 0;
  var indent = 0;
  var node = null;
  // split the string
  var strArr = str.split('\r');
  // check the various tag states
  for (var i = 0; i < strArr.length; i++) {
    indent = 0;
    node = strArr[i];
    if (node.match(/.+<\/\w[^>]*>$/)) {
      //open and closing in the same line
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      // closing tag
      if (pad > 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      //opening tag
      indent = 1;
    } else {
      indent = 0;
    }
    xml += bite.base.Helper.spaces(pad * 4) + node + '\r';
    pad += indent;
  }
  return xml;
};

