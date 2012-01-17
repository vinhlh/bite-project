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
 * @fileoverview Handles the Bugs console, which displays information about bugs
 * that have already been filed on the domain being explored.
 *
 * TODO (jason.stredwick): Remove user and server from this file.  They are
 * only used to determine if the user is logged in.  Instead just check if the
 * user is logged in or some alternative.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.BugsConsole');

goog.require('bite.client.BugDetailsPopup');
goog.require('bite.client.BugHelper');
goog.require('bite.client.BugOverlay');
goog.require('bite.ux.Container');
goog.require('bite.client.MiniBugPopup');
goog.require('bite.client.Templates');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.ui.AnimatedZippy');
goog.require('soy');



/**
 * Creates a bugs console and displays it on the current page.
 * @param {?string} user The email of the current user.
 * @param {string} server The current server channel.
 * @param {bite.client.BugOverlay} overlay The bug overlay manager.
 * @constructor
 */
bite.client.BugsConsole = function(user, server, overlay) {
  /**
   * The bugs console container.
   * @type {bite.ux.Container}
   * @private
   */
  this.container_ = null;

  /**
   * Manages events on the overlay.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();

  /**
   * The bug overlay associated with this page.
   * @type {bite.client.BugOverlay}
   * @private
   */
  this.bugOverlay_ = overlay;

  /**
   * The bugs data.
   * @type {Object}
   * @private
   */
  this.bugs_ = null;

  this.load_(user, server);
};


/**
 * Bug keys used as label indicators.
 * @enum {string}
 * @private
 */
bite.client.BugsConsole.LabelKey_ = {
  BOUND: 'target_element',
  RECORDING: 'recording_link'
};


/**
 * The key used by bugs to identify label information.
 * @type {string}
 * @private
 */
bite.client.BugsConsole.LABEL_ID_ = 'labels';


/**
 * Label data represent valid keys that are interpretted by soy when converting
 * label information into html.
 * @enum {string}
 * @private
 */
bite.client.BugsConsole.LabelData_ = {
  BACKGROUND_COLOR: 'bgColor',
  NAME: 'name'
};


/**
 * Label name.
 * @enum {string}
 * @private
 */
bite.client.BugsConsole.LabelName_ = {
  BOUND: 'bound',
  RECORDING: 'recording'
};


/**
 * Returns whether or not the console is currently visible on screen.
 * @return {boolean} True if the console is visible.
 */
bite.client.BugsConsole.prototype.isConsoleVisible = function() {
  if (!this.container_) {
    return false;
  }
  return this.container_.isVisible();
};


/**
 * Updates the data about bugs, and does necessary updates to
 * the UI and the overlay if applicable.
 * @param {Object} bugs The new bugs data to use.
 * @param {?string} user The user's e-mail.
 * @param {string} server The server url.
 */
bite.client.BugsConsole.prototype.updateData = function(bugs, user, server) {
  this.bugs_ = bugs;
  if (this.container_) {
    this.renderBugList_(user, server);
  }
};


/**
 * Removes the console element from the page.
 * @return {boolean} Whether the console was removed or not.
 */
bite.client.BugsConsole.prototype.removeConsole = function() {
  if (this.container_) {
    if (this.bugOverlay_) {
      this.bugOverlay_.remove();
    }
    this.container_.remove();
    this.container_ = null;
    this.eventHandler_.removeAll();
    return true;
  }
  return false;
};


/**
 * Hides the console element from the page.
 */
bite.client.BugsConsole.prototype.hideConsole = function() {
  if (this.bugOverlay_) {
    this.bugOverlay_.remove();
  }
  if (this.container_) {
    this.container_.hide();
  }
};


/**
 * Shows the console element.
 */
bite.client.BugsConsole.prototype.showConsole = function() {
  if (this.container_) {
    this.container_.show();
  }
};


/**
 * Loads the console.
 * @param {?string} user The user's e-mail.
 * @param {string} server The server url.
 * @private
 */
bite.client.BugsConsole.prototype.load_ = function(user, server) {
  this.container_ = new bite.ux.Container(server, 'bite-bugs-console',
                                          'Bugs', 'Explore existing bugs',
                                          true);
  var rootFolder = chrome.extension.getURL('');
  this.container_.setContentFromHtml(bite.client.Templates.bugConsole(
      {rootFolder: rootFolder}));

  // Will check the render state and render the bug list if appropriate.
  this.renderBugList_(user, server);

  this.setConsoleHandlers_();
};


