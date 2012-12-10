// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview This file is the entry point of the store edit page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.server.StoreEdit');

goog.require('bite.server.Helper');
goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.string');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');



/**
 * A class for initializing store edit page.
 * @param {string} method The method details json string.
 * @constructor
 * @export
 */
rpf.server.StoreEdit = function(method) {
  /**
   * The method code element.
   * @type {Element}
   * @private
   */
  this.methodCodeElem_ = goog.dom.getElement('store-edit-method-code');

  /**
   * The method name element.
   * @type {Element}
   * @private
   */
  this.methodNameElem_ = goog.dom.getElement('store-edit-method-name');

  /**
   * The description element.
   * @type {Element}
   * @private
   */
  this.descriptionElem_ = goog.dom.getElement('store-edit-description');

  /**
   * The dependency name element.
   * @type {Element}
   * @private
   */
  this.depsNameElem_ = goog.dom.getElement('store-edit-deps-name');

  /**
   * The dependency code element.
   * @type {Element}
   * @private
   */
  this.depsCodeElem_ = goog.dom.getElement('store-edit-deps-code');

  /**
   * The additional labels element.
   * @type {Element}
   * @private
   */
  this.addlLabelsElem_ = goog.dom.getElement('store-edit-addl-labels');

  /**
   * The publish button element.
   * @type {Element}
   * @private
   */
  this.publishElem_ = goog.dom.getElement('store-edit-publish');

  /**
   * The reset button element.
   * @type {Element}
   * @private
   */
  this.resetElem_ = goog.dom.getElement('store-edit-reset');

  /**
   * The primary label selector.
   * @type {goog.ui.Select}
   * @private
   */
  this.primaryLabelSelector_ = null;

  /**
   * The method key string.
   * @type {string}
   * @private
   */
  this.methodKey_ = '';

  this.initUi_();

  this.registerHandlers_();

  if (method) {
    this.initMethodFields_(method);
  }
};


/**
 * Inits the edit page UI.
 * @private
 */
rpf.server.StoreEdit.prototype.initUi_ = function() {
  this.initPrimaryLabelSelector_();
  this.initDepsField_();
};


/**
 * Inits the deps field.
 * @private
 */
rpf.server.StoreEdit.prototype.initDepsField_ = function() {
  var placeHolder = 'Please paste the dependency code (< 1MB). ' +
      'To avoid being duplicated with other deps code, please' +
      ' use a unique namespace for your code. ' +
      'For example, var myUniqueNamespace = {};' +
      ' myUniqueNamespace.methodName = function() {...}';
  this.depsCodeElem_.setAttribute('placeholder', placeHolder);
};


/**
 * Fills the page with method details.
 * @param {string} method The method details json string.
 * @private
 */
rpf.server.StoreEdit.prototype.initMethodFields_ = function(method) {
  var details = JSON.parse(method);
  this.methodCodeElem_.value = unescape(details['methodCode']);
  this.methodNameElem_.value = details['methodName'];
  this.descriptionElem_.value = unescape(details['description']);
  this.primaryLabelSelector_.setValue(details['primaryLabel']);

  var addlLabels = details['addlLabels'];
  this.addlLabelsElem_.value = addlLabels.join(', ');
  this.depsNameElem_.value = unescape(details['depsName']);
  this.depsCodeElem_.value = unescape(details['depsCode']);

  this.methodKey_ = details['key'];
  this.disableEditFields_();
};


/**
 * Disables the edit fields in update mode.
 * @private
 */
rpf.server.StoreEdit.prototype.disableEditFields_ = function() {
  this.methodNameElem_.setAttribute('disabled', true);
  this.methodNameElem_.setAttribute('class', 'disabled');
  this.depsNameElem_.setAttribute('disabled', true);
  this.depsNameElem_.setAttribute('class', 'disabled');
};


/**
 * Inits the primary label selector.
 * @private
 */
rpf.server.StoreEdit.prototype.initPrimaryLabelSelector_ = function() {
  var selector = new goog.ui.Select('Primary Label');
  selector.addItem(new goog.ui.MenuItem('Verification'));
  selector.addItem(new goog.ui.MenuItem('Action'));
  selector.addItem(new goog.ui.MenuItem('Misc'));
  selector.render(goog.dom.getElement('label-selector'));
  this.primaryLabelSelector_ = selector;
};


/**
 * Registers the event listeners to the buttons.
 * @private
 */
rpf.server.StoreEdit.prototype.registerHandlers_ = function() {
  goog.events.listen(
      this.publishElem_,
      goog.events.EventType.CLICK,
      goog.bind(this.onPublish_, this));
  goog.events.listen(
      this.resetElem_,
      goog.events.EventType.CLICK,
      goog.bind(this.onReset_, this));
  goog.events.listen(
      this.methodNameElem_,
      goog.events.EventType.BLUR,
      goog.bind(this.onMethodNameBlur_, this));
};


/**
 * Sends a request to server.
 * @param {string} path The path of the URL.
 * @param {Function} callback The callback function.
 * @private
 */
