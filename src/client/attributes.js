// Copyright 2010 Google Inc. All Rights Reserved.
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
 * @fileoverview This file contains the attributes manipulation.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.Attributes');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.TabBar');
goog.require('rpf.Console.Messenger');



/**
 * A class for attributes manipulation.
 * @param {rpf.Attributes.UITypes} id The type of this instance. It could be
 *     either a details dialog instance or validation dialog instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event, Function=)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.Attributes = function(id, onUiEvents) {
  /**
   * The element's descriptor which contains the attributes info.
   * @type {Object}
   * @private
   */
  this.descriptor_ = null;

  /**
   * The callback function when generate the new descriptor.
   * @type {function()}
   * @private
   */
  this.generateCmdCallback_ = goog.nullFunction;

  /**
   * The id of this instance.
   * @type {rpf.Attributes.UITypes}
   * @private
   */
  this.id_ = id;

  /**
   * The current line number.
   * @type {number}
   * @private
   */
  this.lineNum_ = -1;

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = rpf.Console.Messenger.getInstance();

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event, Function=)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;
};


/**
 * Enum for the attributes UI types.
 * @enum {string}
 */
rpf.Attributes.UITypes = {
  DETAILS_DIALOG: 'detailsDialog',
  VALIDATION_DIALOG: 'validationDialog'
};


/**
 * Creates the attribute tabs.
 * @param {Object} dialog The dialog object.
 * @param {Object} descriptor The descriptor object.
 * @param {string} xpath The xpath of the current element.
 * @param {function()=} opt_callback The callback function.
 * @param {number=} opt_lineNum The line number.
 * @export
 */
rpf.Attributes.prototype.createAttrTabs = function(
    dialog, descriptor, xpath, opt_callback, opt_lineNum) {
  this.descriptor_ = descriptor;
  this.lineNum_ = opt_lineNum ? opt_lineNum : -1;
  this.generateCmdCallback_ = opt_callback || goog.nullFunction;

  var xpathTable = null;
  var xpathTitle = null;
  var updateXpathBtn = null;

  if (xpath) {
    xpathTitle = goog.dom.createDom(goog.dom.TagName.H3,
        {'class': 'componentName'}, 'Xpath');
    xpathTable = goog.dom.createDom(goog.dom.TagName.TABLE,
        {'width': '100%', 'style': 'margin-bottom: 10px'},
        goog.dom.createDom(goog.dom.TagName.TR, {},
            goog.dom.createDom(goog.dom.TagName.TD,
                {'width': '80%'},
                goog.dom.createDom(goog.dom.TagName.INPUT,
                    {'type': 'text', 'style': 'width: 100%',
                     'id': 'xpath' + this.id_, 'value': xpath})),
            goog.dom.createDom(goog.dom.TagName.TD,
                {'align': 'right', 'id': 'updateXpathTd'},
                updateXpathBtn = goog.dom.createDom(goog.dom.TagName.INPUT,
                    {'type': 'button', 'id': 'updateXpath' + this.id_,
                     'value': 'Update Xpath'}))));
    var updateAllDiv = goog.dom.createDom(goog.dom.TagName.DIV,
        {'id': 'updateAllDivInAttribute' + this.id_});
  }

  var tabBar = goog.dom.createDom(goog.dom.TagName.DIV, {
    'id': 'top' + this.id_,
    'class': 'goog-tab-bar'
  });
  var tabBarTitle = goog.dom.createDom(goog.dom.TagName.H3,
      {'class': 'componentName'}, 'Attributes');
  var clear = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'goog-tab-bar-clear'
  });
  var content = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'goog-tab-content',
    'id': 'top_content' + this.id_
  });
  var desc = descriptor;
  var maxLevel = 4;
  var index = 0;
  while (desc && index < maxLevel) {
    tabBar.appendChild(this.addNewTabForAttrs_(desc, index));
    index += 1;
    desc = desc['parentElem'];
  }
  if (xpathTable) {
    dialog.appendChild(xpathTitle);
    dialog.appendChild(xpathTable);
    dialog.appendChild(updateAllDiv);
    if (this.id_ == rpf.Attributes.UITypes.VALIDATION_DIALOG) {
      goog.style.setStyle(updateXpathBtn, 'display', 'none');
    } else {
      goog.events.listen(updateXpathBtn, 'click',
          goog.bind(this.callbackStartUpdateMode_, this));
    }
  }
  dialog.appendChild(tabBarTitle);
  dialog.appendChild(tabBar);
  dialog.appendChild(clear);
  dialog.appendChild(content);
  this.getButtonSet_(dialog);
  var topTab = new goog.ui.TabBar();
  goog.events.listen(topTab, goog.ui.Component.EventType.SELECT,
                     goog.bind(this.onTabSelected_, this));
  topTab.decorate(goog.dom.getElement('top' + this.id_));
};


