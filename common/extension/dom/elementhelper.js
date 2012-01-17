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
 * @fileoverview This file contains the element descriptive info
 * generator and parser.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('common.client.ElementDescriptor');

goog.require('Bite.Constants');
goog.require('common.dom.querySelector');
goog.require('goog.dom');
goog.require('goog.format.HtmlPrettyPrinter');
goog.require('goog.format.JsonPrettyPrinter');
goog.require('goog.json');
goog.require('goog.string');



/**
 * A class for generating and parsing the descriptive info of an element.
 * @constructor
 * @export
 */
common.client.ElementDescriptor = function() {
  /**
   * The private console logger.
   * @private
   */
  this.console_ = goog.global.console;
};


/**
 * Gets element based on the given method and value.
 * @param {string} method The method to locate an element.
 * @param {string} value The value to locate an element.
 * @return {Element} The matching element.
 * @export
 */
common.client.ElementDescriptor.getElemBy = function(method, value) {
  var doc = goog.dom.getDocument();
  try {
    switch (method) {
      case 'xpath':
        return doc.evaluate(
            value, doc, null, XPathResult.ANY_TYPE, null).iterateNext();
      case 'id':
        return goog.dom.getElement(value);
      case 'linktext':
        return doc.evaluate(
          '//a[text()="' + value + '"]', doc,
          null, XPathResult.ANY_TYPE, null).iterateNext();
      case 'class':
        return doc.querySelector('.' + value);
      case 'name':
        return doc.getElementsByName(value)[0];
      case 'selector':
        return doc.querySelector(value);
    }
  } catch (e) {
    console.log('Error: ' + e.message);
    return null;
  }
};


/**
 * Generates the css selector path of an element.
 * @param {!Node} elem The element object.
 * @return {string} The selector string.
 * @export
 */
common.client.ElementDescriptor.prototype.generateSelectorPath = function(
    elem) {
  var selector = '';
  try {
    selector = common.dom.querySelector.getSelector(elem);
  } catch (e) {
    console.log('Failed to generate the selector path.');
  }
  return selector;
};


/**
 * Generates the css selector of an element.
 * @param {Element} elem The element object.
 * @return {string} The selector string.
 * @export
 */
common.client.ElementDescriptor.prototype.generateSelector = function(elem) {
  var curElem = elem;
  var selector = this.generateSelector_(curElem);
  while (!this.isSelectorUnique_(elem, selector)) {
    curElem = curElem.parentNode;
    if (curElem == document || curElem.tagName.toLowerCase() == 'html') {
      break;
    }
    selector = this.generateSelector_(curElem) + '>' + selector;
  }
  return selector;
};


/**
 * Generates the xpath of an element based on user specified attribute array.
 * @param {Element} elem The element object.
 * @param {Object.<string, Object>} ancestorAttrs The key is the ancestor
 *     elements' attribute and the value is an object which contains the
 *     attribute's value and whether the value should be exact or contained.
 * @param {Object.<string, Object>} elementAttrs Refers to the ancestorAttrs,
 *     the difference is that this object contains the selected element's
 *     attributes.
 * @return {string} The xpath string.
 * @export
 */
common.client.ElementDescriptor.prototype.generateXpath = function(
    elem, ancestorAttrs, elementAttrs) {
  var curElem = elem;
  var doc = goog.dom.getDocument();
  var xpath = this.generateXpath_(curElem, elementAttrs);
  var notUnique = false;

  // Loops to check if the xpath matches a unique element.
  while (curElem.tagName.toLowerCase() != 'body' &&
         (notUnique = !this.isXpathUnique_(elem, '//' + xpath))) {
    curElem = curElem.parentNode;
    xpath = this.generateXpath_(curElem, ancestorAttrs) + '/' + xpath;
  }
  if (notUnique) {
    console.log('The final xpath is (not working): ' + ('//' + xpath) + '\n' +
                'The found elements by the above xpath are:');
    console.log(this.getAllElementsByXpath_('//' + xpath));
    return 'Error (please check the developer console for xpath)';
  } else {
    return '//' + xpath;
  }
};


