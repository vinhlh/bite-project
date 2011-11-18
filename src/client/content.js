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
 * Heads-up Display content script.
 *
 * @author alexto@google.com (Alexis O. Torres)
 */


goog.provide('bite.client.Content');

goog.require('Bite.Constants');
goog.require('bite.bugs.filter');
goog.require('bite.client.BugOverlay');
goog.require('bite.client.BugsConsole');
goog.require('bite.client.ElementMapper');
goog.require('bite.client.ElementSelector');
goog.require('bite.client.Templates');
goog.require('bite.client.TestsConsole');
goog.require('bite.client.console.NewBug');
goog.require('bite.client.console.NewBugTypeSelector');
goog.require('bite.console.Helper');
goog.require('bite.console.Screenshot');
goog.require('bite.options.constants');
goog.require('common.client.ElementDescriptor');
goog.require('goog.Timer');
goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.dom.classes');
goog.require('goog.json');
goog.require('goog.math');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('goog.userAgent.jscript');
goog.require('goog.userAgent.platform');



/**
 * Content script class.
 * @constructor
 * @export
 */
bite.client.Content = function()  {
  /**
   * Whether or not the current page is in the list of pages we should
   * autorecord.
   * @type {boolean}
   * @private
   */
  this.isAutoRecordPage_ = this.isAutoRecordUrl_(goog.global.location.href);

  /**
   * Whether or not RPF should automatically begin recording.
   * @type {boolean}
   * @private
   */
  this.autoRecord_ = false;

  /**
   * The manager for the overlay.
   * @type {bite.client.BugOverlay}
   * @private
   */
  this.bugOverlay_ = null;

  /**
   * Manager of the Bugs Console.
   * @type {bite.client.BugsConsole}
   * @private
   */
  this.bugsConsole_ = null;

  /**
   * Manager of the Test Console.
   * @type {bite.client.TestsConsole}
   * @private
   */
  this.testsConsole_ = null;

  /**
   *  Monitors the viewport (window).
   * @type {!goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.biteViewportSizeMonitor_ = new goog.dom.ViewportSizeMonitor();

  /**
   * Manages selecting a new UI element when reporting a new bug from the page.
   * @type {bite.client.ElementSelector}
   * @private
   */
  this.elementSelector_ = null;

  /**
   * Buffer for recorded script string.
   * @type {string}
   * @private
   */
  this.recordingScript_ = '';

  /**
   * Buffer for the recorded script in human readable format.
   * @type {string}
   * @private
   */
  this.recordingReadable_ = '';

  /**
   * Buffer for special recorded data (e.g. while while types).
   * @type {string}
   * @private
   */
  this.recordingData_ = '';

  /**
   * The screenshot manager instance.
   * @type {bite.console.Screenshot}
   * @private
   */
  this.screenshotMgr_ = new bite.console.Screenshot();

  /**
   * Buffer for recorded script's info map.
   * @type {Object}
   * @private
   */
  this.recordingInfoMap_ = {};

  /**
   * Whether it's currently in the state of recording user actions.
   * @type {boolean}
   * @private
   */
  this.isRecordingActions_ = false;

  /**
   * Whether a new bug is currently being filed.
   * @type {boolean}
   * @private
   */
  this.isFilingNewBug_ = false;

  /**
   * The console for selecting the type of a new bug.
   * @type {bite.client.console.NewBugTypeSelector}
   * @private
   */
  this.newBugTypeSelector_ = null;

  /**
   * The url of the current server channel.
   * @type {string}
   * @private
   */
  this.serverChannel_ = '';

  /**
   * Retrieve the settings and current user info.
   */
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.GET_SETTINGS},
      goog.bind(this.handleSettings_, this, goog.nullFunction));

  // Add a listener for window resizes.
  goog.events.listen(this.biteViewportSizeMonitor_,
                     goog.events.EventType.RESIZE,
                     goog.bind(this.windowResizeHandler_, this));

  // Add a listener for keyboard shortcuts.
  goog.events.listen(goog.global.document.body,
                     goog.events.EventType.KEYDOWN,
                     goog.bind(this.shortcutHandler_, this));
};


/**
 * Element seleted while logging a new bug or dragging an exising
 * bug in to the right context.
 * @type {Element}
 * @private
 */
