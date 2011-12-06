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
 * @fileoverview This file contains the methods to update elements
 * locators info.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.locators.Updater');

goog.require('bite.base.Helper');
goog.require('element.helper.Templates.locatorsUpdater');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.format.HtmlPrettyPrinter');
goog.require('goog.events');
goog.require('goog.ui.tree.TreeControl');
goog.require('goog.ui.tree.TreeNode');
goog.require('rpf.Console.Messenger');



/**
 * A class for maintaining element locators info.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @constructor
 * @export
 */
bite.locators.Updater = function(messenger) {
  /**
   * The document tree.
   * @type {Document}
   * @private
   */
  this.domTree_ = null;

  /**
   * The ui tree.
   * @type {goog.ui.tree.TreeControl}
   * @private
   */
  this.uiTree_ = null;

  /**
   * The dynamic id counter.
   * @type {number}
   * @private
   */
  this.counter_ = 0;

  /**
   * The selected locator's id which is to be updated.
   * @type {string}
   * @private
   */
  this.selectedId_ = '';

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;
};


/**
 * The known methods to locate elements.
 * @type {Object}
 */
bite.locators.Updater.knownMethods = {
  'id': true,
  'xpath': true,
  'selector': true,
  'linktext': true,
  'name': true,
  'class': true
};


/**
 * Overrides the original enterDocument method to avoid a couple events.
 * Adds FOCUSOUT, FOCUSIN, MOUSEDOWN, CLICK events listeners.
 * @suppress {duplicate} Overriding TreeControl methods? sigh
 */
goog.ui.tree.TreeControl.prototype.enterDocument = function() {
  goog.ui.tree.TreeControl.superClass_.enterDocument.call(this);
  var el = this.getElement();
  el.className = this.getConfig().cssRoot;
  el.setAttribute('hideFocus', 'true');
  this.attachEvents();
  this.initAccessibility();
};


/**
 * Overrides the original enterDocument method to avoid a couple events.
 * Adds FOCUSOUT, FOCUSIN, MOUSEDOWN, CLICK events listeners.
 */
goog.ui.tree.TreeControl.prototype.attachEvents = function() {
  var el = this.getElement();
  el.tabIndex = 0;
  var kh = this.keyHandler_ = new goog.events.KeyHandler(el);
  var fh = this.focusHandler_ = new goog.events.FocusHandler(el);
  this.getHandler().
      listen(fh, goog.events.FocusHandler.EventType.FOCUSOUT, this.handleBlur_).
      listen(fh, goog.events.FocusHandler.EventType.FOCUSIN, this.handleFocus_).
      listen(el, goog.events.EventType.MOUSEDOWN, this.handleMouseEvent_).
      listen(el, goog.events.EventType.CLICK, this.handleMouseEvent_);
};


/**
 * Renders the UI in the given element.
 * @param {Element} elem The dom element to render UI.
 * @export
 */
bite.locators.Updater.prototype.render = function(elem) {
  soy.renderElement(
      elem,
      element.helper.Templates.locatorsUpdater.showUI,
      {});
  goog.events.listen(
      goog.dom.getElement('generateTree'),
      goog.events.EventType.CLICK,
      goog.bind(this.onGenerate_, this));
  goog.events.listen(
      goog.dom.getElement('saveToXml'),
      goog.events.EventType.CLICK,
      goog.bind(this.getXmlFromUiTree_, this));
};


/**
 * Generates a locator tree.
 * @param {Event} e The event object.
 * @private
 */
bite.locators.Updater.prototype.onGenerate_ = function(e) {
  this.counter_ = 0;
  var data = goog.dom.getElement('xmlData').value;
  var xmlTree = goog.dom.getElement('xmlTree');
  xmlTree.innerHTML = '';
  this.constructTreeFromXml_(data);
  this.uiTree_.render(xmlTree);
  this.uiTree_.setShowLines(false);
  this.uiTree_.setShowRootLines(false);
  this.uiTree_.expandAll();
  this.addShowBtnListeners_();
  this.addUpdateBtnListeners_();
  goog.style.showElement(goog.dom.getElement('saveToXml'), true);
};


/**
 * Adds the showBtn listeners.
 * @private
 */
