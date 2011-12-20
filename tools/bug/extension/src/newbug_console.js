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
 * New bug console, used to walk the use through the steps
 * necessary to log a bug.
 *
 * @author ekamenskaya@google.com (Ekaterina Kamenskaya)
 * @author alexto@google.com (Alexis O. Torres)
 */


goog.provide('bite.client.console.NewBug');

goog.require('Bite.Constants');
goog.require('bite.client.BugTemplate');
goog.require('bite.ux.Container');
goog.require('bite.client.TemplateManager');
goog.require('bite.client.Templates');
goog.require('bite.client.console.NewBugTemplate');
goog.require('bite.common.net.xhr.async');
goog.require('bite.console.Helper');
goog.require('common.client.ElementDescriptor');
goog.require('common.client.RecordModeManager');
goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.dom.forms');
goog.require('goog.dom.selection');
goog.require('goog.events.EventHandler');
goog.require('goog.string');
goog.require('goog.structs.Map');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('goog.userAgent.platform');
goog.require('goog.userAgent.product');
goog.require('soy');



/**
 * Creates an instance of the NewBug console.
 * @param {?string} user Email for the current user.
 * @param {Function=} opt_callback Callback function when New Bug console is
 *     canceled or a new bug is logged.
 * @constructor
 */
bite.client.console.NewBug = function(user, opt_callback) {
  /**
   * Extension's root folder URL.
   * @type {string}
   * @private
   */
  this.rootFolder_ = chrome.extension.getURL('');

  /**
   * Container for the new bug console.
   * @type {bite.ux.Container}
   * @private
   */
  this.container_ = null;

  /**
   * Current user's email.
   * @type {?string}
   * @private
   */
  this.user_ = user;

  /**
   * Callback function to call when the New Bug console
   * finishes logging a new bug or is canceled.
   * @type {function()}
   * @private
   */
  this.doneCallback_ = opt_callback || goog.nullFunction;

  /**
   * Screenshot for when the bug was logged.
   * @type {?string}
   * @private
   */
  this.screenshot_ = null;

  /**
   * Title text area.
   * @type {Element}
   * @private
   */
  this.titleTextArea_ = null;

  /**
   * Templates dropdown list.
   * @type {Element}
   * @private
   */
  this.templatesList_ = null;

  /**
   * The templates to be shown.
   * @type {!Object.<string, bite.client.BugTemplate>}
   * @private
   */
  this.templates_ = {};

  /**
   * Screenshot checkbox.
   * @type {Element}
   * @private
   */
  this.screenshotCheckbox_ = null;

  /**
   * Notes text area.
   * @type {Element}
   * @private
   */
  this.notesTextArea_ = null;

  /**
   * UI Element description text area.
   * @type {Element}
   * @private
   */
  this.uiTextArea_ = null;

  /**
   * Recoding script text area.
   * @type {Element}
   * @private
   */
  this.recordingTextArea_ = null;

  /**
   * The current URL.
   * @type {string}
   * @private
   */
  this.url_ = '';  // Set to the current URL from the show() method.

  /**
   * Buffer for the link to recorded test.
   * @type {string}
   * @private
   */
  this.recordingLink_ = '';

  /**
   * Buffer for the recorded test.
   * @type {string}
   * @private
   */
  this.recordingScript_ = '';

  /**
   * Buffer for the recorded test in human readable format.
   * @type {string}
   * @private
   */
  this.recordingReadable_ = '';

  /**
   * Buffer for the recording data.
   * @type {string}
   * @private
   */
  this.recordingData_ = '';

  /**
   * Buffer for recorded script's info map.
   * @type {Object}
   * @private
   */
  this.recordingInfoMap_ = {};

  /**
   * Manager for selecting a new UI element.
   * @type {common.client.RecordModeManager}
   * @private
   */
  this.recordModeManger_ = null;

  /**
   * Element used as the highlight box.
   * @type {Element}
   * @private
   */
  this.pingDiv_ = null;

  /**
   * Manages the UI listeners for the new bug console.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
};


/**
 * New Bug Form tabs.
 * @enum {string}
 * @private
 */
bite.client.console.NewBug.Tab_ = {
  RECORDING: 'Recording',
  OVERVIEW: 'Overview',
  UI: 'UI'
};


/**
 * Instruments the usage of the NewBug console.
 * @param {string} action The action to log.
 * @param {string} label Additional details related to the action to log.
 * @private
 */
bite.client.console.NewBug.logEvent_ = function(action, label) {
  chrome.extension.sendRequest({'action': Bite.Constants.HUD_ACTION.LOG_EVENT,
                                'category': Bite.Constants.TestConsole.NEWBUG,
                                'event_action': action,
                                'label': label});
};


/**
 * Gets current repro URL.
 * @return {string} The current repro URL.
 * @private
 */
bite.client.console.NewBug.prototype.getCurrentUrl_ = function() {
  var url = goog.global.location.href;
  return url;
};


/**
 * Element seleted while logging a new bug or dragging an exising
 * bug in to the right context.
 * @type {Element}
 * @private
 */
bite.client.console.NewBug.prototype.selectedElement_ = null;


/**
 * Gets the screenshot of this page.
 * @private
 */
bite.client.console.NewBug.prototype.getScreenshot_ = function() {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.GET_SCREENSHOT},
      goog.bind(this.getScreenshotCallback_, this));
};


