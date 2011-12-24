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
 * @fileoverview Creates a popup on the page giving users details about
 * a particular bug and ways to interact with it, such as commenting and
 * changing the status.  Only one popup can exist on a page at a time,
 * and the popup is removed upon the user moving their mouse away.
 *
 * @author bustamante@google.com (Richard Bustamante)
 */


goog.provide('bite.client.BugDetailsPopup');

goog.require('Bite.Constants');
goog.require('bite.client.Templates');
goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('goog.style');



/**
 * Bug Details Popup class constructor.
 * @constructor
 * @export
 */
bite.client.BugDetailsPopup = function() {
  /**
   * Handler for popup events.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler();
};
goog.addSingletonGetter(bite.client.BugDetailsPopup);


/**
 * The width of the popup.
 * @type {number}
 * @private
 */
bite.client.BugDetailsPopup.BUG_POPUP_WIDTH_ = 310;


/**
 * The height of the popup.
 * @type {number}
 * @private
 */
bite.client.BugDetailsPopup.BUG_POPUP_HEIGHT_ = 150;


/**
 * The ID of the popup container.
 * @type {string}
 * @export
 */
bite.client.BugDetailsPopup.POPUP_CONTAINER_ID = 'bug-popup-container';


/**
 * An error string fragment to identify access denied errors.
 * @type {string}
 * @private
 */
bite.client.BugDetailsPopup.ACCESS_DENIED_ERROR_ = '403';


/**
 * Whether to remove the bug popup.
 * @type {boolean}
 * @private
 */
bite.client.BugDetailsPopup.prototype.removeBugPopup_ = false;


/**
 * Whether to lock the bug popup from being removed.
 * @type {boolean}
 * @private
 */
bite.client.BugDetailsPopup.prototype.lockBugPopup_;


/**
 * The ID of the bug being represented.
 * @type {string}
 * @private
 */
bite.client.BugDetailsPopup.prototype.bugId_ = '';


/**
 * The popup HTML container.
 * @type {Element}
 * @private
 */
bite.client.BugDetailsPopup.prototype.popup_;


/**
 * The HUD content client of the caller.
 *
 * TODO(ralphj): Get rid of this circular dependency.
 * @type {Object}
 * @private
 */
bite.client.BugDetailsPopup.prototype.contentClient_;


/**
 * Enum for bug icon URLs enumeration.
 *
 * TODO(ralphj): Use the BugHelper.BugIcons here instead.
 * @enum {string}
 * @export
 */
bite.client.BugDetailsPopup.BugIcons = {
  ACTIVE: 'imgs/bug-active-32.png',
  RESOLVED: 'imgs/bug-resolved-32.png',
  CLOSED: 'imgs/bug-closed-32.png',
  UNKNOWN: 'imgs/bug-unknown-32.png'
};


/**
 * Enum for actions to take when interacting with Bugs.
 * @enum {string}
 * @export
 */
bite.client.BugDetailsPopup.BugActions = {
  ACTIVATE: 'activate',
  RESOLVE: 'resolve',
  VERIFY: 'verify',
  NOTABUG: 'notABug',
  COMMENT: 'comment'
};


/**
 * Converts a string to proper case, captializing the first letter of
 *   each word.
 * @param {string} string The string to convert to proper casing.
 * @return {string} The string with proper casing.
 * @export
 */
bite.client.BugDetailsPopup.prototype.strToProperCase = function(string) {
  // Replace the first character of each word with it's toUpperCase equivelant.
  return string.replace(/\b(.)/g,
                        function(letter) { return letter.toUpperCase(); });
};


/**
 * Creates a bug popup for the specified element.
 * @param {Node} element The overlayElement to create a popup next to.
 * @param {Object} bugData A dictionary containing the bug data.
 * @param {Object} contentClient The HUD content client of the caller.
 * @return {?Element} The popup container element or null if not created.
 * @export
 */
bite.client.BugDetailsPopup.prototype.createElementBugPopup = function(
    element, bugData, contentClient) {

  // Move the popup 2 pixels up to compensate for a visual effect of the
  // popup having having rounded corners.
  var popupTop = parseInt(element.style.top, 10) - 2;

  // Keep the popup within the browser window.
  popupTop = Math.min(popupTop,
                      goog.global.document.documentElement.clientHeight -
                      bite.client.BugDetailsPopup.BUG_POPUP_HEIGHT_);
  popupTop = Math.max(popupTop, 0);

  // Move the popup 3 pixels away from the overlay for aesthetic reasons.
  var popupLeft = parseInt(element.style.left, 10) +
                  parseInt(element.style.width, 10) + 3;

  // Keep the popup within the browser window.
  popupLeft = Math.min(popupLeft,
                       goog.global.document.documentElement.clientWidth -
                       bite.client.BugDetailsPopup.BUG_POPUP_WIDTH_);

  return this.createBugPopup(popupLeft, popupTop, bugData, contentClient);
};


/**
 * Creates a bug popup at the specified coordinates.  If a popup for the same
 * bug already exists or the popup is locked this function will abort and
 * return null.
 * @param {number} left The left position to create the bug popup at.
 * @param {number} top The top position to create the bug popup at.
 * @param {Object} bugData A dictionary containing the bug data.
 * @param {Object} contentClient The HUD content client of the caller.
 * @return {?Element} The popup container element or null if not created.
 * @export
 */
bite.client.BugDetailsPopup.prototype.createBugPopup = function(
    left, top, bugData, contentClient) {
  this.contentClient_ = contentClient;

  // If this function is called in the interim of flagBugPopupRemoval
  // abort destroying the popup as the user has performed an action to keep
  // it around.
  this.removeBugPopup_ = false;

  // If the popups have been locked, don't create a new one.
  if (this.lockBugPopup_) {
    return null;
  }

  // If a popup for the same bug already exists, don't create a duplicate, if
  // it's for a new bug then remove the existing popup and continue.
  if (this.popup_) {
    if (this.bugId_ == bugData['id']) {
      // Update position.
      goog.style.setPosition(this.popup_, left, top);
      return null;
    } else {
      this.destroyBugPopup(true);
    }
  }

  this.bugId_ = bugData['id'];
  this.popup_ = goog.dom.createDom(goog.dom.TagName.DIV,
      {'id': bite.client.BugDetailsPopup.POPUP_CONTAINER_ID,
       'class': 'popup-empty-frame',
       'style': 'position: absolute'});
  goog.style.setPosition(this.popup_, left, top);
  goog.dom.appendChild(goog.global.document.body, this.popup_);
  this.drawBugData_(bugData, this.popup_);

  // Setup listeners to remove/keep the popup on mouse out / in respectively.
  this.eventHandler_.listen(this.popup_,
                            goog.events.EventType.MOUSEOVER,
                            goog.bind(this.flagBugPopupRemoval, this, false));
  this.eventHandler_.listen(this.popup_,
                            goog.events.EventType.MOUSEOUT,
                            goog.bind(this.flagBugPopupRemoval, this, true));
  return this.popup_;
};


/**
 * Gets the appropiate bug icon associated with the specified Bug status.
 * @param {string} state The state of the bug, valid values are 'active',
 *    'resolved', 'closed', and 'unknown'.
 * @return {string} A URL to the bug icon.
 * @private
 */
bite.client.BugDetailsPopup.prototype.getBugIcon_ = function(state) {
  var result = null;

  switch (state.toLowerCase()) {
    case 'active':
      result = chrome.extension.getURL(
          bite.client.BugDetailsPopup.BugIcons.ACTIVE);
      break;
    case 'resolved':
      result = chrome.extension.getURL(
          bite.client.BugDetailsPopup.BugIcons.RESOLVED);
      break;
    case 'closed':
      result = chrome.extension.getURL(
          bite.client.BugDetailsPopup.BugIcons.CLOSED);
      break;
    case 'unknown':
    default:
      result = chrome.extension.getURL(
          bite.client.BugDetailsPopup.BugIcons.UNKNOWN);
      break;
  }

  return result;
};


/**
 * Draws a popup Element with Bug data.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The HTML element object of the container.
 * @private
 */
bite.client.BugDetailsPopup.prototype.drawBugData_ = function(
    bugData, container) {
  this.lockBugPopup_ = false;
  var iconURL = this.getBugIcon_(bugData['state']);
  var bugStatus = this.strToProperCase(bugData['status']);

  // Only use the 'yyyy-mm-dd' part of the date/time strings.
  var reportByDate = bugData['reported_on'].substring(0, 10);
  var lastUpdateByDate = bugData['last_update'].substring(0, 10);
  var reportByUser = bugData['author'].split('@')[0];
  var reportByLink = bugData['author_url'];
  var lastUpdateByUser = bugData['last_updater'].split('@')[0];
  var lastUpdateByLink = bugData['last_updater_url'];

  var bugDataPopup = goog.dom.createDom(goog.dom.TagName.DIV,
      {'class': 'popup-empty-frame'});

  goog.dom.removeChildren(container);
  bugDataPopup.innerHTML = bite.client.Templates.bugDetailsPopup(
      {imgURI: iconURL,
       bugID: bugData['id'],
       bugLink: bugData['details_link'],
       status: bugStatus,
       priority: bugData['priority'],
       reportDate: reportByDate,
       reportBy: reportByUser,
       reportByURI: reportByLink,
       lastUpdateDate: lastUpdateByDate,
       lastUpdateBy: lastUpdateByUser,
       lastUpdateByURI: lastUpdateByLink,
       bugTitle: bugData['title'],
       state: bugData['state'],
       navLeft: chrome.extension.getURL('imgs/nav-left.png'),
       navRight: chrome.extension.getURL('imgs/nav-right.png')});

  goog.dom.appendChild(container, bugDataPopup);
  this.createBugCommandListeners_(bugData, container);
  this.createBoundCommandListeners_(bugData, bugDataPopup);
};


/**
 * Adds listeners for the "Bound" label.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} bugDataPopup The HTML element object of the bug popup.
 * @private
 */
bite.client.BugDetailsPopup.prototype.createBoundCommandListeners_ = function(
    bugData, bugDataPopup) {
  var boundLabel = goog.dom.getElement('bug-popup-bound-label');
  if (boundLabel) {
    this.eventHandler_.listen(boundLabel,
                              goog.events.EventType.CLICK,
                              goog.bind(this.showBoundLabelMenu_,
                                        this,
                                        bugData,
                                        bugDataPopup,
                                        boundLabel));
  }
};


/**
 * Adds listeners for any bug command elements found.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The HTML element object of the container.
 * @param {Element} label The HTML element object of the "Bound" label.
 * @private
 */
bite.client.BugDetailsPopup.prototype.showBoundLabelMenu_ = function(
    bugData, container, label) {
  var boundMenuControl = goog.dom.createDom(goog.dom.TagName.DIV,
      {'class': 'popup-empty-frame'});
  boundMenuControl.innerHTML = bite.client.Templates.boundControlOptions();
  goog.dom.appendChild(container, boundMenuControl);

  // Depending on the length of the Bug ID the bound label can change position.
  var labelPosition = goog.style.getPosition(label);
  goog.style.setPosition(boundMenuControl,
                         labelPosition.x + 35,
                         labelPosition.y + 22);
  this.eventHandler_.listen(
      goog.dom.getElement('bug-popup-bound-menu-remove'),
      goog.events.EventType.CLICK,
      goog.bind(this.submitRemoveBugBinding_, this, bugData,
                goog.bind(goog.dom.removeNode, this, boundMenuControl)));
  this.eventHandler_.listen(goog.dom.getElement('bug-popup-bound-menu-cancel'),
                            goog.events.EventType.CLICK,
                            goog.bind(goog.dom.removeNode, this,
                                      boundMenuControl));
};


/**
 * Submits a remove/clear bug binding message to the server.
 * @param {Object} bugData A dictionary of the bug data for this binding.
 * @param {function()} callback Callback to call after submitting the
 *     bug binding removal to the server.
 * @private
 */
bite.client.BugDetailsPopup.prototype.submitRemoveBugBinding_ = function(
    bugData, callback) {
  var requestData = {'action': Bite.Constants.HUD_ACTION.UPDATE_BUG,
                     'details': {'key': bugData['key'], 'target_element': ''}};
  chrome.extension.sendRequest(requestData,
      goog.bind(this.refreshLocalBugData_, this, callback));
};


/**
 * Refreshes the local bug data with data on the server.
 * @param {function()=} opt_callback Function to call after requesting refresh.
 * @private
 */
bite.client.BugDetailsPopup.prototype.refreshLocalBugData_ =
    function(opt_callback) {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.UPDATE_DATA,
       target_url: goog.global.location.href});
  if (opt_callback) {
    opt_callback();
  }
};