/**
 * Generates the xpath of an element based on user specified attribute array.
 * @param {Node} elem The element object.
 * @param {Object.<string, Object>} attrs Refers to the generateXpath's doc.
 * @return {string} The xpath string.
 * @private
 */
common.client.ElementDescriptor.prototype.generateXpath_ = function(
    elem, attrs) {
  var attrXpath = '';
  for (var attr in attrs) {
    var text = '';
    var isExact = true;
    if (!attrs[attr]) {
      // Assume if the value is null, then it needs dynamically get the
      // attribute value and assume it should be exact match.
      text = attr == 'text' ?
          goog.dom.getTextContent(/** @type {Node} */ (elem)) :
          elem.getAttribute(attr);
    } else {
      text = attrs[attr]['value'];
      isExact = attrs[attr]['isExact'];
    }
    if (attr == 'text') {
      if (isExact) {
        attrXpath += ('[text()="' + text + '"]');
      } else {
        attrXpath += ('[contains(text(),"' + text + '")]');
      }
    } else {
      if (text) {
        if (isExact) {
          attrXpath += ('[@' + attr + '="' + text + '"]');
        } else {
          attrXpath += ('[contains(@' + attr + ',"' + text + '")]');
        }
      }
    }
  }
  // If the xpath with attribute matches unique element, no need to
  // append the node index info.
  if (this.isXpathUnique_(
      /** @type {Element} */ (elem), '//' + elem.tagName + attrXpath)) {
    return elem.tagName + attrXpath;
  }
  var children = [];
  var prefix = '';
  if (elem.parentNode) {
    children = goog.dom.getChildren(/** @type {Element} */ (elem.parentNode));
    for (var i = 0, j = 0, len = children.length; i < len; ++i) {
      if (children[i].tagName == elem.tagName) {
        ++j;
        if (children[i].isSameNode(elem)) {
          prefix = elem.tagName + '[' + j + ']';
        }
      }
    }
  }
  return prefix + attrXpath;
};


/**
 * The relatively stable attributes.
 * @private
 */
common.client.ElementDescriptor.elemAttr_ = ['name', 'class', 'title'];


/**
 * Generates the css selector of an element.
 * @param {Node} elem The element object.
 * @return {string} The selector string.
 * @private
 */
common.client.ElementDescriptor.prototype.generateSelector_ = function(elem) {
  var selector = '';
  var children = [];
  var attrSelector = '';
  var attrs = common.client.ElementDescriptor.elemAttr_;
  if (elem.getAttribute('id')) {
    return elem.tagName + '#' + elem.getAttribute('id');
  }
  for (var i = 0, len = attrs.length; i < len; i++) {
    var value = elem.getAttribute(attrs[i]);
    if (value) {
      attrSelector += ('[' + attrs[i] + '="' + value + '"]');
    }
  }
  if (elem.parentNode) {
    children = goog.dom.getChildren(/** @type {Element} */ (elem.parentNode));
    var j = 0;
    for (var i = 0, len = children.length; i < len; i++) {
      if (children[i].tagName == elem.tagName) {
        j += 1;
        if (children[i].isSameNode(elem)) {
          selector = elem.tagName + ':nth-of-type(' + j + ')';
        }
      }
    }
  }
  return selector + attrSelector;
};


/**
 * Tests if the selector is unique for the given elem.
 * @param {Element} elem The element object.
 * @param {string} selector The selector string.
 * @return {boolean} Whether the selector is unique.
 * @private
 */
common.client.ElementDescriptor.prototype.isSelectorUnique_ = function(
    elem, selector) {
  var elems = null;
  try {
    elems = goog.dom.getDocument().querySelectorAll(selector);
  } catch (e) {
    console.log('Failed to find elements through selector ' + selector);
    return false;
  }
  return elems && elems.length == 1 && elem.isSameNode(elems[0]);
};


