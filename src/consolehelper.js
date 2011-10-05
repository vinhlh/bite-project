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
 * @fileoverview This file contains the helper functions.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.Helper');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.LabelInput');
goog.require('rpf.Console.Messenger');



/**
 * A class of helper functions.
 * @param {Object} editorContainer The html container for the editor manager.
 * @param {string} editorDivId The desired id of the editor div.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event)} onUiEvents
 *     The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.Helper = function(
    editorContainer, editorDivId, messenger, onUiEvents) {
  /**
   * The selected option name.
   * @type {string}
   * @private
   */
  this.currentOption_ = Bite.Constants.TEST_LIB_NAME;

  /**
   * The unique id for creating html.
   * @type {string}
   * @private
   */
  this.id_ = '';

  /**
   * The lib select object.
   * @type {Object}
   * @private
   */
  this.select_ = null;

  /**
   * The editor object.
   * @type {Object}
   * @private
   */
  this.editor_ = this.addEditor(editorContainer, editorDivId);

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  this.addSelectOptions_();
};


/**
 * @return {Object} Gets the editor object.
 * @export
 */
rpf.Helper.prototype.getEditor = function() {
  return this.editor_;
};


/**
 * Adds the customized function editor.
 * @param {Object} container The element that contains the new elements.
 * @param {string} id The editor div id.
 * @return {Object} The editor instance.
 * @export
 */
rpf.Helper.prototype.addEditor =
    function(container, id) {
  this.id_ = id;
  var select = null;
  var table = goog.dom.createDom(goog.dom.TagName.TABLE,
      {'height': '250px', 'width': '100%'},
      goog.dom.createDom(goog.dom.TagName.TR, {},
          goog.dom.createDom(goog.dom.TagName.TD,
              {'width': '20%'},
              goog.dom.createDom(goog.dom.TagName.DIV,
                  {'id': 'selectArea' + id,
                   'style': 'height: 100%; width: 100%;' +
                   ' display: block; overflow: auto;'},
                  select = goog.dom.createDom(goog.dom.TagName.SELECT,
                      {'id': 'commonlibselect' + id,
                       'style': 'width: 100%; height: 100%',
                       'multiple': 'multiple'}))),
          goog.dom.createDom(goog.dom.TagName.TD, {},
              goog.dom.createDom(goog.dom.TagName.DIV,
                  {'id': 'editorArea' + id,
                   'style': 'background-color: #FFFACD;' +
                       'padding: 2px; height: 100%;'},
                  goog.dom.createDom(goog.dom.TagName.DIV,
                      {'id': id})))));
  this.select_ = select;
  container.appendChild(table);
  container.appendChild(this.getCmdInputRow_(id));
  var generateButton = new goog.ui.CustomButton('create');
  generateButton.render(goog.dom.getElement('generateLibCmdButton' + id));
  generateButton.id = 'generateButton' + id;
  goog.events.listen(
      generateButton,
      goog.ui.Component.EventType.ACTION,
      goog.partial(
        this.onUiEvents_,
        Bite.Constants.UiCmds.GENERATE_CUSTOMIZED_FUNCTION_CALL,
        {}));
  var label = new goog.ui.LabelInput('function name, arg1, arg2, arg3...');
  label.render(goog.dom.getElement('generateLibCmdDIV' + id));
  label.getElement().id = 'generateLibCmdInput' + id;
  goog.dom.setProperties(label.getElement(), {'style': 'width: 100%'});
  var editor = new rpf.EditorManager(id);
  this.editor_ = editor;
  return editor;
};


/**
 * Adds the common lib as options.
 * @private
 */
rpf.Helper.prototype.addSelectOptions_ = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.GET_COMMON_LIBS,
       'params': {}},
      goog.bind(this.addSelectOptionsCallback_, this));
};


/**
 * Callback for adding the common lib as options.
 * @param {Object} response The response object.
 * @private
 */