/**
 * Adds listeners for any bug command elements found.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The HTML element object of the container.
 * @private
 */
bite.client.BugDetailsPopup.prototype.createBugCommandListeners_ = function(
    bugData, container) {
  var commandObj = null;
  for (var command in bite.client.BugDetailsPopup.BugActions) {
    commandObj = goog.dom.getElement(
        'bug-command-' + bite.client.BugDetailsPopup.BugActions[command]);
    if (commandObj) {
      this.eventHandler_.listen(
              commandObj,
              goog.events.EventType.CLICK,
              goog.bind(this.drawSubmitPopup, this,
                        bite.client.BugDetailsPopup.BugActions[command],
                        bugData, container));
    }
  }
};


/**
 * Draws a popup for users to tailor/submit a change for a bug.
 * @param {bite.client.BugDetailsPopup.BugActions} action The action being
 *     taken.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The container HTML element to draw in.
 * @export
 */
bite.client.BugDetailsPopup.prototype.drawSubmitPopup = function(
    action, bugData, container) {
  this.lockBugPopup_ = true;

  goog.dom.removeChildren(container);
  var bugDataIconURL = this.getBugIcon_(bugData['state']);
  var bugDataPopup = goog.dom.createDom(goog.dom.TagName.DIV,
                         {'class': 'popup-empty-frame'});
  bugDataPopup.innerHTML = bite.client.Templates.bugConfirmChanges(
                              {imgURI: bugDataIconURL,
                               bugID: bugData['id'],
                               bugLink: bugData['details_link'],
                               command: action});
  goog.dom.appendChild(container, bugDataPopup);
  this.eventHandler_.listen(goog.dom.getElement('bug-command-cancel'),
                         goog.events.EventType.CLICK,
                         goog.bind(this.drawBugData_, this, bugData,
                                   container));
  this.eventHandler_.listen(goog.dom.getElement('bug-command-submit'),
                         goog.events.EventType.CLICK,
                         goog.bind(this.postBugUpdate_, this, bugData,
                                   container));
};