bite.client.Content.prototype.selectedElement_ = null;


/**
 * @type {?bite.client.console.NewBug}
 * @private
 */
bite.client.Content.prototype.newBugConsole_ = null;


/**
 * Id of the bug template to show when the new bug console is shown.
 * @type {string}
 * @private
 */
bite.client.Content.prototype.newBugTemplateId_ = '';


/**
 * Bugs data.
 * @type {Object}
 * @private
 */
bite.client.Content.prototype.bugs_ = null;


/**
 * Bug data filters.
 * @type {Object}
 * @private
 */
bite.client.Content.prototype.bugFilters_ = null;


/**
 * User email.
 * @type {?string}
 * @private
 */
bite.client.Content.prototype.user_ = null;


/**
 * Buffer for the link to recorded script in json format.
 * @type {?string}
 * @private
 */
bite.client.Content.prototype.recordingLink_ = null;


/**
 * Handles the response from the retrieving the settings.
 * @param {?function(string)} callback A method to callback with retrieved url.
 * @param {Object} settings The settings data. This is a mapping of option
 *     ids in bite.options.constants.Id to their values.
 * @private
 */
bite.client.Content.prototype.handleSettings_ = function(callback, settings) {
  this.serverChannel_ = settings[bite.options.constants.Id.SERVER_CHANNEL];
  if (settings[bite.options.constants.Id.AUTO_RECORD] == 'true') {
    this.autoRecord_ = true;
  } else {
    this.autoRecord_ = false;
  }

  if (callback) {
    callback(this.serverChannel_);
  }

  // To enable stand-alone bug filing (without the Bugs console), and Maps
  // specific features get the user's info and then finish initializing.
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.GET_CURRENT_USER},
      goog.bind(this.getCurrentUser_, this,
                goog.bind(this.constructorCallback_, this)));
};


/**
 * Callback function to finish initializing this class. Begins auto-recording
 * if the page url matches those for automatic recording.
 * @private
 */
bite.client.Content.prototype.constructorCallback_ = function() {
  if (this.isAutoRecordPage_ && this.autoRecord_) {
    this.overrideBiteInstallLink_();
    this.startRecording_();
  }
};


bite.client.Content.prototype.shortcutHandler_ = function(e) {
  if (e.ctrlKey && e.altKey) {
    if (e.keyCode == Bite.Constants.KeyCodes.B_KEY) {
      this.startNewBugHandler_();
    }
  }
};


/**
 * Sets the template id that the New Bug console will use as its default.
 * @param {string} template The id of the new template.
 */
bite.client.Content.prototype.setNewBugTemplateId = function(template) {
  this.newBugTemplateId_ = template;
};


/**
 * Overrides the BITE Install button link if it is on the website.
 * Clicking on the link when BITE is installed will open the New Bug
 * console.
 *
 * @private
 */
bite.client.Content.prototype.overrideBiteInstallLink_ = function() {
  var biteInstallButton = goog.dom.getElement('bite-install-link');
  if (biteInstallButton) {
    goog.dom.setProperties(biteInstallButton,
                           {'href': 'javascript: void(0)',
                            'id': 'bite-already-installed-link'});
    goog.events.removeAll(biteInstallButton);
    goog.events.listen(biteInstallButton, goog.events.EventType.CLICK,
                       goog.bind(this.startNewBugHandler_, this));
  }

  // The code below supports the version of maps without the bite install link.
  var bugReport = goog.dom.getElement('bugreport');
  if (!bugReport) {
    return;
  }
  var link = goog.dom.getFirstElementChild(bugReport);
  if (!link) {
    return;
  }
  goog.dom.setProperties(link, {'href': 'javascript: void(0)'});
  goog.events.removeAll(link);
  goog.events.listen(link, goog.events.EventType.CLICK,
                     goog.bind(this.startNewBugHandler_, this));
};


/**
 * Gets current user's email address.
 * @param {function()} callback The callback to invoke.
 * @param {{success: boolean, username: string, url: string}} responseObj
 *     An object that contains the login or logout url and optionally
 *     the username of the user.
 * @private
 */
bite.client.Content.prototype.getCurrentUser_ =
    function(callback, responseObj) {
  if (!responseObj['success']) {
    console.warn('Error checking login status.');
  } else {
    this.user_ = responseObj['username'];
  }
  callback();
};