/**
 * Enters the updater mode and awaits the user to update the selected xpath.
 * @private
 */
rpf.Attributes.prototype.callbackStartUpdateMode_ = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.ENTER_UPDATER_MODE,
       'params': {}});
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_ACTION_CALLBACK},
      goog.bind(this.callbackOnReceiveAction_, this));
};


/**
 * When receives the new xpath, it replaces the old one with the new one.
 * @param {Object} response The response object.
 * @private
 */
rpf.Attributes.prototype.callbackOnReceiveAction_ = function(response) {
  goog.dom.getElement('xpath' + this.id_).value =
      response['cmdMap']['xpaths'][0];

  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.END_UPDATER_MODE,
       'params': {}});
  if (this.lineNum_ > 0) {
    this.onUiEvents_(
        Bite.Constants.UiCmds.UPDATE_ELEMENT_AT_LINE,
        {'line': this.lineNum_,
         'cmdMap': response['cmdMap']},
        /** @type {Event} */ ({}),
        goog.bind(this.showUpdateAllUi_, this));
  }
};


/**
 * Shows the UI for suggesting the users to update all of the similar steps.
 * @param {Function} registerEvents The function to register events on
 *     buttons in the UI.
 * @param {string} html The html string of the UI.
 * @private
 */
rpf.Attributes.prototype.showUpdateAllUi_ = function(registerEvents, html) {
  goog.dom.getElement('updateAllDivInAttribute' + this.id_).innerHTML = html;
  registerEvents(goog.bind(this.cancelUpdateAllUi_, this));
};


/**
 * Cancels the current batch updates, but this will not roll back any updates
 * that are made.
 * @private
 */
rpf.Attributes.prototype.cancelUpdateAllUi_ = function() {
  goog.dom.getElement('updateAllDivInAttribute' + this.id_).innerHTML = '';
};


/**
 * Gets the attributes buttons set.
 * @param {Object} dialog The container dialog.
 * @return {Object} The button set div element.
 * @private
 */
rpf.Attributes.prototype.getButtonSet_ = function(dialog) {
  var buttonSetDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
    'id': 'buttonSetDiv' + this.id_,
    'style': 'text-align:right'
  });
  var testButton = new goog.ui.CustomButton('Test');
  testButton.setTooltip('Highlight the found elems in the interacted page.');
  var testDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
    'id': 'testDiv' + this.id_,
    'style': 'display:inline'
  });
  var generateButton = new goog.ui.CustomButton('Generate');
  generateButton.setTooltip('Add/Replace the line with specified validation.');
  var generateDiv = goog.dom.createDom(goog.dom.TagName.DIV, {
    'id': 'generateDiv' + this.id_,
    'style': 'display:inline'
  });
  buttonSetDiv.appendChild(testDiv);
  buttonSetDiv.appendChild(generateDiv);
  dialog.appendChild(buttonSetDiv);
  generateButton.render(goog.dom.getElement('generateDiv' + this.id_));
  if (this.id_ == rpf.Attributes.UITypes.DETAILS_DIALOG) {
    testButton.render(goog.dom.getElement('testDiv' + this.id_));
    goog.events.listen(testButton, goog.ui.Component.EventType.ACTION,
        this.testDescriptor_, false, this);
  } else {
    goog.style.setStyle(testDiv, 'display', 'none');
  }
  goog.events.listen(generateButton, goog.ui.Component.EventType.ACTION,
      this.generateDescriptor_, false, this);
  return buttonSetDiv;
};


/**
 * Generates a the validation command.
 * @private
 */
rpf.Attributes.prototype.generateDescriptor_ = function() {
  this.updateDescriptor_();
  this.generateCmdCallback_();
};


/**
 * Tests a descriptor in the page under record.
 * @private
 */
rpf.Attributes.prototype.testDescriptor_ = function() {
  this.updateDescriptor_();
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.TEST_DESCRIPTOR,
       'params': {'descriptor': this.descriptor_}});
};


/**
 * Adds a new tab for the element's attributes.
 * @param {Object} descriptor Descriptor of the element.
 * @param {number} level Level of ancestor.
 * @return {Node} The tab object.
 * @private
 */