/**
 * Tests if the xpath is unique for the given elem.
 * @param {Element} elem The element object.
 * @param {string} xpath The xpath string.
 * @return {boolean} Whether the xpath is unique.
 * @private
 */
common.client.ElementDescriptor.prototype.isXpathUnique_ = function(
    elem, xpath) {
  try {
    var doc = goog.dom.getDocument();
    var elems = null;
    elems = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    var firstR = elems.iterateNext();
    var secondR = elems.iterateNext();
    return firstR && !secondR && elem.isSameNode(firstR);
  } catch (e) {
    throw new Error('Failed to find elements through xpath ' + xpath);
  }
};


/**
 * Gets all of the elements by a given xpath.
 * @param {string} xpath The xpath string.
 * @return {!Array.<Element>} The elements that match the given xpath.
 * @private
 */
common.client.ElementDescriptor.prototype.getAllElementsByXpath_ = function(
    xpath) {
  var elements = [];
  try {
    var doc = goog.dom.getDocument();
    var elems = null;
    var temp = null;
    elems = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    while (temp = elems.iterateNext()) {
      elements.push(temp);
    }
    return elements;
  } catch (e) {
    console.log('Failed to find elements through xpath ' + xpath);
    return [];
  }
};


/**
 * Generates the descriptor of an element.
 * @param {Element} elem The element object.
 * @param {number} propagateTimes The number of ancestors to collect.
 * @param {boolean} opt_Optimized Whether use optimized alogrithm.
 * @return {string} An string of the descriptive info of an element.
 * @export
 */
common.client.ElementDescriptor.prototype.generateElementDescriptor =
    function(elem, propagateTimes, opt_Optimized) {
  var opt = true;
  if (opt_Optimized == false) {
    opt = false;
  }
  var descriptor = goog.json.serialize(this.generateElementDescriptor_(
      elem, propagateTimes, opt));
  var printer = new goog.format.JsonPrettyPrinter(null);
  return printer.format(descriptor);
};


/**
 * Generates an element descriptor including all necessary info.
 * @param {Node} elem The HTML element.
 * @param {number} propagateTimes The number of ancestors to collect.
 * @param {boolean} opt Whether to use optimized algorithm.
 * @return {Object} Element descriptor object.
 * @private
 */
common.client.ElementDescriptor.prototype.generateElementDescriptor_ =
    function(elem, propagateTimes, opt) {
  if (!elem) {
    return null;
  }
  var descriptor = {};
  descriptor.tagName = elem.tagName;
  descriptor.elementText = this.fixStr(this.getText(elem), opt);
  this.addImplicitAttrs_(descriptor, /** @type {Element} */ (elem));
  var attrs = elem.attributes;
  var attrsLen = 0;
  if (attrs) {
    attrsLen = attrs.length;
  }
  if (attrsLen) {
    descriptor.attributes = {};
  }
  for (var i = 0; i < attrsLen; i++) {
    descriptor.attributes[attrs[i].name] = this.fixStr(attrs[i].value, opt);
  }
  descriptor.optimized = opt;
  if (elem.parentNode && propagateTimes) {
    descriptor.parentElem = this.generateElementDescriptor_(
        elem.parentNode, propagateTimes - 1, opt);
  } else {
    descriptor.parentElem = null;
  }
  return descriptor;
};


/**
 * Adds implicit attributes of the given element to descriptor.
 * @param {Object} descriptor The descriptor object for the given element.
 * @param {Element} elem The HTML element.
 * @private
 */