/**
 * Notify the user that they can't perform that action without logging in.
 * @private
 */
bite.client.Content.prototype.createLoginErrorMessage_ = function() {
  alert('You must be logged in to perform that action. \n' +
        'Please log in at ' + this.serverChannel_ + ' and try again.');
};


/**
 * Returns whether or not a given url is in the list of urls that should
 * trigger automatic recording.
 * @param {string} url The url to check.
 * @return {boolean} True if the url should trigger automatic recording.
 * @private
 */
bite.client.Content.prototype.isAutoRecordUrl_ = function(url) {
  var uri = new goog.Uri(url);
  var urls = Bite.Constants.AUTO_RECORD_URLS;
  for (var i = 0; i < urls.length; ++i) {
    if (goog.string.caseInsensitiveCompare(uri.getDomain(), urls[i]) == 0) {
      return true;
    }
  }
  return false;
};


/**
 * Automatically starts recording user actions on a page
 * (with no rpf Console UI constructed).
 * @private
 */
bite.client.Content.prototype.startRecording_ = function() {
  this.isRecordingActions_ = true;
  chrome.extension.sendRequest(
      {'command': Bite.Constants.CONSOLE_CMDS.SET_TAB_AND_START_RECORDING,
       'params': {'url': '',
                  'noConsole': true}});
  bite.client.Content.logEvent_('StartedRecording', '');
};


/**
 * Stops recording user actions on a pagea and saves the test script on
 * the web.
 * @private
 */
bite.client.Content.prototype.stopRecording_ = function() {
  if (!this.isRecordingActions_) {
    return;
  }
  chrome.extension.sendRequest(
      {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});
  bite.client.Content.logEvent_('StoppedRecording', '');
  var datafile = bite.console.Helper.appendInfoMap(
      this.recordingInfoMap_, this.recordingData_);
  chrome.extension.sendRequest(
      {'command': Bite.Constants.CONSOLE_CMDS.UPDATE_ON_WEB,
       'params': {'testName': 'name',
                  'startUrl': goog.global.location.href,
                  'scripts': this.recordingScript_,
                  'datafile': datafile,
                  'userLib': '',
                  'projectName': 'project',
                  'screenshots': '',
                  'needOverride': '',
                  'noConsole': true}});
  bite.client.Content.logEvent_('SavedRecording', '');
  this.isRecordingActions_ = false;
};


/**
 * Static method used to instrument the usage of BITE's content script.
 * @param {string} action The action to log.
 * @param {string} label Additional details related to the action to log.
 * @private
 */
bite.client.Content.logEvent_ = function(action, label) {
  chrome.extension.sendRequest({'action': Bite.Constants.HUD_ACTION.LOG_EVENT,
                                'category': Bite.Constants.TestConsole.NONE,
                                'event_action': action,
                                'label': label});
};


/**
 * Called when the window resizes and updates BITE features that need it.
 * @private
 */
bite.client.Content.prototype.windowResizeHandler_ = function() {
  // Update bug overlay.
  if (this.bugOverlay_ && this.bugOverlay_.bugOverlayOn()) {
    this.bugOverlay_.render();
  }
};


/**
 * Removes the console element from the page.
 * @private
 */
bite.client.Content.prototype.removeAllConsoles_ = function() {
  if (this.bugsConsole_) {
    this.bugsConsole_.removeConsole();
    this.bugsConsole_ = null;
  }
  if (this.testsConsole_) {
    this.testsConsole_.removeConsole();
    this.testsConsole_ = null;
  }
  if (this.newBugConsole_) {
    this.newBugConsole_.cancel();
    this.newBugConsole_ = null;
  }
};

// TODO(ralphj): Add a function to just hide the consoles.


/**
 * Starts the process of filing a new bug. Begins by checking if the user is
 * logged in.
 * @private
 */
bite.client.Content.prototype.startNewBugHandler_ = function() {
  if (!this.user_) {
    // Try getting the current user one more time.
    var callback = goog.bind(this.startNewBug_, this);
    chrome.extension.sendRequest(
        {'action': Bite.Constants.HUD_ACTION.GET_CURRENT_USER},
        goog.bind(this.getCurrentUser_, this, callback));
    return;
  }
  this.startNewBug_();
};