rpf.Attributes.prototype.addNewTabForAttrs_ = function(
    descriptor, level) {
  var classValue = 'goog-tab';
  var tabName = '';
  if (level == 0) {
    classValue += ' goog-tab-selected';
    tabName = 'Recorded element';
  } else if (level == 1) {
    tabName = 'Parent';
  } else if (level == 2) {
    tabName = 'Grandparent';
  } else {
    tabName = level + ' level ancestor';
  }
  var tab = goog.dom.createDom('div', {
    'class': classValue,
    'id': this.id_ + 'tab_' + level
  });
  goog.dom.setTextContent(tab, tabName);
  return tab;
};


/**
 * Handles a tab selected event.
 * @param {Object} e The event object.
 * @private
 */
rpf.Attributes.prototype.onTabSelected_ = function(e) {
  var tabSelected = e.target;
  var id = tabSelected.getContentElement().id;
  var parts = id.split('_');
  var level = parseInt(parts.pop(), 10);
  var desc = this.descriptor_;
  for (var i = 0; i < level; i++) {
    desc = desc['parentElem'];
  }
  this.selectedTabLevelDesc_ = desc;
  this.selectedTabLevel_ = level;
  this.showElementAttrs_(desc, level);
};


/**
 * Adds the table header for attributes.
 * @return {Node} A TR element.
 * @private
 */
rpf.Attributes.prototype.addTableHeader_ = function() {
  /**
   * <tr>
   *   <td><div></td>
   *   <td><div></td>
   *   <td><div></td>
   *   <td><div></td>
   *   <td><div></td>
   * </tr>
   */
  var row = goog.dom.createDom(goog.dom.TagName.TR, {},
      goog.dom.createDom(goog.dom.TagName.TD, {},
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'console-attributes-row-div'},
              'Attribute')),
      goog.dom.createDom(goog.dom.TagName.TD, {},
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'console-attributes-row-div'},
              'Value')),
      goog.dom.createDom(goog.dom.TagName.TD, {},
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'console-attributes-row-div'},
              'Must')),
      goog.dom.createDom(goog.dom.TagName.TD, {},
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'console-attributes-row-div'},
              'Optional')),
      goog.dom.createDom(goog.dom.TagName.TD, {},
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'console-attributes-row-div'},
              'Ignore')));
  return row;
};


/**
 * Shows the element's attributes in UI.
 * @param {Object} descriptor The descriptor object of an elem.
 * @param {number} level The level of the elem's ancestor.
 * @private
 */
rpf.Attributes.prototype.showElementAttrs_ = function(
    descriptor, level) {
  var content = goog.dom.getElement('top_content' + this.id_);
  goog.dom.removeChildren(content);
  var table = goog.dom.createDom(goog.dom.TagName.TABLE, {
    'id': 'elemAttrs' + this.id_,
    'width': '100%'
  });
  var th = this.addTableHeader_();
  table.appendChild(th);
  var row = this.addRowOfAttr_('Tag:', descriptor.tagName, level);
  table.appendChild(row);
  row = this.addRowOfAttr_('Text:', descriptor.elementText, level);
  table.appendChild(row);
  var disabled = descriptor['disabled'];
  var checked = descriptor['checked'];
  var selectedIndex = descriptor['selectedIndex'];
  if (disabled) {
    row = this.addRowOfAttr_('Disabled:', disabled, level);
  }
  if (checked) {
    row = this.addRowOfAttr_('Checked:', checked, level);
  }
  if (selectedIndex) {
    row = this.addRowOfAttr_('SelectedIndex:', selectedIndex, level);
  }
  table.appendChild(row);
  for (var key in descriptor.attributes) {
    row = this.addRowOfAttr_(key + ':', descriptor.attributes[key], level);
    table.appendChild(row);
  }
  content.appendChild(table);
};


/**
 * Adds a row of attribute.
 * @param {string} name The attribute's name.
 * @param {null|string|undefined} value The attribute's value.
 * @param {number} level The level of ancestor.
 * @return {Node} The row dom element.
 * @private
 */
