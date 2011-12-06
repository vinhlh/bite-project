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
 * @fileoverview This file contains the dialog for exporting a project.  When
 * the user enters a project, its tests and details are loaded from the server
 * and displayed in the dialog.  If the user makes changes to the details and
 * wishes to save those changes the save button must be pressed.  It does not
 * automatically save user changes as they are made.
 *
 * The main functionality of this dialog is the ability to export the project
 * as Java WebDriver code.  It does this by translating the loaded project
 * information through the bite.webdriver and then sends the resulting output
 * files to the server.  The output files are then zipped, stored on the
 * server, and then downloaded to the user's machine.
 *
 * The script button follows the same process as the export button, but
 * produces a command line script created by RPF for the exported project.  The
 * script will unzip the exported project and move it to the correct location
 * within the client.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('rpf.ExportDialog');

goog.require('bite.closure.Helper');
goog.require('bite.common.mvc.helper');
goog.require('bite.webdriver');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.format.JsonPrettyPrinter');
goog.require('goog.json');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.TabBar');
goog.require('rpf.Console.Messenger');
goog.require('rpf.DataModel');
goog.require('rpf.StatusLogger');
goog.require('rpf.soy.Dialog');



/**
 * Defines an export dialog used by RPF to export tests and projects to the
 * local machine as a zip file.  Each zip file will contain the translation
 * of the information in the selected format.
 * @param {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
 *     onUiEvents The function to handle the specific event.
 * @param {function()} reloadProject The method to reload the project.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @constructor
 */
rpf.ExportDialog = function(onUiEvents, reloadProject, messenger) {
  /**
   * The project data loaded from the server.
   * @type {Object}
   * @private
   */
  this.data_ = null;

  /**
   * The dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.dialog_ = null;

  /**
   * Contains key elements within the dialog.
   * @type {!Object.<string, !Element>}
   * @private
   */
  this.elements_ = {};

  /**
   * Manages events that are constant through every state.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.handlersDynamic_ = null;

  /**
   * Manages a set of events that will change from state to state.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.handlersStatic_ = null;

  /**
   * Whether or not the dialog is ready for use.
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  /**
   * The project name.
   * @type {string}
   * @private
   */
  this.projectName_ = '';

  /**
   * The location.
   * @type {string}
   * @private
   */
  this.location_ = '';

  /**
   * The test ids.
   * @type {!Array.<string>}
   * @private
   */
  this.ids_ = [];

  /**
   * The method to reload the current project.
   * @type {function()}
   * @private
   */
  this.reloadProject_ = reloadProject;

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
};


/**
 * Ids for important elements.
 * @enum {string}
 * @private
 */
rpf.ExportDialog.Id_ = {
  ADD: 'export-add-class',
  EXPORT: 'export-button-export',
  INTERVAL: 'export-java-interval',
  JAVA_PACKAGE_PATH: 'export-java-package-path',
  JAVA_PACKAGE_IMPORT: 'import-java-package-path',
  IMPORT: 'export-button-import',
  PAGE_TABLE_BODY: 'export-page-table-body',
  ROOT: 'export-root',
  SAVE: 'export-button-save',
  TEST_DATA: 'export-test-data'
};


/**
 * Destroys the export dialog making it unusable.
 */
rpf.ExportDialog.prototype.destroy = function() {
  // Clean up listeners
  this.handlersDynamic_ && this.handlersDynamic_.removeAll();
  this.handlersStatic_ && this.handlersStatic_.removeAll();

  // Remove the content generated by this object from the dialog object's html.
  if (rpf.ExportDialog.Id_.ROOT in this.elements_) {
    goog.dom.removeNode(this.elements_[rpf.ExportDialog.Id_.ROOT]);
  }

  // Remove references to owned objects.
  this.data_ = null;
  this.dialog_ = null;
  this.elements_ = {};
  this.handlersDynamic_ = null;
  this.handlersStatic_ = null;
  this.ready_ = false;
};


/**
 * Initialize the export dialog.
 */
rpf.ExportDialog.prototype.init = function() {
  if (this.isReady()) {
    return;
  }

  try {
    this.initContent_();
    this.initComponents_();
    this.initStaticHandlers_();
  } catch (error) {
    this.destroy();
    console.error('ERROR (rpf.ExportDialog.init): Failed to initialize. ' +
                  'Exception: ' + error);
    return;
  }

  this.ready_ = true;
};