/**
 * Collects information for a bug update and posts it to the back end.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The HTML element object of the container.
 * @private
 */
bite.client.BugDetailsPopup.prototype.postBugUpdate_ = function(
    bugData, container) {
  // Disable the appearance of the popup while waiting for a response.
  this.disableSubmitPopup_();

  var details = {'key': bugData['key']};
  var commentElem = goog.dom.getElement('bug-popup-comment');
  if (commentElem) {
    details['comment'] = contentElement.innerHTML;
  }
  var statusElem = goog.dom.getElement('bug-update-status');
  var status = undefined;
  if (statusElem) {
    status = statusElem.innerHTML;
    details['status'] = status;
  }

  // TODO (jason.stredwick): I notice that the status in the bug data is not
  // updated here and perhaps not elsewhere.  Look into this.
  var requestData = {'action': Bite.Constants.HUD_ACTION.UPDATE_BUG,
                     'details': details};

  chrome.extension.sendRequest(requestData,
       goog.bind(this.postBugUpdateHandler_, this, status, bugData,
                 container));
};


/**
 * Disables the controls users can interact with on the Submit popup.
 * @private
 */
bite.client.BugDetailsPopup.prototype.disableSubmitPopup_ = function() {
  // Gray-out the controls, to make the popup appear disabled.
  goog.style.setStyle(goog.dom.getElement('bug-popup-comment'),
                      'color', '#666666');
  goog.dom.getElement('bug-popup-comment').contentEditable = false;
  goog.dom.classes.set(goog.dom.getElement('bug-command-cancel'),
                       'pseudo-link-disabled');
  goog.dom.classes.set(goog.dom.getElement('bug-command-submit'),
                       'pseudo-link-disabled');

  // If the user is just commenting this control won't exist.
  var updateStatus = goog.dom.getElement('bug-update-status');
  if (updateStatus) {
    updateStatus.disabled = true;
  }
};


