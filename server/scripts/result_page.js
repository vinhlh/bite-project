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
 * @fileoverview This file contains the Result page class.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.server.Result');

goog.require('bite.server.Constants');
goog.require('bite.server.LayoutHelper');
goog.require('bite.server.Page');
goog.require('bite.server.Helper');
goog.require('bite.server.run.Overview');
goog.require('bite.server.run.Settings');
goog.require('bite.server.run.Results');
goog.require('bite.server.set.Tab');
goog.require('bite.server.templates.details.ResultPage');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.CustomButton');



/**
 * A class for result's details page.
 * @extends {bite.server.Page}
 * @constructor
 * @export
 */
bite.server.Result = function() {
};
goog.inherits(bite.server.Result, bite.server.Page);


/**
 * Inits the result page.
 * @param {Object} paramsMap The params map of the url hash.
 */
bite.server.Result.prototype.init = function(paramsMap) {
  var baseView = goog.dom.getElement('baseView');
  baseView.innerHTML = bite.server.templates.details.ResultPage.showBodyArea();
  this.parseParams_(paramsMap);
};


/**
 * Parses the given params and perform accordingly.
 * @param {Object} paramsMap The params map.
 * @private
 */
bite.server.Result.prototype.parseParams_ = function(paramsMap) {
  var resultKey = paramsMap.get('resultKey') || '';
  if (resultKey) {
    this.loadResultFromServer_(resultKey);
  }
};


/**
 * Loads the result info from server.
 * @param {string} resultKey The result's key string.
 * @private
 */
bite.server.Result.prototype.loadResultFromServer_ = function(resultKey) {
  var requestUrl = bite.server.Helper.getUrl(
    '',
    '/result/view',
    {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'resultKey': resultKey}).toString();
  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var result = xhr.getResponseJson();
      goog.dom.getElement('resultScreenshot').src = result['screenshot'];
    } else {
      throw new Error('Failed to get the Run template: ' +
                      xhr.getStatus());
    }
  }, this), 'POST', parameters);
};

