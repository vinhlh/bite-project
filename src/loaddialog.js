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
 * @fileoverview This file contains how RPF loads tests.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.LoaderDialog');

goog.require('common.mvc.Helper');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.AutoComplete.Basic');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.StatusLogger');
goog.require('rpf.soy.LoadDialog');



/**
 * A class for loading tests from locally or cloud.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
 *     onUiEvents The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.LoaderDialog = function(messenger, onUiEvents) {
  /**
   * The load dialog.
   * @type {Object}
   * @private
   */
  this.loaderDialog_ = new goog.ui.Dialog();

  /**
   * The status of tests loading.
   * @type {Object}
   * @private
   */
  this.status_ = {};

  /**
   * The ids of the tests.
   * @type {Array.<string>}
   * @private
   */
  this.uniqueIds_ = [];

  /**
   * The names of the tests.
   * @type {Array}
   * @private
   */
  this.testNames_ = [];

  /**
   * The project name entry input.
   * @type {Element}
   * @private
   */
  this.searchBox_ = null;

  /**
   * The dialog for displaying the tests for a project.
   * @type {Element}
   * @private
   */
  this.tests_ = null;

  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = messenger;

  /**
   * The function to handle the specific event.
   * @type {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
   * @private
   */
  this.onUiEvents_ = onUiEvents;

  /**
   * Inits the load dialog.
   */
  this.initLoaderDialog_();
};


/**
 * @const The loading status.
 * @type {string}
 * @private
 */
rpf.LoaderDialog.STATUS_LOADING_ = 'loading...';


/**
 * @const The default project to use to load tests.
 * @type {string}
 * @private
 */
rpf.LoaderDialog.DEFAULT_PROJECT_ = 'rpf';


/**
 * @const The executor server.
 * @type {string}
 * @private
 */
rpf.LoaderDialog.EXECUTOR_SERVICE_ = 'http://suite-executor.appspot.com';


/**
 * Enum for location values.
 * @enum {string}
 */
rpf.LoaderDialog.Locations = {
  WEB: 'web',
  LOCAL: 'local'
};


/**
 * Sets the visibility of the loader dialog.
 * @param {boolean} display Whether or not to show the dialog.
 * @export
 */
rpf.LoaderDialog.prototype.setVisible = function(display) {
  this.loaderDialog_.setVisible(display);
};


/**
 * Inits the loader dialog.
 * @private
 */
rpf.LoaderDialog.prototype.initLoaderDialog_ = function() {
  var content = common.mvc.Helper.renderModel(rpf.soy.LoadDialog.getContent);
  if (!content) {
    throw 'No content was rendered.';
  }

  // Initialize to null the elements that are always present in the dialog.
  // Don't include the root element because the search looks within that
  // element and will not locate itself.
  var elements = {
    'status': null,
    'deleteTestDialog': null,
    'loadTestDialog': null,
    'cancelTestDialog': null,
    'project-name': null,
    'load-go-button': null,
    'load-tests': null
  };

  // Load all relevant elements.
  if (!common.mvc.Helper.bulkGetElementById(elements, content)) {
    var keys = [];
    for (var key in elements) {
      if (!elements[key]) {
        keys.push(key);
      }
    }
    throw 'Failed to create elements: ' + keys.join(', ');
  }

  var dialogElem = this.loaderDialog_.getContentElement();
  dialogElem.appendChild(content);

  this.loaderDialog_.setTitle('Load Script');
  this.loaderDialog_.setButtonSet(null);
  this.loaderDialog_.setVisible(true);
  this.loaderDialog_.setVisible(false);
  this.searchBox_ = elements['project-name'];
  this.status_ = elements['status'];
  this.tests_ = elements['load-tests'];

  goog.events.listen(
      elements['deleteTestDialog'],
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.DELETE_SELECTED_TEST,
          {}));
  goog.events.listen(
      elements['loadTestDialog'],
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.LOAD_SELECTED_TEST,
          {}));
  goog.events.listen(
      elements['cancelTestDialog'],
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.CANCEL_DIALOG,
          {}));
  goog.events.listen(
      elements['load-go-button'],
      'click',
      goog.bind(this.clickGo_, this));
  goog.events.listen(
      this.searchBox_,
      'keypress',
      goog.bind(this.onEnter_, this));
  this.onUiEvents_(
      Bite.Constants.UiCmds.LOAD_PROJECT_NAME_INPUT,
      {},
      /** @type {Event} */ ({}),
      goog.bind(this.setProjectAutoComplete_, this));
};


