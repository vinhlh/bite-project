//Copyright 2010 Google Inc. All Rights Reserved.

/**
 * @fileoverview This file contains how to automatically generate code.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.CodeGenerator');
goog.provide('rpf.CodeNode');

goog.require('bite.base.Helper');
goog.require('goog.math');
goog.require('goog.string');
goog.require('rpf.MiscHelper');



/**
 * A class for the generated tree node.
 * @param {rpf.CodeNode.NodeType} nodeType The node type.
 * @param {string} value The node value.
 * @param {Object} opt_info The optional info.
 * @constructor
 */
rpf.CodeNode = function(nodeType, value, opt_info) {
  /**
   * The type of the node.
   * @type {rpf.CodeNode.NodeType}
   * @private
   */
  this.type_ = nodeType;

  /**
   * The value on this node.
   * @type {string}
   * @private
   */
  this.value_ = value;

  /**
   * The additional info.
   * @type {Object}
   * @private
   */
  this.additionalInfo_ = opt_info || {};

  /**
   * The children nodes.
   * @type {Array}
   * @private
   */
  this.children_ = [];

  /**
   * The parent node.
   * @type {rpf.CodeNode}
   * @private
   */
  this.parent_ = null;
};


/**
 * Enum for the node type.
 * @enum {string}
 * @export
 */
rpf.CodeNode.NodeType = {
  ROOT: 'root',
  IMPORT: 'import',
  CLASS: 'class',
  METHOD: 'method',
  PROPERTY: 'property',
  COMMAND: 'command',
  COMMENT: 'comment'
};


/**
 * Gets the parent node.
 * @return {rpf.CodeNode} The parent node.
 * @export
 */
rpf.CodeNode.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Sets the parent node.
 * @param {rpf.CodeNode} pNode The parent node.
 * @export
 */
rpf.CodeNode.prototype.setParent = function(pNode) {
  this.parent_ = pNode;
};


/**
 * Gets the next sibling node.
 * @return {rpf.CodeNode} The next sibling node.
 * @export
 */
rpf.CodeNode.prototype.getNext = function() {
  var siblings = this.parent_.children_;
  for (var i = 0, len = siblings.length; i < len; i++) {
    if (siblings[i] == this) {
      return siblings[i + 1] || null;
    }
  }
  return null;
};


/**
 * Adds a child node.
 * @param {rpf.CodeNode} node The child node.
 * @export
 */
rpf.CodeNode.prototype.addChild = function(node) {
  this.children_.push(node);
  node.setParent(this);
};


/**
 * Gets all the children nodes.
 * @return {Array} All of the children nodes.
 * @export
 */
rpf.CodeNode.prototype.getChildren = function() {
  return this.children_;
};


/**
 * Gets the type of the node.
 * @return {rpf.CodeNode.NodeType} The type of the node.
 * @export
 */
rpf.CodeNode.prototype.getType = function() {
  return this.type_;
};


/**
 * Gets the value of the node.
 * @return {string} The value of the node.
 * @export
 */
rpf.CodeNode.prototype.getValue = function() {
  return this.value_;
};


/**
 * Gets the additional info.
 * @param {string} name The parameter's name.
 * @return {Object} The additional info object.
 * @export
 */
rpf.CodeNode.prototype.getAdditional = function(name) {
  return this.additionalInfo_[name] || null;
};


/**
 * Sets the additional info.
 * @param {string} name The info name.
 * @param {string} value The info value.
 * @export
 */
rpf.CodeNode.prototype.setAdditional = function(name, value) {
  this.additionalInfo_[name] = value;
};


/**
 * A class for generating the test script.
 * @constructor
 */
rpf.CodeGenerator = function() {
  /**
   * The generated code tree.
   * @type {rpf.CodeNode}
   * @private
   */
  this.codeTree_ = null;
};


/**
 * @const
 * @type {string}
 * @private
 */
rpf.CodeGenerator.VARIABLE_CONTENT_MAP_ = 'ContentMap';


/**
 * The bite action namespace.
 * @const
 * @type {string}
 * @private
 */
rpf.CodeGenerator.BITE_ACTION_NAMESPACE_ = 'bite.rpf.';


/**
 * Enum for the dom action values.
 * @enum {string}
 * @export
 */
rpf.CodeGenerator.RecordActions = {
  CHANGE: 'change',
  CLICK: 'click',
  DBLCLICK: 'doubleClick',
  DRAG: 'drag',
  KEYUP: 'keyup',
  REPLACE_HTML: 'replaceHtml',
  SELECT: 'select',
  SUBMIT: 'submit',
  TYPE: 'type',
  VERIFY: 'verify'
};