rpf.Helper.prototype.addSelectOptionsCallback_ = function(
    response) {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_COMMON_LIB,
       'params': {'name': Bite.Constants.TEST_LIB_NAME,
                  'value': ''}});
  var commonLibs = response['commonLibs'];
  commonLibs[Bite.Constants.TEST_LIB_NAME] = {};
  commonLibs[Bite.Constants.TEST_LIB_NAME]['lib'] = '';
  for (var libName in commonLibs) {
    var opt = null;
    if (libName != Bite.Constants.TEST_LIB_NAME) {
      opt = new Option(libName, libName);
    } else {
      opt = new Option(libName, libName, true, true);
    }
    goog.events.listen(
        opt,
        'dblclick',
        goog.partial(
            this.onUiEvents_,
            Bite.Constants.UiCmds.LOAD_SELECTED_LIB,
            {}));
    this.select_.add(opt, null);
  }
};


/**
 * Loads the specified lib to editor.
 * @param {string} lib The desired library name.
 * @private
 */
rpf.Helper.prototype.loadSelectedLib_ = function(lib) {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_COMMON_LIB,
       'params': {'name': this.currentOption_,
                  'value': this.editor_.getCode()}});
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.GET_COMMON_LIBS,
       'params': {'lib': lib}},
      goog.bind(this.loadSelectedLibCallback_, this));
};


/**
 * Callback for loading the specified lib to editor.
 * @param {Object} response The response object.
 * @private
 */
rpf.Helper.prototype.loadSelectedLibCallback_ = function(
    response) {
  var lib = response['lib'];
  /**
   * The following two lines are a hacky workaround to a bug in Bespin.
   * In summary, Bespin doesn't deal well with multiple editors loaded
   * in the same window in Chrome.  What we're doing below is forcing
   * the editor to redraw by filling it with code which is longer than
   * the editor window is high.  Then we're free to set the editor contents
   * to what it's supposed to be: the contents of the library.
   *
   * Ideally, we'd dig through the Bespin code and fix this bug, but the
   * version of Bespin we're depending on (0.92), is soon to become obsolete
   * anyway because the entire editor stack is being replaced with ACE.  Thus,
   * our time would be better used by using this hacky workaround and moving
   * on.
   */
  var code = '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n';
  this.editor_.setCode(code);
  this.editor_.setCode(response['commonLibs'][lib]['lib']);
  this.currentOption_ = lib;
};


/**
 * Loads the specified lib to editor.
 * @export
 */
rpf.Helper.prototype.loadSelectedLib = function() {
  var selectedIndex = this.select_.selectedIndex;
  if (selectedIndex < 0) {
    return;
  }
  var selectedOption = this.select_.options[selectedIndex];
  this.loadSelectedLib_(selectedOption.text);
};


/**
 * Generates the customized function call.
 * @param {Event} e The event.
 * @return {string} The function call string.
 * @export
 */
rpf.Helper.prototype.generateCustomizedFunctionCall =
    function(e) {
  var id = e.target.id;
  id = id.substring('generateButton'.length, id.length);
  var value = goog.dom.getElement('generateLibCmdInput' + id).value;
  return value;
};


/**
 * Gets the command input row including a input box and a button.
 * @param {string} id The unique id.
 * @return {Element} The table dom element.
 * @private
 */
rpf.Helper.prototype.getCmdInputRow_ = function(id) {
  /**
   * <table>
   *   <tr>
   *     <td><div></td>
   *     <td><div></td>
   */
  var table = goog.dom.createDom(goog.dom.TagName.TABLE,
      {'height': '30px', 'width': '100%'},
      goog.dom.createDom(goog.dom.TagName.TR, {},
          goog.dom.createDom(goog.dom.TagName.TD,
              {'width': '80%',
               'align': 'right'},
              goog.dom.createDom(goog.dom.TagName.DIV,
                  {'style': 'width: 100%',
                   'id': 'generateLibCmdDIV' + id})),
          goog.dom.createDom(goog.dom.TagName.TD, {},
              goog.dom.createDom(goog.dom.TagName.DIV,
                  {'id': 'generateLibCmdButton' + id}))));
  return table;
};


/**
 * @return {string} The selected option name.
 * @export
 */
rpf.Helper.prototype.getCurrentOption = function() {
  return this.currentOption_;
};