/**
 * Callback function to call after the current page's screenshot was captured.
 * @param {string} dataUrl The data URL string.
 * @private
 */
bite.client.console.NewBug.prototype.getScreenshotCallback_ =
    function(dataUrl) {
  this.container_.show();
  var container = goog.dom.getElement('bite-nbg-screenshot');
  this.screenshotCheckbox_ = container.querySelector(goog.dom.TagName.INPUT);
  this.screenshotCheckbox_.checked = true;
  this.screenshot_ = dataUrl;
  goog.events.listen(container, goog.events.EventType.CLICK,
      goog.bind(this.showScreenshotHandler_, this));
};


/**
 * Shows the captured screenshot data.
 * @param {Event} event Event data.
 * @private
 */
bite.client.console.NewBug.prototype.showScreenshotHandler_ = function(event) {
  var label = 'SUCCESS';
  var text = 'ShowNewBugScreenshot';
  if (event.target != this.screenshotCheckbox_) {
    goog.global.open(this.screenshot_);
  } else {
    label = 'NEW_VALUE: ' + this.screenshotCheckbox_.checked;
    text = 'ToggleNewBugScreenshotCheckbox';
  }
  bite.client.console.NewBug.logEvent_(text, label);
};


/**
 * Allows the user to select a different UI element.
 * @private
 */
bite.client.console.NewBug.prototype.replaceElement_ = function() {
  var replace = this.container_.getRoot().querySelector('#replace');
  var replaceText = goog.dom.getFirstElementChild(replace);

  // RecordModeManager highlights items that the mouse hovers over until one
  // is clicked, then calls its callback on that element.
  if (!this.recordModeManager_) {
    this.recordModeManager_ = new common.client.RecordModeManager();
  }
  if (this.recordModeManager_.isRecording()) {
    // If the user clicks 'replace' again, cancel the selection process.
    replaceText.innerHTML = 'replace';
    this.recordModeManager_.exitRecordingMode();
    this.initializeHighlightBox_();
    this.showJson_();
  } else {
    replaceText.innerHTML = 'cancel';
    this.showTargetElement_('Select a new UI element');
    // Remove the current highlight box.
    goog.dom.removeNode(this.pingDiv_);
    this.pingDiv_ = null;
    this.recordModeManager_.enterRecordingMode(
        goog.bind(this.replaceSelectedElement_, this));
  }
};


/**
 * Replaces the selected UI element.
 * @param {Element} elem The new element.
 * @private
 */
bite.client.console.NewBug.prototype.replaceSelectedElement_ = function(elem) {
  if (!this.recordModeManager_.isRecording()) {
    return;
  }
  var replace = this.container_.getRoot().querySelector('#replace');
  var replaceText = goog.dom.getFirstElementChild(replace);
  replaceText.innerHTML = 'replace';
  this.recordModeManager_.exitRecordingMode();

  // Don't select items from the newbug console.
  var console = goog.dom.getElement('bite-newbug-console');
  if (!goog.dom.contains(console, elem)) {
    this.selectedElement_ = elem;
  }

  this.initializeHighlightBox_();
  this.showJson_();
};


