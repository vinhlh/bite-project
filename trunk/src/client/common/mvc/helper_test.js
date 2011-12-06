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
 * @fileoverview Unit tests for bite.common.mvc.helper.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.mvc.helper');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.query');


function setUp() {}


function tearDown() {}


/**
 * Test bite.common.mvc.helper.bulkGetElementById
 */
function testBulkGetElementById() {
  var body = goog.dom.getDocument().body;

  var x = goog.dom.createElement(goog.dom.TagName.DIV);
  var y = goog.dom.createElement(goog.dom.TagName.DIV);
  var z = goog.dom.createElement(goog.dom.TagName.DIV);
  x.id = 'x';
  y.id = 'y';
  z.id = 'z';
  goog.dom.appendChild(body, x);
  goog.dom.appendChild(body, y);
  goog.dom.appendChild(body, z);

  var obj = {
    'x': undefined,
    'y': undefined,
    'z': undefined
  };

  // Test find with src element.
  assertTrue(bite.common.mvc.helper.bulkGetElementById(obj, body));
  assertFalse(goog.isNull(obj.x) || goog.isNull(obj.y) || goog.isNull(obj.z));

  obj.x = undefined;
  obj.y = undefined;
  obj.z = undefined;

  // Test find without src element.
  assertTrue(bite.common.mvc.helper.bulkGetElementById(obj));
  assertFalse(goog.isNull(obj.x) || goog.isNull(obj.y) || goog.isNull(obj.z));

  obj.x = undefined;
  obj.y = undefined;
  obj.z = undefined;

  // Test find with missing id.
  obj['a'] = undefined;
  assertFalse(bite.common.mvc.helper.bulkGetElementById(obj));
  assertTrue(goog.isNull(obj.a));

  // Clean up
  goog.dom.removeNode(x);
  goog.dom.removeNode(y);
  goog.dom.removeNode(z);
}


/**
 * Test bite.common.mvc.helper.getElement.
 */
function testGetElement() {
  var body = goog.dom.getDocument().body;

  var x = goog.dom.createElement(goog.dom.TagName.DIV);
  x.id = 'x';
  x.innerHTML = '<div id="y"><div id="z"></div></div>';
  goog.dom.appendChild(body, x);

  var element = bite.common.mvc.helper.getElement('y', goog.dom.getDocument());
  assertNotNull(element);
  assertEquals('y', element.id);

  element = bite.common.mvc.helper.getElement('z', x);
  assertNotNull(element);
  assertEquals('z', element.id);

  // Clean up
  goog.dom.removeNode(x);
}


/**
 * Test bite.common.mvc.helper.initModel
 */
function testInitModel() {
  var body = goog.dom.getDocument().body;

  var modelFunc = function(data) {
    return '<div id="' + data['name'] + '"></div>';
  }

  var data = [{'name': 'e1'}, {'name': 'e2'}, {'name': 'e3'}];
  for (i = 0, len = data.length; i < len; ++i) {
    bite.common.mvc.helper.initModel(modelFunc, data[i]);
  }

  var elements = [];
  for (i = 0, j = data.length - 1, len = body.childNodes.length;
      i < len && j >= 0; ++i, --j) {
    assertEquals(data[j]['name'], body.childNodes[i].id);
    elements.push(body.childNodes[i]);
  }

  // Clean up
  for (i = 0, len = elements.length; i < len; ++i) {
    goog.dom.removeNode(elements[i]);
  }
}


/**
 * Test bite.common.mvc.helper.initView.
 */
function testInitView() {
  var func = function(data) {
    return '<div id="init-view-test">' + (data['baseUrl'] || 'empty') +
           '</div>';
  };

  // Test with url
  var query = goog.dom.query('[id="init-view-test"]');
  assertEquals(0, query.length);

  assertTrue(bite.common.mvc.helper.initView(func, 'testurl'));
  query = goog.dom.query('[id="init-view-test"]');
  assertEquals(1, query.length);
  assertEquals('testurl', query[0].innerHTML);

  goog.dom.removeNode(query[0]);
  query = goog.dom.query('[id="init-view-test"]');
  assertEquals(0, query.length);

  // Test with no url
  assertTrue(bite.common.mvc.helper.initView(func));
  query = goog.dom.query('[id="init-view-test"]');
  assertEquals(1, query.length);
  assertEquals('empty', query[0].innerHTML);

  goog.dom.removeNode(query[0]);
  query = goog.dom.query('[id="init-view-test"]');
  assertEquals(0, query.length);
}


/**
 * Test bite.common.mvc.helper.removeElementById
 */
function testRemoveElementById() {
  var body = goog.dom.getDocument().body;

  // Remove with no matching id.
  try {
    bite.common.mvc.helper.removeElementById('fail');
  } catch (error) {
    fail(error);
  }

  var x = goog.dom.createElement(goog.dom.TagName.DIV);
  var y = goog.dom.createElement(goog.dom.TagName.DIV);
  var z = goog.dom.createElement(goog.dom.TagName.DIV);
  x.id = 'x';
  y.id = 'x';
  z.id = 'x';

  // Remove single instance of an element with the given id.
  goog.dom.appendChild(body, x);
  var query = goog.dom.query('[id="x"]');
  assertEquals(1, query.length);
  bite.common.mvc.helper.removeElementById('x');
  query = goog.dom.query('[id="x"]');
  assertEquals(0, query.length);

  // Remove multiple instances of an element with the given id.
  goog.dom.appendChild(body, x);
  goog.dom.appendChild(body, y);
  goog.dom.appendChild(body, z);
  var query = goog.dom.query('[id="x"]');
  assertEquals(3, query.length);
  bite.common.mvc.helper.removeElementById('x');
  query = goog.dom.query('[id="x"]');
  assertEquals(0, query.length);
}


/**
 * Test bite.common.mvc.helper.validateName
 */
function testValidateName() {
  var name = '';
  // Test empty string
  assertFalse(bite.common.mvc.helper.validateName(name));

  // Test bad values
  name = '_';
  assertFalse(bite.common.mvc.helper.validateName(name));
  name = '_a';
  assertFalse(bite.common.mvc.helper.validateName(name));
  name = '1';
  assertFalse(bite.common.mvc.helper.validateName(name));
  name = '1a';
  assertFalse(bite.common.mvc.helper.validateName(name));
  name = 'a b';
  assertFalse(bite.common.mvc.helper.validateName(name));
  name = 'a.txt';
  assertFalse(bite.common.mvc.helper.validateName(name));

  // Test valid values
  name = 'a';
  assertTrue(bite.common.mvc.helper.validateName(name));
  name = 'a1_';
  assertTrue(bite.common.mvc.helper.validateName(name));
  name = 'a_1';
  assertTrue(bite.common.mvc.helper.validateName(name));
  name = 'very_long_name';
  assertTrue(bite.common.mvc.helper.validateName(name));
}

