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
 * @fileoverview Unit tests for bite.common.log.Simple.
 *
 * Note that tests make use of the entryTest function for validating entry
 * objects.  This function requires an object containing expected values.  If a
 * key is present but the value is undefined in the expected values object then
 * that key is considered a don't care. (This also assumes that the log does
 * not add key/value pairs if the value is undefined)  If the key is not
 * present in the expected values object then a fail assertion occurs.  The
 * reason for this assertion is to ensure that changes to the entry object are
 * noted by the unit tester and not overlooked.
 *
 * Test cases:
 *   testChangeMaxEntriesWithLessThenAddEntry
 *   testChangeMaxEntriesWithLess
 *   testChangeMaxEntriesWithEqual
 *   testChangeMaxExtriesWithMore
 *   testMaxEntries
 *   testClearWithMultipleEntries
 *   testClearWithOneEntry
 *   testReattachListener
 *   testSingleListener
 *   testEntryTimeOrder
 *   testAddMultipleEntries
 *   testAddOneEntry
 *   testNoEntries
 *   testConstructorInputs
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.common.log.Simple');


/**
 * The log created and destroyed for each test.
 * @type {bite.common.log.Simple}
 */
var logToTest = null;


/**
 * Alias to the key names for the log.  Creating this alias will help general
 * the testing done for the log so that future logs can refactor this code for
 * a more general testing solution.
 * @type {!Object}
 */
var LOG_KEY_NAME = bite.common.log.Simple.KeyName;


/**
 * Sets up the environment for each unit test.
 */
function setUp() {
  logToTest = new bite.common.log.Simple();
}


/**
 * Cleans up the environment for each unit test.
 */
function tearDown() {
  logToTest = null;
}


/**
 * Called when the log fires a signal and is passed entry object.  The function
 * will loop over all known log keys and compare the expected value with the
 * given value.  If the values are not equal an assert will occur.  An assert
 * will also occur if a known key is missing.
 * @param {string} msg A message to be displayed by the assert.
 * @param {bite.common.log.Simple.Entry} expectedValues An entry object
 *     containing the expected values in the entry.  All undefined but present
 *     keys are considered "don't cares".
 * @param {?bite.common.log.Simple.Entry=} entry The log entry to validate.
 */
function entryTest(msg, expectedValues, entry) {
  if (entry == null || entry == undefined) {
    fail(msg + ' Entry not provided.');
  }

  for (var keyId in LOG_KEY_NAME) {
    var key = LOG_KEY_NAME[keyId];

    // Skip keys if they exist and have an undefined value.
    if (key in expectedValues && expectedValues[key] == undefined) {
      continue;
    }

    msg = msg + ' [' + key + '].';

    if (!(key in expectedValues)) {
      fail(msg + '  Missing expected value for comparison.');
    }
    msg = msg + ' : ' + expectedValues[key] + ' = ' + entry[key] + ' : ';
    assertEquals(msg, expectedValues[key], entry[key]);
  }
}


/**
 * Generates an object containing all the known keys in a log entry set as
 * don't cares.  The object also contains a counter for tracking how many times
 * the callback has fired.
 * @return {!Object} An object containing don't care values for all known keys,
 *     and a counter.
 */
function getDefaultExpectedValues() {
  var obj = {};
  obj[LOG_KEY_NAME.TIMESTAMP] = undefined;
  obj[LOG_KEY_NAME.VALUE] = undefined;
  return obj;
}


/**
 * Tests changing max entries for the log where the number of entries is less
 * than the new maximum.  Then make sure that adding a new entry gives the
 * correct information.
 */