rpf.Attributes.prototype.addRowOfAttr_ = function(
    name, value, level) {
  if (value == undefined) {
    return goog.dom.createDom(goog.dom.TagName.TR, {},
        goog.dom.createDom(goog.dom.TagName.TD, {}));
  }
  var text = {};
  var checked = true;
  var radioCheckedMust = false;
  var radioCheckedOptional = false;
  var radioCheckedIgnore = false;
  if (typeof(value) != 'string') {
    if (value['show'] == 'must') {
      radioCheckedMust = true;
    } else if (value['show'] == 'optional') {
      radioCheckedOptional = true;
    } else {
      radioCheckedIgnore = true;
    }
    value = value['value'];
  } else {
    radioCheckedOptional = true;
  }
  var radio1 = null;
  var radio2 = null;
  var radio3 = null;
  /**
   * <tr>
   *   <td><div></td>
   *   <td><input></td>
   *   <td><input></td>
   *   <td><input></td>
   *   <td><input></td>
   * </tr>
   */
  var row = goog.dom.createDom(goog.dom.TagName.TR, {},
      goog.dom.createDom(goog.dom.TagName.TD,
          {'align': 'center',
           'width': '10%',
           'style': 'font: 13px verdana;'},
           text = goog.dom.createDom(goog.dom.TagName.DIV, {})),
      goog.dom.createDom(goog.dom.TagName.TD,
          {'align': 'left', 'width': '30%'},
          goog.dom.createDom(goog.dom.TagName.INPUT, {
            'id': this.id_ + name + '_' + level,
            'type': 'text',
            'value': value,
            'disabled': !checked})),
      goog.dom.createDom(goog.dom.TagName.TD,
          {'width': '20%', 'align': 'center'},
          radio1 = goog.dom.createDom(goog.dom.TagName.INPUT, {
            'name': this.id_ + 'radio_' + name + '_' + level,
            'type': 'radio',
            'value': 'must'})),
      goog.dom.createDom(goog.dom.TagName.TD,
          {'width': '20%', 'align': 'center'},
          radio2 = goog.dom.createDom(goog.dom.TagName.INPUT, {
            'name': this.id_ + 'radio_' + name + '_' + level,
            'type': 'radio',
            'value': 'optional'})),
      goog.dom.createDom(goog.dom.TagName.TD,
          {'width': '20%', 'align': 'center'},
          radio3 = goog.dom.createDom(goog.dom.TagName.INPUT, {
            'name': this.id_ + 'radio_' + name + '_' + level,
            'type': 'radio',
            'value': 'ignore'})));
  radio1.checked = radioCheckedMust;
  radio2.checked = radioCheckedOptional;
  radio3.checked = radioCheckedIgnore;
  goog.events.listen(radio1, goog.events.EventType.CLICK,
      this.onUpdateAttr_, false, this);
  goog.events.listen(radio2, goog.events.EventType.CLICK,
      this.onUpdateAttr_, false, this);
  goog.events.listen(radio3, goog.events.EventType.CLICK,
      this.onUpdateAttr_, false, this);
  goog.dom.setTextContent(text, name);
  return row;
};


/**
 * Updates the descriptor when user checks on/off an attribute.
 * @param {Object} e The event object.
 * @private
 */
rpf.Attributes.prototype.onUpdateAttr_ = function(e) {
  this.updateDescriptor_();
};


/**
 * Updates the descriptor.
 * @private
 */
rpf.Attributes.prototype.updateDescriptor_ = function() {
  var desc = this.selectedTabLevelDesc_;
  var level = this.selectedTabLevel_;
  desc.tagName = this.getNewValueObj_('Tag:_' + level);
  desc.elementText = this.getNewValueObj_('Text:_' + level);
  if (desc['checked']) {
    desc['checked'] = this.getNewValueObj_('Checked:_' + level);
  }
  if (desc['disabled']) {
    desc['disabled'] = this.getNewValueObj_('Disabled:_' + level);
  }
  if (desc['selectedIndex']) {
    desc['selectedIndex'] = this.getNewValueObj_('SelectedIndex:_' + level);
  }
  for (var key in desc.attributes) {
    desc.attributes[key] = this.getNewValueObj_(key + ':_' + level);
  }
  console.log('The new descriptor is:' + JSON.stringify(desc));
};


/**
 * Gets the attribute's value and show info.
 * @param {string} name The attribute's name.
 * @return {Object} The value and show of the attribute.
 * @private
 */
rpf.Attributes.prototype.getNewValueObj_ = function(name) {
  var value = goog.dom.getElement(this.id_ + name).value;
  var radios = document.getElementsByName(this.id_ + 'radio_' + name);
  var show = '';
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      show = radios[i].value;
    }
  }
  return {'value': value, 'show': show};
};
