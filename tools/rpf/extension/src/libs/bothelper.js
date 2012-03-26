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
 * The wrapper functions for the third party library - browser automation,
 * which provides functions like click, type and etc.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.rpf.BotHelper');

goog.require('bite.rpf.ActionsHelper');
goog.require('bot');
goog.require('bot.Keyboard.Keys');
goog.require('bot.Mouse');
goog.require('bot.action');
goog.require('bot.events');
goog.require('bot.locators.xpath');
goog.require('common.client.ElementDescriptor');
goog.require('goog.Timer');
goog.require('goog.dom');



/**
 * The bot actions wrapper.
 * @constructor
 * @extends {bite.rpf.ActionsHelper}
 * @export
 */
bite.rpf.BotHelper = function() {
  goog.base(this);
  this.init_();
};
goog.inherits(bite.rpf.BotHelper, bite.rpf.ActionsHelper);


/**
 * Inits the bot helper and sets the global methods. Note that for every
 * wrapper it needs to implement the following interfaces that simulate
 * user's actions.
 * @private
 */
bite.rpf.BotHelper.prototype.init_ = function() {
  BiteRpfAction.click = goog.bind(this.click, this);
  BiteRpfAction.drag = goog.bind(this.drag, this);
  BiteRpfAction.enter = goog.bind(this.enter, this);
  BiteRpfAction.select = goog.bind(this.select, this);
  BiteRpfAction.type = goog.bind(this.type, this);
  BiteRpfAction.input = goog.bind(this.input, this);
  BiteRpfAction.submit = goog.bind(this.submit, this);
  BiteRpfAction.doubleClick = goog.bind(this.doubleClick, this);
  BiteRpfAction.verify = goog.bind(this.verify, this);
  BiteRpfAction.move = goog.bind(this.move, this);
  BiteRpfAction.call = goog.bind(this.call, this);
  BiteRpfAction.verifyNot = goog.bind(this.verifyNot, this);
};


/**
 * Flashes the element.
 * @param {Element} elem The element.
 * @private
 */
bite.rpf.BotHelper.prototype.flash_ = function(elem) {
  // TODO(phu): We should save the previous outline style and then revert.
  goog.style.setStyle(elem, 'outline', 'medium solid red');
  goog.Timer.callOnce(
      function() {goog.style.setStyle(elem, 'outline', '');},
      400);
};


/**
 * Gets the element.
 * @param {string|Element} elem The element info.
 * @return {!Element} The element that was found.
 * @private
 */
bite.rpf.BotHelper.prototype.getElement_ = function(elem) {
  var elemType = typeof elem;
  var log = '';
  if (elemType == 'string') {
    log = 'xpath - ' + elem;
    elem = bot.locators.xpath.single(
        /** @type {string} */ (elem), goog.dom.getDocument());
  } else {
    log = 'tagName - ' + elem.tagName;
  }
  if (elem) {
    this.flash_(/** @type {Element} */ (elem));
    return /** @type {!Element} */ (elem);
  }
  throw new Error('Could not find the element: ' + log);
};


/**
 * Clicks the given element.
 * @param {string|Element} elem The element to be clicked.
 */
bite.rpf.BotHelper.prototype.click = function(elem) {
  elem = this.getElement_(elem);
  try {
    bot.action.click(elem);
  } catch (e) {
    // Since bot.action.click needs the element to be shown, we have to
    // do this workaround for legacy code.
    var doc = goog.dom.getOwnerDocument(elem);
    goog.style.scrollIntoContainerView(elem,
        goog.userAgent.WEBKIT ? doc.body : doc.documentElement);

    var size = goog.style.getSize(elem);
    var opt_coords = new goog.math.Coordinate(size.width / 2, size.height / 2);

    var mouse = new bot.Mouse();
    mouse.move(elem, opt_coords);

    var pos = goog.style.getClientPosition(elem);
    var args = /** @type {bot.events.MouseArgs} */ ({
      clientX: pos.x + opt_coords.x,
      clientY: pos.y + opt_coords.y,
      button: 0,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      relatedTarget: null
    });

    bot.events.fire(elem, bot.events.EventType.MOUSEDOWN, args);
    bot.events.fire(elem, bot.events.EventType.MOUSEUP, args);
    bot.events.fire(elem, bot.events.EventType.CLICK, args);
  }
};


