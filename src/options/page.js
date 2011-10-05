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
 * BITE options/settings page controller.  The BITE Options Page provides an
 * interface for BITE users to change different configuration details about the
 * BITE tool.
 *
 * @author alexto@google.com (Alexis O. Torres)
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.options.Page');

goog.require('bite.LoginManager');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('bite.options.private_constants');
goog.require('bite.options.private_data');
goog.require('goog.Timer');
goog.require('goog.date.relative');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.object');



/**
 * Provides the class to maintain state for the page.
 * @constructor
 * @export
 */
bite.options.Page = function() {
  /**
   * Records which configuration settings have changed.
   * @type {!Object}
   * @private
   */
  this.changed_ = {};

  /**
   * The handler reference used to handle chrome extension request messages.
   * A reference is required for cleanup.
   * @type {Function}
   * @private
   */
  this.handleOnRequest_ = goog.bind(this.onRequestHandler_, this);

  /**
   * A flag representing whether or not this object has been destroyed.
   * @type {boolean}
   * @private
   */
  this.isDestroyed_ = false;

  /**
   * A flag used to denote whether or not this object is ready for use.
   * @type {boolean}
   * @private
   */
  this.isReady_ = false;

  /**
   * Manages event listeners created by this page.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * A timer used to refresh dynamic elements such as last saved time.  When
   * the Page object is destroyed, the timer will be disposed.
   * @type {goog.Timer}
   * @private
   */
  this.refreshTimer_ = new goog.Timer(bite.options.Page.REFRESH_RATE_);
};


/**
 * The options page DOM Element names.
 *
 * Some of the keys are values from bite.options.constants.Id instead of
 * directly accessing the enum due to the fact that Closure can not handle
 * keys in an enum being set from values in a different enum.  They also can't
 * handle non-capitalized, quoted strings as keys for enums.  Thus this type
 * is Object out of necessity.
 * @type {!Object}
 * @private
 */
bite.options.Page.ElementName_ = {
  'project': 'bug-project',
  'recording': 'bug-recording',
  'screenshot': 'bug-screenshot',
  'state': 'bug-state',
  'uiBinding': 'bug-ui-binding',
  'serverChannel': 'server-channel',
  'autoRecord': 'auto-record',
  'featuresBugs': 'features-bugs',
  'featuresRpf' : 'features-rpf',
  'featuresTests' : 'features-tests',

  SAVE_BUTTON: 'save-button',
  SAVE_TIME: 'save-time',
  USERNAME: 'user'
};


/**
 * Map option value to configuration value.
 * @type {Object}
 * @private
 */
bite.options.Page.MapValues_ = {
  'dev': bite.options.constants.ServerChannelOption.DEV,
  'beta': bite.options.constants.ServerChannelOption.BETA,
  'rel': bite.options.constants.ServerChannelOption.RELEASE
};


/**
 * The refresh rate used with a timer to determine when dynamic elements
 * should be updated (refreshed).  The rate is in milliseconds.
 * @type {number}
 * @private
 */
bite.options.Page.REFRESH_RATE_ = 5000;


/**
 * Enables/disables the Save button and updates it's text.
 * @param {boolean} enable Whether or not to enable the button.
 * @private
 */
bite.options.Page.prototype.enableSave_ = function(enable) {
  var saveButtonId = bite.options.Page.ElementName_.SAVE_BUTTON;
  var saveButton = goog.dom.getElement(saveButtonId);
  if (!saveButton) {
    // Do nothing if the DOM Element is not found, the error should have been
    // recorded in the initialization.
    return;
  }

  saveButton.disabled = !enable;
  saveButton.innerText = enable ? 'Save Now' : 'Saved';
};


/**
 * Handle saving of a new configuration.
 * @private
 */
bite.options.Page.prototype.handleSave_ = function() {
  this.enableSave_(false);

  // Assumes that the changed_ Object will only ever have iterable items for
  // those option values that are stored/removed.
  // If the changed_ object is empty, do nothing.
  if (goog.object.isEmpty(this.changed_)) {
    return;
  }

  var usernameId = bite.options.Page.ElementName_.USERNAME;
  var usernameElement = goog.dom.getElement(usernameId);
  var username = usernameElement ? usernameElement.innerText : undefined;

  // Set the cached values for the configuration to the local instance managed
  // by this object/UI.
  bite.options.data.updateConfiguration(this.changed_, username);

  // Let everyone know that the entire configuration has changed.
  this.notifyChange_();

  this.refreshInterface_();

  this.changed_ = {};
};


/**
 * Handles the onselect event for option elements and updates the configuration
 * with the appropriate value.
 * @param {string} key A key used to identify the option.
 * @param {Event} event The event caused when the select element changes.
 * @private
 */