/**
 * Create/Setup the major components of the object.  These components help
 * manage the dialog.  This function is intended to only be called by init.
 * @private
 */
rpf.ExportDialog.prototype.initComponents_ = function() {
  this.handlersDynamic_ = new goog.events.EventHandler();
  this.handlersStatic_ = new goog.events.EventHandler();

  var rootElement = this.elements_[rpf.ExportDialog.Id_.ROOT];
  this.dialog_ = new goog.ui.Dialog();
  this.dialog_.getContentElement().appendChild(rootElement);
  this.dialog_.setTitle('Project details');
  this.dialog_.setButtonSet(null);
  this.dialog_.setVisible(false);

  var topTab = new goog.ui.TabBar();
  goog.events.listen(topTab, goog.ui.Component.EventType.SELECT,
                     goog.bind(this.onTabSelected_, this));
  topTab.decorate(goog.dom.getElement('project-details-tab'));
  this.renderButtons_();
};


/**
 * Renders the buttons.
 * @private
 */
rpf.ExportDialog.prototype.renderButtons_ = function() {
  var deleteButton = new goog.ui.CustomButton('Delete');

  goog.events.listen(
      deleteButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.onDeleteTests_, this));
  deleteButton.render(goog.dom.getElement('delete-tests-button'));

  var saveButton = new goog.ui.CustomButton('Save');

  goog.events.listen(
      saveButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.handleSave_, this));
  saveButton.render(this.elements_[rpf.ExportDialog.Id_.SAVE]);

  var importButton = new goog.ui.CustomButton('Import');

  goog.events.listen(
      importButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.handleImport_, this));
  importButton.render(this.elements_[rpf.ExportDialog.Id_.IMPORT]);

  var exportButton = new goog.ui.CustomButton('Export');

  goog.events.listen(
      exportButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.handleExport_, this));
  exportButton.render(this.elements_[rpf.ExportDialog.Id_.EXPORT]);
};


/**
 * On removing the selected tests.
 * @private
 */
rpf.ExportDialog.prototype.onDeleteTests_ = function() {
  var selectedTestNames = [];
  var selectedTestIds = [];
  var location = this.location_;
  var selector = goog.dom.getElement('project-details-tests-selector');
  for (var i = 0; i < selector.options.length; ++i) {
    if (selector.options[i].selected) {
      selectedTestNames.push(selector.options[i].value);
      if (this.ids_ && this.ids_[i]) {
        selectedTestIds.push(this.ids_[i]);
      }
    }
  }
  if (selectedTestNames.length > 0) {
    if (location == rpf.LoaderDialog.Locations.LOCAL) {
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.DELETE_TEST_LOCAL,
           'params': {'project': this.projectName_,
                      'testNames': selectedTestNames}},
          this.reloadProject_);
    } else {
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.DELETE_TEST_ON_WTF,
           'params': {'jsonIds': selectedTestIds}},
          this.reloadProject_);
    }
  }
};


/**
 * Render the content elements for the dialog using soy then store references
 * to specific elements.  Will throw an exception in string form upon error.
 * This function is intended to only be called by init.
 * @private
 */
rpf.ExportDialog.prototype.initContent_ = function() {
  var helper = bite.common.mvc.helper;
  var content = helper.renderModel(rpf.soy.Dialog.exportContent);
  if (!content) {
    throw 'No content was rendered.';
  }

  var key = '';

  // Initialize to null the elements that are always present in the dialog.
  // Don't include the root element because the search looks within that
  // element and will not locate itself.
  var elements = {};
  for (key in rpf.ExportDialog.Id_) {
    var id = rpf.ExportDialog.Id_[key];
    elements[id] = null;
  }

  // Load all relevant elements.
  if (!helper.bulkGetElementById(elements, content)) {
    var keys = [];
    for (key in elements) {
      if (!elements[key]) {
        keys.push(key);
      }
    }
    throw 'Failed to create elements: ' + keys.join(', ');
  }

  // Store relevant Element references for quick lookup later.
  this.elements_ = elements;
};


/**
 * Handles a tab selected event.
 * @param {Object} e The event object.
 * @private
 */
rpf.ExportDialog.prototype.onTabSelected_ = function(e) {
  var tabSelected = e.target;
  var id = tabSelected.getContentElement().id;
  var contentDiv = goog.dom.getElement('project-details-content');
  var tabs = contentDiv.querySelectorAll('.project-details-content-tab');
  bite.closure.Helper.setElementsVisibility(/** @type {Array} */ (tabs), false);
  var selectedTab = goog.dom.getElement(id + '-content');
  bite.closure.Helper.setElementsVisibility([selectedTab], true);
};


