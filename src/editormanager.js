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
 * @fileoverview This class provides an interface to the Ace instance.
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.EditorManager');

goog.require('bite.base.Helper');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.dom');



/**
 * A class that provides an interface to the editor.
 * Do not use this class until the initFinished boolean is true.
 * We have to load editor related files asynchronously, so the class
 * may not be ready to use right when it's instantiated.
 * You may also use the initCallback to deal with this.
 *
 * @param {string} editorContainerId The html id of the editor container.
 * @param {function()=} opt_initCallback A function to call when initialization
 *     has finished.
 * @param {function()=} opt_getViewMode The function to return the
 *     view mode.
 * @param {function()=} opt_getInfoMap The function to return the
 *     infoMap.
 * @constructor
 * @export
 */
rpf.EditorManager = function(
    editorContainerId,
    opt_initCallback,
    opt_getViewMode,
    opt_getInfoMap) {

  /**
   * The initialization callback.
   * @type {function()}
   * @private
   */
  this.initCallback_ = opt_initCallback || goog.nullFunction;

  /**
   * The initialization callback.
   * @type {function()}
   * @private
   */
  this.getViewMode_ = opt_getViewMode || goog.nullFunction;

  /**
   * The get infoMap function.
   * @type {function()}
   * @private
   */
  this.getInfoMap_ = opt_getInfoMap || goog.nullFunction;

  /**
   * Variable which switches to true when this instance has finished
   * initializing.
   * @private
   */
  this.initFinished_ = false;

  /**
   * The editor instance.
   * @private
   */
  this.editor_ = null;

  /**
   * The temp code in editor.
   * @type {string}
   * @private
   */
  this.tempCode_ = '';

  /**
   * The html container for the editor instance.
   * @type {Element}
   * @private
   */
  this.container_ = goog.dom.getElement(editorContainerId);

  /**
   * A dictionary containing the gutter decoration classes of each gutter row.
   * @type {Object.<number, string>}
   * @private
   */
  this.gutterDecorationDict_ = {};

  this.editor_ = ace.edit(editorContainerId);

  var javaScriptMode = require('ace/mode/javascript').Mode;
  this.editor_.getSession().setMode(new javaScriptMode());

  this.editor_.renderer.setHScrollBarAlwaysVisible(false);
  this.editor_.getSession().setUseWrapMode(false);
  this.editor_.getSession().setWrapLimitRange(49, 49);

  this.finishInit_();
};


/**
 * Classes used to set gutter decorations in the editor.
 * @enum {string}
 * @private
 */
rpf.EditorManager.GutterClasses_ = {
  FAILING: 'rpf-gutter-failing',
  PASSING: 'rpf-gutter-passing',
  RUNNING: 'rpf-gutter-running'
};


/**
 * Callback used to finish initializing this object when
 * all the editor related files have finished loading.
 *
 * @private
 */
rpf.EditorManager.prototype.finishInit_ = function() {
  if (this.initCallback_) {
    this.initCallback_();
  }
};


/**
 * @return {Element} The html container for the editor instance.
 */
rpf.EditorManager.prototype.getContainer = function() {
  return this.container_;
};


/**
 * Gets the total number of lines currently in the editor view.
 * @return {number} The total line count.
 * @export
 */
rpf.EditorManager.prototype.getTotalLineCount = function() {
  return this.editor_.getSession().getLength();
};


/**
 * Get the line of text at the given line.
 * @param {number} lineNumber The line number (starting from 0).
 * @return {string} The line of text or null if no line of text exists
 *     for the given line.
 * @export
 */
rpf.EditorManager.prototype.getTextAtLine = function(lineNumber) {
  if (this.editor_.getSession().getLength() < lineNumber) {
    return '';
  }
  return this.editor_.getSession().getLine(lineNumber);
};


/**
 * Gets the current cursor selection in the editor.
 *
 * @return {Object} An ace selection object containing
 *    start, end, rows, and columns of the current selection.
 * @export
 */