/**
 * Begins filing a new bug. The first step is to show the New Bug Type
 * Selector. If the current page does not have any Bug Template options,
 * the type selector will automatically move to the next step.
 * @private
 */
bite.client.Content.prototype.startNewBug_ = function() {
  if (!this.user_) {
    this.createLoginErrorMessage_();
    return;
  }
  // Don't start filing a new bug if the process of filing a new bug has
  // already begun.
  if (this.isFilingNewBug_) {
    return;
  }
  this.isFilingNewBug_ = true;
  this.stopRecording_();
  this.removeAllConsoles_();
  if (!this.newBugTypeSelector_) {
    this.newBugTypeSelector_ =
        new bite.client.console.NewBugTypeSelector(
            goog.bind(this.setNewBugTemplateId, this),
            goog.bind(this.toggleReportBug_, this),
            goog.bind(function() {this.isFilingNewBug_ = false;}, this));
  }
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.GET_TEMPLATES,
       url: goog.global.location.href},
       goog.bind(this.newBugTypeSelector_.load, this.newBugTypeSelector_));
};


/**
 * Toggles the visibility of the Bugs console.
 * @private
 */
bite.client.Content.prototype.toggleBugs_ = function() {
  if (this.bugsConsole_) {
    if (this.bugsConsole_.isConsoleVisible()) {
      this.bugsConsole_.hideConsole();
    } else {
      this.bugsConsole_.showConsole();
    }
  } else {
    this.loadBugsConsole();
  }
};


/**
 * Toggles the visibility of the Tests console.
 * @private
 */
bite.client.Content.prototype.toggleTests_ = function() {
  if (this.testsConsole_) {
    if (this.testsConsole_.isConsoleVisible()) {
      this.testsConsole_.hideConsole();
    } else {
      this.testsConsole_.showConsole();
    }
  } else {
    this.loadTestsConsole();
  }
};


/**
 * Handles when the New Bug console is done (it is cancelled or a new bug is
 * logged using it).
 * @private
 */
bite.client.Content.prototype.newBugConsoleDoneHandler_ = function() {
  this.newBugConsole_ = null;
  this.isFilingNewBug_ = false;
};


/**
 * Handles loading/showing the New Bug console.
 * @private
 */
bite.client.Content.prototype.loadNewBugConsole_ = function() {
  if (!this.newBugConsole_) {
    var callback = goog.bind(this.newBugConsoleDoneHandler_, this);
    this.newBugConsole_ = new bite.client.console.NewBug(this.user_, callback);
  }

  // The console will not be displayed until the template list is retrieved.
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.GET_TEMPLATES},
      goog.bind(this.finishLoadNewBugConsole_, this));
};


/**
 * Finishes loading the New Bug Console by displaying it to the user.
 * @param {!Object.<string, bite.client.BugTemplate>} templates The templates to
 *     show.
 * @private
 */
bite.client.Content.prototype.finishLoadNewBugConsole_ = function(templates) {
  this.newBugConsole_.show(this.selectedElement_,
                           this.serverChannel_,
                           templates,
                           this.newBugTemplateId_,
                           this.recordingLink_,
                           this.recordingScript_,
                           this.recordingReadable_,
                           this.recordingData_,
                           this.recordingInfoMap_);
};


/**
 * Toggles Report a bug recording mode.
 * @private
 */
bite.client.Content.prototype.toggleReportBug_ = function() {
  if (!this.elementSelector_) {
    this.elementSelector_ = new bite.client.ElementSelector(
        goog.bind(function() {this.isFilingNewBug_ = false;}, this));
  }
  var label = 'IS_RECORDING: ' + this.elementSelector_.isActive();
  bite.client.Content.logEvent_('ToggleReportBug', label);
  if (this.elementSelector_.isActive()) {
    this.elementSelector_.cancelSelection();
  } else if (this.user_) {
    // Only enter recording mode if the user is logged in.
    this.removeAllConsoles_();
    this.elementSelector_.startRecording(
        goog.bind(this.endReportBugHandler_, this));
  }
};


/**
 * Refreshes the UI to reflect any changes in bug data.
 * @private
 */