/**
 * Initializes the div that highlights the selected element.
 * @private
 */
bite.client.console.NewBug.prototype.initializeHighlightBox_ = function() {
  if (this.selectedElement_) {
    this.pingDiv_ = goog.dom.createDom(goog.dom.TagName.DIV, {
      'id' : 'bite-nbg-highlight-box',
      'style' : 'position:absolute;'
    });
    goog.dom.appendChild(goog.global.document.body, this.pingDiv_);
    this.updateHighlightBoxPosition_();
  }
};


/**
 * Updates the position of the highlight box to be that of the currently
 * selected element.
 * @private
 */
bite.client.console.NewBug.prototype.updateHighlightBoxPosition_ = function() {
  var elem = this.selectedElement_;
  goog.style.setPosition(this.pingDiv_, goog.style.getPageOffset(elem));
  goog.style.setSize(this.pingDiv_, goog.style.getSize(elem));
};


/**
 * Highlights the selected element briefly.
 * @private
 */
bite.client.console.NewBug.prototype.pingElementOn_ = function() {
  goog.dom.classes.add(this.pingDiv_, 'bite-nbg-emphasis');
  goog.Timer.callOnce(goog.bind(this.pingElementOff_, this), 1000);
};


/**
 * Turns off highlighting of the selected element.
 * @private
 */
bite.client.console.NewBug.prototype.pingElementOff_ = function() {
  goog.dom.classes.remove(this.pingDiv_, 'bite-nbg-emphasis');
};


/**
 * Handles selection changing the templates dropdown.
 * @private
 */
bite.client.console.NewBug.prototype.changeTemplateHandler_ = function() {
  var selectedIndex = this.templatesList_.selectedIndex;
  var selectedTemplate = this.templatesList_.options[selectedIndex].value;

  var notes = this.templates_[selectedTemplate].noteText;
  this.notesTextArea_.value = notes;
};


/**
 * Takes a button Element and styles it as pressed or not pressed
 * according to the parameter 'pressed'.
 * @param {Element} button The button to style.
 * @param {boolean} pressed Whether or not the element should be pressed.
 * @private
 */
bite.client.console.NewBug.prototype.stylePressedButton_ =
    function(button, pressed) {
  if (pressed) {
    goog.dom.classes.add(button, 'bite-pressed');
  } else {
    goog.dom.classes.remove(button, 'bite-pressed');
  }
};


/**
 * Shows outerHTML of the selected element in the UI tab of New Bug.
 * @private
 */
bite.client.console.NewBug.prototype.showOuterHtml_ = function() {
  var outerHtml =
      common.client.ElementDescriptor.generateOuterHtml(
          this.selectedElement_);
  this.showTargetElement_(outerHtml);
  var json = this.container_.getRoot().querySelector('#json');
  var html = this.container_.getRoot().querySelector('#html');
  this.stylePressedButton_(json, false);
  this.stylePressedButton_(html, true);
};


/**
 * Shows JSON of the selected element in the UI tab of New Bug.
 * @private
 */
bite.client.console.NewBug.prototype.showJson_ = function() {
  var descriptor =
      common.client.ElementDescriptor.generateElementDescriptorNAncestors(
          this.selectedElement_, 3);
  this.showTargetElement_(descriptor);
  var json = this.container_.getRoot().querySelector('#json');
  var html = this.container_.getRoot().querySelector('#html');
  this.stylePressedButton_(json, true);
  this.stylePressedButton_(html, false);
};


/**
 * Public function to clean up the console.
 */
bite.client.console.NewBug.prototype.cancel = function() {
  this.cancelHandler_();
};


/**
 * Cancels the console.
 * @private
 */
bite.client.console.NewBug.prototype.cancelHandler_ = function() {
  this.destroyrootElement_();
  this.cleanUp_();
};


/**
 * Cleans up the listeners for the New Bug Console and calls the doneCallback.
 * @private
 */
