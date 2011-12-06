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
 * @fileoverview Define the helper functions for MVCs (Model/View/Controls).
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.common.mvc.helper');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.query');
goog.require('soy');



/**
 * Takes an object whose keys are element ids, looks up each element, and
 * sets the key's value in the object to that element or null if the element
 * was not found or there was more than one.  Returns false if an element was
 * assigned null.  It also assumes that each id is unique in the opt_srcElement
 * (defaults to the document if not given).
 *
 * Note that goog.dom.query is used instead of goog.dom.getElement because
 * getElement assumes the elements are already part of the document.  Query
 * can search relative to an element even if it is not in the document.  Plus
 * it is a targeted search rather than over the whole document.
 * @param {Object.<string, Element>} inout_idToElementMap An object containing
 *     an element id.  This function will look up the element by id and
 *     set the object's value to that element.  If the element is not found
 *     or there is more than one then null is assigned as the value.
 * @param {!Element=} opt_srcElement The opt_srcElement to use when looking up
 *     the id.  If an element is not given then the document will be used.
 * @return {boolean} Whether or not all the ids were found.
 */
bite.common.mvc.helper.bulkGetElementById = function(inout_idToElementMap,
                                                     opt_srcElement) {
  var src = opt_srcElement || goog.dom.getDocument();
  // srcId will only be assigned if src is an Element thus guaranteeing that
  // only elements are returned by this function.
  var srcId = 'id' in src && opt_srcElement ? src['id'] : '';

  var success = true;

  for (var elementId in inout_idToElementMap) {
    if (srcId && elementId == srcId) {
      inout_idToElementMap[elementId] = /** @type {Element} */ (src);
      continue;
    }

    var id = '[id="' + elementId + '"]';
    var query = goog.dom.query(id, src);
    if (query.length != 1) {
      inout_idToElementMap[elementId] = null;
      success = false;
      continue;
    }

    inout_idToElementMap[elementId] = query[0];
  }

  return success;
};


/**
 * Takes an id and a source element and retrieves the element with that id.
 * The intent is to provide the same general functionality as
 * goog.dom.getElement(), but to allow a targeted search rather than searching
 * the entire document for an element.
 * @param {string} id The element id to search for.
 * @param {!Element} srcElement The element from which to start the search.
 * @return {Element} Return either the element or null.  Null will also be
 *     returned in multiple elements with the same id are found.
 */
bite.common.mvc.helper.getElement = function(id, srcElement) {
  var query = goog.dom.query('[id="' + id + '"]', srcElement);
  if (query.length != 1) {
    return null;
  }

  return query[0];
};


/**
 * Creates the model and adds it to the document's body.
 * @param {function((Object|null|undefined),
 *                  (goog.string.StringBuffer|null|undefined)):
 *                  (string|undefined)} getModelFunc The soy template function
 *     that creates the console's model.
 * @param {Object.<string>=} opt_data Optional data that can be passed to the
 *     template function.
 * @return {Element} Return the element or null on failure.
 */
bite.common.mvc.helper.initModel = function(getModelFunc, opt_data) {
  var element = bite.common.mvc.helper.renderModel(getModelFunc, opt_data);
  if (!element) {
    return null;
  }

  var body = goog.dom.getDocument().body;

  // Note that goog.dom.getFirstElementChild does not recognize certain node
  // types such as #text nodes.  So manually get first child.
  var child = body.firstChild || null;
  if (!child) {
    goog.dom.appendChild(body, element);
  } else {
    goog.dom.insertSiblingBefore(element, child);
  }

  return element;
};


/**
 * Adds the view to the document by appending a link tag with the appropriate
 * css url to the head of the document.
 * @param {function((Object|null|undefined),
 *                  (goog.string.StringBuffer|null|undefined)):
 *                  (string|undefined)} getViewFunc The soy template function
 *     that creates a link tag to the appropriate css.
 * @param {string=} opt_baseUrl The base url to use for relative references.
 * @return {boolean} Whether or not the procedure was a success.
 */