/**
 * Handles the response for updating a bug server side.
 * @param {string} status The new status of the bug.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The container HTML element to draw in.
 * @param {string} result A JSON with the result of the update.
 * @private
 */
bite.client.BugDetailsPopup.prototype.postBugUpdateHandler_ = function(
    status, bugData, container, result)  {
  chrome.extension.sendRequest(
      {action: Bite.Constants.HUD_ACTION.UPDATE_DATA,
       target_url: goog.global.location.href});
  this.drawConfirmationPopup_(status, bugData, container, result);
};


/**
 * Draws a popup Element that confirms the update to the bug.
 * @param {string=} status The new status of the bug, can be undefined if no
 *     status value was updated.
 * @param {Object} bugData A dictionary of the Bug data elements.
 * @param {Node} container The container HTML element to draw in.
 * @param {string} result A JSON with the result.
 * @private
 */
bite.client.BugDetailsPopup.prototype.drawConfirmationPopup_ = function(
    status, bugData, container, result) {
  var updatedBugData = this.contentClient_.getBugData_(bugData['id']);
  var resultMsg = '';
  this.lockBugPopup_ = false;
  goog.dom.removeChildren(container);

  if (result['success'] == true) {
    if (status == undefined) {
      resultMsg = 'Your comment has been successfully posted.';
    } else {
      resultMsg = 'This issue has been marked as <b>' + status + '</b>';
    }
  } else {
    resultMsg = 'Unable to submit update';

    // If there was an error message return to the user, specifically for 403
    // errors give the user a user-friendly asking them to contact the team.
    if (result['error']) {
      if (result['error'].indexOf(
          bite.client.BugDetailsPopup.ACCESS_DENIED_ERROR_) > -1) {
        resultMsg += ' - Access Denied' +
                     '<br><span style="color: #6F6F6F; font-size: 7pt">' +
                     'Please contact the appropiate team for access to' +
                     '<br>update these issues.</span>';
      } else {
        resultMsg += ' - ' + escape(result['error']);
      }
    }
  }

  var bugResultIconURL = this.getBugIcon_(updatedBugData['state']);
  var bugResultPopup = goog.dom.createDom(goog.dom.TagName.DIV,
      {'class': 'popup-empty-frame'});
  bugResultPopup.innerHTML = bite.client.Templates.bugResultPopup(
       {imgURI: bugResultIconURL,
        bugID: updatedBugData['id'],
        bugLink: updatedBugData['details_link'],
        resultMessage: resultMsg});
  goog.dom.appendChild(container, bugResultPopup);

  this.eventHandler_.listen(goog.dom.getElement('back-to-bug-details'),
                         goog.events.EventType.CLICK,
                         goog.bind(this.drawBugData_, this,
                                   updatedBugData, container));
};