/**
 * Enum for the dom tags.
 * @enum {string}
 * @export
 */
rpf.CodeGenerator.DomTags = {
  SELECT: 'select',
  TEXTAREA: 'textarea'
};


/**
 * Enum for the client action values.
 * @enum {string}
 * @export
 */
rpf.CodeGenerator.PlaybackActions = {
  CLICK: 'click',
  DBLCLICK: 'doubleClick',
  RUN: 'run',
  SELECT: 'select',
  INPUT: 'input',
  TYPE: 'type',
  SUBMIT: 'submit',
  FIND: 'find',
  VERIFY: 'verify',
  WAIT: 'wait',
  MOUSE: 'mouse',
  COMPARE: 'comparePosition',
  CHANGE_URL: 'changeUrl',
  SLEEP: 'sleep',
  VALIDATE_BLOCK: 'validateBlock',
  REDIRECT: '<<<>>>',
  REDIRECT_TO: 'redirectTo',
  REPLACE_HTML: 'replaceHtml',
  DRAG: 'drag'
};


/**
 * Gets the generated code for a url redirection.
 * @param {string} url The url it redirects to.
 * @return {string} The generated cmd string.
 * @export
 */
rpf.CodeGenerator.getRedirectUrl = function(url) {
  return goog.string.buildString(
      rpf.CodeGenerator.PlaybackActions.REDIRECT_TO,
      '(', url, ');');
};


/**
 * Tests the command type.
 * @param {string} cmd The command string.
 * @return {number} 0: Old executable. 1: New executable. 2: Others commands.
 * 3: The rest cases.
 * @export
 */
rpf.CodeGenerator.testCmdType = function(cmd) {
  var actions = rpf.CodeGenerator.PlaybackActions;
  if (goog.string.startsWith(cmd, actions.RUN)) {
    return 0;
  } else if (
      goog.string.startsWith(cmd, actions.CLICK) ||
      goog.string.startsWith(cmd, actions.DBLCLICK) ||
      goog.string.startsWith(cmd, actions.SELECT) ||
      goog.string.startsWith(cmd, actions.INPUT) ||
      goog.string.startsWith(cmd, actions.TYPE) ||
      goog.string.startsWith(cmd, actions.SUBMIT) ||
      goog.string.startsWith(cmd, actions.VERIFY) ||
      goog.string.startsWith(cmd, actions.DRAG) ||
      goog.string.startsWith(cmd, actions.REPLACE_HTML)) {
    return 1;
  } else if (
      goog.string.startsWith(cmd, actions.REDIRECT) ||
      goog.string.startsWith(cmd, actions.REDIRECT_TO) ||
      goog.string.startsWith(cmd, actions.SLEEP) ||
      goog.string.startsWith(cmd, actions.CHANGE_URL)) {
    return 2;
  } else {
    return 3;
  }
};


/**
 * Gets the generated code tree.
 * @return {rpf.CodeNode} The generated code tree.
 * @export
 */
rpf.CodeGenerator.prototype.getCodeTree = function() {
  return this.codeTree_;
};


/**
 * Gets the url in a generated redirect command.
 * @param {string} cmd The generated command.
 * @return {string} The url.
 * @export
 */
rpf.CodeGenerator.getUrlInRedirectCmd = function(cmd) {
  // The cmd.length - 2 meant to remove the ending );
  if (cmd.indexOf(rpf.CodeGenerator.PlaybackActions.CHANGE_URL) === 0) {
    return cmd.substring(
        rpf.CodeGenerator.PlaybackActions.CHANGE_URL.length + 1,
        cmd.length - 2);
  } else {
    return cmd.substring(
        rpf.CodeGenerator.PlaybackActions.REDIRECT_TO.length + 1,
        cmd.length - 2);
  }
};


/**
 * Gets the indentation.
 * @param {number} number The number of spaces.
 * @return {string} The indentation.
 * @export
 */
rpf.CodeGenerator.prototype.getIndentation = function(number) {
  var indent = '';
  for (var i = 0; i < number; i++) {
    indent += ' ';
  }
  return indent;
};


/**
 * Generates the command for sleeping.
 * @param {string} sleepTime The sleeping time.
 * @return {string} The command for a sleep command.
 * @export
 */