bite.options.Page.prototype.handleSelect_ = function(key, event) {
  var value = event.target.value;
  value = this.processOption_(key, value);
  this.updateOption_(key, value);
};


/**
 * Handles a change in the value of a checkbox.
 * @param {string} key A key used to identify the option.
 * @param {Element} checkbox The checkbox element.
 * @param {Event} event The event.
 * @private
 */
bite.options.Page.prototype.handleCheckbox_ = function(key, checkbox, event) {
  var value = 'false';
  if (checkbox.checked) {
    value = 'true';
  }
  this.updateOption_(key, value);
};


/**
 * Initializes the page by validating DOM Elements, initializing the page's
 * events and handlers.  It also retrieves the current configuration and
 * updates the interface to reflect it.
 * @param {function(boolean)=} opt_callback An optional callback that will
 *     be fired when initialization is complete.
 * @export
 */
bite.options.Page.prototype.init = function(opt_callback) {
  if (this.isReady() || this.isDestroyed()) {
    // Do not allow initialization if the object is already initialized or
    // has been destroyed.
    return;
  }

  this.initDOMElements_();
  this.initData_();
  this.refreshInterface_();

  // Start the refresh timer so that the interface will update as things change
  // such as last saved time.
  this.refreshTimer_.start();

  // Once everything is ready, hookup the extension onRequest handler that
  // listens to configuration updates from other parts of the application.
  // handleOnRequest is a goog.bind function reference.
  chrome.extension.onRequest.addListener(this.handleOnRequest_);
  this.isReady_ = true;
};


/**
 * Sets up handling for the object, the refresh timer, and DOM Elements.  It
 * also verifies DOM Elements are present and does any other setup related
 * functions.
 * @private
 */
bite.options.Page.prototype.initDOMElements_ = function() {
  var type, handler, listenId;

  // Retrieve the data elements from the HTML and setup their event handlers.
  for (var key in bite.options.constants.Id) {
    var id = bite.options.constants.Id[key];

    var elementName = bite.options.Page.ElementName_[id];
    var element = goog.dom.getElement(elementName);
    if (!element) {
      // Continue processing the handler setup if a element is missing.
      console.log('ERROR: Failed to find data element (' + elementName + ').');
      continue;
    }

    // Figure out if it's a select or a checkbox input.
    if (element.tagName == 'SELECT') {
      this.eventHandler_.listen(element, goog.events.EventType.CHANGE,
                                goog.bind(this.handleSelect_, this, id));
    } else if (element.tagName == 'INPUT' && element.type == 'checkbox') {
      this.eventHandler_.listen(
          element, goog.events.EventType.CLICK,
          goog.bind(this.handleCheckbox_, this, id, element));
    } else {
      console.log('ERROR: Element of unknown input type (' +
                  elementName + ').');
      continue;
    }
  }

  // Setup the Save Button
  var saveButtonId = bite.options.Page.ElementName_.SAVE_BUTTON;
  var saveButton = goog.dom.getElement(saveButtonId);
  if (saveButton) {
    type = goog.events.EventType.CLICK;
    handler = goog.bind(this.handleSave_, this);
    this.eventHandler_.listen(saveButton, type, handler);

    this.enableSave_(false);

  } else {
    // Continue processing the handler setup if a element is missing.
    console.log('ERROR: Failed to find save button element (' + saveButtonId +
                ').');
  }

  // Validate the presence of the last save time Element.
  var saveTimeId = bite.options.Page.ElementName_.SAVE_TIME;
  var saveTimeElement = goog.dom.getElement(saveTimeId);
  if (!saveTimeElement) {
    // Continue processing the handler setup if a element is missing.
    console.log('ERROR: Failed to find last saved time element (' +
                saveTimeId + ').');
  }

  // Validate the presence of the user name Element.
  var usernameId = bite.options.Page.ElementName_.USERNAME;
  var usernameElement = goog.dom.getElement(usernameId);
  if (!usernameElement) {
    // Continue processing the handler setup if a element is missing.
    console.log('ERROR: Failed to find username element (' +
                usernameId + ').');
  }

  // Setup the refresh timer to update the last saved time.
  type = goog.Timer.TICK;
  handler = goog.bind(this.refreshInterface_, this);
  this.eventHandler_.listen(this.refreshTimer_, type, handler);
};


/**
 * Retrieves the current configuration and sets the data values to its
 * current value.
 * @private
 */