bite.locators.Updater.prototype.addShowBtnListeners_ = function() {
  var btns = goog.dom.getDocument().getElementsByName('showBtn');
  for (var i = 0, len = btns.length; i < len; ++i) {
    goog.events.listen(
        btns[i], goog.events.EventType.CLICK,
        goog.bind(this.onShowBtnClicked_, this));
  }
};


/**
 * Adds the updateBtn listeners.
 * @private
 */
bite.locators.Updater.prototype.addUpdateBtnListeners_ = function() {
  var btns = goog.dom.getDocument().getElementsByName('updateBtn');
  for (var i = 0, len = btns.length; i < len; ++i) {
    goog.events.listen(
        btns[i], goog.events.EventType.CLICK,
        goog.bind(this.onUpdateBtnClicked_, this));
  }
};


/**
 * UpdateBtn click handler.
 * @param {Event} e The click event.
 * @private
 */
bite.locators.Updater.prototype.onUpdateBtnClicked_ = function(e) {
  this.messenger_.sendMessage(
    {'command': Bite.Constants.CONSOLE_CMDS.SET_ACTION_CALLBACK,
     'params': {}},
    goog.bind(this.updateLocator, this));
  var selectedNode = this.uiTree_.getSelectedItem();
  this.selectedId_ = this.getNodeId_(selectedNode);
};


/**
 * Update the selected locator.
 * @param {Object} infoMap The map containing element info.
 * @export
 */
bite.locators.Updater.prototype.updateLocator = function(infoMap) {
  goog.dom.getElement('name' + this.selectedId_).value = 'selector';
  goog.dom.getElement('value' + this.selectedId_).value =
      infoMap['cmdMap']['selectors'][0];
};


/**
 * ShowBtn click handler.
 * @param {Event} e The click event.
 * @private
 */
bite.locators.Updater.prototype.onShowBtnClicked_ = function(e) {
  var selectedNode = this.uiTree_.getSelectedItem();
  var show = this.getShowBtnAction_(selectedNode);
  this.setShowBtnValue_(selectedNode, show);
  var locators = [];
  this.getSubLocators_(locators, selectedNode, show);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.TEST_LOCATOR,
       'params': {'locators': locators}},
      goog.bind(this.updateTestResult_, this));
};


/**
 * Updates the results of the tests.
 * @param {Object} response The response object.
 * @private
 */
