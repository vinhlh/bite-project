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
 * @fileoverview This file is the entry point of the store view page.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.server.StoreView');

goog.require('bite.server.Helper');
goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.string');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');
goog.require('rpf.server.Store');



/**
 * A class for initializing store view page.
 * @param {string} label The primary label.
 * @param {string} methods The methods json string.
 * @constructor
 * @export
 */
rpf.server.StoreView = function(label, methods) {
  /**
   * The details dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.detailsDialog_ = null;

  /**
   * The methods object.
   * @type {!Object}
   * @private
   */
  this.methodsMap_ = {};

  /**
   * The method code element.
   * @type {Element}
   * @private
   */
  this.methodCodeElem_ = null;

  /**
   * The method name element.
   * @type {Element}
   * @private
   */
  this.methodNameElem_ = null;

  /**
   * The author element.
   * @type {Element}
   * @private
   */
  this.authorElem_ = null;

  /**
   * The description element.
   * @type {Element}
   * @private
   */
  this.descriptionElem_ = null;

  /**
   * The tips element.
   * @type {Element}
   * @private
   */
  this.tryTipElem_ = null;

  /**
   * The selected method key.
   * @type {string}
   * @private
   */
  this.selectedMethodKey_ = '';

  this.initUi_(label, methods);
};


/**
 * Inits the view page UI.
 * @param {string} label The primary label.
 * @param {string} methods The methods json string.
 * @private
 */
rpf.server.StoreView.prototype.initUi_ = function(label, methods) {
  this.initSidebar_(label);
  this.initContent_(methods);
  this.initDetailsDialog_();
};


/**
 * Inits the view page details dialog.
 * @private
 */
rpf.server.StoreView.prototype.initDetailsDialog_ = function() {
  this.detailsDialog_ = new goog.ui.Dialog();
  this.detailsDialog_.setTitle('Method Details');
  this.detailsDialog_.setButtonSet(null);

  var contentElement = this.detailsDialog_.getContentElement();
  soy.renderElement(
      contentElement,
      rpf.server.Store.createDetailsDialogContent,
      {});

  this.methodCodeElem_ = goog.dom.getElement('store-view-details-code');

  this.methodNameElem_ = goog.dom.getElement('store-view-details-name');

  this.authorElem_ = goog.dom.getElement('store-view-details-author');

  this.descriptionElem_ = goog.dom.getElement('store-view-details-description');

  this.tryTipElem_ = goog.dom.getElement('store-view-details-try-tips');

  var backgroundElem = this.detailsDialog_.getBackgroundElement();

  goog.events.listen(
      backgroundElem,
      goog.events.EventType.CLICK,
      goog.bind(this.showDetailsDialog_, this, false));

  var openWindowElem = goog.dom.getElement('store-view-details-open-window');
  var runMethodElem = goog.dom.getElement('store-view-details-run-method');
  var addRpfElem = goog.dom.getElement('store-view-details-add-rpf');

  var openWindowTip = 'Opens a Chrome window and you would need to' +
      ' manually navigate to your site do any preparation.';
  var runMethodTip = 'You would need to edit the code to be runnable and' +
      ' it will be injected in every frame  inside the test window.' +
      ' Note that you could check the test window developer console' +
      ' for any logs and the editted code will not be saved.';
  var addRpfTip = 'If your RPF console is opened, it will add the original ' +
      'method call to RPF editor.';

  goog.events.listen(
      openWindowElem,
      goog.events.EventType.CLICK,
      goog.bind(this.onOpenTestWindow_, this));

  goog.events.listen(
      runMethodElem,
      goog.events.EventType.CLICK,
      goog.bind(this.onRunMethodInWindow_, this));

  goog.events.listen(
      addRpfElem,
      goog.events.EventType.CLICK,
      goog.bind(this.onAddToRpf_, this));

  goog.events.listen(
      openWindowElem,
      goog.events.EventType.MOUSEOVER,
      goog.bind(this.onShowTryOutTips_, this, openWindowTip));

  goog.events.listen(
      runMethodElem,
      goog.events.EventType.MOUSEOVER,
      goog.bind(this.onShowTryOutTips_, this, runMethodTip));

  goog.events.listen(
      addRpfElem,
      goog.events.EventType.MOUSEOVER,
      goog.bind(this.onShowTryOutTips_, this, addRpfTip));
};