common.client.ElementDescriptor.prototype.addImplicitAttrs_ =
    function(descriptor, elem) {
  if (!elem || !elem['tagName']) {
    return;
  }
  var tagNameUpper = elem['tagName'].toUpperCase();
  switch (tagNameUpper) {
    case goog.dom.TagName.SELECT:
      descriptor['selectedIndex'] = elem.selectedIndex + '';
      break;
    case goog.dom.TagName.INPUT:
      if (elem['type']) {
        var typeLower = elem['type'].toLowerCase();
        if (typeLower == 'radio' || typeLower == 'checkbox') {
          descriptor['checked'] = elem.checked + '';
        } else if (typeLower == 'button' || typeLower == 'submit') {
          descriptor['disabled'] = elem.disabled + '';
        }
      }
      break;
    case goog.dom.TagName.BUTTON:
      descriptor['disabled'] = elem.disabled + '';
      break;
  }
};


/**
 * Adds implicit attributes score.
 * @param {Object} descriptor The descriptor object for the given element.
 * @param {Element} elem The element to be compared.
 * @return {number} The score.
 * @private
 */
common.client.ElementDescriptor.prototype.addImplicitAttrsScore_ =
    function(descriptor, elem) {
  var score = 0;
  if (descriptor['disabled']) {
    score += this.getFieldScore_(descriptor['disabled'], elem.disabled + '');
  }
  if (descriptor['checked']) {
    score += this.getFieldScore_(descriptor['checked'], elem.checked + '');
  }
  if (descriptor['selectedIndex']) {
    score += this.getFieldScore_(descriptor['selectedIndex'],
                                 elem.selectedIndex + '');
  }
  return score;
};


/**
 * Parses the element descriptor and gets the potential element(s).
 * @param {string} descriptorStr The descriptive info string of an element.
 * @param {boolean=} opt_all Whether returns all of the results.
 * @return {Object} Found element(s).
 * @export
 */
common.client.ElementDescriptor.prototype.parseElementDescriptor =
    function(descriptorStr, opt_all) {
  var document_ = document;
  var result = this.parseElementDescriptor_(descriptorStr, document_, opt_all);
  return result['elems'] ? result :
         {'elems': null, 'matchHtmls': 'Attribute validation failed.'};
};


/**
 * Parses an element descriptor string and returns all the found elements.
 * @param {string|Object} descriptorStrOrObj The descriptive info of an elem.
 * @param {Object} document_ The document object (could be from a frame).
 * @param {boolean=} opt_all Whether returns all of the results.
 * @return {Object.<Element|Array,string|Array>}
 *     An element or a group of elements.
 * @private
 */
common.client.ElementDescriptor.prototype.parseElementDescriptor_ =
    function(descriptorStrOrObj, document_, opt_all) {
  var descriptor = {};
  if (typeof(descriptorStrOrObj) == 'string') {
    descriptor = goog.json.parse(descriptorStrOrObj);
  } else {
    descriptor = descriptorStrOrObj;
  }
  var tag = descriptor['tagName'];
  if (typeof(tag) != 'string') {
    tag = tag['value'];
  }
  var elemsStart = document_.getElementsByTagName(tag);
  var desc = descriptor;
  var elems = elemsStart;
  var matchHtmls = [];
  var rtnObj = {};
  var level = 0;
  while (elems.length >= 1 && desc) {
    rtnObj = this.parse_(
        elems, /** @type {Object} */ (desc), level, matchHtmls);
    elems = rtnObj['elems'];
    matchHtmls = rtnObj['matchHtmls'];
    if (desc['parentElem']) {
      desc = desc['parentElem'];
    } else {
      desc = null;
    }
    level += 1;
  }
  if (elems.length == 0) {
    return {'elems': null, 'matchHtmls': matchHtmls};
  }
  if (opt_all) {
    return {'elems': elems, 'matchHtmls': matchHtmls};
  } else {
    return {'elems': elems[0], 'matchHtmls': matchHtmls[0]};
  }
};


/**
 * Deals with the back compatibility issue.
 * @param {Object} descriptor The descriptor object.
 * @param {boolean} opt Whether is optimized.
 * @param {Element|Node} elem The element object.
 * @return {number} The score got from back compat.
 * @private
 */