bite.locators.Updater.prototype.updateTestResult_ = function(response) {
  var results = response['results'];
  for (var i = 0, len = results.length; i < len; ++i) {
    var result = results[i];
    try {
      var elem = goog.dom.getElement('node' + result['id']);
      if (result['show']) {
        elem.src = result['passed'] ?
            'imgs/test-pass.png' : 'imgs/test-fail.png';
      } else {
        elem.src = '';
      }
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  }
};


/**
 * Sets the showBtn value to the node including all the descendants.
 * @param {goog.ui.tree.BaseNode} node The tree node.
 * @private
 */
bite.locators.Updater.prototype.getShowBtn_ = function(node) {
  return goog.dom.getElement('show' + this.getNodeId_(node));
};


/**
 * Sets the showBtn value to the node including all the descendants.
 * @param {goog.ui.tree.BaseNode} node The tree node.
 * @param {boolean} show Whether to show the element or not.
 * @private
 */
bite.locators.Updater.prototype.setShowBtnValue_ = function(node, show) {
  var btn = this.getShowBtn_(node);
  if (btn) {
    btn.value = show ? 'hide' : 'show';
  }
};


/**
 * Gets the action on a showBtn click, which depends on the btn value.
 * @param {goog.ui.tree.BaseNode} node The tree node.
 * @return {boolean} Whether to show or hide the element.
 * @private
 */
bite.locators.Updater.prototype.getShowBtnAction_ = function(node) {
  var btn = this.getShowBtn_(node);
  return btn.value == 'show';
};


/**
 * Gets locators in all the descendants.
 * @param {Array} arr The locator array.
 * @param {goog.ui.tree.BaseNode} node The ui tree node.
 * @param {boolean} show Whether to show or hide the element.
 * @private
 */
bite.locators.Updater.prototype.getSubLocators_ = function(
    arr, node, show) {
  var children = node.getChildren();
  for (var i = 0, len = children.length; i < len; ++i) {
    var curNode = children[i];
    var values = this.getNodeValues_(curNode);
    var nameLowerCase = values['name'].toLowerCase();
    if (bite.locators.Updater.knownMethods[nameLowerCase] && values['value']) {
      arr.push({'method': nameLowerCase,
                'value': values['value'],
                'show': show,
                'id': this.getNodeId_(curNode)});
      return;
    }
    this.setShowBtnValue_(curNode, show);
    this.getSubLocators_(arr, curNode, show);
  }
};


/**
 * Reads an xml string and constructs a dom tree.
 * @param {string} xml The xml string.
 * @private
 */
bite.locators.Updater.prototype.constructTreeFromXml_ = function(xml) {
  this.domTree_ = goog.dom.xml.loadXml(xml);
  var treeConfig = goog.ui.tree.TreeControl.defaultConfig;
  treeConfig['cleardotPath'] = 'imgs/rpf/cleardot.gif';
  treeConfig['indentWidth'] = 57;
  this.uiTree_ = new goog.ui.tree.TreeControl('root', treeConfig);
  this.addData_(this.uiTree_, this.domTree_.documentElement);
  console.log(this.uiTree_);
};


/**
 * Generates an xml file.
 * @private
 */
bite.locators.Updater.prototype.getXmlFromUiTree_ = function() {
  this.uiTree_.expandAll();
  var values = this.getNodeValues_(this.uiTree_);
  this.domTree_ = goog.dom.xml.createDocument(values['name']);
  this.updateDomTree_(this.uiTree_, this.domTree_.documentElement);
  var xml = goog.dom.xml.serialize(this.domTree_);
  goog.dom.getElement('xmlData').value = bite.base.Helper.formatXml(xml);
};


/**
 * Gets the name and value.
 * @param {goog.ui.tree.BaseNode} node The tree node object.
 * @return {Object} The name and value pair.
 * @private
 */
bite.locators.Updater.prototype.getNodeValues_ = function(node) {
  var ids = node['controls'];
  var name = goog.dom.getElement(ids['nameId']).value;
  var value = ids['valueId'] ? goog.dom.getElement(ids['valueId']).value : '';
  return {'name': name, 'value': value};
};


/**
 * Gets the node id.
 * @param {goog.ui.tree.BaseNode} node The tree node object.
 * @return {string} The node id.
 * @private
 */
bite.locators.Updater.prototype.getNodeId_ = function(node) {
  return node['controls']['id'];
};


/**
 * Updates the dom tree based on the UI tree values.
 * @param {goog.ui.tree.BaseNode} node The tree node object.
 * @param {Element} elem The dom element.
 * @private
 */
bite.locators.Updater.prototype.updateDomTree_ = function(node, elem) {
  var children = node.getChildren();
  for (var i = 0, len = children.length; i < len; ++i) {
    var curNode = children[i];
    var values = this.getNodeValues_(curNode);
    var newElem = goog.dom.createDom(values['name'], {}, values['value']);
    goog.dom.appendChild(elem, newElem);
    this.updateDomTree_(curNode, newElem);
  }
};


/**
 * Constructs tree from a dom object.
 * @param {goog.ui.tree.TreeControl} node The tree node object.
 * @param {Element} elem The dom element.
 * @private
 */
bite.locators.Updater.prototype.addData_ = function(node, elem) {
  var children = goog.dom.getChildren(elem);
  for (var i = 0, len = children.length; i < len; ++i) {
    var curElem = children[i];
    var newNode = node.getTree().createNode('');
    node.add(newNode);
    this.addData_(newNode, curElem);
  }
  var value = '';
  if (children.length == 0) {
    value = goog.dom.getTextContent(elem);
  }
  var nameId = 'name' + this.counter_;
  var id = '' + this.counter_;
  var valueId = 'value' + this.counter_++;
  var folder = element.helper.Templates.locatorsUpdater.getNode(
      {'data': {'name': elem.tagName,
                'nameId': nameId,
                'value': value,
                'valueId': valueId,
                'nodeId': 'node' + id,
                'showBtnId': 'show' + id,
                'updateBtnId': 'update' + id}});
  node['controls'] = {'nameId': nameId};
  node['controls']['id'] = id;
  if (value) {
    node['controls']['valueId'] = valueId;
  }
  node.setHtml(folder);
};