/**
 * Setup handlers for the dialog.  This function is intended to only be called
 * by init.
 * @private
 */
rpf.ExportDialog.prototype.initStaticHandlers_ = function() {
  // State changing button handlers
  var element = this.elements_[rpf.ExportDialog.Id_.ADD];
  this.handlersStatic_.listen(element, goog.events.EventType.CLICK,
                              goog.bind(this.handleAdd_, this));
};


/**
 * Returns whether or not the dialog is ready and usable.
 * @return {boolean} Is ready.
 */
rpf.ExportDialog.prototype.isReady = function() {
  return this.ready_;
};


/**
 * Creates a row for the url/page map table.
 * @param {string} url The url pattern.
 * @param {string} name The page's name.
 * @param {Element} element The table's body element to add to.
 * @param {boolean=} opt_first Whether or not the new row should be appended as
 *     the first row (if true) or the last row (if false).  Defaults to false.
 * @private
 */
rpf.ExportDialog.prototype.generateUrlPageMapRow_ = function(url,
                                                             name,
                                                             element,
                                                             opt_first) {
  var helper = bite.common.mvc.helper;

  var first = opt_first || false;

  // Create a new row by creating a table with soy.
  var table = helper.renderModel(rpf.soy.Dialog.getPageMap,
                                 {'url': url, 'name': name});
  if (!table) {
    console.error('ERROR (rpf.ExportDialog.generateUrlPageMapRow_): Failed ' +
                  'to create table.');
    return;
  }

  // Retrieve key elements from the table.
  var row = helper.getElement('export-page-map-row', table);
  var close = helper.getElement('export-page-map-close', table);
  if (!row || !close) {
    console.error('ERROR (rpf.ExportDialog.generateUrlPageMapRow_): New ' +
                  'table does not contain required elements.');
    return;
  }

  // Remove the row from the table and add it to the table within the document.
  goog.dom.removeNode(row);
  if (first) {
    goog.dom.insertChildAt(element, row, 0);
  } else {
    element.appendChild(row);
  }

  // Create a listener for the close button
  var closeObject = {};
  var closeFunc = function() {
    goog.events.unlistenByKey(closeObject.listenerKey);
    goog.dom.removeNode(row);

    // Clear references
    closeObject = null;
    row = null;
  };

  try {
    var key = goog.events.listen(close, goog.events.EventType.CLICK,
                                 closeFunc);
    if (!key) {
      throw 'Failed to create listener; returned null.';
    }
    closeObject.listenerKey = key;
  } catch (error) {
    console.error('ERROR (rpf.ExportDialog.generateUrlPageMapRow_): Failed ' +
                  'to create listener for close button.');
    return;
  }
};


/**
 * Loops over the url/page map elements and extracts a url/page map.
 * @return {!Object} The current url/page map.
 * @private
 */
rpf.ExportDialog.prototype.getUrlPageMap_ = function() {
  var urlPageMap = {};

  var rows = this.elements_[rpf.ExportDialog.Id_.PAGE_TABLE_BODY].rows;
  for (var i = 0, len = rows.length; i < len; ++i) {
    var children = rows[i].children;
    var url = children[0].children[0].value;
    var pageName = children[1].children[0].value;

    if (!url || !pageName) {
      continue;
    }

    urlPageMap[url] = pageName;
  }

  return urlPageMap;
};


/**
 * Opens a page and downloads the zip file.
 * @param {Object} response The response object.
 * @private
 */
rpf.ExportDialog.prototype.getZip_ = function(response) {
  var url = response['url'];
  goog.global.window.open(url);
};


/**
 * Handles the pressing of the plus button that adds a new url/page mapping
 * to the table of mappings.  The new mapping begins empty and the user can
 * add relevant information.
 * @private
 */
rpf.ExportDialog.prototype.handleAdd_ = function() {
  var urlPageMapElement = this.elements_[rpf.ExportDialog.Id_.PAGE_TABLE_BODY];
  this.generateUrlPageMapRow_('', '', urlPageMapElement, true);
};


/**
 * Exports the generated Java files by downloading a zip.
 * @param {Object} data The consolidated data.
 * @private
 */