bite.common.mvc.helper.initView = function(getViewFunc, opt_baseUrl) {
  opt_baseUrl = opt_baseUrl || '';

  // Prepare style tag and get first head element.
  var style = soy.renderAsElement(getViewFunc, {'baseUrl': opt_baseUrl});
  var headResults = goog.dom.getElementsByTagNameAndClass(
      goog.dom.TagName.HEAD);
  if (!style || !headResults.length) {
    return false;
  }

  var head = headResults[0];
  goog.dom.appendChild(head, style);

  return true;
};


/**
 * Removes all element instances with the given id.
 * @param {string} id The element id to search for.
 */
bite.common.mvc.helper.removeElementById = function(id) {
  id = '[id="' + id + '"]';
  var query = goog.dom.query(id);

  // Not assuming that the query results is a live/dynamic node list versus
  // a static one, so copy references before removing them from the document.
  var element = [];
  for (var i = 0, len = query.length; i < len; ++i) {
    element.push(query[i]);
  }

  for (var i = 0, len = element.length; i < len; ++i) {
    goog.dom.removeNode(element[i]);
  }
};


/**
 * Generate an element using a soy template.
 * @param {function((Object|null|undefined),
 *                  (goog.string.StringBuffer|null|undefined)):
 *                  (string|undefined)} getModelFunc The soy template function
 *     that creates the console's model.
 * @param {Object.<string>=} opt_data Optional data that can be passed to the
 *     template function.
 * @return {Element} Return the element or null on failure.
 */
bite.common.mvc.helper.renderModel = function(getModelFunc, opt_data) {
  var element = soy.renderAsElement(getModelFunc, opt_data);
  if (!element) {
    return null;
  }

  return element;
};


/**
 * Generate an element using a soy template and the specified tag.
 * @param {string} tag The tag name of the created element.
 * @param {function((Object|null|undefined),
 *                  (goog.string.StringBuffer|null|undefined)):
 *                  (string|undefined)} getModelFunc The soy template function
 *     that creates the console's model.
 * @param {Object.<string>=} opt_data Optional data that can be passed to the
 *     template function.
 * @return {Element} Return the element or null on failure.
 */
bite.common.mvc.helper.renderModelAs = function(tag, getModelFunc, opt_data) {
  var element = goog.dom.createElement(tag);
  if (!element) {
    return null;
  }

  soy.renderElement(element, getModelFunc, opt_data);

  return element;
};


/**
 * Modify the given element's innerHTML to the string returned by the soy
 * template.
 * @param {Element} element The element to add the model to.
 * @param {function((Object|null|undefined),
 *                  (goog.string.StringBuffer|null|undefined)):
 *                  (string|undefined)} getModelFunc The soy template function
 *     that creates the console's model.
 * @param {Object.<string>=} opt_data Optional data that can be passed to the
 *     template function.
 * @return {boolean} Whether or not success occurred.
 */
bite.common.mvc.helper.renderModelFor = function(element, getModelFunc,
                                                 opt_data) {
  if (!element) {
    return false;
  }

  soy.renderElement(element, getModelFunc, opt_data);

  return true;
};


/**
 * Validates a specific kind of name that has a limited character set.  The
 * names follow the rules such that it must begin with a letter and then
 * can contain any letter, number, or underscore.  This is useful for naming
 * things such as project labels, files, test names, etc.
 * TODO (jasonstredwick): This function probably does not belong here.
 *     examine its usefulness and move it where appropriate.
 * TODO (jasonstredwick): This function does not take into account non-ascii
 *     names.  Consider making a string helper that handles these types of
 *     externally facing, user entered names.
 * @param {string} name The name to validate.
 * @return {boolean} Whether or not the name input value is valid.
 */
bite.common.mvc.helper.validateName = function(name) {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
};