/**
 * Flags the BugPopup for removal or switches the flag to keep it.
 * @param {boolean} remove Whether to remove (true) or keep (false) the popup.
 * @export
 */
bite.client.BugDetailsPopup.prototype.flagBugPopupRemoval = function(remove) {
  // To prevent an accidental mouse-out, wait 200 milliseconds before
  // destroying the popup.  If the user mouses back in this.removeBugPopup_
  // is set to false and the popup won't be destroyed.
  this.removeBugPopup_ = remove;
  if (remove == true) {
    goog.Timer.callOnce(this.destroyBugPopup, 200, this);
  }
};


/**
 * @param {boolean} locked Whether to lock the bug popup from being removed.
 * @export
 */
bite.client.BugDetailsPopup.prototype.setLocked = function(locked) {
  this.lockBugPopup_ = locked;
};


/**
 * @return {boolean} Whether the popup is flagged for removal.
 * @export
 */
bite.client.BugDetailsPopup.prototype.isFlaggedForRemoval = function() {
  return this.removeBugPopup_;
};

/**
 * @param {boolean} remove Whether the popup is flagged for removal.
 * @export
 */
bite.client.BugDetailsPopup.prototype.setFlaggedForRemoval =
    function(remove) {
  this.removeBugPopup_ = remove;
};


/**
 * Removes the Bug Popup depending whether it's flagged for removal.
 * @param {boolean} force Whether to force destroy the popup, ignoring other
 *     flags and parameters.
 * @export
 */
bite.client.BugDetailsPopup.prototype.destroyBugPopup = function(force) {
  // Make sure we still want to remove it when this gets called.
  if ((this.removeBugPopup_ == true && this.lockBugPopup_ == false) ||
      force) {
    if (this.popup_) {
      this.eventHandler_.removeAll();
      goog.dom.removeNode(this.popup_);
      this.popup_ = null;
    }
  }
};


/**
 * Sets the new popup element.
 * @param {Element} elmnt The target popup element.
 * @export
 */
bite.client.BugDetailsPopup.prototype.setTarget = function(elmnt) {
  this.popup_ = elmnt;
};