rpf.ExportDialog.prototype.exportAsJavaFilesZip_ = function(data) {
  var dataModel = new rpf.DataModel();
  var processedData = dataModel.convertDataToRaw(data || {});
  var pages = bite.webdriver.getWebdriverCode(processedData);
  var files = {};
  for (var pageName in pages) {
    var filename = pageName + '.java';
    var page = pages[pageName];
    files[filename] = page;
  }
  this.downloadZip_(files);
};


/**
 * Exports the generated data model by downloading a zip.
 * @param {string} dataFile The data model file content.
 * @private
 */
rpf.ExportDialog.prototype.exportAsDataModelZip_ = function(dataFile) {
  var files = {};
  files['data.rpf'] = dataFile;
  this.downloadZip_(files);
};


/**
 * Sends the files object to server to download a zip.
 * @param {Object.<string, string>} files It contains the file name and the
 *     corresponding file content.
 * @private
 */
rpf.ExportDialog.prototype.downloadZip_ = function(files) {
  var command = {
    'command': Bite.Constants.CONSOLE_CMDS.SAVE_ZIP,
    'params': {'files': files}
  };
  var messenger = rpf.Console.Messenger.getInstance();
  messenger.sendMessage(command, goog.bind(this.getZip_, this));
};


/**
 * Handles the clicking of the import button. By default, it will send a ping
 * to local server and try to import the project defined in data.rpf, and
 * then save the project to localStorage for further manipulation.
 * @private
 */
rpf.ExportDialog.prototype.handleImport_ = function() {
  var ids = rpf.ExportDialog.Id_;
  var command = {
    'command': Bite.Constants.CONSOLE_CMDS.LOAD_PROJECT_FROM_LOCAL_SERVER,
    'params': {'path': this.elements_[ids.JAVA_PACKAGE_IMPORT].value}
  };
  var messenger = rpf.Console.Messenger.getInstance();
  messenger.sendMessage(command, goog.bind(this.onImportCallback_, this));
  var statusLogger = rpf.StatusLogger.getInstance();
  statusLogger.setStatus('Importing the project from your client...');
};


/**
 * Handles the clicking of the import button. By default, it will send a ping
 * to local server and try to import the project defined in data.rpf, and
 * then save the project to localStorage for further manipulation.
 * @private
 */
rpf.ExportDialog.prototype.onImportCallback_ = function(response) {
  // Updates the status for saving the project locally.
  var statusLogger = rpf.StatusLogger.getInstance();
  statusLogger.setStatusCallback(response);
  // If the project was successfully loaded, load it in the console.
  if (response['project']) {
    this.onUiEvents_(Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_PROJECT,
        {'isWeb': false,
         'project': response['project']},
        /** @type {Event} */ ({}));
  }
};


/**
 * Handles the clicking of the export button.  The clicked will pass the
 * necessary data to the translation component.  While exporting the
 * project the dialog will become non-responsive except for the close button on
 * the dialog.  There is no stopping the translation/download process once
 * started.
 * @private
 */
rpf.ExportDialog.prototype.handleExport_ = function() {
  var name = this.projectName_;
  if (!name) {
    rpf.StatusLogger.getInstance().setStatus(
        'Please load a project first.', 'red');
    return;
  }

  var dataModel = new rpf.DataModel();
  var result = dataModel.consolidateData(
      {'name': this.projectName_,
       'tests': this.data_['tests'],
       'project_details': this.data_['project_details']});
  var data = result['data'];
  var jsFiles = result['jsFiles'];

  var printer = new goog.format.JsonPrettyPrinter(null);
  var dataFile = printer.format(data);

  var requestUrl = rpf.MiscHelper.getUrl('http://localhost:7171', '', {});

  var pageMap = this.elements_[rpf.ExportDialog.Id_.JAVA_PACKAGE_PATH].value;

  var parameters = goog.Uri.QueryData.createFromMap(
      {'command': 'replaceDatafile',
       'datafilePath': pageMap.split('.').join('/'),
       'fileName': 'data.rpf',
       'jsFiles': jsFiles,
       'content': dataFile}).toString();

  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      rpf.StatusLogger.getInstance().setStatus(xhr.getResponseText());
    } else {
      // If it fails, we assume the local server is not ready, so we will
      // send files to the server and then await its response to pull the zip
      // down to the local machine.
      var msg = xhr.getResponseText() || 'Local server is not ready...';
      rpf.StatusLogger.getInstance().setStatus(msg, 'red');
      this.exportAsDataModelZip_(dataFile);
    }
  }, this), 'POST', parameters);
};