rpf.server.StoreEdit.prototype.sendRequestToServer_ = function(path, callback) {
  var requestUrl = bite.server.Helper.getUrl('', path, {});
  var primaryLabel = this.primaryLabelSelector_.getSelectedItem().getValue();
  var parameters = goog.Uri.QueryData.createFromMap(
      {'methodCode': escape(this.methodCodeElem_.value),
       'methodName': this.methodNameElem_.value,
       'description': escape(this.descriptionElem_.value),
       'primaryLabel': primaryLabel,
       'addlLabels': this.parseLabelString_(this.addlLabelsElem_.value),
       'depsName': escape(this.depsNameElem_.value),
       'depsCode': escape(this.depsCodeElem_.value)}).toString();
  bite.server.Helper.displayMessage('Saving changes...');
  goog.net.XhrIo.send(requestUrl, callback, 'POST', parameters);
};


/**
 * Callback function after saving a new method.
 * @param {Object} e The event object.
 * @private
 */
rpf.server.StoreEdit.prototype.saveNewMethodCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    var result = xhr.getResponseJson();
    this.methodKey_ = result['key'];
    this.disableEditFields_();
    bite.server.Helper.displayMessage('Saved successfully', 1 * 1000);
  } else {
    bite.server.Helper.displayMessage('Failed saving', 0, true);
    throw new Error('Failed to submit the change. Error log: ' +
                    xhr.getLastError());
  }
};


/**
 * Callback function after updating a method.
 * @param {Object} e The event object.
 * @private
 */
rpf.server.StoreEdit.prototype.updateMethodCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    bite.server.Helper.displayMessage('Updated successfully', 1 * 1000);
  } else {
    bite.server.Helper.displayMessage('Failed updating', 0, true);
    throw new Error('Failed to submit the change. Error log: ' +
                    xhr.getLastError());
  }
};


/**
 * Callback function for checking method name.
 * @param {Object} e The event object.
 * @private
 */
rpf.server.StoreEdit.prototype.checkMethodNameCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    bite.server.Helper.displayMessage('The method name is valid.', 0.5 * 1000);
  } else {
    bite.server.Helper.displayMessage(
        'The method name already exists.', 0, true);
  }
};


/**
 * Handler for method name field on blur.
 * @private
 */
rpf.server.StoreEdit.prototype.onMethodNameBlur_ = function() {
  var methodName = goog.string.trim(this.methodNameElem_.value);
  if (methodName) {
    var requestUrl = bite.server.Helper.getUrl(
        '', '/store/check_method_name', {});
    var parameters = goog.Uri.QueryData.createFromMap(
        {'name': methodName}).toString();
    goog.net.XhrIo.send(
        requestUrl,
        goog.bind(this.checkMethodNameCallback_, this),
        'POST',
        parameters);
  }
};


/**
 * Handler for publishing the change.
 * @private
 */
rpf.server.StoreEdit.prototype.onPublish_ = function() {
  if (this.validateFields_()) {
    var callback = null;
    if (this.methodKey_) {
      // Updates the method.
      callback = goog.bind(this.updateMethodCallback_, this);
      this.sendRequestToServer_('/store/update_method', callback);
    } else {
      // Creates a new method.
      callback = goog.bind(this.saveNewMethodCallback_, this);
      this.sendRequestToServer_('/store/save_new_method', callback);
    }
  }
};


/**
 * Parses the given labels string.
 * @param {string} labels The labels string.
 * @return {string} The label array json string.
 * @private
 */
rpf.server.StoreEdit.prototype.parseLabelString_ = function(labels) {
  var trimmed_string = goog.string.trim(labels);
  var result = [];
  if (trimmed_string) {
    var raw_labels = trimmed_string.split(',');
    for (var i = 0, len = raw_labels.length; i < len; ++i) {
      result.push(goog.string.trim(raw_labels[i]));
    }
  }
  return JSON.stringify(result);
};


/**
 * Validates the fields.
 * @return {boolean} Whether the fields are all valid.
 * @private
 */
rpf.server.StoreEdit.prototype.validateFields_ = function() {
  if (goog.string.isEmpty(this.methodCodeElem_.value)) {
    bite.server.Helper.displayMessage('Empty method code', 0, true);
    return false;
  }

  if (goog.string.isEmpty(this.methodNameElem_.value)) {
    bite.server.Helper.displayMessage('Empty method name', 0, true);
    return false;
  }

  // We might need to do a better checking here.
  if (this.methodCodeElem_.value.indexOf(this.methodNameElem_.value) == -1) {
    bite.server.Helper.displayMessage(
        'Please use the exact method name typed in the method code box.',
        0, true);
    return false;
  }

  if (goog.string.isEmpty(this.descriptionElem_.value)) {
    bite.server.Helper.displayMessage('Empty description', 0, true);
    return false;
  }

  if (!this.primaryLabelSelector_.getSelectedItem()) {
    bite.server.Helper.displayMessage(
        'Please select a primary label.', 0, true);
    return false;
  }

  if (!goog.string.isEmpty(this.depsCodeElem_.value) &&
      goog.string.isEmpty(this.depsNameElem_.value)) {
    bite.server.Helper.displayMessage(
        'Please enter a name in the dependency name field.', 0, true);
    return false;
  }

  return true;
};


/**
 * Handler for resetting the change.
 * @private
 */
rpf.server.StoreEdit.prototype.onReset_ = function() {
  this.methodCodeElem_.value = '';
  this.methodNameElem_.value = '';
  this.descriptionElem_.value = '';
  this.depsNameElem_.value = '';
  this.depsCodeElem_.value = '';
  this.addlLabelsElem_.value = '';
  this.primaryLabelSelector_.setValue(null);
  bite.server.Helper.dismissMessage();
};