/**
 * Shows the tips.
 * @param {string} tip The tip string.
 * @private
 */
rpf.server.StoreView.prototype.onShowTryOutTips_ = function(tip) {
  this.tryTipElem_.innerHTML = tip;
};


/**
 * Inits the view page sidebar.
 * @param {string} label The primary label.
 * @private
 */
rpf.server.StoreView.prototype.initSidebar_ = function(label) {
  if (!label) {
    label = 'All';
  }
  var labels = ['All', 'Verification', 'Action', 'Misc'];
  var data = [];
  for (var i = 0, len = labels.length; i < len; ++i) {
    var selected = labels[i].toLowerCase() == label.toLowerCase();
    data.push({'name': labels[i], 'selected': selected});
  }
  soy.renderElement(
      goog.dom.getElement('store-view-sidebar'),
      rpf.server.Store.createViewSidebar,
      {'data': data});
};


/**
 * Parses the method instances string.
 * @param {string} methods The methods json string.
 * @return {Array} The array of methods.
 * @private
 */
rpf.server.StoreView.prototype.parseMethodsString_ = function(methods) {
  var methodsArr = [];

  if (!methods) {
    return methodsArr;
  }

  var methodInstances = goog.json.parse(methods);
  this.methodsMap_ = {};

  for (var i = 0, len = methodInstances.length; i < len; ++i) {
    var description = unescape(methodInstances[i]['description']);
    var data = {
      'name': methodInstances[i]['methodName'],
      'description': description.replace(/\n/g, '<br />'),
      'code': unescape(methodInstances[i]['methodCode']),
      'author': methodInstances[i]['author'],
      'key': methodInstances[i]['key'],
      'depsCode': methodInstances[i]['depsCode']};
    methodsArr.push(data);
    this.methodsMap_[methodInstances[i]['key']] = data;
  }

  return methodsArr;
};


/**
 * Inits the view page content.
 * @param {string} methods The methods json string.
 * @private
 */
rpf.server.StoreView.prototype.initContent_ = function(methods) {
  if (!methods) {
    this.methodsMap_ = {};
    return;
  }
  var methodInstances = this.parseMethodsString_(methods);

  soy.renderElement(
      goog.dom.getElement('store-view-content'),
      rpf.server.Store.createViewContent,
      {'data': methodInstances});

  this.registerDetailsButtons_();
  this.registerDeleteButtons_();
};


/**
 * Registers listeners to the details button.
 * @private
 */
rpf.server.StoreView.prototype.registerDetailsButtons_ = function() {
  var buttons = goog.dom.getElementsByClass('store-view-button-details');
  var boundFunc = goog.bind(this.onDetailsClicked_, this);
  for (var i = 0, len = buttons.length; i < len; ++i) {
    goog.events.listen(buttons[i], goog.events.EventType.CLICK, boundFunc);
  }
};


/**
 * Registers listeners to the delete button.
 * @private
 */
rpf.server.StoreView.prototype.registerDeleteButtons_ = function() {
  var buttons = goog.dom.getElementsByClass('store-view-button-delete');
  var boundFunc = goog.bind(this.onDeleteClicked_, this);
  for (var i = 0, len = buttons.length; i < len; ++i) {
    goog.events.listen(buttons[i], goog.events.EventType.CLICK, boundFunc);
  }
};


/**
 * The handler for when details button is clicked.
 * @param {Event} e The event.
 * @private
 */
rpf.server.StoreView.prototype.onDetailsClicked_ = function(e) {
  var key = e.target.id.split('details_')[1];
  this.updateDetailsDialog_(key);
  this.showDetailsDialog_(true);
};


