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
 * @fileoverview This file contains the console messages related functions.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.StatusLogger');

goog.require('goog.fx');
goog.require('goog.fx.dom');



/**
 * A class for handling messages related functions.
 * @constructor
 */
rpf.StatusLogger = function() {
  /**
   * The status input element.
   * @type {Element}
   * @private
   */
  this.statusArea_ = goog.dom.getElement(rpf.StatusLogger.ID_);

  this.anim_ = new goog.fx.dom.FadeInAndShow(this.statusArea_, 600);

  this.setStatus(rpf.StatusLogger.DEFAULT);
};
goog.addSingletonGetter(rpf.StatusLogger);


/**
 * The status Element id.
 * @type {string}
 * @private
 */
rpf.StatusLogger.ID_ = 'statusLog';


/**
 * Default messages.
 * @type {string}
 */
rpf.StatusLogger.DEFAULT = [
  'Learn the tutorial <a href="https://sites.google.com/site' +
  '/rpfwiki/about" target="_blank">here</a>'].join('<br>');


/**
 * Starts recording messages.
 * @type {string}
 */
rpf.StatusLogger.START_RECORDING = [
  'Started recording',
  '(<a href="https://sites.google.com/site' +
  '/rpfwiki/q-a#recordissue"' +
  ' target="_blank">Trouble shooting</a>)'].join('<br>');


/**
 * Stops recording messages.
 * @type {string}
 */
rpf.StatusLogger.STOP_RECORDING = [
  'Stopped recording'].join('<br>');


/**
 * Starts loading a test messages.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST = ['Loading...'].join('<br>');


/**
 * Starts loading a test messages.
 * @type {string}
 */
rpf.StatusLogger.LOAD_NO_TEST_ERROR = [
  'Please select a test.',
  '(You might want to load a project first)'].join('<br>');


/**
 * Loads a test successfully message.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST_SUCCESS = [
  'Load Successful.'].join('<br>');


/**
 * Loads a test unsuccessfully message.
 * @type {string}
 */
rpf.StatusLogger.LOAD_TEST_FAILED = [
  'Failed loading...'].join('<br>');


/**
 * Project missing details.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_MISSING_DETAILS = [
    'Project missing details...'].join('<br>');


/**
 * Project has no tests.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_NO_TESTS = ['Project has no tests...'].join('<br>');


/**
 * Project not found.
 * @type {string}
 */
rpf.StatusLogger.PROJECT_NOT_FOUND = ['Project not found...'].join('<br>');


/**
 * Saving messages.
 * @type {string}
 */
rpf.StatusLogger.SAVING = ['Saving...'].join('<br>');


/**
 * Starts playback messages.
 * @type {string}
 */
rpf.StatusLogger.START_PLAYBACK = [
  'Started playback the test.',
  '(Stop button can clear status)'
].join('<br>');


/**
 * Finishes playback successfully messages.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_SUCCESS = [
  'Finished playback the test successfully!'].join('<br>');


/**
 * Finishes playback unsuccessfully messages.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_FAILED = [
  'Failed to playback the test.'].join('<br>');


/**
 * Manually stopped the playback.
 * @type {string}
 */
rpf.StatusLogger.PLAYBACK_STOPPED = ['The playback was stopped.'].join('<br>');


/**
 * Saving failure messages.
 * @type {string}
 */
rpf.StatusLogger.SAVE_FAILED = [
  'Failed saving... (There might be a server hiccup,' +
  'please try again later)'].join('<br>');


/**
 * Saving success messages.
 * @type {string}
 */
rpf.StatusLogger.SAVE_SUCCESS = [
  'Saved successfully.'].join('<br>');