rpf.CodeGenerator.generateSleepCmd = function(sleepTime) {
  return goog.string.buildString(
             rpf.CodeGenerator.PlaybackActions.SLEEP,
             '(', sleepTime, ');');
};


/**
 * Generates the command for adding a customized function.
 * @param {string} signature The function signature.
 * @return {string} The command for a function call.
 * @export
 */
rpf.CodeGenerator.generateFunctionCmd = function(signature) {
  return goog.string.buildString(
             rpf.CodeGenerator.PlaybackActions.RUN,
             '(', signature, ');');
};


/**
 * Generates the command for adding a invocation to a test.
 * @param {string} testId The test id.
 * @param {string} testName The test name.
 * @return {string} The command for the invocation.
 * @export
 */
rpf.CodeGenerator.generateInvocationCmd = function(
    testId, testName) {
  return goog.string.buildString(
             rpf.CodeGenerator.PlaybackActions.RUN,
             '(invoke, \'calls ', testName,
             ' module.\');/*"""call(', testId, ')"""*/');
};


/**
 * Gets the value of an attribute.
 * @param {Object|string} attrValue The attribute value.
 * @return {string} The value of the attribute.
 * @private
 */
rpf.CodeGenerator.prototype.getsAttrValue_ = function(attrValue) {
  if (!attrValue) {
    return '';
  }
  if (typeof(attrValue) == 'string') {
    return attrValue;
  } else {
    return attrValue['value'];
  }
};


/**
 * Gets the tag name from the new generated code.
 * @param {string} cmd The cmd string.
 * @return {string} The tagname.
 * @private
 */
rpf.CodeGenerator.prototype.getTagNameFromNewCode_ = function(cmd) {
  var id = bite.base.Helper.getStepId(cmd);
  return id.split('-')[1];
};


// TODO(phu): add info per existence in attributes.
/**
 * Extract the important info from the given descriptor.
 * @param {string} script The script string.
 * @param {string} content The content string.
 * @param {Object=} opt_descriptor The optional descriptor object.
 * @return {string} The important info of the descriptor.
 * @export
 */
rpf.CodeGenerator.prototype.extractInfo = function(
    script, content, opt_descriptor) {
  try {
    var descriptor = opt_descriptor || rpf.MiscHelper.getDescriptor(script);
    var tagName = descriptor.tagName || '';
    var info = '';
    var text = descriptor['elementText'] || '';
    if (content) {
      info = ' "' + content + '" in';
    }
    var tagNameValue = tagName ? this.getsAttrValue_(tagName) :
                       this.getTagNameFromNewCode_(script);
    info += ' the ' + tagNameValue + ' with';
    if (!descriptor.attributes) {
      var id = descriptor.id || '';
      var class_ = descriptor['class_'] || '';
      var value = descriptor.value || '';
      var name = descriptor.name || '';
    } else {
      var id = descriptor.attributes.id || '';
      var class_ = descriptor.attributes['class'] || '';
      var value = descriptor.attributes.value || '';
      var name = descriptor.attributes.name || '';
    }
    if (text) {
      info += ' TEXT "' + this.getsAttrValue_(text) + '"';
    } else if (value) {
      info += ' VALUE "' + this.getsAttrValue_(value) + '"';
    } else {
      if (id) {
        info += ' ID ' + this.getsAttrValue_(id);
      }
      if (class_) {
        info += ' CLASS ' + this.getsAttrValue_(class_);
      }
      if (name) {
        info += ' NAME ' + this.getsAttrValue_(name);
      }
    }
  } catch (e) {
    info = 'Error: ' + e.message;
  }
  return info;
};


/**
 * Gets the action if it is an action string.
 * @param {string} cmd The command string.
 * @return {string} The action.
 */
