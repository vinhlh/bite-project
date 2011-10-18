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
 *   testIncrementAndOptCalls
 *   testIncrement
 *   testRepeatFire
 *   testNoOptCalls
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.utils.Barrier');


/**
 * Sets up the environment for each unit test.
 */
function setUp() {}


/**
 * Cleans up the environment for each unit test.
 */
function tearDown() {}


/**
 * Tests that incrementing after the barrier is created with opt_numCalls by
 * starting the barrier at one and then incrementing by one.  When fired three
 * times, the callback will be fired once.
 */
function testIncrementAndOptCalls() {
  var counter = 0;
  var callback = function() {
    ++counter;
  };
  var barrier = new bite.common.utils.Barrier(callback, 1);
  barrier.increment();
  barrier.fire();
  barrier.fire(); // Fires immediately because it reaches zero on this firing.
  barrier.fire();
  assertEquals(2, counter);
}

/**
 * Tests that the increment function causes the barrier to prevent firing until
 * the the counter reaches zero.  Test increments by two and fires four times
 * to ensure the callback is only fired twice.
 */
function testIncrement() {
  var counter = 0;
  var callback = function() {
    ++counter;
  };
  var barrier = new bite.common.utils.Barrier(callback);
  barrier.increment();
  barrier.increment();
  barrier.fire();
  barrier.fire(); // Fires immediately because it reaches zero on this firing.
  barrier.fire();
  barrier.fire();
  assertEquals(3, counter);
}


/**
 * Tests that the barrier can fire repeatedly after it has been called once.
 */
function testRepeatFire() {
  var counter = 0;
  var callback = function() {
    ++counter;
  };
  var barrier = new bite.common.utils.Barrier(callback);
  barrier.fire();
  barrier.fire();
  barrier.fire();
  assertEquals(3, counter);
}


/**
 * Tests creating a barrier with no initial counter and ensure the barrier can
 * fire immediately.
 */
function testNoOptCalls() {
  var counter = 0;
  var callback = function() {
    ++counter;
  };
  var barrier = new bite.common.utils.Barrier(callback);
  barrier.fire();
  assertEquals(1, counter);
}