bite.client.console.NewBug.prototype.cleanUp_ = function() {
  goog.dom.removeNode(this.pingDiv_);
  this.pingDiv_ = null;
  this.eventHandler_.removeAll();
  this.doneCallback_();
};


/**
 * Submits the New Bug Form.  The first step is to retrieve the server url.
 * @private
 */
bite.client.console.NewBug.prototype.submitHandler_ = function() {
  var request = {action: Bite.Constants.HUD_ACTION.GET_SERVER_CHANNEL};
  chrome.extension.sendRequest(request,
                               goog.bind(this.submitHandlerSend_, this));
};


/**
 * Finishes the submission of a new bug after receiving the server url.
 * @param {string} url The server url.
 * @private
 */
bite.client.console.NewBug.prototype.submitHandlerSend_ = function(url) {
  // Extract data for the new bug.
  var selectedIndex = this.templatesList_.selectedIndex;
  var selectedTemplate = this.templatesList_.options[selectedIndex].value;
  var title = this.titleTextArea_.value;
  if (!title) {
    alert('Title is required');
    return;
  }

  var details = this.templates_[selectedTemplate];
  var project = details.backendProject;
  var provider = details.backendProvider;
  var notes = this.notesTextArea_.value;
  var server = url;
  var postUrl = new goog.Uri(server);
  postUrl.setPath('/bugs/new');

  var descriptor =
      common.client.ElementDescriptor.generateElementDescriptorNAncestors(
          this.selectedElement_, 3);

  var label = '';
  var screenshot = null;
  if (this.screenshotCheckbox_.checked) {
    screenshot = this.screenshot_;
    label = 'SELECTED';
  } else {
    label = 'NOT_SELECTED';
  }
  bite.client.console.NewBug.logEvent_('SubmitNewBugScreenshot', label);

  // Construct new bug data and send a post to the server.
  var data = {
    'provider': provider,
    'project': project,
    'title': title,
    'repro': notes,
    'url': this.url_,
    'target_element': descriptor,
    'recording_link': this.recordingLink_,
    'version': goog.userAgent.VERSION
  };
  if (screenshot) {
    data['screenshot'] = screenshot;
  }

  // TODO(jasonstredwick): Change how new bugs are submitted so the dialog
  // remains open but uneditable until the result of the save is resolved.
  // Then once resolved correctly, close the popup.  Otherwise, post an error
  // message, handle the situation, and allow them the chance to submit again.
  var responseHandler = function(success, url) {
    if (success) {
      goog.global.window.open(url);
    }
  };
  var parameters = goog.Uri.QueryData.createFromMap(data).toString();
  bite.common.net.xhr.async.post(postUrl.toString(), parameters,
                                 responseHandler);

  // Inform the other bug related consoles that they need to update.
  chrome.extension.sendRequest({action: Bite.Constants.HUD_ACTION.UPDATE_DATA});

  // Record success and clean up console.
  label = 'SUCCESS: New Bug submitted to project ' + project + '.';
  bite.client.console.NewBug.logEvent_('SubmitNewBug', label);

  this.destroyrootElement_();
  this.cleanUp_();
};


/**
 * Sets New Bug Form handlers.
 * @private
 */