function testChangeMaxEntriesWithLessThenAddEntry() {
  var testName = 'testChangeMaxEntriesWithLessThenAddEntry';

  logToTest.add('entry1');
  logToTest.add('entry2');
  logToTest.add('entry3');

  // Change max entries to two while there are currently three entries in the
  // log.  This should cut off the first entry, so the newest entry should be
  // the only one left.
  logToTest.setMaxEntries(2);

  // Add a forth entry
  logToTest.add('entry4');

  // Check that only two entries are in the log, and are the correct entries.
  var expectedValues = getDefaultExpectedValues();

  iter = logToTest.getIterOldToNew();

  entryObj = iter();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry3';
  entryTest(testName, expectedValues, entryObj);

  entryObj = iter();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry4';
  entryTest(testName, expectedValues, entryObj);

  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);
}


/**
 * Tests changing max entries for the log where the number of entries is less
 * than the new maximum.
 */
function testChangeMaxEntriesWithLess() {
  var testName = 'testChangeMaxEntriesWithLess';

  logToTest.add('entry1');
  logToTest.add('entry2');

  var expectedValues = getDefaultExpectedValues();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry2';

  // Check that only one entry is in the log, and it is the correct entry.
  var iter = logToTest.getIterNewToOld();
  var entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNotNull(iter());
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);

  // Change max entries to one while there are currently two entries in the
  // log.  This should cut off the first entry, so the newest entry should be
  // the only one left.
  logToTest.setMaxEntries(1);

  // Check that only one entry is in the log, and it is the correct entry.
  iter = logToTest.getIterNewToOld();
  entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);
}


/**
 * Tests changing max entries for the log where the number of entries is equal
 * to the new maximum.
 */
function testChangeMaxEntriesWithEqual() {
  var testName = 'testChangeMaxEntriesWithEqual';

  logToTest.add('entry1');
  logToTest.add('entry2');

  var expectedValues = getDefaultExpectedValues();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry2';

  // Check that only one entry is in the log, and it is the correct entry.
  var iter = logToTest.getIterNewToOld();
  var entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNotNull(iter());
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);

  // Change max entries to two while there are currently two entries in the
  // log.
  logToTest.setMaxEntries(2);

  // Check that only one entry is in the log, and it is the correct entry.
  iter = logToTest.getIterNewToOld();
  entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNotNull(iter());
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);
}


/**
 * Tests changing max entries for the log where the number of entries is still
 * less than the new maximum.
 */
function testChangeMaxEntriesWithMore() {
  var testName = 'testChangeMaxEntriesWithMore';

  logToTest.add('entry1');
  logToTest.add('entry2');

  var expectedValues = getDefaultExpectedValues();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry2';

  // Check that only one entry is in the log, and it is the correct entry.
  var iter = logToTest.getIterNewToOld();
  var entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNotNull(iter());
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);

  // Change max entries to three while there are currently two entries in the
  // log.
  logToTest.setMaxEntries(3);

  // Check that only one entry is in the log, and it is the correct entry.
  iter = logToTest.getIterNewToOld();
  entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNotNull(iter());
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);
}


/**
 * Tests that max entries restricts the number of entries the log can hold.
 */
function testMaxEntries() {
  var testName = 'testMaxEntries';

  logToTest = new bite.common.log.Simple(1);
  logToTest.add('entry1');
  logToTest.add('entry2');

  var expectedValues = getDefaultExpectedValues();
  expectedValues[LOG_KEY_NAME.VALUE] = 'entry2';

  // Check that only one entry is in the log, and it is the correct entry.
  var iter = logToTest.getIterNewToOld();
  var entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNull(iter());

  // Test access to newest entry is correct.
  entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);
}


/**
 * Tests that entry access returns null after clearing a log with multiple
 * entries.  Other tests ensure that access works properly.
 */
function testClearWithMultipleEntries() {
  for (var i = 1; i <= 4; ++i) {
    logToTest.add('entry' + i);
  }
  logToTest.clear();

  // Accessing newest.
  assertNull(logToTest.getNewestEntry());

  // Accessing through new to old iterator.
  iter = logToTest.getIterNewToOld();
  assertNull(iter());

  // Accessing through old to new iterator.
  iter = logToTest.getIterOldToNew();
  assertNull(iter());
}