/**
 * Sets the project name autocomplete.
 * @param {Array} names The array of project names.
 * @private
 */
rpf.LoaderDialog.prototype.setProjectAutoComplete_ = function(names) {
  new goog.ui.AutoComplete.Basic(names, this.searchBox_, false);
};


/**
 * Callback on project changes and with an enter.
 * @param {Object} e The object/element that triggered the event.
 * @private
 */
rpf.LoaderDialog.prototype.onEnter_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ENTER) {
    this.showTests_(goog.bind(this.saveProjectNameInput_, this));
  }
};


/**
 * Sets the location where the project is loaded from.
 * @param {boolean} isWeb Whether the location is the web.
 * @private
 */
rpf.LoaderDialog.prototype.setLocation_ = function(isWeb) {
  goog.dom.getElement('location-local').checked = !isWeb;
  goog.dom.getElement('location-web').checked = isWeb;
};


/**
 * Sets the project name.
 * @param {string} projectName The project name.
 * @private
 */
rpf.LoaderDialog.prototype.setProjectName_ = function(projectName) {
  goog.dom.getElement('project-name').value = projectName;
};


/**
 * Automates the dialog.
 * @param {boolean} isWeb Whether the location is the web.
 * @param {string} project The project name.
 * @param {string} test The test name.
 * @param {function(Object)} callback The callback function.
 */
rpf.LoaderDialog.prototype.automateDialog = function(
    isWeb, project, test, callback) {
  this.setLocation_(isWeb);
  this.setProjectName_(project);
  this.showTests_(
      goog.bind(this.loadSelectedTest, this, callback, project, test));
};


/**
 * Gets the storage location.
 * @return {string} The storage location.
 * @private
 */
rpf.LoaderDialog.prototype.getStorageLocation_ = function() {
  var locations = goog.dom.getDocument().getElementsByName('storageLocation');
  for (var i = 0, len = locations.length; i < len; ++i) {
    if (locations[i].checked) {
      return locations[i].value;
    }
  }
  alert('Please select a location.');
  throw new Error('No location was specified.');
};


/**
 * Clicks on the go button to load a test.
 * @private
 */
rpf.LoaderDialog.prototype.clickGo_ = function() {
  this.showTests_(goog.bind(this.saveProjectNameInput_, this));
};


/**
 * Saves the project name to localStorage.
 * @private
 */
rpf.LoaderDialog.prototype.saveProjectNameInput_ = function() {
  if (this.tests_.options.length <= 0) {
    return;
  }
  this.onUiEvents_(
      Bite.Constants.UiCmds.SAVE_PROJECT_NAME_INPUT,
      {'name': this.searchBox_.value},
      /** @type {Event} */ ({}));
};


/**
 * Shows tests from locally or cloud.
 * @param {function(Object)=} opt_callback The optional callback.
 * @private
 */
rpf.LoaderDialog.prototype.showTests_ = function(opt_callback) {
  var names = [];
  var storageLocation = this.getStorageLocation_();
  this.setStatus(rpf.LoaderDialog.STATUS_LOADING_);
  var project = this.searchBox_.value;
  if (!project) {
    alert('Please enter a project name.');
    return;
  }
  if (storageLocation == rpf.LoaderDialog.Locations.WEB) {
    var callback = goog.bind(
        this.updateNamesAndIds_, this, opt_callback || goog.nullFunction);
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.GET_ALL_FROM_WEB,
         'params': {'project': project}},
        callback);
  } else {
    var callback = goog.bind(
        this.updateNames_, this, opt_callback || goog.nullFunction);
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.GET_TEST_NAMES_LOCALLY,
         'params': {'project': project}},
        callback);
  }
};