bite.client.console.NewBug.prototype.setConsoleHandlers_ = function() {
  var cancelLink = goog.dom.getElementByClass('bite-close-button',
                                              this.container_.getRoot());
  this.eventHandler_.listen(cancelLink,
                            goog.events.EventType.CLICK,
                            goog.bind(this.cancelHandler_, this));

  var finishLink = this.container_.getRoot().querySelector('#bite-nbg-submit');
  this.eventHandler_.listen(finishLink,
                            goog.events.EventType.CLICK,
                            goog.bind(this.submitHandler_, this));

  // Handler for the template list.
  if (this.templatesList_) {
    this.eventHandler_.listen(this.templatesList_,
                              goog.events.EventType.CHANGE,
                              goog.bind(this.changeTemplateHandler_, this));
  }

  var recordingTab =
      this.container_.getRoot().querySelector('td.bite-nbg-recording-tab');
  this.eventHandler_.listen(recordingTab,
                            goog.events.EventType.CLICK,
                            goog.bind(this.changeTabHandler_, this,
                                bite.client.console.NewBug.Tab_.RECORDING));

  var overviewTab =
      this.container_.getRoot().querySelector('td.bite-nbg-overview-tab');
  this.eventHandler_.listen(overviewTab,
                            goog.events.EventType.CLICK,
                            goog.bind(this.changeTabHandler_, this,
                                bite.client.console.NewBug.Tab_.OVERVIEW));

  var uiTab = this.container_.getRoot().querySelector('td.bite-nbg-ui-tab');
  this.eventHandler_.listen(uiTab,
                            goog.events.EventType.CLICK,
                            goog.bind(this.changeTabHandler_, this,
                                      bite.client.console.NewBug.Tab_.UI));

  // Handler for readable recorded script in Recording tab.
  var readable = this.container_.getRoot().querySelector('#readable');
  if (readable) {
    this.eventHandler_.listen(readable,
                              goog.events.EventType.CLICK,
                              goog.bind(this.showRecordingScriptReadable_,
                                        this))
  }

  // Handler for not human readable recorded script in Recording tab.
  var code = this.container_.getRoot().querySelector('#code');
  if (code) {
    this.eventHandler_.listen(code,
                              goog.events.EventType.CLICK,
                              goog.bind(this.showRecordingScriptCode_, this));
  }

  // Handler for play button in Recording tab.
  var play = this.container_.getRoot().querySelector('#play');
  if (play) {
    this.eventHandler_.listen(play,
                              goog.events.EventType.CLICK,
                              goog.bind(this.playRecordingScript_, this));
  }

  // Handler for outerHTML representation of target element in UI tab.
  var html = this.container_.getRoot().querySelector('#html');
  if (html) {
    this.eventHandler_.listen(html,
                              goog.events.EventType.CLICK,
                              goog.bind(this.showOuterHtml_, this));
  }

  // Handler for JSON representation of target element in UI tab.
  var json = this.container_.getRoot().querySelector('#json');
  if (json) {
    this.eventHandler_.listen(json,
                              goog.events.EventType.CLICK,
                              goog.bind(this.showJson_, this));
  }

  // Handler for replacing the target element in UI tab.
  var replace = this.container_.getRoot().querySelector('#replace');
  if (replace) {
    this.eventHandler_.listen(replace,
                              goog.events.EventType.CLICK,
                              goog.bind(this.replaceElement_, this));
  }

  // Handler for identifying the target element in UI tab.
  var ping = this.container_.getRoot().querySelector('#ping');
  if (ping) {
    this.eventHandler_.listen(ping,
                              goog.events.EventType.CLICK,
                              goog.bind(this.pingElementOn_, this));
  }
};


/**
 * Destroys console's root element.
 * @private
 */
bite.client.console.NewBug.prototype.destroyrootElement_ = function() {
  this.container_.remove();
  this.templatesList_ = null;
  this.container_ = null;
};


/**
 * Shows the recording script in readable form.
 * @private
 */
bite.client.console.NewBug.prototype.showRecordingScriptReadable_ = function() {
  this.showRecordingScript_(this.recordingReadable_);
  var codeButton = this.container_.getRoot().querySelector('#code');
  var readableButton = this.container_.getRoot().querySelector('#readable');
  this.stylePressedButton_(codeButton, false);
  this.stylePressedButton_(readableButton, true);
};


/**
 * Shows the recording script in code form.
 * @private
 */
bite.client.console.NewBug.prototype.showRecordingScriptCode_ = function() {
  this.showRecordingScript_(this.recordingScript_);
  var codeButton = this.container_.getRoot().querySelector('#code');
  var readableButton = this.container_.getRoot().querySelector('#readable');
  this.stylePressedButton_(codeButton, true);
  this.stylePressedButton_(readableButton, false);
};


/**
 * Shows recorded script in Recording tab of New Bug Form.
 * @param {?string} script The recorded script.
 * @private
 */