/**
 * Renders the bugs in the Bug Console.
 * @param {?string} user The user's e-mail.
 * @param {string} server The server url.
 * @private
 */
bite.client.BugsConsole.prototype.renderBugList_ = function(user, server) {
  // Assumes that the console has been loaded.
  var contentCanvas =
      this.container_.getRoot().querySelector('#bite-bugs-content-canvas');

  // Add a login url if there is no user currently logged in.
  if (!user) {
    contentCanvas.innerHTML = '<b>Please login to view available bugs.</b>';
    return;
  }

  // Keep the current message if bugs have not yet been loaded.
  if (!this.bugs_) {
    return;
  }

  // Add a short message if there are no bugs to display.
  if (this.bugs_.length <= 0) {
    contentCanvas.innerHTML = '<p style="font-weight: bold">' +
        'No known bugs in this page.</p>';
    return;
  }

  // Results is an array of bugs associated with a specific url.  The array
  // holds Objects of type {url: string, bugs: Array.<Bug Objects>}.
  var results = [];
  // allBugs is an array of all the bug objects.  The list has no direct ties
  // to a url like results.
  var allBugs = [];
  for (var i = 0; i < this.bugs_.length; ++i) {
    var bugs = this.bugs_[i][1];

    var result = {'url': this.bugs_[i][0], 'bugs': []};
    var bugList = result['bugs'];

    for (var j = 0; j < bugs.length; ++j) {
      var bug = bugs[j];

      if (bug['visible']) {
        bug.img = bite.client.BugHelper.getBugIcon(bug['state']);
        bite.client.BugsConsole.applyLabels_(bug);

        bugList.push(bug);
      }
    }

    goog.array.sort(bugList, bite.client.BugHelper.CompareBugsState);

    // Extend existing AllBugs array with all additional bugs found.
    // Equivalent to Python's array.extend method.
    Array.prototype.push.apply(allBugs, bugList);

    // Only include the sections if applicable bugs were found.
    if (result['bugs'].length > 0) {
      results.push(result);
    }
  }

  contentCanvas.innerHTML = bite.client.Templates.addRows({results: results});

  // Once the page has been rendered, determine if any bugs are visible and
  // give the special "no bugs" message instead of a blank slate.
  var rows = contentCanvas.querySelectorAll('.bite-bugs-row');
  if (!rows.length) {
    contentCanvas.innerHTML = '<p style="font-weight: bold">' +
        'No known bugs in this page.</p>';
    return;
  }

  var resultContainers = contentCanvas.querySelectorAll(
      '.bite-bugs-console-result-container');

  // Create animated drop downs for the bug lists.
  for (var i = resultContainers.length - 1; i >= 0; --i) {
    var curr = resultContainers[i];
    var header = goog.dom.getFirstElementChild(curr);
    var containerBody = goog.dom.getNextElementSibling(header);

    // Creating an instance of AnimatedZippy on the header and body for each
    // container causes the Zippy to be attached to the elements.  Always
    // open the first category (when i == 0 is true).
    var zippy = new goog.ui.AnimatedZippy(header, containerBody, i == 0);
  }

  for (var i = rows.length - 1; i >= 0; --i) {
    this.eventHandler_.listen(rows[i], goog.events.EventType.CLICK,
                              goog.bind(this.handleBugRowClick_, this,
                                        allBugs[i]));
    this.eventHandler_.listen(rows[i], goog.events.EventType.MOUSEDOWN,
                              goog.bind(this.handleBugRowMouseDown_, this,
                                        allBugs[i]));
  }
};


/**
 * Given a bug, adds the appropriate label information to that object.
 * Currently, it is assumed that no labels will be added from the server and
 * only those determined by this function will be displayed.  A different
 * approach will be required to reduce duplicates if the assumption proves
 * false.
 * @param {Object} bug A reference to the bug to update.
 * @private
 */