/**
 * Handles the clicking of the save button.  When pressed the current project
 * details will be formed into an object and sent to the server to be saved.
 * @private
 */
rpf.ExportDialog.prototype.handleSave_ = function() {
  var name = this.projectName_;
  if (!name) {
    rpf.StatusLogger.getInstance().setStatus(
        'Please load a project first.', 'red');
    return;
  }

  rpf.StatusLogger.getInstance().setStatus(rpf.StatusLogger.SAVING, '#777');

  // Disable dialog elements
  for (var key in rpf.ExportDialog.Id_) {
    var id = rpf.ExportDialog.Id_[key];
    var element = this.elements_[id];
    element.setAttribute('disabled', 'disabled');
  }

  var urlPageMap = this.getUrlPageMap_();
  var ids = rpf.ExportDialog.Id_;
  var wdPage = this.elements_[ids.JAVA_PACKAGE_PATH].value || '';
  var interval = this.elements_[ids.INTERVAL].value || '';
  var params = {'interval': interval,
                'waitVisible': interval ? false : true};

  var details = {
    'page_map': goog.json.serialize(urlPageMap),
    'params': goog.json.serialize(params),
    'java_package_path': wdPage
  };

  var data = {
    'command': '',
    'params': {
      'name': name,
      'data': goog.json.serialize(details)
    }
  };

  var location = this.getStorageLocation_();
  if ('web' == location) {
    data['command'] = Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT;
  } else {
    data['command'] = Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT_METADATA_LOCALLY;
  }

  rpf.Console.Messenger.getInstance().sendMessage(data,
      goog.bind(this.handleSaveComplete_, this, name));
};


/**
 * Handles the response from the server after a request to save the project
 * details.
 * @param {string} name The name of the project that is being saved.
 * @param {Object} responseObj The object returned from the request.
 * @private
 */
rpf.ExportDialog.prototype.handleSaveComplete_ = function(name, responseObj) {
  // Enable dialog elements
  for (var key in rpf.ExportDialog.Id_) {
    var id = rpf.ExportDialog.Id_[key];
    var element = this.elements_[id];
    if (element.hasAttribute('disabled')) {
      element.removeAttribute('disabled');
    }
  }

  // Process response
  if (!responseObj || !('success' in responseObj) || !responseObj['success']) {
    rpf.StatusLogger.getInstance().setStatus(rpf.StatusLogger.SAVE_FAILED,
                                             'red');
  } else {
    rpf.StatusLogger.getInstance().setStatus(rpf.StatusLogger.SAVE_SUCCESS,
                                             'green');
  }
};


/**
 * Clears the project info dialog UI.
 * @private
 */
rpf.ExportDialog.prototype.clear_ = function() {
  //Clear major elements
  this.elements_[rpf.ExportDialog.Id_.TEST_DATA].innerHTML = '';
  this.elements_[rpf.ExportDialog.Id_.PAGE_TABLE_BODY].innerHTML = '';
  this.elements_[rpf.ExportDialog.Id_.JAVA_PACKAGE_PATH].value = '';
};


/**
 * Handles the response from the server after a request to load the project
 * details and tests.
 * @param {string} name The name of the project that is being saved.
 * @param {function()} callback The callback function.
 * @param {Object} responseObj The object returned from the request.
 */