bite.client.console.NewBug.prototype.showRecordingScript_ = function(script) {
  if (!this.recordingScript_) {
    script = 'No recording has been captured for this page.';
  }
  script = bite.console.Helper.getDocString(
      goog.global.location.hostname,
      this.user_ ? this.user_ : 'rpf') + script;
  this.recordingTextArea_.value = script;
};


/**
 * Plays recorded script from Recording tab in New Bug Form.
 * @private
 */
bite.client.console.NewBug.prototype.playRecordingScript_ = function() {
  if (!this.recordingScript_) {
    alert('No script recorded');
    return;
  }
  chrome.extension.sendRequest(
    {'command': Bite.Constants.CONSOLE_CMDS.CHECK_PLAYBACK_OPTION_AND_RUN,
     'params': {'method': Bite.Constants.PlayMethods.ALL,
                'startUrl': 'http://maps.google.com',
                'scripts': this.recordingScript_,
                'datafile': this.recordingData_,
                'infoMap': this.recordingInfoMap_,
                'preparationDone': false,
                'userLib': '',
                'needOverride': '',
                'noConsole': true}});
};


/**
 * Shows outerHTML or JSON descriptor of target element in UI tab of New Bug
 * Form.
 * @param {?string} descriptor The outerHTML or JSON descriptor of target
 *     element.
 * @private
 */
bite.client.console.NewBug.prototype.showTargetElement_ = function(descriptor) {
  this.uiTextArea_.value = descriptor;
};


/**
 * Highlights selected tab's title in New Bug Form.
 * @param {Element} newBugFormTabElmt The tab title element in
 *     New Bug Form (Overview, UI, Recording, etc.).
 * @param {boolean} selected Whether the corresponding tab is selected.
 * @private
 */
bite.client.console.NewBug.prototype.highlightTabTitle_ = function(
    newBugFormTabElmt, selected) {
  if (selected) {
    goog.dom.classes.swap(newBugFormTabElmt,
                          'bite-navbar-item-inactive',
                          'bite-navbar-item-active');
  } else {
    goog.dom.classes.swap(newBugFormTabElmt,
                          'bite-navbar-item-active',
                          'bite-navbar-item-inactive');
  }
};


/**
 * Changes tabs in New Bug Console.
 * @param {?bite.client.console.NewBug.Tab_} selectedTab The selected tab in
 *     New Bug Form (Overview, Recording, etc.).
 * @private
 */
bite.client.console.NewBug.prototype.changeTabHandler_ = function(
    selectedTab) {
  var consoleToolbar =
      this.container_.getRoot().querySelector('div.bite-console-toolbar');
  soy.renderElement(consoleToolbar,
                    bite.client.console.NewBugTemplate.getConsoleToolbar,
                    {selectedTab: selectedTab});

  // Shows contents of selected tab, and hides contents of other tabs in New
  // Bug Form.
  var recordingTabContents =
      this.container_.getRoot().querySelector('div.bite-nbg-recording-data');
  var overviewTabContents =
      this.container_.getRoot().querySelector('div.bite-nbg-overview-data');
  var uiTabContents =
      this.container_.getRoot().querySelector('div.bite-nbg-ui-data');
  var isOverviewTab = selectedTab == bite.client.console.NewBug.Tab_.OVERVIEW;
  var isUITab = selectedTab == bite.client.console.NewBug.Tab_.UI;
  var isRecordingTab =
      selectedTab == bite.client.console.NewBug.Tab_.RECORDING;

  goog.style.showElement(overviewTabContents, false);
  goog.style.showElement(uiTabContents, false);
  goog.style.showElement(recordingTabContents, false);

  var message = '';
  var messageId = '';

  if (isOverviewTab) {
    message = 'Fill out a description of the bug and a title. Explore the ' +
        'other tabs for additional options, and click Bug it! when finished.';
    messageId = 'newbug-overview-intro';
    goog.style.showElement(overviewTabContents, true);
  } else if (isRecordingTab) {
    message = 'If automatic recording is turned on, a playback of your ' +
        'actions will be displayed here. Visit the BITE settings to turn on ' +
        'automatic recording.';
    messageId = 'newbug-recording-info';
    goog.style.showElement(recordingTabContents, true);
    this.showRecordingScriptReadable_();
  } else if (isUITab) {
    message = 'Information about the selected UI element is shown here. ' +
        'Click replace to choose a new element, or ping to see the current ' +
        'one.';
    messageId = 'newbug-ui-intro';
    goog.style.showElement(uiTabContents, true);
    this.showJson_();
  }

  this.container_.showInfoMessageOnce(messageId, message);

  // Highlights selected tab title (in blue), and removes blue selection from
  // other tab titles in New Bug Form.
  var recordingTabElmt =
      this.container_.getRoot().querySelector('td.bite-nbg-recording-tab');
  var uiTabElmt = this.container_.getRoot().querySelector('td.bite-nbg-ui-tab');
  var overviewTabElmt =
      this.container_.getRoot().querySelector('td.bite-nbg-overview-tab');
  this.highlightTabTitle_(overviewTabElmt, isOverviewTab);
  this.highlightTabTitle_(uiTabElmt, isUITab);
  this.highlightTabTitle_(recordingTabElmt, isRecordingTab);

  this.eventHandler_.removeAll();
  this.setConsoleHandlers_();
};