/**
 * The handler for when delete button is clicked.
 * @param {Event} e The event.
 * @private
 */
rpf.server.StoreView.prototype.onDeleteClicked_ = function(e) {
  var key = e.target.id.split('delete_')[1];
  this.deleteMethod_(key);
};


/**
 * Sends a ping to server to delete a method.
 * @param {string} key The key string.
 * @private
 */
rpf.server.StoreView.prototype.deleteMethod_ = function(key) {
  var requestUrl = bite.server.Helper.getUrl('', '/store/delete', {});
  var parameters = goog.Uri.QueryData.createFromMap({'key': key}).toString();
  bite.server.Helper.displayMessage('Deleting...');
  goog.net.XhrIo.send(
      requestUrl, goog.bind(this.deleteMethodCallback_, this),
      'POST', parameters);
};


/**
 * The delete method callback function.
 * @private
 */
rpf.server.StoreView.prototype.deleteMethodCallback_ = function(e) {
  var xhr = e.target;
  if (xhr.isSuccess()) {
    goog.global.location.reload(true);
  } else {
    bite.server.Helper.displayMessage('Failed deleting', 1 * 1000, true);
    throw new Error('Failed to delete the method. Error log: ' +
                    xhr.getLastError());
  }
};


/**
 * Update the details dialog.
 * @param {string} key The key string.
 * @private
 */
rpf.server.StoreView.prototype.updateDetailsDialog_ = function(key) {
  this.selectedMethodKey_ = key;
  var method = this.methodsMap_[key];
  this.methodCodeElem_.value = method['code'];
  this.methodNameElem_.innerHTML = method['name'];
  this.authorElem_.innerHTML = method['author'];
  this.descriptionElem_.innerHTML = method['description'];
};


/**
 * Shows whether the details dialog is shown.
 * @param {boolean} show Whether to show the dialog.
 * @private
 */
rpf.server.StoreView.prototype.showDetailsDialog_ = function(show) {
  this.detailsDialog_.setVisible(show);
};


/**
 * Handler for opening a new window through RPF.
 * @param {Event} e The event object.
 * @private
 */
rpf.server.StoreView.prototype.onOpenTestWindow_ = function(e) {
  var data = {'command': 'openTestWindow'};
  this.dispatchRpfEvent_(e.target, data);
};


/**
 * Handler for adding the method to rpf.
 * @param {Event} e The event object.
 * @private
 */
rpf.server.StoreView.prototype.onAddToRpf_ = function(e) {
  var method = this.methodsMap_[this.selectedMethodKey_];
  var depsCode = method['depsCode'] ? method['depsCode'] : '';
  depsCode += method['code'];
  var data = {'command': 'addMethodToRpf',
              'code': depsCode,
              'methodName': method['name']};
  this.dispatchRpfEvent_(e.target, data);
};


/**
 * Handler for running the method in the test window.
 * @param {Event} e The event object.
 * @private
 */
rpf.server.StoreView.prototype.onRunMethodInWindow_ = function(e) {
  var method = this.methodsMap_[this.selectedMethodKey_];
  var depsCode = method['depsCode'] ? method['depsCode'] : '';
  depsCode += this.methodCodeElem_.value;
  var data = {'command': 'runMethodInWindow',
              'code': depsCode};
  this.dispatchRpfEvent_(e.target, data);
};


/**
 * Dispatches a RPF event.
 * @param {EventTarget} target The target element.
 * @param {Object} data The data object.
 * @private
 */
rpf.server.StoreView.prototype.dispatchRpfEvent_ = function(target, data) {
  goog.dom.getElement('rpfLaunchData').innerHTML = goog.json.serialize(data);
  var evt = goog.dom.getDocument().createEvent('Event');
  evt.initEvent('rpfLaunchEvent', true, true);
  target.dispatchEvent(evt);
};
