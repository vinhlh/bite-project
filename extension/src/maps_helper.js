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
 * Helper for filing bugs specific to maps.google.com.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.MapsHelper');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.string');


/**
 * The maps domain.
 * @const
 * @type {string}
 * @private
 */
bite.client.MapsHelper.MAPS_DOMAIN_ = 'maps.google.com';


/**
 * Maps related data.
 * @enum {string}
 */
bite.client.MapsHelper.MapsData = {
  DEBUG_URL_ID: 'ledebugurl',
  LINK_ID: 'link'
};


/**
 * Determines whether an URL is a Google Maps URL.
 * @param {string} url URL to test.
 * @return {boolean} Whether the given URL is a Google Maps URL.
 */
bite.client.MapsHelper.isMapsUrl = function(url) {
  var uri = new goog.Uri(url);
  return goog.string.caseInsensitiveCompare(
      uri.getDomain(), bite.client.MapsHelper.MAPS_DOMAIN_) == 0;
};


/**
 * Updates the URL of a maps page, and does not edit other URLs.
 * @param {string} url The page's url.
 * @param {function(string)} setUrlCallback A callback to set the new url.
 */
bite.client.MapsHelper.updateUrl = function(url, setUrlCallback) {
  if (bite.client.MapsHelper.isMapsUrl(url)) {
    var link = goog.dom.getElement(bite.client.MapsHelper.MapsData.LINK_ID);

    // We'd like to use the debug url instead of the normal URL if it exists.
    // We have to click on the link element to show the dialog which
    // potentially contains the debug url.
    // Calls the wrapper function for the actions.
    BiteRpfAction.click(link);

    // Gets the debug URL only when the field is shown. Will retry if
    // not immediaetly available.
    bite.client.MapsHelper.updateDebugUrl_(0, setUrlCallback);
  }
};


/**
 * Updates the bugs's url with the debug url, retries up to 5 times.
 * @param {number} timesAttempted The number of retries that have been attempted.
 * @param {function(string)} setUrlCallback A callback to set the new url.
 * @private
 */
bite.client.MapsHelper.updateDebugUrl_ =
    function(timesAttempted, setUrlCallback) {
  var debugInput = goog.dom.getElement(
      bite.client.MapsHelper.MapsData.DEBUG_URL_ID);

  if (debugInput && debugInput.value &&
      debugInput.parentNode.style.display != 'none') {
    setUrlCallback(debugInput.value);
  } else {
    // Retry up to 5 times.
    if (timesAttempted < 5) {
      goog.Timer.callOnce(
          goog.partial(
              bite.client.MapsHelper.updateDebugUrl_,
              timesAttempted + 1,
              setUrlCallback),
          200);
    } else {
      // TODO(bustamante): Capture failures like this and report them to the
      // BITE server or Google Analytics.
    }
  }
};