/**
 * Loads the New Bug console.
 * @param {Element} selectedElement Element the bug is related to.
 * @param {string} server The current server url.
 * @param {!Object.<string, bite.client.BugTemplate>} templates The list of
 *     templates to show.
 * @param {?string} opt_template The id of the initial template to show.
 * @param {?string} opt_recordingLink The link to recorded script.
 * @param {?string} opt_recordingScript The recorded script.
 * @param {?string} opt_recordingReadable The recorded script in human readable
 *     format.
 * @param {?string} opt_recordingData The recorded data (e.g. when user types).
 * @param {Object=} opt_recordingInfoMap The info map for the recordings.
 */
bite.client.console.NewBug.prototype.show = function(
    selectedElement, server, templates, opt_template, opt_recordingLink,
    opt_recordingScript, opt_recordingReadable, opt_recordingData,
    opt_recordingInfoMap) {
  this.selectedElement_ = selectedElement;
  this.initializeHighlightBox_();

  var template = opt_template || '';
  this.templates_ = templates;
  this.url_ = this.getCurrentUrl_();


  this.container_ = new bite.ux.Container(server,
                                          'bite-newbug-console',
                                          'New Bug', 'File a new bug',
                                          false, true);
  var templatesByProject = bite.client.TemplateManager.getTemplatesByProject(
      this.templates_);
  this.container_.setContentFromHtml(
      bite.client.console.NewBugTemplate.newBugConsole(
          {rootFolder: this.rootFolder_,
           projects: templatesByProject}));

  this.titleTextArea_ =
      this.container_.getRoot().querySelector('#bite-nbg-title');
  this.templatesList_ = this.templatesList_ ? this.templatesList_ :
      this.container_.getRoot().querySelector('#bite-nbg-templates');
  this.notesTextArea_ =
      this.container_.getRoot().querySelector('#bite-nbg-notes');
  this.uiTextArea_ =
      this.container_.getRoot().querySelector('#bite-nbg-ui-text');
  this.recordingTextArea_ =
      this.container_.getRoot().querySelector('#bite-nbg-recording-text');

  this.setConsoleHandlers_();

  if (!template || template == 'default') {
    template = 'bite_default_bug';
  }

  this.recordingLink_ = opt_recordingLink || '';
  this.recordingScript_ = opt_recordingScript || '';
  this.recordingReadable_ = opt_recordingReadable || '';
  this.recordingData_ = opt_recordingData || '';
  this.recordingInfoMap_ = opt_recordingInfoMap || {};

  var newTemplate = this.templatesList_.querySelector(
      '[value=' + template + ']');
  newTemplate.selected = 'true';
  this.changeTabHandler_(bite.client.console.NewBug.Tab_.OVERVIEW);
  this.changeTemplateHandler_();

  // Wait for the screen to refresh and show the highlighted element before
  // taking a screenshot.
  goog.Timer.callOnce(goog.bind(this.getScreenshot_, this), 10);
};