rpf.EditorManager.prototype.getCurrentSelection = function() {
  return this.editor_.getSelectionRange();
};


/**
 * Gets the current code in the editor.
 *
 * @return {string} The current contents of the editor.
 * @export
 */
rpf.EditorManager.prototype.getCode = function() {
  return this.editor_.getSession().getValue();
};


/**
 * Sets the editor contents to the code passed in.
 *
 * @param {string} newCode The code to put in the editor.
 * @export
 */
rpf.EditorManager.prototype.setCode = function(newCode) {
  this.editor_.getSession().setValue(newCode);
};


/**
 * Adds a running class to a line number.
 * @param {number} num The editor line number.
 * @export
 */
rpf.EditorManager.prototype.addRunningClass = function(num) {
  this.editor_.renderer.addGutterDecoration(
      num, rpf.EditorManager.GutterClasses_.RUNNING);
  this.gutterDecorationDict_[num] = rpf.EditorManager.GutterClasses_.RUNNING;
};


/**
 * Adds a passed class to a line number.
 * @param {number} num The editor line number.
 * @export
 */
rpf.EditorManager.prototype.addPassedClass = function(num) {
  this.editor_.renderer.addGutterDecoration(
      num, rpf.EditorManager.GutterClasses_.PASSING);
  this.gutterDecorationDict_[num] = rpf.EditorManager.GutterClasses_.PASSING;
};


/**
 * Adds a failed class to a line number.
 * @param {number} num The editor line number.
 * @export
 */
rpf.EditorManager.prototype.addFailedClass = function(num) {
  this.editor_.renderer.addGutterDecoration(
      num, rpf.EditorManager.GutterClasses_.FAILING);
  this.gutterDecorationDict_[num] = rpf.EditorManager.GutterClasses_.FAILING;
};


/**
 * Clears all images from the gutter.
 * @export
 */
rpf.EditorManager.prototype.clearGutterDecoration = function() {
  for (var rowNum in this.gutterDecorationDict_) {
    var num = parseInt(rowNum, 10);
    var className = this.gutterDecorationDict_[num];
    this.editor_.renderer.removeGutterDecoration(num, className);
  }
  this.gutterDecorationDict_ = {};
};


/**
 * Get the original line of code.
 * @param {number} line The line number.
 * @return {string} line The line number in the original scripts.
 * @export
 */
rpf.EditorManager.prototype.getOriginalLineAt = function(line) {
  var script = '';
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    script = this.getCode().split('\n')[line];
  } else if (this.getViewMode_() ==
             Bite.Constants.ViewModes.READABLE) {
    var scripts = this.tempCode_.split('\n');
    script = scripts[line];
  }
  return script;
};


/**
 * Get the original code.
 * @return {string} The code or translation.
 * @export
 */
rpf.EditorManager.prototype.getOriginalCode = function() {
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    return this.getCode();
  } else if (this.getViewMode_() ==
             Bite.Constants.ViewModes.READABLE) {
    return this.tempCode_;
  }
  return '';
};


/**
 * Display in the selected mode.
 * @param {string} code The code to be displayed.
 * @export
 */
rpf.EditorManager.prototype.displayInEditor = function(code) {
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    this.setCode(code);
  } else if (this.getViewMode_() ==
             Bite.Constants.ViewModes.READABLE) {
    this.tempCode_ = code;
    this.setReadableCode();
  }
};


/**
 * @return {string} The temp code in editor.
 * @export
 */
rpf.EditorManager.prototype.getTempCode = function() {
  return this.tempCode_;
};


/**
 * @param {string} code The temp code in editor.
 * @export
 */
rpf.EditorManager.prototype.setTempCode = function(code) {
  this.tempCode_ = code;
};


/**
 * Set the readable code in editor.
 * @export
 */
rpf.EditorManager.prototype.setReadableCode = function() {
  var readable = [];
  var scripts = this.tempCode_.split('\n');
  var infoMap = this.getInfoMap_();
  for (var i = 0; i < scripts.length; i++) {
    readable.push(this.getTranslatedText_(scripts[i], infoMap));
  }
  readable = readable.join('\n');
  this.setCode(readable);
};