bite.client.BugsConsole.applyLabels_ = function(bug) {
  var labels = [];

  // Add appropriate labels to the bug.
  for (var labelKey in bite.client.BugsConsole.LabelKey_) {
    var key = bite.client.BugsConsole.LabelKey_[labelKey];

    // Check if each of the desired labels are in the bug.
    if (bug[key]) {
      var label = {};
      var hasLabel = false;

      // Handle the specific label.
      switch (key) {
        case bite.client.BugsConsole.LabelKey_.BOUND:
          if (bug[bite.client.BugsConsole.LabelKey_.BOUND] != 'null') {
            label[bite.client.BugsConsole.LabelData_.NAME] =
                bite.client.BugsConsole.LabelName_.BOUND;
            hasLabel = true;
          }
          break;
        case bite.client.BugsConsole.LabelKey_.RECORDING:
          label[bite.client.BugsConsole.LabelData_.NAME] =
              bite.client.BugsConsole.LabelName_.RECORDING;
          hasLabel = true;
          break;
      }

      // Add the newly created label to the list of labels.
      if (hasLabel) {
        labels.push(label);
      }
    }
  }

  // Update the bug with the new list of labels.
  bug[bite.client.BugsConsole.LABEL_ID_] = labels;
};


/**
 * Handles starting a new bug.
 * @private
 */
bite.client.BugsConsole.prototype.startNewBugHandler_ = function() {
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.START_NEW_BUG});
};


/**
 * Sets up the handlers for the bugs console.
 * @private
 */
bite.client.BugsConsole.prototype.setConsoleHandlers_ = function() {
  var hideConsole = goog.dom.getElementByClass('bite-close-button',
                                               this.container_.getRoot());
  if (hideConsole) {
    this.eventHandler_.listen(hideConsole, goog.events.EventType.CLICK,
                              goog.bind(this.hideConsole, this));
  }

  var newBugButton = goog.dom.getElement('bite-toolbar-button-new-bug');
  if (newBugButton) {
    this.eventHandler_.listen(newBugButton, goog.events.EventType.CLICK,
                              goog.bind(this.startNewBugHandler_, this));
  }

  var overlayBugsButton =
      goog.dom.getElement('bite-toolbar-button-overlay-bugs');
  if (overlayBugsButton) {
    this.eventHandler_.listen(overlayBugsButton, goog.events.EventType.CLICK,
                              goog.bind(this.toggleBugOverlay_, this));
  }
};


/**
 * Handles a mouse down event on a row in the Bugs console.
 * @param {Object} bugData The corresponding bug data for the row.
 * @param {Object} e The MouseEvent object from the mousedown.
 * @private
 */
bite.client.BugsConsole.prototype.handleBugRowMouseDown_ =
    function(bugData, e) {
  bite.client.MiniBugPopup.getInstance().initDragBugBinding(bugData, e);
};


/**
 * Handles a user clicking on a row in the Bugs console.
 * @param {Object} bugData The corresponding bug data for the row clicked.
 * @param {Object} e The MouseEvent object from a user clicking.
 * @private
 */
bite.client.BugsConsole.prototype.handleBugRowClick_ = function(bugData, e) {
  var win = goog.dom.getWindow();
  bite.client.BugDetailsPopup.getInstance().createBugPopup(
      win.pageXOffset + e.clientX - 5,
      win.pageYOffset + e.clientY - 5,
      bugData, this);
};


/**
 * Toggles the bug overlay mechanism.
 * @private
 */
bite.client.BugsConsole.prototype.toggleBugOverlay_ = function() {
  if (this.bugOverlay_.bugOverlayOn()) {
    this.bugOverlay_.remove();
  } else {
    this.bugOverlay_.render();
  }

  var label = 'NEW_VISIBILITY: ' + this.bugOverlay_.bugOverlayOn();
  chrome.extension.sendRequest(
      {'action': Bite.Constants.HUD_ACTION.LOG_EVENT,
       'category': Bite.Constants.TestConsole.BUGS,
       'event_action': 'ToggleBugOverlay',
       'label': label});

  this.updateBugOverlayUI_();
};


/**
 * Updates the Bug Overlay UI depending on whether overlay is enabled or not.
 * @private
 */
bite.client.BugsConsole.prototype.updateBugOverlayUI_ = function() {
  var overlayButton = goog.dom.getElement('bite-toolbar-button-overlay-bugs');
  if (overlayButton) {
    if (this.bugOverlay_.bugOverlayOn()) {
      goog.dom.classes.add(overlayButton, 'bite-pressed');
    } else {
      goog.dom.classes.remove(overlayButton, 'bite-pressed');
    }
  }
};