/**
 * Hits the enter key on the given element.
 * @param {string|Element} elem The element to hit enter on.
 */
bite.rpf.BotHelper.prototype.enter = function(elem) {
  elem = this.getElement_(elem);
  bot.action.type(elem, bot.Keyboard.Keys.ENTER);
};


/**
 * Selects the given element.
 * @param {string|Element} elem The element to be selected.
 * @param {string} value The value to be selected.
 */
bite.rpf.BotHelper.prototype.select = function(elem, value) {
  var options = this.getElement_(elem).options;
  for (var i = 0, len = options.length; i < len; ++i) {
    if (options[i].value == value) {
      bot.action.click(options[i]);
      break;
    }
  }
};


/**
 * Moves the cursor to the given element.
 * @param {string|Element} elem The element to be moved to.
 */
bite.rpf.BotHelper.prototype.move = function(elem) {
  elem = this.getElement_(elem);
  var doc = goog.dom.getOwnerDocument(elem);
  goog.style.scrollIntoContainerView(elem,
      goog.userAgent.WEBKIT ? doc.body : doc.documentElement);

  var size = goog.style.getSize(elem);
  var opt_coords = new goog.math.Coordinate(size.width / 2, size.height / 2);

  var mouse = new bot.Mouse();
  mouse.move(elem, opt_coords);
};


/**
 * Drags the given element.
 * @param {string|Element} elem The element to be dragged.
 * @param {number} dX The difference of x coordinates.
 * @param {number} dY The difference of y coordinates.
 */
bite.rpf.BotHelper.prototype.drag = function(elem, dX, dY) {
  bot.action.drag(this.getElement_(elem), dX, dY);
};


/**
 * Inputs text in the given element by changing the element's value attribute.
 * @param {string|Element} elem The element to have text input.
 * @param {string} text The text input.
 */
bite.rpf.BotHelper.prototype.input = function(elem, text) {
  elem = this.getElement_(elem);
  if (elem.value != text) {
    elem.value = text;
    bot.events.fire(elem, bot.events.EventType.CHANGE);
  }
};


/**
 * Inputs text character by character in the given element.
 * @param {string|Element} elem The element to have text input.
 * @param {string} text The text input.
 */
bite.rpf.BotHelper.prototype.type = function(elem, text) {
  elem = this.getElement_(elem);
  elem.value = '';
  elem.focus();
  bot.action.type(elem, text);
};


/**
 * Submits the form.
 * @param {string|Element} elem The form to be submitted.
 */
bite.rpf.BotHelper.prototype.submit = function(elem) {
  // TODO (phu): Figure out how this should work.  Changed submit to click
  // as submit is deprecated.
  bot.action.click(this.getElement_(elem));
};


/**
 * Double clicks the given element.
 * @param {string|Element} elem The element to be double clicked.
 */
bite.rpf.BotHelper.prototype.doubleClick = function(elem) {
  bot.action.doubleClick(this.getElement_(elem));
};


/**
 * Verifies the specified element does not exist.
 * @param {string|Element} elem The element.
 * @param {string} content The content to verify.
 */
bite.rpf.BotHelper.prototype.verifyNot = function(elem, content) {
  if (!elem) {
    return;
  }
  elem = this.getElement_(elem);
  var result = common.client.ElementDescriptor.getElement(
      BiteRpfAction.currCmdMap, 'descriptor');
  if (result['elem']) {
    throw new Error('VerifyNot failed: Element found.');
  }
};


/**
 * Verifies the specified element exists.
 * @param {string|Element} elem The element.
 * @param {string} content The content to verify.
 */
bite.rpf.BotHelper.prototype.verify = function(elem, content) {
  elem = this.getElement_(elem);
  var result = common.client.ElementDescriptor.getElement(
      BiteRpfAction.currCmdMap, 'descriptor');
  if (!result['elem']) {
    throw new Error(result['log']);
  }
};