/**
 * Tests that entry access returns null after clearing a log with a single
 * entry.  Other tests ensure that access works properly.
 */
function testClearWithOneEntry() {
  logToTest.add('entry');
  logToTest.clear();

  // Accessing newest.
  assertNull(logToTest.getNewestEntry());

  // Accessing through new to old iterator.
  iter = logToTest.getIterNewToOld();
  assertNull(iter());

  // Accessing through old to new iterator.
  iter = logToTest.getIterOldToNew();
  assertNull(iter());
}

/**
 * Tests reattaching the same listener between log entries.  The test also
 * ensures the listener is attached when entries are logged before adding
 * listeners.
 */
function testReattachListener() {
  var testName = 'testReattachListener';
  var counter = 0;
  var expectedValues = getDefaultExpectedValues();

  var callback = function(entry) {
    entryTest(testName, expectedValues, entry);
    ++counter;
  };

  logToTest.add('entry1');

  logToTest.addListener(callback);
  assertTrue(logToTest.hasListener(callback));

  logToTest.add('entry2');

  logToTest.removeListener(callback);
  assertFalse(logToTest.hasListener(callback));

  logToTest.add('entry3');

  logToTest.addListener(callback);
  assertTrue(logToTest.hasListener(callback));

  logToTest.add('entry4');

  logToTest.removeListener(callback);
  assertFalse(logToTest.hasListener(callback));

  logToTest.add('entry5');

  assertEquals(2, counter);
}


/**
 * Tests attaching a single listener to a log.  The test ensures the listener
 * is fired the correct number of times.  The scenario adds three entries with
 * the listener attached followed by another entry after the listener is
 * removed.
 */
function testSingleListener() {
  var testName = 'testSingleListener';
  var counter = 0;
  var expectedValues = getDefaultExpectedValues();

  var callback = function(entry) {
    entryTest(testName, expectedValues, entry);
    ++counter;
  };

  logToTest.addListener(callback);

  var entry;
  for (var i = 1; i <= 3; ++i) {
    entry = 'entry' + i;
    expectedValues[LOG_KEY_NAME.VALUE] = entry;
    logToTest.add(entry);
  }

  logToTest.removeListener(callback);

  logToTest.add('entry4');

  // Ensure the callback was only fired three times as the listener was removed
  // after the third log entry.
  assertEquals(3, counter);
}


/**
 * Tests that entry order are chronological based on timestamps.  In
 * testAddMultipleEntries, entry order was verified by the iterators relative
 * to the order added.  Thus, this test only needs to check that the order is
 * chronological.
 */
function testEntryTimeOrder() {
  var testName = 'testEntryOrder';
  var t = -1;

  var entry;
  for (var i = 1; i <= 4; ++i) {
    entry = 'entry' + i;
    logToTest.add(entry);

    // Test timestamp for the newest is greater than the previous entry.
    var entryObj = logToTest.getNewestEntry();
    assertTrue(testName, t <= entryObj[LOG_KEY_NAME.TIMESTAMP]);
    t = entryObj[LOG_KEY_NAME.TIMESTAMP];

    // Hope to get a small difference to appear in the timestamps, but not
    // guaranteed.  Do not want to use asynchronous timeout in the unit test.
    // Doesn't invalidate test if a pause doesn't occur.
    for (var pause = 0; pause < 100000; ++pause);
  }
}


/**
 * Tests the addition of multiple entries; four was arbitrarily chosen for
 * this scenario.  The test also examines entry access and order.  Timestamps
 * are checked in testEntryTimeOrder().
 */