bite.client.Content.prototype.refreshBugConsoleUI_ = function() {
  bite.bugs.filter(this.bugs_, this.bugFilters_);
  if (this.bugsConsole_) {
    this.bugsConsole_.updateData(this.bugs_, this.user_, this.serverChannel_);
  }
};


/**
 * Returns a bug with a specified id.
 * @param {string} id The id of the bug to look up.
 * @return {?Object} A dictionary of the Bug data elements, or
 *     null if a matching bug wasn't found.
 * @private
 */
bite.client.Content.prototype.getBugData_ = function(id) {
  for (var i = 0; i < this.bugs_.length; ++i) {
    for (var j = 0, bugs = this.bugs_[i][1]; j < bugs.length; ++j) {
      if (bugs[j]['id'] == id) {
        return bugs[j];
      }
    }
  }
  return null;
};


/**
 * Gets the link to recorded and saved test from saveloadmanager.js.
 * @param {!Object.<string, string>} request Object Data sent in the request.
 * @private
 */
bite.client.Content.prototype.getRecordingLink_ = function(request) {
  this.recordingLink_ = request['recording_link'];
};


/**
 * Handles the callback after an element is clicked while logging a new bug.
 * @param {Element} selectedElement Element the user clicked on.
 * @private
 */
bite.client.Content.prototype.endReportBugHandler_ = function(selectedElement) {
  this.selectedElement_ = selectedElement;
  this.loadNewBugConsole_();
};


/**
 * Parses a string containing "###, ###" coordinates.
 * @param {string} coordinates a string containing "###, ###" coordinates.
 * @return {Array} An array of ints with [x, y] coordinates.
 * @private
 */
bite.client.Content.prototype.parseCoordinates_ = function(coordinates) {
  var coordComponents = coordinates.split(',');
  return [parseInt(coordComponents[0], 10), parseInt(coordComponents[1], 10)];
};


/**
 * Updates the bugs data.
 * @param {Object} result Bug data known for the page.
 */
bite.client.Content.prototype.updateBugsData = function(result) {
  this.bugs_ = result['bugs'];
  this.bugFilters_ = result['filters'];
  bite.bugs.filter(this.bugs_, this.bugFilters_);
  if (this.bugsConsole_) {
    this.bugsConsole_.updateData(result['bugs'], this.user_,
                                 this.serverChannel_);
  }
  if (this.bugOverlay_) {
    this.bugOverlay_.updateData(result['bugs']);
  }
};

/**
 * Updates the tests data.
 * @param {Object} result Test data known for the page.
 */
bite.client.Content.prototype.updateTestData =
    function(result) {
  this.user_ = result['user'];

  if (this.testsConsole_) {
    this.testsConsole_.updateData(result['test'], this.user_,
                                  this.serverChannel_);
  }
};


/**
 * Loads the bugs console tab.
 * @export
 */
bite.client.Content.prototype.loadBugsConsole = function() {
  bite.client.Content.fetchBugsData();
  if (!this.bugsConsole_) {
    // Set up the overlay before passing it to the bugs console.
    this.bugOverlay_ = new bite.client.BugOverlay();

    this.bugsConsole_ = new bite.client.BugsConsole(this.user_,
                                                    this.serverChannel_,
                                                    this.bugOverlay_);
  }

  bite.client.Content.logEvent_('Load', 'SET_VISIBLE: ' +
                               this.bugsConsole_.isConsoleVisible());
};


/**
 * Submits a bug recording to the server. This function is going to be used,
 * when updating existing bugs with recording information.
 * @param {Object} bugData a dictionary of the bug data for this binding.
 * @param {string} recording_link The link to recorded steps.
 * @private
 */
bite.client.Content.prototype.submitBugRecording_ = function(
    bugData, recording_link) {
  var requestData = {'action': Bite.Constants.HUD_ACTION.UPDATE_BUG_RECORDING,
                     'project': bugData['project'],
                     'provider': (bugData['provider'] ||
                                  Bite.Constants.Providers.ISSUETRACKER),
                     'id': bugData['id'],
                     'update_action': Bite.Constants.BugRecordingActions.UPDATE,
                     'recording_link': recording_link};

  chrome.extension.sendRequest(requestData);
};


/**
 * Loads the test console tab.
 * @export
 */