bite.options.Page.prototype.initData_ = function() {
  var configuration = bite.options.data.getCurrentConfiguration();

  // Retrieve the data elements from the HTML and setup their event handlers.
  for (var key in bite.options.constants.Id) {
    // Retrieve id used to lookup the DOM Element's name.
    var id = bite.options.constants.Id[key];

    if (!(id in configuration)) {
      continue;
    }

    this.refreshData_(id, configuration[id]);
  }
};


/**
 * Returns whether or not this object is destroyed.
 * @return {boolean} Destroyed or not.
 */
bite.options.Page.prototype.isDestroyed = function() {
  return this.isDestroyed_;
};


/**
 * Returns whether or not this object is ready for use.
 * @return {boolean} Ready or not.
 */
bite.options.Page.prototype.isReady = function() {
  return this.isReady_;
};


/**
 * Send broadcast message letting others know what part of the configuration
 * has changed.
 * @private
 */
bite.options.Page.prototype.notifyChange_ = function() {
  // Construct message data.
  var data = {};
  data['action'] = bite.options.constants.Message.UPDATE;
  data[bite.options.constants.MessageData.DATA] = this.changed_;

  // Broadcast message to the extension.  No response is desired.
  chrome.extension.sendRequest(data, goog.nullFunction);
};


/**
 * Handles messages sent from others related to the configuration data.
 * @param {!Object} request The data sent.
 * @param {MessageSender} sender An object containing information about the
 *     script context that sent the request.
 * @param {function(!*): void} response Optional function to call when the
 *     request completes; only call when appropriate.
 * @private
 */
bite.options.Page.prototype.onRequestHandler_ =
    function(request, sender, response) {
  // TODO (jasonstredwick): Figure out how to generate a common set of
  // message passing values to cross all of BITE and potentially others.
  // (possibly in testing/chronos/common?)
  var owner = request['owner'];
  var action = request['action'];
  if (owner != bite.options.constants.OWNER || !action) {
    return;
  }

  switch (action) {
    case bite.options.constants.Message.UPDATE:
      var data = request[bite.options.constants.MessageData.DATA];

      // Look through all the valid options and update the ones that were
      // supplied with the data.
      for (var key in bite.options.constants.Id) {
        var id = bite.options.constants.Id[key];
        if (id in data) {
          this.refreshData_(id, data[id]);
          this.updateOption_(id, data[id]);
        }
      }

      break;
  }
};


/**
 * Process the option that was selected from the UI in case it does not map
 * directly to the configuration value.
 * @param {string} id The option id.
 * @param {string} value The value that was chosen.
 * @return {string} The processed version of the value.
 * @private
 */
bite.options.Page.prototype.processOption_ = function(id, value) {
  if (!goog.object.containsValue(bite.options.constants.Id, id)) {
    console.log('ERROR: Update option failed due to a bad key: ' + id + '.');
    return value;
  }

  id = /** @type {bite.options.constants.Id} */ (id);
  switch (id) {
    case bite.options.constants.Id.SERVER_CHANNEL:
      // Map the option interface id to the configuration value.  Assumes that
      // the map is managed and all mapped values are present and correct.
      return bite.options.Page.MapValues_[value];
  }

  return value;
};


/**
 * Process the option that was selected from the UI in case it does not map
 * directly to the configuration value.
 * @param {bite.options.constants.Id} id The option id.
 * @param {string} value The value that was chosen.
 * @return {string} The processed version of the value.
 * @private
 */
bite.options.Page.prototype.processOptionReverse_ = function(id, value) {
  switch (id) {
    case bite.options.constants.Id.SERVER_CHANNEL:
      // Map the configuration value to the UI option value.  Assumes that
      // the mapped values are present and correct.
      switch (value) {
        case bite.options.constants.ServerChannelOption.DEV:
          return 'dev';
        case bite.options.constants.ServerChannelOption.RELEASE:
          return 'rel';
        case bite.options.constants.ServerChannelOption.BETA:
          return 'beta';
      }
      break;
  }

  return value;
};


/**
 * Refresh DOM Element selections with values from the given data.
 * @param {string} id The option to update.
 * @param {string} value The new value.
 * @private
 */
bite.options.Page.prototype.refreshData_ = function(id, value) {
  if (!goog.object.containsValue(bite.options.constants.Id, id)) {
    console.log('ERROR: Refresh data failed due to a bad key ' + id + '.');
    return;
  }

  id = /** @type {bite.options.constants.Id} */ (id);
  var elementName = bite.options.Page.ElementName_[id];
  var element = goog.dom.getElement(elementName);
  if (!element) {
    // Continue processing the handler setup if a element is missing.
    // An error is not recorded here because it would have been recorded
    // first in this.setup_.
    return;
  }

  if (element.tagName == 'SELECT') {
    element.value = this.processOptionReverse_(id, value);
  } else if (element.tagName == 'INPUT' && element.type == 'checkbox') {
    if (value == 'true') {
      element.checked = true;
    } else {
      element.checked = false;
    }
  }
};