/**
 * Check if the given line of command has descriptor.
 * @param {number} lineNumber The line number for which we should check
 *     for a description.
 * @return {Object} The descriptor or null.
 * @export
 */
rpf.EditorManager.prototype.checkHasDesc = function(lineNumber) {
  var script = '';
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    script = this.getTextAtLine(lineNumber);
    if (!script) {
      return null;
    }
  } else if (this.getViewMode_() == Bite.Constants.ViewModes.READABLE) {
    var scripts = this.tempCode_.split('\n');
    script = scripts[lineNumber];
  }
  console.log('  Got this script:' + script);
  var desc = rpf.MiscHelper.getDescriptor(script);
  var translation = this.getTranslatedText_(script);
  if (typeof(desc) == 'object') {
    return {'desc': desc, 'translation': translation};
  } else {
    return null;
  }
};


/**
 * Gets the translated text.
 * @param {string} cmd The command script.
 * @param {Object=} opt_infoMap The info map of the script.
 * @return {string} The translated text.
 * @private
 */
rpf.EditorManager.prototype.getTranslatedText_ = function(cmd, opt_infoMap) {
  var data = goog.dom.getElement(
      Bite.Constants.RpfConsoleId.DATA_CONTAINER).value;
  var descriptor = null;
  if (opt_infoMap) {
    var stepId = bite.base.Helper.getStepId(cmd);
    if (stepId && opt_infoMap['steps'][stepId]) {
      var elemId = opt_infoMap['steps'][stepId]['elemId'];
      descriptor = opt_infoMap['elems'][elemId]['descriptor'];
    }
  }
  var codeGen = new rpf.CodeGenerator();
  return codeGen.translateCmd(cmd, data, descriptor);
};


/**
 * Replaces a generated command in console text fields.
 * @param {string} pCmd The generated puppet command.
 * @param {number} index Replace the commmand at the given line.
 * @export
 */
rpf.EditorManager.prototype.replaceCommand = function(pCmd, index) {
  var code = this.tempCode_;
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    code = this.getCode();
  }
  var newCode = '';
  if (index != -1) {
    var allLines = code.split('\n');
    allLines.splice(index, 1, pCmd);
    newCode = allLines.join('\n');
  } else {
    newCode = code + pCmd + '\n';
  }
  if (this.getViewMode_() == Bite.Constants.ViewModes.CODE) {
    this.setCode(newCode);
  } else {
    this.tempCode_ = newCode;
    this.setReadableCode();
  }
};


/**
 * Remove the line from editor.
 * @param {number} line The line number.
 * @export
 */
rpf.EditorManager.prototype.removeCurrentLine = function(line) {
  var lines = this.getOriginalCode().split('\n');
  lines.splice(line, 1);
  this.displayInEditor(lines.join('\n'));
};


/**
 * Get the total line number.
 * @return {number} The total line number.
 * @export
 */
rpf.EditorManager.prototype.getTotalLineNum = function() {
  return this.getTotalLineCount();
};


/**
 * Move the line down by one.
 * @param {number} line The current line.
 * @export
 */
rpf.EditorManager.prototype.moveDown = function(line) {
  if (line >= this.getTotalLineNum()) {
    return;
  }
  var lines = this.getOriginalCode().split('\n');
  var currentLine = lines[line];
  lines[line] = lines[line + 1];
  lines[line + 1] = currentLine;
  this.displayInEditor(lines.join('\n'));
};


/**
 * Move the line up by one.
 * @param {number} line The current line.
 * @export
 */
rpf.EditorManager.prototype.moveUp = function(line) {
  if (line < 1) {
    return;
  }
  var lines = this.getOriginalCode().split('\n');
  var currentLine = lines[line];
  lines[line] = lines[line - 1];
  lines[line - 1] = currentLine;
  this.displayInEditor(lines.join('\n'));
};