bite.client.Content.prototype.loadTestsConsole = function() {
  bite.client.Content.fetchTestData();
  if (!this.testsConsole_) {
    this.testsConsole_ = new bite.client.TestsConsole(this.user_,
                                                      this.serverChannel_);
  }

  bite.client.Content.logEvent_('Load', 'SET_VISIBLE: ' +
                               this.testsConsole_.isConsoleVisible());
};


/**
 * Handles request sent via chrome.extension.sendRequest().
 * @param {!Object.<string, string, Object>} request Object Data sent in
  *    the request.
 * @param {MessageSender} sender An object containing information about the
 *     script context that sent the request.
 * @param {function(!*): void} callback Function to call when the request
 *     completes.
 * @export
 */
bite.client.Content.prototype.onRequest =
    function(request, sender, callback) {

  switch (request['action']) {
    case Bite.Constants.HUD_ACTION.GET_RECORDING_LINK:
      this.getRecordingLink_(request);
      break;
    case Bite.Constants.HUD_ACTION.HIDE_CONSOLE:
      this.removeAllConsoles_();
      break;
    case Bite.Constants.HUD_ACTION.START_NEW_BUG:
      this.startNewBugHandler_();
      break;
    case Bite.Constants.HUD_ACTION.TOGGLE_BUGS:
      this.toggleBugs_();
      break;
    case Bite.Constants.HUD_ACTION.TOGGLE_TESTS:
      this.toggleTests_();
      break;
    case Bite.Constants.HUD_ACTION.UPDATE_DATA:
      bite.client.Content.fetchTestData();
      bite.client.Content.fetchBugsData();
      break;
    case Bite.Constants.UiCmds.ADD_NEW_COMMAND:
      this.recordingScript_ += (request['pCmd'] + '\n\n');
      this.recordingReadable_ += (request['readableCmd'] + '\n\n');
      if (request['dCmd']) {
        this.recordingData_ += (request['dCmd'] + '\n');
      }
      this.screenshotMgr_.addIndex(request['cmdMap']['id']);
      bite.console.Helper.assignInfoMap(
          this.recordingInfoMap_, request['cmdMap']);
      break;
    case Bite.Constants.UiCmds.ADD_SCREENSHOT:
      this.screenshotMgr_.addScreenShot(
          /** @type {string} */ (request['dataUrl']),
          /** @type {string} */ (request['iconUrl']));
      break;
    case bite.options.constants.Message.UPDATE:
      var requestObj = goog.json.parse(request['data'] || '{}');
      this.serverChannel_ = requestObj['serverChannel'];
      this.bugFilters_ = requestObj;
      this.refreshBugConsoleUI_();
      break;
    default:
      goog.global.console.error(
          'Action not recognized: ' + request['action']);
      break;
  }
};


/**
 * An instance of this class.
 * @type {bite.client.Content}
 * @export
 */
bite.client.Content.instance = new bite.client.Content();


/**
 * Send request to background page to fetch tests
 * relevant to the current page.
 * @export
 */
bite.client.Content.fetchTestData = function() {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.FETCH_TEST_DATA,
       target_url: goog.global.location.href},
       goog.bind(bite.client.Content.instance.updateTestData,
                 bite.client.Content.instance));
};


/**
 * Send request to background page to fetch bugs relevant to the
 * current page.
 * @export
 */
bite.client.Content.fetchBugsData = function() {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.FETCH_BUGS_DATA,
       target_url: goog.global.location.href},
      goog.bind(bite.client.Content.instance.updateBugsData,
                bite.client.Content.instance));
};


/**
 * Creates a lock so multiple instances of the content script won't run.
 * @param {string} id the ID of the lock.
 * @export
 */
function createLock(id) {
  var biteLock = goog.dom.createDom(goog.dom.TagName.DIV, {'id': id});

  // Insert the lock element in the document head, to prevent it from
  // inteferring with xpaths in the body.
  goog.dom.appendChild(goog.global.document.head, biteLock);
}

//Create a lock so other instances won't run on top of this one.
createLock(Bite.Constants.BITE_CONSOLE_LOCK);


goog.exportSymbol(
    'bite.client.Content.instance', bite.client.Content.instance);


// Wire up the requests.
chrome.extension.onRequest.addListener(
    goog.bind(bite.client.Content.instance.onRequest,
              bite.client.Content.instance));