/**
 * Refreshes the non-data portion of the interface; updates the last saved
 * information and the username.
 * @private
 */
bite.options.Page.prototype.refreshInterface_ = function() {
  var saveTimeId = bite.options.Page.ElementName_.SAVE_TIME;
  var saveTimeElement = goog.dom.getElement(saveTimeId);
  if (saveTimeElement) {
    // Shortcut to the Key enum.
    var keys = bite.options.private_constants.Key;

    // Retrieve the cached last saved data.
    var timestamp = bite.options.private_data.get(keys.ADMIN_LAST_SAVE_TIME);
    var lastuser = bite.options.private_data.get(keys.ADMIN_LAST_SAVE_USER);

    // Prepare the last saved data information string.
    var lastSaveInfo = '';
    if (timestamp && lastuser) {
      // Prepare timestamp by converting it to a delta time relative to now.
      var millisec = /** @type {number} */ (timestamp);
      // Converts the millisecond time to a formatted time relative to now.
      // If the diff is too old it will return an empty string.
      var timeDiff = goog.date.relative.format(millisec);
      if (!timeDiff) {
        // If the date is old enough, format relative to days.
        timeDiff = goog.date.relative.formatDay(millisec);
      }

      lastSaveInfo = 'Updated ' + timeDiff + ' by ' + lastuser;
    }

    saveTimeElement.innerText = lastSaveInfo;
  }

  // Begin the refresh of the current user.
  var usernameId = bite.options.Page.ElementName_.USERNAME;
  var usernameElement = goog.dom.getElement(usernameId);
  if (usernameElement) {
    // Retrieve the current user asynchronously.
    var callback = goog.bind(this.refreshUsername_, this, usernameElement);
    bite.LoginManager.getInstance().getCurrentUser(callback);
  }
};


/**
 * Refreshes the username based on the current value stored by the
 * LoginManager.
 * @param {!Element} element The username DOM Element.
 * @param {Object} data The user related data with the following information:
 *     {success: boolean, url: string, username: string}.
 * @private
 */
bite.options.Page.prototype.refreshUsername_ = function(element, data) {
  var success = data['success'];
  var username = data['username'];
  username = username.replace(/[@]google[.]com$/, '');

  // Make sure that we have valid values before updating the configuration.
  if (success && username && element.innerText != username) {
    element.innerText = username;

    // Shortcut to the Key enum.
    var keys = bite.options.private_constants.Key;
    bite.options.private_data.update(keys.ADMIN_LAST_SAVE_USER, username);
  }
};


/**
 * Destroys and cleans up the object when it is no longer needed.  It will
 * unhook all listeners and perform other related cleanup functions.
 * Essentially, this object will no longer be functional after a call to this
 * function.
 */
bite.options.Page.prototype.stop = function() {
  if (this.isDestroyed()) {
    return;
  }

  // Stop refresh timer and destroy it by removing its only reference
  // maintained by this object, which created it.
  this.refreshTimer_.stop();
  this.refreshTimer_.dispose();

  // Cleanup all the Listeners.
  this.eventHandler_.removeAll();

  // Remove chrome extension's request listener.
  if (chrome.extension.onRequest.hasListener(this.handleOnRequest_)) {
    chrome.extension.onRequest.removeListener(this.handleOnRequest_);
  }

  // Clean storage objects.
  this.changed_ = {};

  // Set a flag so the object can't be destroyed multiple times.
  this.isDestroyed_ = true;
};


/**
 * Updates a single option with the given value.
 * @param {string} key A key used to identify the option.
 * @param {string} value The new value for the option.
 * @private
 */
bite.options.Page.prototype.updateOption_ = function(key, value) {
  if (!goog.object.containsValue(bite.options.constants.Id, key)) {
    console.log('ERROR: Update option failed due to a bad key ' + key + '.');
    return;
  }

  key = /** @type {bite.options.constants.Id} */ (key);
  var cachedValue = bite.options.data.get(key);

  // If the user selected the same value as what is cached then we don't want
  // to mark this option as changed.  Otherwise, remember the newly selected
  // value.
  if (value == cachedValue) {
    delete this.changed_[key];
  } else {
    this.changed_[key] = value;
  }

  // After potentially removing/adding a change, the save button needs to be
  // updated to reflect this information.  The button should be disabled if
  // there are no changes.
  if (goog.object.isEmpty(this.changed_)) {
    this.enableSave_(false);
  } else {
    this.enableSave_(true);
  }
};