/**
 * The helper message for new user starts.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_START = {
  'text': ['Welcome to use RPF!',
           '',
           'Try recording scripts by clicking the record button,',
           'or',
           'load existing scripts by clicking the load button.',
           '',
           'For experienced users, feel free to choose never show tooltips.'
          ].join('<br>'),
  'link': 'https://sites.google.com/site' +
      '/rpfwiki/about/a-quick-example-to-start'
};


/**
 * The helper message for recording.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_RECORD = {
  'text': ['Make sure elements get highlighted before performing actions' +
           ' in page, and then keep an eye on the generated code.',
           '',
           'Enter key is not captured, try mouse clicks if possible. ' +
           'Back button, address bar, flash can not be recorded either.',
           '',
           'Right click on elements for advanced actions like verification.',
           '',
           'Click the stop button first, then you could ' +
           'playback or save it.'].join('<br>'),
  'link': 'https://sites.google.com/site' +
      '/rpfwiki/about/basic-functionalities/new'
};


/**
 * The helper message for playback.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_PLAYBACK = {
  'text': ['If the playback could not start, try clicking stop button to ' +
           'clear the status first.',
           '',
           'Once you have paused at certain line, you could click the play ' +
           'button to continue playing.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/playback'
};


/**
 * The helper message for project details.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_PROJECT = {
  'text': ['You will need to load a project first in order to export ' +
           'it to Java Webdriver code.',
           '',
           'Import feature is not available.',
           '',
           'Under Scripts tab, you could delete scripts.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/webdriver'
};


/**
 * The helper message for add button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_ADD = {
  'text': ['You are ready to start recording a new script' +
           ' under the current project.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki' +
      '/about/basic-functionalities/new'
};


/**
 * The helper message for js scripts button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_METHODS = {
  'text': ['Click play button will execute the script in the target ' +
           'page.',
           '',
           'You could invoke the methods defined here by adding ',
           'call(METHOD_NAME);',
           'in your original recorded script.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/custom-script'
};


/**
 * The helper message for content map button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_CONTENT_MAP = {
  'text': ['Content map stores the user inputs in variables, and ',
           'you could change the values manually.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/content-map'
};


/**
 * The helper message for content map button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_LOAD_COMPLETE = {
  'text': ['Double click on an action line in editor will ' +
           'open the details dialog.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/details-dialog'
};


/**
 * The helper message for content map button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_DETAILS = {
  'text': ['From the Actions dropdown list, you could choose to insert' +
           ' more recordings.' +
           '',
           'In the details tab, you could ping or update the associated ' +
           'element, when it has been changed.',
           '',
           'When you are updating an element, you could either right click' +
           ' the new element in target page to update or click' +
           ' "stop" button to cancel.'
          ].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/details-dialog'
};


/**
 * The helper message for screenshots button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_SCREENSHOTS = {
  'text': ['It might take a few seconds until the screenshots ' +
           'are fully loaded.',
           '',
           'There is a limit on appengine where it stores the screenshots, ' +
           'please keep the size as small as possible.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about' +
      '/basic-functionalities/screenshots'
};


/**
 * The helper message for js settings button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_SETTINGS = {
  'text': ['If "Use Xpath" is checked, RPF will use xpath to locate ' +
           'the elements. Otherwise, it uses a scoring method by' +
           ' checking which element matches the most attributes.',
           '',
           'Note that the checkbox choices will be remembered.'].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/' +
      'basic-functionalities/settings'
};


/**
 * The helper message when playback failed.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_FAILED = {
  'text': ['The common failures are:',
           '1. Expected URL redirection took too long.',
           '2. Target element can not be located.',
           '',
           'To update the element, you can ' +
           'click the update button, and right click ' +
           'an element in target page to finish the process.',
           '',
           'You could either click the play button to continue, ' +
           'or stop it.'
          ].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/playback'
};


/**
 * The helper message for load button.
 * @type {Object}
 */
rpf.StatusLogger.MESSAGE_LOAD = {
  'text': ['Enter or select a project name will automatically load' +
           ' the project. You could then load a script in the same way.',
           '',
           'When you either load or record scripts, the save button will' +
           ' appear.',
           '',
           'The depot could either be web or browser localStorage.',
           '',
           'The icon next to the script input box shows the script id.'
          ].join('<br>'),
  'link': 'https://sites.google.com/site/rpfwiki/about/save-and-load'
};


/**
 * Sets the console status.
 * @param {string} status Status string.
 * @param {string=} opt_color Status color.
 * @export
 */
rpf.StatusLogger.prototype.setStatus = function(status, opt_color) {
  var color = opt_color || 'black';
  var statusDiv = '<div style="color:' + color + '">' + status + '</div>';
  this.statusArea_.innerHTML = statusDiv;
  this.anim_.play();
};


/**
 * Sets the console status when being called back.
 * @param {Object.<string, string>} response
 *     The callback function to set status.
 * @export
 */
rpf.StatusLogger.prototype.setStatusCallback = function(response) {
  this.setStatus(response['message'], response['color']);
};