/**
 * Update names and ids in load dialog.
 * @param {function(Object)} callback The callback function.
 * @param {Object} response The response object.
 * @private
 */
rpf.LoaderDialog.prototype.updateNamesAndIds_ = function(callback, response) {
  var jsonObj = response['jsonObj'];
  var names = [];
  var ids = [];
  var helperObj = {};
  for (var i = 0; i < jsonObj.length; ++i) {
    helperObj[jsonObj[i]['test_name']] = jsonObj[i]['id'];
    names.push(jsonObj[i]['test_name']);
  }
  names = names.sort();
  for (var i = 0; i < names.length; ++i) {
    ids.push(helperObj[names[i]]);
  }
  if (names.length != ids.length) {
    console.error('Names length does not equal to ids length.');
  }
  this.updateSelectBox(names, ids);
  this.setStatus('');
  this.onUiEvents_(
      Bite.Constants.UiCmds.SET_PROJECT_INFO,
      {'tests': jsonObj,
       'from': 'web'},
      /** @type {Event} */ ({}));
  callback({});
};


/**
 * Update names in load dialog.
 * @param {function(Object)} callback The callback function.
 * @param {Object} response The response object.
 * @private
 */
rpf.LoaderDialog.prototype.updateNames_ = function(callback, response) {
  var tests = response['tests'];
  this.onUiEvents_(
      Bite.Constants.UiCmds.SET_PROJECT_INFO,
      {'tests': tests,
       'from': 'local'},
      /** @type {Event} */ ({}));
  var names = [];
  for (var i = 0; i < tests.length; ++i) {
    names.push(tests[i]['test_name']);
  }
  names = names.sort();
  this.updateSelectBox(names, null);
  this.setStatus('');
  callback({});
};


/**
 * Sets status string on loader dialog.
 * @param {string} statusStr The status string.
 */
rpf.LoaderDialog.prototype.setStatus = function(statusStr) {
  this.status_.innerHTML = statusStr;
};


/**
 * Generates an element descriptor including all necessary info.
 * @param {Array} names An array of test names.
 * @param {Array} opt_ids An optional array of test ids.
 */
rpf.LoaderDialog.prototype.updateSelectBox = function(names, opt_ids) {
  goog.dom.removeChildren(this.tests_);
  this.testNames_ = names;
  if (opt_ids) {
    this.uniqueIds_ = opt_ids;
    // TODO(phu): add ids related code.
  }
  try {
    for (var i = 0; i < names.length; i++) {
      var opt = common.mvc.Helper.renderModel(rpf.soy.LoadDialog.getOption,
                                              {'name': names[i]});
      if (!opt) {
        throw 'No content was rendered.';
      }
      goog.events.listen(
          opt,
          'dblclick',
          goog.partial(
              this.onUiEvents_,
              Bite.Constants.UiCmds.LOAD_SELECTED_TEST,
              {}));
      this.tests_.appendChild(opt);
    }
    this.onUiEvents_(
        Bite.Constants.UiCmds.UPDATE_INVOKE_SELECT,
        {'names': this.testNames_,
         'ids': this.uniqueIds_},
        /** @type {Event} */ ({}));
  } catch (e) {
    throw new Error(e);
    // TODO(phu): add report back to server.
  }
};


/**
 * Deletes the selected test info on console.
 */