common.client.ElementDescriptor.prototype.getBackCompat_ =
    function(descriptor, opt, elem) {
  var attrs = [];
  var newKeyWords = {'tagName': 1, 'elementText': 1,
                     'parentElem': 1, 'optimized': 1,
                     'attributes': 1};
  var score = 0;
  var elemKey = '';
  for (var key in descriptor) {
    if (key in newKeyWords) {
      continue;
    }
    elemKey = key;
    if (key == 'class_') {
      elemKey = 'class';
    }
    var attr = this.getAttr_(elem, elemKey);
    if (attr) {
      if (descriptor[key] == this.fixStr(attr['value'], opt)) {
        score++;
      }
    }
  }
  return score;
};


/**
 * Parses the element descriptor and return the possible elements.
 * @param {Array} elems An array of elements.
 * @param {Object} descriptor The descriptor object of an element.
 * @param {number} level The level of ancestor.
 * @param {Array} matchHtmls The matching htmls array.
 * @return {Object} An object of found elements.
 * @private
 */
common.client.ElementDescriptor.prototype.parse_ =
    function(elems, descriptor, level, matchHtmls) {
  var rtnArry = [];
  var rtnMatchInfoArry = [];
  var topScore = 0;
  for (var i = 0; i < elems.length; i++) {
    var elem = this.getAncestor_(elems[i], level);
    var matchInfoHtml = '';
    if (!elem) {
      continue;
    }
    var scoreTotal = 0;
    scoreTotal += this.getFieldScore_(descriptor['tagName'], elem.tagName);
    matchInfoHtml += this.getColoredHtml_('<', 'green');
    matchInfoHtml += this.getAttrHtml_(descriptor['tagName'], elem.tagName);
    var opt = descriptor['optimized'];
    scoreTotal += this.getFieldScore_(descriptor['elementText'],
                                      this.fixStr(this.getText(elem), opt));
    scoreTotal += this.addImplicitAttrsScore_(
        descriptor, /** @type {Element} */ (elem));
    var attrs = descriptor.attributes;
    for (var key in attrs) {
      var attr = elem.attributes.getNamedItem(key);
      scoreTotal += this.getFieldScore_(
          attrs[key], this.fixStr(attr ? attr.value : '', opt));
      matchInfoHtml += this.getColoredHtml_(' ' + key + '="', 'green');
      matchInfoHtml += this.getAttrHtml_(attrs[key],
          this.fixStr(attr ? attr.value : '', opt));
      matchInfoHtml += this.getColoredHtml_('"', 'green');
    }
    matchInfoHtml += this.getColoredHtml_('>', 'green');
    if (!level) {
      matchInfoHtml += '<br>' + this.getAttrHtml_(descriptor['elementText'],
          this.fixStr(this.getText(elem), opt));
    }
    if (!attrs) {
      var backCompatScore = this.getBackCompat_(descriptor, opt, elem);
      scoreTotal += backCompatScore;
    }
    if (scoreTotal < 0) {
      continue;
    }
    if (rtnArry[0]) {
      if (topScore < scoreTotal) {
        rtnArry = [];
        rtnMatchInfoArry = [];
        topScore = scoreTotal;
      } else if (topScore > scoreTotal) {
        continue;
      }
    } else {
      topScore = scoreTotal;
    }
    rtnArry.push(elems[i]);
    if (matchHtmls && matchHtmls.length > i) {
      matchInfoHtml += '<br>' + matchHtmls[i];
    }
    rtnMatchInfoArry.push(matchInfoHtml);
  }
  return {'elems': rtnArry, 'matchHtmls': rtnMatchInfoArry};
};


/**
 * Gets an attribute of an Element.
 * @param {Object} elem The HTML object.
 * @param {string} attrName The attribute name.
 * @return {string} The specified attribute of the element.
 * @private
 */