function testAddMultipleEntries() {
  var testName = 'testAddMultipleEntries';
  var expectedValues = getDefaultExpectedValues();

  // expectedValues will represent the last entry after the loop.
  var entry;
  for (var i = 1; i <= 4; ++i) {
    entry = 'entry' + i;
    expectedValues[LOG_KEY_NAME.VALUE] = entry;

    logToTest.add(entry);
  }
  var finalEntryValue = entry;

  // Test access to newest entry.
  var entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);

  // Test Iterators.
  var iter = logToTest.getIterNewToOld();
  for (i = 4; i >= 1; --i) {
    expectedValues[LOG_KEY_NAME.VALUE] = 'entry' + i;

    entryObj = iter(); // entry[4-1]
    entryTest(testName + i + 'NTO', expectedValues, entryObj);

    // Test the value of the first entry accessed; entry4 expected.
    if (i == 4) {
      assertEquals('IterNewToOld - checking entry value.', finalEntryValue,
                   entryObj[LOG_KEY_NAME.VALUE]);
    }
  }
  assertNull(iter());

  iter = logToTest.getIterOldToNew();
  for (i = 1; i <= 4; ++i) {
    entryObj = iter(); // entry[1-4]
    expectedValues[LOG_KEY_NAME.VALUE] = 'entry' + i;
    entryTest(testName + i + 'OTN', expectedValues, entryObj);

    // Test the value of the first entry accessed; entry4 expected.
    if (i == 4) {
      assertEquals('IterOldToNew - checking entry value.', finalEntryValue,
                   entryObj[LOG_KEY_NAME.VALUE]);
    }
  }
  assertNull(iter());
}


/**
 * Tests the addition of a single entry and access to that entry.
 */
function testAddOneEntry() {
  var testName = 'testAddOneEntry';
  var expectedValues = getDefaultExpectedValues();

  var entry = 'entry1';
  expectedValues[LOG_KEY_NAME.VALUE] = entry;

  logToTest.add(entry);

  // Test access to newest entry.
  var entryObj = logToTest.getNewestEntry();
  entryTest(testName, expectedValues, entryObj);
  assertNotEquals(testName, '-1', entryObj[LOG_KEY_NAME.TIMESTAMP]);

  // Test iterators; expect one entry object followed by a null result.
  var iter = logToTest.getIterNewToOld();
  entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNull(iter());

  iter = logToTest.getIterOldToNew();
  entryObj = iter();
  entryTest(testName, expectedValues, entryObj);
  assertNull(iter());
}


/**
 * Tests an empty log that ensures basic functionality works properly and does
 * not throw exceptions when the log is empty.  Max entries does not need to be
 * checked in this situation because it is tested in testConstructorInputs().
 * Signals are checked int testListeners.
 */
function testNoEntries() {
  var testName = 'testNoEntries';
  var counter = 0;
  var expectedValues = getDefaultExpectedValues();

  var callback = function() {
    ++counter;
  };

  // Test entry access.
  assertNull(logToTest.getNewestEntry());

  // Test iterators; expect null result from empty log.
  var iter = logToTest.getIterNewToOld();
  assertNull(iter());

  iter = logToTest.getIterOldToNew();
  assertNull(iter());

  // Test add/remove of listeners
  assertFalse(logToTest.hasListener(callback));
  logToTest.addListener(callback);
  assertTrue(logToTest.hasListener(callback));
  logToTest.removeListener(callback);
  assertFalse(logToTest.hasListener(callback));
  assertEquals(0, counter); // Ensure the listener was never fired.

  // Test clear
  logToTest.clear();
}


/**
 * Tests constructor inputs to ensure the correct initial values are assigned
 * internally.
 */
function testConstructorInputs() {
  assertEquals(bite.common.log.Simple.DEFAULT_MAX_ENTRIES,
               logToTest.getMaxEntries());

  logToTest = new bite.common.log.Simple(0);
  assertEquals(bite.common.log.Simple.DEFAULT_MAX_ENTRIES,
               logToTest.getMaxEntries());

  logToTest = new bite.common.log.Simple(-1);
  assertEquals(bite.common.log.Simple.DEFAULT_MAX_ENTRIES,
               logToTest.getMaxEntries());

  logToTest = new bite.common.log.Simple(1);
  assertEquals(1, logToTest.getMaxEntries());
}