rpf.LoaderDialog.prototype.deleteSelectedTest = function() {
  var selectedTestNames = [];
  var selectedTestIds = [];
  var location = this.getStorageLocation_();
  for (var i = 0; i < this.tests_.options.length; ++i) {
    if (this.tests_.options[i].selected) {
      selectedTestNames.push(this.tests_.options[i].value);
      if (this.uniqueIds_ && this.uniqueIds_[i]) {
        selectedTestIds.push(this.uniqueIds_[i]);
      }
    }
  }
  if (selectedTestNames.length > 0) {
    if (location == rpf.LoaderDialog.Locations.LOCAL) {
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.DELETE_TEST_LOCAL,
           'params': {'project': this.searchBox_.value,
                      'testNames': selectedTestNames}},
          goog.bind(this.getTestsFrom, this));
    } else {
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.DELETE_TEST_ON_WTF,
           'params': {'jsonIds': selectedTestIds}},
          goog.bind(this.getTestsFrom, this));
    }
  }
};


/**
 * Loads the specified test.
 * @param {function(Object)} callback The load test callback function.
 * @param {string=} opt_project The optional project name.
 * @param {string=} opt_test The optional test name.
 * @param {rpf.LoaderDialog.Locations=} opt_location The optional location.
 */
rpf.LoaderDialog.prototype.loadSelectedTest = function(
    callback, opt_project, opt_test, opt_location) {
  var projectName = '';
  var testName = '';
  var testId = '';

  if (opt_project && opt_test) {
    projectName = opt_project;
    testName = opt_test;
  } else {
    var index = -1;
    index = this.getSelectedTestIndex_();
    if (index < 0) {
      callback({'message': rpf.StatusLogger.LOAD_NO_TEST_ERROR,
                'color': 'red'});
      throw new Error(rpf.StatusLogger.LOAD_NO_TEST_ERROR);
    }
    testId = this.uniqueIds_[index];
    projectName = this.searchBox_.value;
    testName = this.tests_.options[index].value;
  }

  var locationStorage = opt_location || this.getStorageLocation_();
  if (locationStorage == rpf.LoaderDialog.Locations.WEB) {
    this.onUiEvents_(Bite.Constants.UiCmds.LOAD_TEST_FROM_WTF,
        {'jsonId': testId,
         'mode': rpf.MiscHelper.Modes.CONSOLE},
        /** @type {Event} */ ({}));
  } else {
    this.onUiEvents_(Bite.Constants.UiCmds.LOAD_TEST_FROM_LOCAL,
        {'name': testName,
         'projectName': projectName},
        /** @type {Event} */ ({}));
  }
};


/**
 * Gets the current project name.
 * @return {string} The project name.
 */
rpf.LoaderDialog.prototype.getProjectName = function() {
  return this.searchBox_.value;
};


/**
 * Gets all of the selected test names.
 * @return {Array} The selected names.
 */
rpf.LoaderDialog.prototype.getSelectedTests = function() {
  var results = [];
  for (var i = 0; i < this.tests_.options.length; ++i) {
    if (this.tests_.options[i].selected) {
      results.push(this.tests_.options[i].value);
    }
  }
  return results;
};


/**
 * Loads the selected test info on console.
 * @return {number} The selected index.
 * @private
 */
rpf.LoaderDialog.prototype.getSelectedTestIndex_ = function() {
  var selectedIndex = -1;
  var locationStorage = this.getStorageLocation_();
  for (var i = 0; i < this.tests_.options.length; ++i) {
    if (this.tests_.options[i].selected == true) {
      return i;
    }
  }
  return -1;
};


/**
  * Dismisses the dialog without loading a test.
  */
rpf.LoaderDialog.prototype.cancelDialog = function() {
  this.setVisible(false);
};


/**
 * Gets the tests from either web or localStorage.
 * @param {function(Object)=} opt_callback The optional callback.
 */
rpf.LoaderDialog.prototype.getTestsFrom = function(opt_callback) {
  this.showTests_(opt_callback);
};


/**
 * @return {Array.<string>} The ids of the tests.
 */
rpf.LoaderDialog.prototype.getUniqueIds = function() {
  return this.uniqueIds_;
};


/**
 * @return {Array} The names of the tests.
 */
rpf.LoaderDialog.prototype.getTestNames = function() {
  return this.testNames_;
};

