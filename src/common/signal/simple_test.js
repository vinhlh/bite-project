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
 * @fileoverview Unit tests for bite.common.signal.Simple.
 *
 * Test cases:
 *   testMultipleListeners
 *   testBoundListeners
 *   testSignal
 *   noListeners
 *   testBadInputs
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.signal.Simple');


/**
 * The signal created and destroyed for each test.
 * @type {bite.common.signal.Simple}
 */
var signal = null;


/**
 * Sets up the environment for each unit test.
 */
function setUp() {
  signal = new bite.common.signal.Simple();
}


/**
 * Cleans up the environment for each unit test.
 */
function tearDown() {
  signal = null;
}


/**
 * Tests the addition of multiple listeners to a signal.  The test add five
 * listeners to the signal in a specific order and the signal fired.  Then
 * the listeners are removed in a particular order to ensure that the listeners
 * requested for removal are the ones actually removed.  The signal is fired
 * to test the correct removal.
 */
function testMultipleListeners() {
  var counter = 0;
  var f1Counter = 0;
  var f2Counter = 0;
  var f3Counter = 0;
  var f4Counter = 0;
  var f5Counter = 0;

  var f1 = function(obj) { obj.X == 3; ++counter; ++f1Counter; };
  var f2 = function(obj) { obj.X == 3; ++counter; ++f2Counter; };
  var f3 = function(obj) { obj.X == 3; ++counter; ++f3Counter; };
  var f4 = function(obj) { obj.X == 3; ++counter; ++f4Counter; };
  var f5 = function(obj) { obj.X == 3; ++counter; ++f5Counter; };

  signal.addListener(f1);
  signal.addListener(f2);
  signal.addListener(f3);
  signal.addListener(f4);
  signal.addListener(f5);
  signal.fire({X: 3});
  assertEquals(5, counter);

  // Make sure that removing from front, middle, and end will cause the
  // correct listeners to be removed.
  signal.removeListener(f1);
  signal.removeListener(f5);
  signal.removeListener(f3);
  signal.fire({X: 3});
  assertEquals(7, counter);
  assertEquals(1, f1Counter);
  assertEquals(2, f2Counter);
  assertEquals(1, f3Counter);
  assertEquals(2, f4Counter);
  assertEquals(1, f5Counter);

  signal.clear();
  signal.fire({X: 3});
  assertEquals(7, counter);
}


/**
 * Tests adding listeners by key.  Each goog.partial should return a unique
 * function literal allowing f1 to be added multiple times as a listener.
 */
function testBoundListeners() {
  var counter = 0;
  var f1 = function(obj) { obj.X == 3 && ++counter; };
  var f2 = goog.partial(f1);
  var f3 = goog.partial(f1);

  signal.addListener(f1);
  signal.addListener(f1, f2);
  signal.addListener(f1, f3);
  signal.fire({X: 3});
  assertEquals(3, counter);

  assertTrue(signal.hasListener(f1));
  assertTrue(signal.hasListener(f2));
  assertTrue(signal.hasListener(f3));

  signal.removeListener(f1);
  signal.fire({X: 3});
  assertEquals(5, counter);

  signal.removeListener(f2);
  signal.removeListener(f3);
  signal.fire({X: 3});
  assertEquals(5, counter);
}


/**
 * Tests the signal object's ability to add and fire listeners.  There are
 * three listeners that test for different types of inputs: numeric, not
 * undefined, and undefined.  The not undefined input should take any kind
 * of input.
 */
function testSignal() {
  var funcXNum = function(data) { assertEquals(data.X, 3); }
  var funcNotUndefined = function(data) { assertNotUndefined(data); }
  var funcUndefined = function(data) { assertUndefined(data); }

  // Test fire with actual values.
  signal.addListener(funcXNum);
  assertTrue(signal.hasListener(funcXNum));
  signal.fire({X: 3});
  signal.removeListener(funcXNum);

  // Test fire with empty object.
  signal.addListener(funcNotUndefined);
  assertTrue(signal.hasListener(funcNotUndefined));
  signal.fire({});
  signal.removeListener(funcNotUndefined);

  // Test fire with no object.
  signal.addListener(funcUndefined);
  assertTrue(signal.hasListener(funcUndefined));
  signal.fire();
  signal.removeListener(funcUndefined);
}


/**
 * Tests the presence and removal of a listener that has not been added.
 */
function noListeners() {
  var f = function() {};
  try {
    signal.hasListener(f);
    signal.removeListener(f);
  } catch (error) {
    fail(error);
  }
}


/**
 * Tests non-function inputs to addListener, hasListener, removeListener.
 */
function testBadInputs() {
  try {
    signal.addListener();
    signal.addListener(0);
    signal.addListener('string');
    signal.addListener({x: true});
    signal.addListener(null);
    signal.addListener(undefined);

    signal.hasListener();
    signal.hasListener(0);
    signal.hasListener('string');
    signal.hasListener({x: true});
    signal.hasListener(null);
    signal.hasListener(undefined);

    signal.removeListener();
    signal.removeListener(0);
    signal.removeListener('string');
    signal.removeListener({x: true});
    signal.removeListener(null);
    signal.removeListener(undefined);
  } catch (error) {
    fail(error);
  }
}