rpf.ExportDialog.prototype.requestDataComplete = function(
    name, callback, responseObj) {
  var statusLogger = rpf.StatusLogger.getInstance();
  this.clear_();

  // Enable dialog elements
  for (var key in rpf.ExportDialog.Id_) {
    var id = rpf.ExportDialog.Id_[key];
    var element = this.elements_[id];
    if (element.hasAttribute('disabled')) {
      element.removeAttribute('disabled');
    }
  }

  // Process response
  // Check response data for appropriate major components; project_details and
  // tests.
  this.data_ = 'jsonObj' in responseObj ? responseObj['jsonObj'] : null;
  // If an error occurs during communication then the object will have an
  // error key added to the response.
  if (!this.data_ || 'error' in this.data_) {
    this.data_ = null;
    statusLogger.setStatus(rpf.StatusLogger.PROJECT_NOT_FOUND, 'red');
    return;
  }

  var details =
      'project_details' in this.data_ ? this.data_['project_details'] : null;
  if (!details) {
    this.data_ = null;
    statusLogger.setStatus(rpf.StatusLogger.PROJECT_MISSING_DETAILS, 'red');
    return;
  }

  if (!('page_map' in details && 'java_package_path' in details)) {
    this.data_ = null;
    statusLogger.setStatus(rpf.StatusLogger.PROJECT_MISSING_DETAILS, 'red');
    return;
  }

  try {
    var typeOfPageMap = typeof details['page_map'];
    if ('object' == typeOfPageMap) {
      details['page_map'] = details['page_map'];
    } else if ('string' == typeOfPageMap) {
      details['page_map'] =
          /** @type {!Object} */ (goog.json.parse(details['page_map']));
    } else {
      statusLogger.setStatus('Incorrect page map argument.', 'red');
      throw new Error();
    }

    // Update the url/page map for all project data.  When generating the
    // webdriver code, the reference to the url/page map is updated.  Thus
    // the generated code is thrown away but the mapping is updated.
    bite.webdriver.getWebdriverCode(this.data_);
  } catch (error) {
    this.data_ = null;
    statusLogger.setStatus('Parse json failed.');
    console.error('ERROR (rpf.ExportDialog.requestDataComplete_): Failed to ' +
                  'parse json for url/page map: ' + error);
    return;
  }

  var tests = 'tests' in this.data_ ? this.data_['tests'] : null;
  if (!tests) {
    this.data_ = null;
    statusLogger.setStatus(rpf.StatusLogger.PROJECT_NO_TESTS, 'red');
    return;
  }

  // Get list of test names and update appropriate dialog element with data.
  var names = [];
  var ids = [];

  goog.array.sortObjectsByKey(tests, 'test_name');
  for (var i = 0; i < tests.length; ++i) {
    names.push(tests[i]['test_name']);
    var temp = tests[i]['id'];
    if (temp) {
      ids.push(temp);
    }
  }
  this.ids_ = ids;

  var testElement = this.elements_[rpf.ExportDialog.Id_.TEST_DATA];
  bite.common.mvc.helper.renderModelFor(testElement,
                                        rpf.soy.Dialog.getTests,
                                        {'tests': names});

  // Set page/url mappings
  var urlPageMap = details['page_map'];
  var urls = [];
  for (var key in urlPageMap) {
    urls.push(key);
  }
  urls = urls.sort().reverse();

  var urlPageMapElement = this.elements_[rpf.ExportDialog.Id_.PAGE_TABLE_BODY];
  for (var i = 0, len = urls.length; i < len; ++i) {
    var url = urls[i];
    var pageName = urlPageMap[url];
    this.generateUrlPageMapRow_(url, pageName, urlPageMapElement);
  }

  // Set webdriver configuration
  var javaPackagePath = this.elements_[rpf.ExportDialog.Id_.JAVA_PACKAGE_PATH];
  javaPackagePath.value = details['java_package_path'];
  javaPackagePath = this.elements_[rpf.ExportDialog.Id_.JAVA_PACKAGE_IMPORT];
  javaPackagePath.value= details['java_package_path'];

  if (details['params']) {
    var codeParams = goog.json.parse(details['params']);
    var intervalInput = this.elements_[rpf.ExportDialog.Id_.INTERVAL];
    intervalInput.value = codeParams['interval'] ? codeParams['interval'] : '';
  }

  this.setProjectName_(details['name']);

  statusLogger.setStatus(rpf.StatusLogger.LOAD_TEST_SUCCESS, 'green');
  var messenger = rpf.Console.Messenger.getInstance();
  messenger.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.PROJECT_LOADED_IN_EXPORT);
  callback();
};


/**
 * Sets the visibility of the export dialog.
 * @param {boolean} display Whether or not to show the dialog.
 */
rpf.ExportDialog.prototype.setVisible = function(display) {
  if (this.isReady()) {
    this.dialog_.setVisible(display);
  }
};


/**
 * Sets the project name.
 * @param {string} projectName The project name.
 * @private
 */
rpf.ExportDialog.prototype.setProjectName_ = function(projectName) {
  this.projectName_ = projectName;
};


/**
 * Sets the location.
 * @param {string} location The location.
 */
rpf.ExportDialog.prototype.setLocation = function(location) {
  this.location_ = location;
};


/**
 * Gets the storage location.
 * @return {string} The storage location.
 * @private
 */
rpf.ExportDialog.prototype.getStorageLocation_ = function() {
  return this.location_;
};

