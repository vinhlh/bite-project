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
 * @fileoverview Helper functions for dealing with bugs.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.BugHelper');


/**
 * Bug icons URLs enumeration.
 * @enum {string}
 */
bite.client.BugHelper.BugIcons = {
  ACTIVE: chrome.extension.getURL('imgs/bug-active-32.png'),
  RESOLVED: chrome.extension.getURL('imgs/bug-resolved-32.png'),
  CLOSED: chrome.extension.getURL('imgs/bug-closed-32.png'),
  UNKNOWN: chrome.extension.getURL('imgs/bug-unknown-32.png')
};


/**
 * The color to use when highlighting bugs depending on state.
 * @enum {string}
 */
bite.client.BugHelper.BugStateColor = {
  ACTIVE: 'red',
  RESOLVED: 'yellow',
  CLOSED: 'green',
  UNKNOWN: 'blue'
};


/**
 * Bug states.
 * @enum {string}
 */
bite.client.BugHelper.BugState = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  UNKNOWN: 'unknown'
};


/**
 * Compares two bugs for order, using the bug state property.
 * The state order is considered to be:
 *   active < resolved < closed < unknown.
 * @param {{state: bite.client.BugHelper.BugState}} a The first bug to be
 *     compared.
 * @param {{state: bite.client.BugHelper.BugState}} b The second bug to be
 *     compared.
 * @return {number} -1 if a is before b, 0 if a is the same state as b,
 *     1 if a is after b.
 */
bite.client.BugHelper.CompareBugsState = function(a, b) {
  var aState = a['state'];
  var bState = b['state'];
  if (aState == bState) {
    return 0;
  } else if (aState == bite.client.BugHelper.BugState.ACTIVE) {
    return -1;  // a should go first.
  } else if (bState == bite.client.BugHelper.BugState.ACTIVE) {
    return 1;  // b should go first.
  } else if (aState == bite.client.BugHelper.BugState.RESOLVED) {
    return -1;
  } else if (bState == bite.client.BugHelper.BugState.RESOLVED) {
    return 1;
  } else if (aState == bite.client.BugHelper.BugState.CLOSED) {
    return -1;
  } else {
    return 1;  // At this point aState == UNKOWN and bState == CLOSED.
  }
};


/**
 * Gets the appropiate bug icon associated with the specified Bug status.
 * @param {bite.client.BugHelper.BugState} state The state of the bug.
 * @return {bite.client.BugHelper.BugIcons} An URL to an icon.
 */
bite.client.BugHelper.getBugIcon = function(state) {
  switch (state.toLowerCase()) {
    case bite.client.BugHelper.BugState.ACTIVE:
      return bite.client.BugHelper.BugIcons.ACTIVE;
    case bite.client.BugHelper.BugState.RESOLVED:
      return bite.client.BugHelper.BugIcons.RESOLVED;
    case bite.client.BugHelper.BugState.CLOSED:
      return bite.client.BugHelper.BugIcons.CLOSED;
  }
  return bite.client.BugHelper.BugIcons.UNKNOWN;
};


/**
 * Gets the appropiate color to highlight a target element with.
 * @param {string} state The state of the bug, valid values are 'active',
 *    'resolved', 'closed', and 'unknown'.
 * @return {bite.client.BugHelper.BugStateColor} The color to highlight.
 */
bite.client.BugHelper.getBugHighlights = function(state) {
  switch (state.toLowerCase()) {
    case bite.client.BugHelper.BugState.ACTIVE:
      return bite.client.BugHelper.BugStateColor.ACTIVE;
    case bite.client.BugHelper.BugState.RESOLVED:
      return bite.client.BugHelper.BugStateColor.RESOLVED;
    case bite.client.BugHelper.BugState.CLOSED:
      return bite.client.BugHelper.BugStateColor.CLOSED;
  }
  return bite.client.BugHelper.BugStateColor.UNKNOWN;
};