common.client.ElementDescriptor.prototype.getAttr_ = function(
    elem, attrName) {
  return elem.attributes.getNamedItem(attrName);
};


/**
 * Trims a given string.
 * @param {string} stringToTrim The string to be trimmed.
 * @return {string} The trimmed string.
 * @export
 */
common.client.ElementDescriptor.prototype.trim = function(stringToTrim) {
  return stringToTrim.replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if the given string has unicode in it.
 * @param {string} str The string to be checked.
 * @return {boolean} Whether the string contains unicode.
 * @export
 */
common.client.ElementDescriptor.prototype.isUnicode = function(str) {
  for (var i = 0; i < str.length; i++) {
    if (str[i].charCodeAt() > 127) {
      return true;
    }
  }
  return false;
};


/**
 * Gets text from an element.
 * @param {Object} node The HTML element.
 * @return {string} The displayed text.
 * @export
 */
common.client.ElementDescriptor.prototype.getText = function(node) {
  var rtnText = '';
  // TODO(phu): Examine the use of test versions to determine how to process
  // text nodes.  Removed solution examined the browser version, but should
  // use test related information.
  rtnText = this.trim(goog.dom.getTextContent(/** @type {Node} */ (node)));
  return rtnText;
};


/**
 * Optimizes the way of collecting text.
 * @param {string} text The given text.
 * @param {boolean} opt Whether to use optimized algorithm.
 * @return {string} The optimized text.
 * @export
 */
common.client.ElementDescriptor.prototype.fixStr = function(text, opt) {
  var isAsciiStr = true;
  try {
    isAsciiStr = !this.isUnicode(text);
  } catch (e) {
    console.log('Error occured in fixStr: ' + e.message);
  }
  if (opt && isAsciiStr) {
    return this.getSimpleAscii(text);
  } else {
    return text;
  }
};


/**
 * Replaces the original string with a pure Ascii simple one.
 * @param {string} text The given text.
 * @return {string} A pure Ascii text.
 * @export
 */
common.client.ElementDescriptor.prototype.getSimpleAscii = function(text) {
  var maxLen = 20; //experiment with length
  text = text.replace(/\W+/g, '');
  var textStarts = text.length > maxLen ? text.length - maxLen : 0;
  return text.substring(textStarts);
};


/**
 * Gets the value and score of an element.
 * @param {string|Object} value The value string or object.
 * @return {Array} Value and score array.
 * @private
 */
common.client.ElementDescriptor.prototype.getValueAndScore_ =
    function(value) {
  var rtnValue = '';
  var rtnScore = 1;
  if (typeof(value) == 'string') {
    rtnValue = value;
  } else {
    rtnValue = value['value'];
    if (value['score']) {
      rtnScore = value['score'];
    }
    if (value['show'] == 'ignore') {
      rtnValue = '';
      rtnScore = 0;
    }
  }
  return [rtnValue, rtnScore];
};


/**
 * Gets the score.
 * @param {string | Object} value The value string or object.
 * @param {string} domValue The dom element's value string.
 * @return {number} The corresponding score.
 * @private
 */
common.client.ElementDescriptor.prototype.getFieldScore_ =
    function(value, domValue) {
  if (value) {
    var result = this.getValueAndScore_(value);
    var backCompatValue = this.getSimpleAscii(domValue);
    if (result[0] == domValue || result[0] == backCompatValue) {
      return result[1];
    } else {
      if (value['show'] && value['show'] == 'must') {
        return -999; //As long as this could make the total score negative.
      }
      return 0;
    }
  }
  return 0;
};


/**
 * Gets the colored attribute.
 * @param {string | Object} value The value string or object.
 * @param {string} domValue The dom element's value string.
 * @return {string} The corresponding html.
 * @private
 */
common.client.ElementDescriptor.prototype.getAttrHtml_ =
    function(value, domValue) {
  if (value) {
    var result = this.getValueAndScore_(value);
    if (result[0] == domValue) {
      return this.getColoredHtml_(result[0], 'green');
    } else {
      return this.getColoredHtml_(result[0], 'red') +
             this.getColoredHtml_(' (' + domValue + ')', 'black');
    }
  }
  return '';
};


/**
 * Gets the ancestor at a given level.
 * @param {Element} elem The element.
 * @param {number} level The level of an ancestor.
 * @return {Element|Node} The ancestor element.
 * @private
 */
common.client.ElementDescriptor.prototype.getAncestor_ =
    function(elem, level) {
  if (!elem) {
    return null;
  }
  var rtnElem = elem;
  for (var i = 0; i < level; i++) {
    rtnElem = rtnElem.parentNode;
    if (!rtnElem) {
      return null;
    }
  }
  return rtnElem;
};


/**
 * Returns a colored html string.
 * @param {string} text The dom element's value string.
 * @param {string} color The color string.
 * @return {string} The colored html string.
 * @private
 */
common.client.ElementDescriptor.prototype.getColoredHtml_ =
    function(text, color) {
  return '<span style="color:' + color + '">' + text + '</span>';
};


/**
 * The element descriptor instance.
 * @export
 */
var elemDescriptor = new common.client.ElementDescriptor();


/**
 * Express function for parsing an element.
 * @param {string} descriptor The descriptive info object of an element.
 * @param {boolean=} opt_all Whether returns all of the results.
 * @return {Element} The found element.
 * @export
 */
function parseElementDescriptor(descriptor, opt_all) {
  if (typeof descriptor == 'string') {
    try {
      goog.json.parse(descriptor);
    } catch (e) {
      return null;
    }
  }
  var rtnObj = elemDescriptor.parseElementDescriptor(descriptor, opt_all);
  var rtn = rtnObj['elems'];
  var matchHtml = rtnObj['matchHtmls'];
  chrome.extension.sendRequest(
      {command: 'setLastMatchHtml', html: matchHtml});
  return rtn;
}


/**
 * Instance of the ElementDescriptor class.
 * @type {common.client.ElementDescriptor}
 * @export
 */
common.client.ElementDescriptor.instance =
    new common.client.ElementDescriptor();


/**
 * Parses the command and make it runnable.
 * @param {Object} elemMap The element map.
 * @param {string} method The method of getting the element.
 * @return {Object} The element that was found and a log.
 * @export
 */
common.client.ElementDescriptor.getElement = function(elemMap, method) {
  // TODO(phu): Use all the data in elemMap like css selector to find the
  // best match.
  if (method == 'xpath') {
    var xpath = elemMap['xpaths'][0];
    console.log('Uses xpath to find element: ' + xpath);
    return {'elem': common.client.ElementDescriptor.getElemBy(method, xpath),
            'log': 'xPath: ' + elemMap['xpaths'][0]};
  }
  return {'elem': parseElementDescriptor(elemMap['descriptor']),
          'log': 'descriptor: ' + elemMap['descriptor']};
};


/**
 * @export
 */
common.client.ElementDescriptor.runnable = '';


/**
 * Parses the command and make it runnable.
 * @param {string} cmd The command string.
 * @return {string} The runnable puppet code.
 * @export
 */
common.client.ElementDescriptor.parseCommandToRunnable = function(cmd) {
  if (goog.string.startsWith(cmd, 'run(')) {
    var result = cmd.replace('run(', 'BiteRpfAction.');
    return result.replace(', ', '(');
  } else {
    return 'BiteRpfAction.' + cmd;
  }
};


/**
 * Parses the element descriptor and return the possible elements.
 * @param {string} description A string describing an element.
 * @return {?Element} The found element(s).
 * @export
 */
common.client.ElementDescriptor.parseElementDescriptor = function(
    description) {
  try {
    var result = parseElementDescriptor(description);
    if (typeof result == 'string') {
      return null;
    } else {
      return result;
    }
  } catch (error) {
    console.log('ERROR (common.client.ElementDescriptor.' +
                'parseElementDescriptor): An exception was thrown for input ' +
                '- ' + description + '. Returning null.');
  }
};


/**
 * Generates the descriptor of an element.
 * @param {Element} elem The element object.
 * @return {string} A string of the descriptive info of an element.
 * @export
 */
common.client.ElementDescriptor.generateElementDescriptor = function(elem) {
  return common.client.ElementDescriptor.instance.generateElementDescriptor(
      elem, 0, true);
};


/**
 * Generates the descriptor of an element, with specified number of ancestors.
 * @param {Element} elem The element object.
 * @param {number} ancestors The number of element ancestors to go up.
 * @return {string} A string of the descriptive info of an element.
 * @export
 */
common.client.ElementDescriptor.generateElementDescriptorNAncestors = function(
    elem, ancestors) {
  return common.client.ElementDescriptor.instance.generateElementDescriptor(
      elem, ancestors, true);
};


/**
 * Generates the outerHTML of selected element.
 * @param {Element} elem The element object.
 * @return {string} A string of the outerHTML of an element.
 * @export
 */
common.client.ElementDescriptor.generateOuterHtml = function(elem) {
  if (!elem) {
    return '';
  }
  var outerHtmlString = goog.dom.getOuterHtml(elem);
  outerHtmlString = goog.format.HtmlPrettyPrinter.format(outerHtmlString);
  return outerHtmlString;
};


/**
 * Gets all of the attributes of the given element.
 * @param {Element} elem The element object.
 * @return {Array} An array of the attributes.
 * @export
 */
common.client.ElementDescriptor.getAttributeArray = function(elem) {
  if (!elem) {
    return [];
  }
  var attributes = [];
  var temp = {};
  temp['name'] = 'text';
  temp['value'] = goog.dom.getTextContent(/** @type {Node} */ (elem));
  attributes.push(temp);
  var attrs = elem.attributes;
  var attrsLen = attrs ? attrs.length : 0;
  for (var i = 0; i < attrsLen; ++i) {
    temp = {};
    temp['name'] = attrs[i].name;
    temp['value'] = attrs[i].value;
    attributes.push(temp);
  }
  return attributes;
};


/**
 * Puts the "must" attribute/value based on the given object.
 * @param {string} key The attribute's name.
 * @param {string|Object} value The attribute's value.
 * @param {Object} result The result containing all the attribute name
 *     and value pairs.
 * @param {Function=} opt_process The optional function to process the value.
 * @export
 */
common.client.ElementDescriptor.getAttrValue = function(
    key, value, result, opt_process) {
  if (!value) {
    return;
  }
  if (typeof(value) == 'object') {
    if (value['show'] && value['show'] == 'must') {
      var temp = value['value'];
      if (opt_process) {
        temp = opt_process(temp);
      }
      result[key] = temp;
    }
  }
};


/**
 * Gets the "must" attributes/values as an object.
 * @param {string|Object} descriptor The descriptor string or object.
 * @param {Function=} opt_process The optional function to process the value.
 * @return {Object} An object of the attributes/values need to verify.
 * @export
 */
common.client.ElementDescriptor.getAttrsToVerify = function(
    descriptor, opt_process) {
  if (typeof(descriptor) == 'string') {
    descriptor = goog.json.parse(descriptor);
  }
  var result = {};
  var specialAttrs = ['tagName', 'elementText', 'checked', 'disabled',
                      'selectedIndex'];
  for (var i = 0, len = specialAttrs.length; i < len; ++i) {
    common.client.ElementDescriptor.getAttrValue(
        specialAttrs[i], descriptor[specialAttrs[i]], result, opt_process);
  }

  var attributes = descriptor['attributes'];
  for (var name in attributes) {
    common.client.ElementDescriptor.getAttrValue(
        name, attributes[name], result, opt_process);
  }
  return result;
};