rpf.CodeGenerator.getAction = function(cmd) {
  var result = cmd.match(/run\(([a-z]+),/);
  if (result && result.length >= 2) {
    // The second element is the action. The format of cmd looks like
    // run(click, ...);
    return result[1];
  }

  result = cmd.match(/([a-z]+)\(()/);
  if (result && result.length >= 2) {
    // This is to match click(... format.
    return result[1];
  }
  return '';
};


/**
 * Translates the generated command into English.
 * @param {string} script The generated script string.
 * @param {string=} opt_data The data string.
 * @param {Object=} opt_descriptor The optional descriptor object.
 * @return {string} The human readable script.
 * @export
 */
rpf.CodeGenerator.prototype.translateCmd = function(
    script, opt_data, opt_descriptor) {
  var data = opt_data || '';
  var dataStr = goog.string.buildString('var ContentMap = {};', data);
  try {
    eval(dataStr);
    if (!script) {
      return '';
    }
    var content = script.match(/ContentMap\[\".*\"\]/) + '';
    if (content != 'null') {
      eval('content = ' + content + ';');
    }
    if (goog.isArray(content)) {
      content = content[0];
    }
  } catch (e) {
    var content = 'a customized function';
  }
  var humanReadable = '';
  if (script.indexOf(rpf.CodeGenerator.PlaybackActions.SLEEP) === 0) {
    humanReadable = 'Sleep ' + script.match(/\d+/) + 'ms';
  } else if (script.indexOf(
      rpf.CodeGenerator.PlaybackActions.CHANGE_URL) === 0 ||
      script.indexOf(rpf.CodeGenerator.PlaybackActions.REDIRECT_TO) === 0) {
    humanReadable = 'Redirect to ' +
                    rpf.CodeGenerator.getUrlInRedirectCmd(script);
  } else if (script.indexOf(
      rpf.CodeGenerator.PlaybackActions.REDIRECT) === 0) {
    humanReadable = 'Redirect to the next page...';
  } else {
    var action = rpf.CodeGenerator.getAction(script);
    switch (action) {
      case rpf.CodeGenerator.PlaybackActions.CLICK:
      case rpf.CodeGenerator.PlaybackActions.FIND:
      case rpf.CodeGenerator.PlaybackActions.DBLCLICK:
      case rpf.CodeGenerator.PlaybackActions.SUBMIT:
        humanReadable = action + this.extractInfo(script, '', opt_descriptor);
        break;
      case rpf.CodeGenerator.PlaybackActions.SELECT:
      case rpf.CodeGenerator.PlaybackActions.INPUT:
      case rpf.CodeGenerator.PlaybackActions.VERIFY:
      case rpf.CodeGenerator.PlaybackActions.COMPARE:
      case rpf.CodeGenerator.PlaybackActions.TYPE:
        humanReadable = action +
            this.extractInfo(script, content, opt_descriptor);
        break;
    }
  }
  if (!humanReadable) {
    humanReadable = script;
  }
  return humanReadable;
};


/**
 * Generates the command for url changes.
 * @param {string} url The URL will be changed to.
 * @return {string} The command for a URL change.
 * @export
 */
rpf.CodeGenerator.generateUrlChange = function(url) {
  return goog.string.buildString(
             rpf.CodeGenerator.PlaybackActions.CHANGE_URL,
             '(', url, ');');
};


/**
 * Generates command with one arg.
 * @param {rpf.CodeGenerator.PlaybackActions} action The action string.
 * @param {string} getElem The get elem string.
 * @param {Object} cmdMap The command info map.
 * @return {Object} The result object.
 * @private
 */
rpf.CodeGenerator.prototype.generateCmdOneArg_ = function(
    action, getElem, cmdMap) {
  var playbackCmd = goog.string.buildString(action, '(', getElem, ');');
  return {'cmd': playbackCmd,
          'cmdMap': cmdMap};
};


/**
 * Generates command with two args.
 * @param {rpf.CodeGenerator.PlaybackActions} action The action string.
 * @param {string} getElem The get elem string.
 * @param {Object} cmdMap The command info map.
 * @param {string} elemVarName The element variable name.
 * @param {string} content The content string.
 * @return {Object} The result object.
 * @private
 */
rpf.CodeGenerator.prototype.generateCmdTwoArgs_ = function(
    action, getElem, cmdMap, elemVarName, content) {
  var playbackCmd = goog.string.buildString(
      action, '(', getElem, ', ',
      rpf.CodeGenerator.VARIABLE_CONTENT_MAP_,
      '["', elemVarName, '"]);');
  var datafileCmd = goog.string.buildString(
      rpf.CodeGenerator.VARIABLE_CONTENT_MAP_, '["',
      elemVarName, '"] = "', content, '";');

  return {'cmd': playbackCmd,
          'data': datafileCmd,
          'cmdMap': cmdMap};
};


/**
 * Gets a random id.
 * @param {string} action The action string.
 * @param {string} tagName The elem's tag name.
 * @param {string} descriptor The descriptor string.
 * @return {string} A unique cmd id.
 * @export
 */
rpf.CodeGenerator.getCmdUniqueId = function(
    action, tagName, descriptor) {

  function getText(strOrObj) {
    if (!strOrObj) {
      return '';
    }
    if (typeof(strOrObj) == 'object') {
      return strOrObj['value'];
    }
    return strOrObj;
  }

  var result = [action.toLowerCase(),
                tagName.toLowerCase()];
  try {
    var descObj = goog.json.parse(descriptor);
    var text = getText(descObj['elementText']);
    var value = getText(descObj['attributes']['value']);
    var temp = text ? text : value;
    if (temp) {
      result.push(bite.base.Helper.getNonWordRemoved(temp, 20));
    }
  } catch (e) {
    console.log('Error occurred: ' + e.message);
  }
  result.push(goog.math.randomInt(1000));

  return result.join('-');
};


/**
 * Gets the string for getting elem by id.
 * @param {string} id The elem's id.
 * @return {string} The cmd for getting elem by id.
 * @export
 */
rpf.CodeGenerator.getElemByIdCmd = function(id) {
  return 'getElem("' + id + '")';
};


/**
 * Generates the corresponding JS and data commands for a captured interaction.
 * @param {Array} selectors The css selectors of the element.
 * @param {string} content The user's inputs or changes.
 * @param {rpf.CodeGenerator.DomTags} nodeType The element's tag name.
 * @param {rpf.CodeGenerator.RecordActions} action The recorded action.
 * @param {string} descriptor The descriptive info object of the element.
 * @param {string} elemVarName The variable name for the data input.
 * @param {boolean=} opt_noConsole Whether or not the recording is started from
 * the rpf Console UI; can be started automatically from the background.
 * @param {Object=} opt_iframeInfo The iframe info that the element was from.
 * @param {Array=} opt_xpaths The xpath array.
 * @return {Object} The result object.
 * @export
 */
rpf.CodeGenerator.prototype.generateScriptAndDataFileForCmd = function(
    selectors, content, nodeType, action, descriptor,
    elemVarName, opt_noConsole, opt_iframeInfo, opt_xpaths) {
  var playbackCmd = '';
  var cmdMap = {};
  var playAction = action;
  var tagNameLower = nodeType.toLowerCase();

  cmdMap['descriptor'] = goog.json.parse(descriptor);
  cmdMap['selectors'] = selectors;
  cmdMap['id'] = rpf.CodeGenerator.getCmdUniqueId(
      action, tagNameLower, descriptor);
  cmdMap['elemId'] = 'id' + goog.string.getRandomString();
  cmdMap['iframeInfo'] = opt_iframeInfo;
  cmdMap['action'] = action;
  cmdMap['varName'] = elemVarName;
  cmdMap['tagName'] = nodeType;
  cmdMap['xpaths'] = opt_xpaths;

  if (playAction == rpf.CodeGenerator.RecordActions.CLICK ||
      playAction == rpf.CodeGenerator.RecordActions.DBLCLICK ||
      playAction == rpf.CodeGenerator.RecordActions.SUBMIT) {
    return this.generateCmdOneArg_(
        /** @type {rpf.CodeGenerator.PlaybackActions} */ (playAction),
        rpf.CodeGenerator.getElemByIdCmd(cmdMap['id']),
        cmdMap);
  } else if (playAction == rpf.CodeGenerator.RecordActions.REPLACE_HTML ||
             playAction == rpf.CodeGenerator.RecordActions.TYPE ||
             playAction == rpf.CodeGenerator.RecordActions.CHANGE ||
             playAction == rpf.CodeGenerator.RecordActions.SELECT ||
             playAction == rpf.CodeGenerator.RecordActions.VERIFY) {
    if (playAction == rpf.CodeGenerator.RecordActions.CHANGE) {
      playAction = rpf.CodeGenerator.PlaybackActions.INPUT;
    }
    return this.generateCmdTwoArgs_(
        /** @type {rpf.CodeGenerator.PlaybackActions} */ (playAction),
        rpf.CodeGenerator.getElemByIdCmd(cmdMap['id']),
        cmdMap,
        elemVarName,
        content);
  } else if (playAction == rpf.CodeGenerator.RecordActions.DRAG) {
    var cords = content.split('x');
    playbackCmd = goog.string.buildString(
        rpf.CodeGenerator.PlaybackActions.DRAG,
        '(', rpf.CodeGenerator.getElemByIdCmd(cmdMap['id']), ', ' +
        cords[0] + ', ' + cords[1] + ');');
    return {'cmd': playbackCmd,
            'cmdMap': cmdMap};
  }
};

