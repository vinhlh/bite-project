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
 * @fileoverview This file contains the console manager.
 * TODO(phu): Add potential garbage collection methods for the UI elements.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.ConsoleManager');
goog.provide('rpf.ConsoleManager.ModeInfo');

goog.require('Bite.Constants');
goog.require('bite.base.Helper');
goog.require('bite.closure.Helper');
goog.require('bite.client.Templates.rpfConsole');
goog.require('bite.console.Helper');
goog.require('bite.locators.Updater');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.positioning.AnchoredViewportPosition');
goog.require('goog.positioning.ClientPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarSeparator');
goog.require('rpf.CodeGenerator');
goog.require('rpf.ConsoleLogger');
goog.require('rpf.DetailsDialog');
goog.require('rpf.EditorManager');
goog.require('rpf.ExportDialog');
goog.require('rpf.InfoDialog');
goog.require('rpf.LoaderDialog');
goog.require('rpf.MiscHelper');
goog.require('rpf.NotesDialog');
goog.require('rpf.PlayDialog');
goog.require('rpf.QuickCmdDialog');
goog.require('rpf.SaveDialog');
goog.require('rpf.ScreenShotDialog');
goog.require('rpf.SettingDialog');
goog.require('rpf.StatusLogger');
goog.require('rpf.Tests');
goog.require('rpf.ValidateDialog');
goog.require('rpf.soy.Dialog');



/**
 * A class for handling console related functions.
 * @param {boolean=} opt_noConsole Whether ConsoleManager is constructed with
 *     rpf Console UI or not.
 * @constructor
 * @export
 */
rpf.ConsoleManager = function(opt_noConsole) {
  /**
   * The messenger.
   * @type {rpf.Console.Messenger}
   * @private
   */
  this.messenger_ = rpf.Console.Messenger.getInstance();

  /**
   * The locator updater.
   * @type {bite.locators.Updater}
   * @private
   */
  this.locatorUpdater_ = null;

  /**
   * The screenshot dialog.
   * @type {rpf.ScreenShotDialog}
   * @private
   */
  this.screenshotDialog_ = new rpf.ScreenShotDialog();


  /**
   * The recorded script.
   * @type {string}
   * @private
   */
  this.recordedScript_ = '';

  /**
   * The status logger.
   * @type {rpf.StatusLogger}
   * @private
   */
  this.statusLogger_ = rpf.StatusLogger.getInstance();

  /**
   * The project info object, which for now includes an array of json test info,
   * and will include more project specific info like url/PageName mapper and
   * package name, etc. later.
   * @type {Object}
   * @private
   */
  this.projectInfo_ = new rpf.Tests();

  /**
   * The info map.
   * @type {Object}
   * @private
   */
  this.infoMap_ = {};

  /**
   * The user id.
   * @type {string}
   * @private
   */
  this.userId_ = '';

  /**
   * Whether ConsoleManager is constructed with rpf Console UI or not.
   * @type {boolean}
   * @private
   */
  this.noConsole_ = !!opt_noConsole;

  /**
   * What additional information should be shown about the project. This
   * info will be shown below the toolbar.
   * @type {Bite.Constants.RpfConsoleInfoType}
   * @private
   */
  this.moreInfoState_ = Bite.Constants.RpfConsoleInfoType.NONE;

  /**
   * Manages the updating all similar elements.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.updateAllHandler_ = new goog.events.EventHandler();

  /**
   * Manages resizes of the window.
   * @type {goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.viewportSizeMonitor_ = new goog.dom.ViewportSizeMonitor();

  /**
   * Project names in web.
   * @type {Array.<string>}
   * @private
   */
  this.projectNames_ = [];

  /**
   * The script before adding/modifying.
   * @type {string}
   * @private
   */
  this.initialScript_ = '';

  if (!this.noConsole_) {
    this.init_();
  }
};
goog.addSingletonGetter(rpf.ConsoleManager);


/**
 * Sets the initial script.
 * @private
 */
rpf.ConsoleManager.prototype.saveScript_ = function() {
  this.initialScript_ = this.editorMngr_.getOriginalCode();
};


/**
 * Gets the initial script.
 * @return {string} The script.
 */
rpf.ConsoleManager.prototype.getScript = function() {
  return this.initialScript_;
};


/**
 * Checks whether the script needs to be saved.
 * @return {boolean} Whether the script needs to be saved.
 * @private
 */
rpf.ConsoleManager.prototype.needSave_ = function() {
  var codeInEditor = this.editorMngr_.getOriginalCode();
  return codeInEditor != this.initialScript_;
};


/**
 * Inits the console manager's UI.
 * @private
 */
rpf.ConsoleManager.prototype.init_ = function() {
  this.initUI_();

  var toolbar = new goog.ui.Toolbar();

  this.setButton(rpf.ConsoleManager.Buttons.ADD_TEST,
                 'Add a new script',
                 toolbar,
                 Bite.Constants.UiCmds.ADD_NEW_TEST);

  this.setButton(rpf.ConsoleManager.Buttons.LOAD,
                 'Toggle Project/Script panel',
                 toolbar,
                 Bite.Constants.UiCmds.LOAD_CMDS);

  this.setButton(rpf.ConsoleManager.Buttons.SAVE,
                 'Save your script',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_SAVE_DIALOG);

  this.setButton(rpf.ConsoleManager.Buttons.EXPORT,
                 'Project details',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_EXPORT);

  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  this.setButton(rpf.ConsoleManager.Buttons.PLAY,
                 'Run your script',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_PLAYBACK_RUNTIME);
  this.setButton(rpf.ConsoleManager.Buttons.RECORD,
                 'Record your interaction',
                 toolbar,
                 Bite.Constants.UiCmds.START_RECORDING);
  this.setButton(rpf.ConsoleManager.Buttons.STOP,
                 'Stop recording',
                 toolbar,
                 Bite.Constants.UiCmds.STOP_RECORDING);

  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  this.setButton(rpf.ConsoleManager.Buttons.NOTES,
                 'Show custom Javascript functions',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_NOTES);
  this.setButton(rpf.ConsoleManager.Buttons.INFO,
                 'Show the logs',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_INFO);
  this.setButton(rpf.ConsoleManager.Buttons.SCREEN,
                 'View the captured screenshots',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_SCREENSHOT);
  this.setButton(rpf.ConsoleManager.Buttons.ADD_CMD,
                 'Show the quick command dialog',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_QUICK_CMDS);
  this.setButton(rpf.ConsoleManager.Buttons.WORKER,
                 'Switch to worker mode',
                 toolbar,
                 Bite.Constants.UiCmds.START_WORKER_MODE);
  this.setButton(rpf.ConsoleManager.Buttons.SETTING,
                 'Show the settings dialog',
                 toolbar,
                 Bite.Constants.UiCmds.SHOW_SETTING);

  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  this.setButton(rpf.ConsoleManager.Buttons.CONTENT_MAP,
                 'Show the content map',
                 toolbar,
                 Bite.Constants.UiCmds.TOGGLE_CONTENT_MAP);

  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  this.setButton(rpf.ConsoleManager.Buttons.REFRESH,
                 'Refresh the rpf console',
                 toolbar,
                 Bite.Constants.UiCmds.ON_CONSOLE_REFRESH);

  // Allow the content map and project info buttons to have a 'selected' state.
  this.btns_[rpf.ConsoleManager.Buttons.CONTENT_MAP].setSupportedState(
      goog.ui.Component.State.SELECTED, true)
  this.btns_[rpf.ConsoleManager.Buttons.LOAD].setSupportedState(
      goog.ui.Component.State.SELECTED, true)

  this.modeSelector_ = this.getModeSelector_();
  toolbar.render(goog.dom.getElement('console_toolbar'));

  this.changeMode(Bite.Constants.ConsoleModes.IDLE);

  this.checkLocationAndSetProjects_();

  goog.events.listen(
      window,
      'keydown',
      goog.bind(this.onUiEvents,
                this,
                Bite.Constants.UiCmds.ON_KEY_DOWN,
                {}));
  goog.events.listen(
      window,
      'keyup',
      goog.bind(this.onUiEvents,
                this,
                Bite.Constants.UiCmds.ON_KEY_UP,
                {}));

  goog.events.listen(
      goog.dom.getElement('location-local'),
      'click',
      goog.bind(this.checkLocationAndSetProjects_, this));

  goog.events.listen(
      goog.dom.getElement('location-web'),
      'click',
      goog.bind(this.checkLocationAndSetProjects_, this));

  goog.global.window.focus();
  chrome.extension.onRequest.addListener(
      goog.bind(this.makeConsoleCall, this));

  this.viewportSizeMonitor_.addEventListener(goog.events.EventType.RESIZE,
                                             goog.bind(this.onResize_, this));

  this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.NONE);
};


/**
 * Checks the location and set the project names.
 * @private
 */
rpf.ConsoleManager.prototype.checkLocationAndSetProjects_ = function() {
  var location = this.loaderDialog_.getStorageLocation();
  var command = location == rpf.LoaderDialog.Locations.WEB ?
                Bite.Constants.CONSOLE_CMDS.GET_PROJECT_NAMES_FROM_WEB :
                Bite.Constants.CONSOLE_CMDS.GET_PROJECT_NAMES_FROM_LOCAL;
  this.messenger_.sendMessage(
      {'command': command,
       'params': {}},
      goog.bind(this.setProjectNames_, this));
};


/**
 * Set local project names and requests for web project names.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.setProjectNames_ = function(response) {
  this.projectNames_ = response['names'];
  this.resetProjectNames_(this.projectNames_);
};


/**
 * Resets the project names.
 * @param {Array} names The project names.
 * @private
 */
rpf.ConsoleManager.prototype.resetProjectNames_ = function(names) {
  bite.closure.Helper.removeItemsFromSelector(this.projectSelector_);
  bite.closure.Helper.addItemsToSelector(this.projectSelector_, names);
  this.addCustomMethods_(this.projectSelector_);
};


/**
 * Initializes Console Manager's UI parameters.
 * @private
 */
rpf.ConsoleManager.prototype.initUI_ = function() {
 /**
   * Whether or not is recording.
   * @type {boolean}
   * @private
   */
  this.isRecording_ = false;

  /**
   * Whether or not is playing back.
   * @type {boolean}
   * @private
   */
  this.isPlaying_ = false;

  /**
   * The current mode.
   * @type {Bite.Constants.ConsoleModes}
   * @private
   */
  this.mode_ = Bite.Constants.ConsoleModes.IDLE;

  /**
   * The buttons displayed on console UI.
   * @type {Object}
   * @private
   */
  this.btns_ = {};

  /**
   * The modeInfo static object.
   * @type {rpf.ConsoleManager.ModeInfo}
   * @private
   */
  this.modeInfo_ = new rpf.ConsoleManager.ModeInfo();

  /**
   * The line number that should be highlighted.
   * @type {number}
   * @private
   */
  this.lineHighlighted_ = -1;

  /**
   * The mode selector.
   * @type {Object}
   * @private
   */
  this.modeSelector_ = null;

  /**
   * The current view mode.
   * @type {Bite.Constants.ViewModes}
   * @private
   */
  this.viewMode_ = Bite.Constants.ViewModes.CODE;

  /**
   * The line to be inserted.
   * @type {number}
   * @private
   */
  this.lineToInsert_ = -1;

  /**
   * The editor manager.
   * @type {rpf.EditorManager}
   * @private
   */
  this.editorMngr_ = new rpf.EditorManager(
      Bite.Constants.RpfConsoleId.SCRIPTS_CONTAINER,
      goog.bind(this.fetchDataFromBackground_, this),
      goog.bind(this.getViewMode, this),
      goog.bind(this.getInfoMap, this));

  goog.events.listen(this.editorMngr_.getContainer(),
                     goog.events.EventType.DBLCLICK,
                     goog.bind(this.popupDetailedInfo_, this));

  /**
   * The notes dialog.
   * @type {rpf.NotesDialog}
   * @private
   */
  this.notesDialog_ = new rpf.NotesDialog(
      this.messenger_, goog.bind(this.onUiEvents, this));

  /**
   * The export dialog.
   * @type {rpf.ExportDialog}
   * @private
   */
  this.exportDialog_ = new rpf.ExportDialog(
      goog.bind(this.onUiEvents, this),
      goog.bind(this.changeProject_, this),
      this.messenger_);
  this.exportDialog_.init();

  /**
   * The quick commands dialog.
   * @type {rpf.QuickCmdDialog}
   * @private
   */
  this.quickDialog_ = new rpf.QuickCmdDialog(
      goog.bind(this.onUiEvents, this));

  /**
   * The loader dialog.
   * @type {rpf.LoaderDialog}
   * @private
   */
  this.loaderDialog_ = new rpf.LoaderDialog(
      this.messenger_,
      goog.bind(this.onUiEvents, this));

  /**
   * The validation dialog.
   * @type {rpf.ValidateDialog}
   * @private
   */
  this.validationDialog_ = new rpf.ValidateDialog(
      this.messenger_,
      goog.bind(this.onUiEvents, this));

  /**
   * The details dialog.
   * @type {rpf.DetailsDialog}
   * @private
   */
  this.detailsDialog_ = new rpf.DetailsDialog(
      this.messenger_,
      goog.bind(this.onUiEvents, this),
      this.editorMngr_,
      this.screenshotDialog_);

  /**
   * The playback dialog.
   * @type {rpf.PlayDialog}
   * @private
   */
  this.playbackRuntimeDialog_ = new rpf.PlayDialog(
      this.messenger_, goog.bind(this.onUiEvents, this));

  /**
   * The setting dialog.
   * @type {rpf.SettingDialog}
   * @private
   */
  this.settingDialog_ = new rpf.SettingDialog(goog.bind(this.onUiEvents, this));

  /**
   * The info dialog.
   * @type {rpf.InfoDialog}
   * @private
   */
  this.infoDialog_ = new rpf.InfoDialog();

  /**
   * The input dialog.
   * @type {goog.ui.Dialog}
   * @private
   */
  this.inputDialog_ = new goog.ui.Dialog();

  /**
   * The project selector.
   * @type {goog.ui.ComboBox}
   * @private
   */
  this.projectSelector_ = null;

  /**
   * The script selector.
   * @type {goog.ui.ComboBox}
   * @private
   */
  this.scriptSelector_ = null;

  /**
   * The last script name typed in.
   * @type {string}
   * @private
   */
  this.lastScriptName_ = '';

  this.boundOnScriptNameChange_ = goog.bind(this.onScriptChangeHandler_, this);

  this.setupProjectInfoUi_();
};


/**
 * Inits the info dialog.
 * @param {string} title The title of the dialog.
 * @param {Element} element The component element to be rendered in the dialog.
 * @private
 */
rpf.ConsoleManager.prototype.openInputDialog_ = function(title, element) {
  var contentElement = this.inputDialog_.getContentElement();
  contentElement.innerHTML = '';
  contentElement.appendChild(element);
  this.inputDialog_.setTitle(title);
  this.inputDialog_.setButtonSet(null);
  this.inputDialog_.setVisible(true);
};


/**
 * Sets up the project info related UI in the main RPF console.
 * @private
 */
rpf.ConsoleManager.prototype.setupProjectInfoUi_ = function() {
  this.projectSelector_ = this.createSelector_(
      [], 'rpf-current-project', 'Enter a project name',
      goog.bind(this.onProjectChangeHandler_, this));
  this.scriptSelector_ = this.createSelector_(
      [], 'testName', 'Enter a script name',
      this.boundOnScriptNameChange_);
  var urlInputCtrl = new goog.ui.LabelInput('Script start URL');
  var startUrlDiv = goog.dom.getElement('startUrlDiv');
  urlInputCtrl.render(startUrlDiv);
  var urlInput = startUrlDiv.querySelector('.label-input-label');
  urlInput.setAttribute('id', 'startUrl');
  goog.style.setStyle(urlInput, {'width': '100%'});
};


/**
 * Adds the custom methods in the popup menu.
 * @param {goog.ui.ComboBox} selector The combo box selector.
 * @private
 */
rpf.ConsoleManager.prototype.addCustomMethods_ = function(selector) {
  var menuItem = new goog.ui.MenuItem('New Name');
  selector.addItemAt(menuItem, 0);
  var contentElem = menuItem.getContentElement();
  goog.style.setStyle(contentElem, {'color': '#D14836'});
  var menuSeparator = new goog.ui.MenuSeparator();
  var menu = selector.getMenu();
  menu.addChildAt(menuSeparator, 1, true);
};


/**
 * Loads the tests in the selector.
 * @param {Function} callback The callback function.
 * @param {boolean} clearTest Whether clears the test name field.
 * @param {boolean} displayMessage Whether displays the message.
 * @param {Array.<string>} names The script names.
 * @param {Object=} opt_response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.loadTestsInSelector_ = function(
    callback, clearTest, displayMessage, names, opt_response) {
  bite.closure.Helper.removeItemsFromSelector(this.scriptSelector_);
  bite.closure.Helper.addItemsToSelector(this.scriptSelector_, names);
  this.addCustomMethods_(this.scriptSelector_);
  if (clearTest) {
    this.scriptSelector_.setValue('');
  }
  if (opt_response && opt_response['success']) {
    if (displayMessage) {
      this.statusLogger_.setStatus(rpf.StatusLogger.LOAD_TEST_SUCCESS, 'green');
    }
    this.exportDialog_.requestDataComplete(
        this.getProjectName_(), goog.nullFunction,
        {'jsonObj': this.loaderDialog_.getCurrentProject()});
    this.exportDialog_.setLocation(this.loaderDialog_.getStorageLocation());
    this.messenger_.sendStatusMessage(
        Bite.Constants.COMPLETED_EVENT_TYPES.PROJECT_LOADED);
    callback();
  } else {
    if (displayMessage) {
      this.statusLogger_.setStatus(rpf.StatusLogger.LOAD_TEST_FAILED, 'red');
    }
  }
};


/**
 * Changes the project..
 * @param {boolean=} opt_noCheck Whether it should check for project exists.
 * @param {Function=} opt_callback The callback function.
 * @private
 */
rpf.ConsoleManager.prototype.changeProject_ = function(
    opt_noCheck, opt_callback) {
  var noCheck = opt_noCheck || false;
  var callback = opt_callback || goog.nullFunction;
  var currentProject = this.getProjectName_();
  var onEnterNewName = goog.bind(this.onEnterNewProjectName_, this);
  var setName = goog.bind(this.setProjectName_, this);
  var params = {'onEnterNewName': onEnterNewName,
                'setName': setName};
  if (this.checkForCustomMethods_(currentProject, params)) {
    return;
  }
  if (noCheck ||
      (currentProject &&
       goog.array.contains(this.projectNames_, currentProject))) {
    this.statusLogger_.setStatus(rpf.StatusLogger.LOAD_TEST, '#777');
    this.loaderDialog_.loadProject(
        currentProject,
        goog.bind(this.loadTestsInSelector_, this, callback, true, true));
  }
};


/**
 * On project name change handler.
 * @param {Event} e The change event.
 * @private
 */
rpf.ConsoleManager.prototype.onProjectChangeHandler_ = function(e) {
  this.changeProject_();
};


/**
 * On a new script name has been entered.
 * @param {Event} e The change event.
 * @private
 */
rpf.ConsoleManager.prototype.onEnterNewScriptName_ = function(e) {
  var newName = goog.dom.getElement('new-name-input').value;
  if (!newName ||
      goog.array.contains(this.loaderDialog_.getTestNames(), newName)) {
    this.statusLogger_.setStatus('Please enter a valid script name', 'red');
    return;
  }
  this.setScriptName_(newName);
  this.inputDialog_.setVisible(false);
};


/**
 * On a new project name has been entered.
 * @param {Event} e The change event.
 * @private
 */
rpf.ConsoleManager.prototype.onEnterNewProjectName_ = function(e) {
  var newName = goog.dom.getElement('new-name-input').value;
  if (!newName ||
      goog.array.contains(this.projectNames_, newName)) {
    this.statusLogger_.setStatus('Please enter a valid project name', 'red');
    return;
  }
  this.setProjectName_(newName);
  this.inputDialog_.setVisible(false);
};


/**
 * On the cancel button is clicked.
 * @param {Event} e The change event.
 * @private
 */
rpf.ConsoleManager.prototype.onCancelNewScriptName_ = function(e) {
  this.inputDialog_.setVisible(false);
};


/**
 * Checks for the custom methods.
 * @param {string} name The option name.
 * @param {Object} params The parameter map.
 * @return {boolean} Whether the given name is a custom method.
 * @private
 */
rpf.ConsoleManager.prototype.checkForCustomMethods_ = function(
    name, params) {
  switch (name) {
    case rpf.ConsoleManager.CustomMethods.ADD_NEW:
      var setNameMethod = params['setName'];
      setNameMethod('');
      var content = soy.renderAsElement(
          rpf.soy.Dialog.getNewNameUi,
          {});
      this.openInputDialog_('New', content);
      goog.events.listen(
          goog.dom.getElement('new-name-submit'),
          goog.events.EventType.CLICK,
          params['onEnterNewName']);
      goog.events.listen(
          goog.dom.getElement('new-name-cancel'),
          goog.events.EventType.CLICK,
          goog.bind(this.onCancelNewScriptName_, this));
      return true;
  }
  return false;
};


/**
 * On script name change handler.
 * @private
 */
rpf.ConsoleManager.prototype.onScriptChangeHandler_ = function() {
  var lastName = this.lastScriptName_;
  var currentScript = this.scriptSelector_.getValue();
  this.lastScriptName_ = currentScript;
  var onEnterNewName = goog.bind(this.onEnterNewScriptName_, this);
  var setName = goog.bind(this.setScriptName_, this);
  var params = {'onEnterNewName': onEnterNewName,
                'setName': setName};
  if (this.checkForCustomMethods_(currentScript, params)) {
    return;
  }
  var id = this.loaderDialog_.getIdByName(currentScript);
  if (goog.array.contains(this.loaderDialog_.getTestNames(), currentScript)) {
    if (this.needSave_()) {
      this.promptSaveDialog_(lastName);
    } else {
      this.loadTest_();
    }
  }
};


/**
 * Prompt the user whether to save the script first.
 * @param {string} lastName The last script name.
 * @private
 */
rpf.ConsoleManager.prototype.promptSaveDialog_ = function(lastName) {
  var content = soy.renderAsElement(
      rpf.soy.Dialog.getSaveScriptConfirmUi,
      {});
  this.openInputDialog_('Confirm', content);
  goog.events.listen(
      goog.dom.getElement('save-script-submit'),
      goog.events.EventType.CLICK,
      goog.bind(this.onContinueLoad_, this));
  goog.events.listen(
      goog.dom.getElement('save-script-cancel'),
      goog.events.EventType.CLICK,
      goog.bind(this.rollbackScriptName_, this, lastName));
};


/**
 * Rolls back to the previously saved name.
 * @param {string} lastName The last name.
 * @private
 */
rpf.ConsoleManager.prototype.rollbackScriptName_ = function(lastName) {
  this.lastScriptName_ = lastName;
  this.setScriptNameStatic_(lastName);
  this.inputDialog_.setVisible(false);
};


/**
 * When users choose to continue loading.
 * @private
 */
rpf.ConsoleManager.prototype.onContinueLoad_ = function(e) {
  this.inputDialog_.setVisible(false);
  this.loadTest_();
};


/**
 * Loads the test.
 * @private
 */
rpf.ConsoleManager.prototype.loadTest_ = function() {
  if (this.isRecording()) {
    this.statusLogger_.setStatus(
        'During recording, can not load a script.', 'red');
    return;
  }
  var currentScript = this.scriptSelector_.getValue();
  this.statusLogger_.setStatus(rpf.StatusLogger.LOAD_TEST, '#777');
  this.loaderDialog_.loadSelectedTest(
      goog.bind(this.loadTestCallback_, this),
      this.getProjectName_(),
      currentScript);
};


/**
 * Creates the project selector for choosing options.
 * @param {Array} options The options to be showed in selector.
 * @param {string} id The id of the div where the selector will be rendered.
 * @param {string} text The default text.
 * @param {Function} callback The callback function.
 * @return {goog.ui.ComboBox} The combobox instance.
 * @private
 */
rpf.ConsoleManager.prototype.createSelector_ = function(
    options, id, text, callback) {
  var selector_ = new goog.ui.ComboBox();
  selector_.setUseDropdownArrow(false);
  selector_.setDefaultText(text);
  for (var i = 0, len = options.length; i < len; ++i) {
    var pName = '';
    var pId = '';
    if (goog.isString(options[i])) {
      pName = options[i];
      pId = options[i];
    } else {
      pName = options[i]['name'];
      pId = options[i]['id'];
    }
    var option = new goog.ui.ComboBoxItem(pName);
    goog.dom.setProperties(/** @type {Element} */ (option), {'id': pId});
    selector_.addItem(option);
  }
  var selectorElem = goog.dom.getElement(id);
  selector_.render(selectorElem);
  var inputElem = selectorElem.querySelector('.label-input-label');
  inputElem.setAttribute('type', 'text');
  goog.style.setStyle(inputElem, {'width': '62%'});
  var menuElem = selectorElem.querySelector('.goog-menu');
  goog.style.setStyle(menuElem, {'max-height': '400px', 'overflow-y': 'auto'});
  goog.events.listen(
      selector_, goog.ui.Component.EventType.CHANGE,
      callback);
  return selector_;
};


/**
 * Handles window resizes.
 * @private
 */
rpf.ConsoleManager.prototype.onResize_ = function() {
  var toolbarSize = 34;
  var infobarSize = 67;
  var infopanelSize = 163;
  var curSize = this.viewportSizeMonitor_.getSize();
  var container = goog.dom.getElement('scriptsContainer');
  if (this.moreInfoState_ == Bite.Constants.RpfConsoleInfoType.NONE) {
    goog.style.setSize(
        container,
        curSize.width,
        curSize.height - (toolbarSize + infobarSize));
  } else {
    goog.style.setSize(
        container,
        curSize.width,
        curSize.height - (toolbarSize + infobarSize + infopanelSize));
  }
  this.screenshotDialog_.resize();
  this.notesDialog_.resize();
  this.editorMngr_.resize();
};


/**
 * Fetches init data from background.
 * @private
 */
rpf.ConsoleManager.prototype.fetchDataFromBackground_ = function() {
  this.messenger_.sendMessage(
    {'command': Bite.Constants.CONSOLE_CMDS.FETCH_DATA_FROM_BACKGROUND,
     'params': {}},
    goog.bind(this.fetchDataFromBackgroundCallback_, this));
};


/**
 * Fetches init data from background callback.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.fetchDataFromBackgroundCallback_ = function(
    response) {
  this.userId_ = response['userId'];
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.RPF_CONSOLE_OPENED);
};


/**
 * Gets the mode selector control.
 * @return {goog.ui.ToolbarSelect} The mode selector.
 * @private
 */
rpf.ConsoleManager.prototype.getModeSelector_ = function() {
  var modeMenu = new goog.ui.Menu();
  var codeOption = new goog.ui.Option('Code');
  var readOption = new goog.ui.Option('Readable');
  var bookOption = new goog.ui.Option('Book');
  var updaterOption = new goog.ui.Option('Updater');
  modeMenu.addChild(codeOption, true);
  modeMenu.addChild(readOption, true);
  modeMenu.addChild(bookOption, true);
  modeMenu.addChild(updaterOption, true);
  var modeSelector = new goog.ui.ToolbarSelect('Mode', modeMenu);
  modeSelector.setSelectedIndex(0);
  goog.events.listen(
      codeOption,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.selectViewCodeMode_, this));
  goog.events.listen(
      readOption,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.selectViewReadableMode_, this));
  goog.events.listen(
      bookOption,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.selectViewBookMode_, this));
  goog.events.listen(
      updaterOption,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.selectUpdaterMode_, this));
  return modeSelector;
};


/**
 * Adds a tooblar button.
 * @param {rpf.ConsoleManager.Buttons} btn The buttons displayed on console UI.
 * @param {string} tooltip Tool tip for the toolbar button.
 * @param {goog.ui.Toolbar} toolbar The toolbar to add buttons on.
 * @param {Bite.Constants.UiCmds} uiCmd The corresponding message.
 * @export
 */
rpf.ConsoleManager.prototype.setButton = function(
    btn, tooltip, toolbar, uiCmd) {
  var toolbarItem = new goog.ui.ToolbarButton(goog.dom.getElement(btn));
  toolbarItem.setTooltip(tooltip);
  this.btns_[btn] = toolbarItem;
  toolbar.addChild(toolbarItem, true);
  goog.events.listen(
      toolbarItem.getElement(),
      goog.events.EventType.CLICK,
      goog.bind(this.onUiEvents,
                this,
                uiCmd,
                {}));
};


/**
 * Event handler for calls from background world.
 * @param {Object} request The request object.
 * @param {MessageSender} sender The sender object.
 * @param {function(Object)=} opt_callback The callback function.
 * @export
 */
rpf.ConsoleManager.prototype.makeConsoleCall = function(
    request, sender, opt_callback) {
  this.logInfo('Got this message: ' + request['command']);
  this.handleMessages_(
      request['command'], request['params'], opt_callback);
};


/**
 * Handles the events happened on UI.
 * @param {Bite.Constants.UiCmds} uiCmd The message of the event.
 * @param {Object} params The params object.
 * @param {Event} event The event object.
 * @param {function(Object)=} opt_callback The optional callback function.
 * @export
 */
rpf.ConsoleManager.prototype.onUiEvents = function(
    uiCmd, params, event, opt_callback) {
  params['event'] = event;
  this.handleMessages_(uiCmd, params, opt_callback);
};


/**
 * Handles the messages to control the actions on UI.
 * @param {Bite.Constants.UiCmds} uiCmd The command will be performed on UI.
 * @param {Object} params The params object.
 * @param {function(Object)=} opt_callback The optional callback function.
 * @private
 */
rpf.ConsoleManager.prototype.handleMessages_ = function(
    uiCmd, params, opt_callback) {
  switch (uiCmd) {
    // For the console helper.
    case Bite.Constants.UiCmds.GENERATE_CUSTOMIZED_FUNCTION_CALL:
      var value = '';
      this.quickDialog_.writeCmd(
          rpf.QuickCmdDialog.Commands.FUNCTION, value);
      break;

    // For the details dialog.
    case Bite.Constants.UiCmds.UPDATE_HIGHLIGHT_LINE:
      this.updateHighlightLine(params['lineNum']);
      break;
    case Bite.Constants.UiCmds.ON_PREV_PAGE:
      this.findPrevCmd(this.detailsDialog_.getCurLineNum());
      break;
    case Bite.Constants.UiCmds.ON_NEXT_PAGE:
      this.findNextCmd(this.detailsDialog_.getCurLineNum());
      break;
    case Bite.Constants.UiCmds.ON_EDIT_CMD:
      this.detailsDialog_.onEditCmd();
      break;
    case Bite.Constants.UiCmds.ON_CMD_MOVE_UP:
      this.detailsDialog_.onCmdMoveUp();
      break;
    case Bite.Constants.UiCmds.ON_CMD_MOVE_DOWN:
      this.detailsDialog_.onCmdMoveDown();
      break;
    case Bite.Constants.UiCmds.ON_INSERT_ABOVE:
      this.detailsDialog_.setVisible(false);
      this.setLineToInsert(this.detailsDialog_.getCurLineNum());
      this.startRecording();
      break;
    case Bite.Constants.UiCmds.ON_INSERT_BELOW:
      this.detailsDialog_.setVisible(false);
      this.setLineToInsert(this.detailsDialog_.getCurLineNum() + 1);
      this.startRecording();
      break;
    case Bite.Constants.UiCmds.ON_REMOVE_CUR_LINE:
      this.detailsDialog_.onRemoveCurLine();
      break;

    // For the playback dialog.
    case Bite.Constants.UiCmds.AUTOMATE_PLAY_MULTIPLE_TESTS:
      this.playbackRuntimeDialog_.setVisible(true);
      this.playbackRuntimeDialog_.automateDialog(params['testInfo']);
      this.messenger_.sendStatusMessage(
          Bite.Constants.COMPLETED_EVENT_TYPES.RUN_PLAYBACK_STARTED);
      break;
    case Bite.Constants.UiCmds.UPDATE_COMMENT:
      this.playbackRuntimeDialog_.updateComment(
          params['id'], params['comment']);
      break;
    case Bite.Constants.UiCmds.UPDATE_ELEMENT_AT_LINE:
      this.updateElementAtLine_(
          params['line'], params['cmdMap'], opt_callback || goog.nullFunction);
      break;
    case Bite.Constants.UiCmds.SET_PLAYBACK_ALL:
      this.startPlayback(Bite.Constants.PlayMethods.ALL);
      this.playbackRuntimeDialog_.setPlaybackAll();
      break;
    case Bite.Constants.UiCmds.SET_PLAYBACK_STEP:
      this.playbackRuntimeDialog_.setPlaybackStep();
      this.startPlayback(Bite.Constants.PlayMethods.STEP);
      break;
    case Bite.Constants.UiCmds.SET_PLAYBACK_PAUSE:
      this.playbackRuntimeDialog_.setPlaybackPause(params['uiOnly']);
      break;
    case Bite.Constants.UiCmds.SET_PLAYBACK_STOP:
      this.playbackRuntimeDialog_.setPlaybackStop();
      break;
    case Bite.Constants.UiCmds.SET_PLAYBACK_STOP_ALL:
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.STOP_GROUP_TESTS,
           'params': {}});
      this.playbackRuntimeDialog_.setPlaybackStop();
      break;
    case Bite.Constants.UiCmds.SET_FINISHED_TESTS_NUMBER:
      this.playbackRuntimeDialog_.setFinishedNumber(params['num']);
      break;
    case Bite.Constants.UiCmds.DELETE_CMD:
      var lineNum = this.playbackRuntimeDialog_.deleteCmd();
      this.getEditorManager().removeCurrentLine(lineNum - 1);
      break;
    case Bite.Constants.UiCmds.FAIL_CMD:
      this.playbackRuntimeDialog_.failCmd();
      break;
    case Bite.Constants.UiCmds.OVERRIDE_CMD:
      this.playbackRuntimeDialog_.overrideCmd();
      break;
    case Bite.Constants.UiCmds.UPDATE_CMD:
      this.playbackRuntimeDialog_.updateCmd();
      break;
    case Bite.Constants.UiCmds.INSERT_CMD:
      var lineNum = this.playbackRuntimeDialog_.insertCmd();
      this.setLineToInsert(lineNum);
      break;

    // For the validation dialog.
    case Bite.Constants.UiCmds.DISPLAY_ALL_ATTRIBUTES:
      this.validationDialog_.displayAllAttributes();
      break;

    case Bite.Constants.UiCmds.SAVE_TEST:
      this.saveTest();
      break;

    // For the quick command dialog.
    case Bite.Constants.UiCmds.UPDATE_INVOKE_SELECT:
      this.quickDialog_.updateInvokeSelect(params['names'], params['ids']);
      this.playbackRuntimeDialog_.updateTestSelection(
          params['names'], params['ids']);
      break;

    // For the load dialog.
    case Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_TEST:
      this.automateLoadDialog_(
          params['isWeb'],
          params['project'],
          params['test'],
          goog.nullFunction);
      break;
    case Bite.Constants.UiCmds.AUTOMATE_DIALOG_LOAD_PROJECT:
      this.automateLoadDialog_(
          params['isWeb'],
          params['project'],
          '',
          goog.nullFunction);
      break;
    case Bite.Constants.UiCmds.SET_PROJECT_INFO:
      this.setProjectInfo(
          params['name'], params['tests'], params['from'], params['details']);
      break;

    // For the main console.
    case Bite.Constants.UiCmds.SET_CONSOLE_STATUS:
      this.statusLogger_.setStatus(params['message'], params['color']);
      break;
    case Bite.Constants.UiCmds.UPDATE_PLAYBACK_STATUS:
      this.updatePlaybackStatus(params['text'], params['color']);
      break;
    case Bite.Constants.UiCmds.UPDATE_CURRENT_STEP:
      this.updateCurrentStep(params['curStep']);
      break;
    case Bite.Constants.UiCmds.LOAD_TEST_FROM_LOCAL:
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.GET_JSON_LOCALLY,
           'params': params},
          goog.bind(this.loadTestCallback_, this));
      break;
    case Bite.Constants.UiCmds.LOAD_TEST_FROM_WTF:
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.GET_JSON_FROM_WTF,
           'params': params},
          goog.bind(this.loadTestCallback_, this));
      break;
    case Bite.Constants.UiCmds.UPDATE_WHEN_ON_FAILED:
      this.setPlaybackPause(params['uiOnly']);
      this.playbackRuntimeDialog_.makeChoiceAfterFailure(
          params['failureReason'], params['failureLog']);
      this.editorMngr_.addFailedClass(params['currentStep']);
      break;
    case Bite.Constants.UiCmds.UPDATE_WHEN_RUN_FINISHED:
      this.setPlayStatus(false, params['status']);
      this.updateCurrentStep(-1);
      this.setPlaybackStop(params['uiOnly']);
      this.updatePlaybackStatus(
          'The current playback has been finished.', 'black');
      break;
    case Bite.Constants.UiCmds.OPEN_VALIDATION_DIALOG:
      this.validationDialog_.openValidationDialog(
          params['request']);
      break;
    case Bite.Constants.UiCmds.SET_START_URL:
      this.setStartUrl(params['url']);
      this.setDocString(params['url']);
      break;
    case Bite.Constants.UiCmds.ON_KEY_DOWN:
      this.onKeyDown_(params['event']);
      break;
    case Bite.Constants.UiCmds.ON_KEY_UP:
      this.onKeyUp_(params['event']);
      break;
    case Bite.Constants.UiCmds.ON_CONSOLE_CLOSE:
      this.onConsoleClose_();
      break;
    case Bite.Constants.UiCmds.ON_CONSOLE_REFRESH:
      this.onConsoleRefresh_();
      break;
    case Bite.Constants.UiCmds.ON_SHOW_MORE_INFO:
      this.onShowMoreInfo_();
      break;

    case Bite.Constants.UiCmds.ADD_GENERATED_CMD:
      this.screenshotDialog_.getScreenshotManager().addGeneratedCmd(
          params['cmd']);
      break;
    case Bite.Constants.UiCmds.ADD_NEW_COMMAND:
      this.addNewCommand(
          params['pCmd'],
          params['dCmd'],
          params['index'],
          params['cmdMap']);
      break;
    case Bite.Constants.UiCmds.ADD_SCREENSHOT:
      this.screenshotDialog_.getScreenshotManager().addScreenShot(
          params['dataUrl'],
          params['iconUrl']);
      break;
    case Bite.Constants.UiCmds.RESET_SCREENSHOTS:
      this.screenshotDialog_.getScreenshotManager().resetScreenShots(
          params['screenshots']);
      break;
    case Bite.Constants.UiCmds.UPDATE_SCRIPT_INFO:
      this.updateScriptInfo(
          params['name'],
          params['url'],
          params['script'],
          params['datafile'],
          params['userlib'],
          params['id'],
          params['projectname']);
      break;
    case Bite.Constants.UiCmds.CHANGE_MODE:
      this.changeMode(params['mode']);
      break;
    case Bite.Constants.UiCmds.HIGHLIGHT_LINE:
      var line = this.projectInfo_.getFailureLineNumber(
          params['stepId'], params['testName']);
      if (line >= 0) {
        this.popDescInfoMap_(line);
        this.detailsDialog_.onEditCmd();
      }
      break;
    case Bite.Constants.UiCmds.TOGGLE_CONTENT_MAP:
      this.handleInfoPanelButton_(
          Bite.Constants.RpfConsoleInfoType.CONTENT_MAP);
      break;
    case Bite.Constants.UiCmds.TOGGLE_PROJECT_INFO:
      this.handleInfoPanelButton_(
          Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
      break;
    case Bite.Constants.UiCmds.SHOW_QUICK_CMDS:
      this.showQuickCmds();
      break;
    case Bite.Constants.UiCmds.SHOW_EXPORT:
      this.showExportDialog();
      break;
    case Bite.Constants.UiCmds.SHOW_INFO:
      this.showInfo();
      break;
    case Bite.Constants.UiCmds.LOAD_CMDS:
      this.loadCmds();
      break;
    case Bite.Constants.UiCmds.SHOW_NOTES:
      this.showNotes();
      break;
    case Bite.Constants.UiCmds.START_RECORDING:
      var passChecking = params['passChecking'] || false;
      this.startRecording(passChecking);
      break;
    case Bite.Constants.UiCmds.SHOW_SAVE_DIALOG:
      this.showSaveDialog();
      break;
    case Bite.Constants.UiCmds.ADD_NEW_TEST:
      this.addNewTest_();
      break;
    case Bite.Constants.UiCmds.SHOW_SCREENSHOT:
      this.showScreenshot();
      break;
    case Bite.Constants.UiCmds.SHOW_SETTING:
      this.showSetting();
      break;
    case Bite.Constants.UiCmds.SHOW_PLAYBACK_RUNTIME:
      this.showPlaybackRuntime();
      break;
    case Bite.Constants.UiCmds.STOP_RECORDING:
      this.stopRecording();
      break;
    case Bite.Constants.UiCmds.START_WORKER_MODE:
      this.startWorkerMode();
      break;
    case Bite.Constants.UiCmds.RECORD_TAB_CLOSED:
      this.stopRecording();
      this.warnRecordTabClosed_();
      break;
    default:
      break;
  }
};


/**
 * Enum for image path.
 * @enum {string}
 * @export
 */
rpf.ConsoleManager.Images = {
  /* TODO(ralphj): Remove the validation image. */
  VALIDATION: 'imgs/rpf/validation.png',
  RECORD_GREY: 'imgs/rpf/record-disabled.png',
  STOP: 'imgs/rpf/stop.png',
  VALIDATION_GREY: 'imgs/rpf/validation-disabled.png',
  RECORD: 'imgs/rpf/record.png',
  STOP_GREY: 'imgs/rpf/stop-disabled.png',
  VALIDATION_ON: 'imgs/rpf/validationon.png',
  WORKER: 'imgs/rpf/workermode.png',
  WORKER_OFF: 'imgs/rpf/workermodeoff.png'
};


/**
 * Enum for result status.
 * @enum {string}
 * @export
 */
rpf.ConsoleManager.Results = {
  SUCCESS: 'passed',
  STOP: 'stop'
};


/**
 * Enum for the custom methods.
 * @enum {string}
 */
rpf.ConsoleManager.CustomMethods = {
  ADD_NEW: 'New Name'
};


/**
 * Enum for buttons.
 * @enum {string}
 * @export
 */
rpf.ConsoleManager.Buttons = {
  ADD_CMD: 'rpf-addCmd',
  CONTENT_MAP: 'rpf-content-map-button',
  EXPORT: 'rpf-export',
  INFO: 'rpf-info',
  LOAD: 'rpf-loadTest',
  NOTES: 'rpf-notes',
  RECORD: 'rpf-record',
  REFRESH: 'rpf-refresh',
  SAVE: 'rpf-saveTest',
  ADD_TEST: 'rpf-addTest',
  SCREEN: 'rpf-screenShots',
  SETTING: 'rpf-setting',
  PLAY: 'rpf-startPlayback',
  STOP: 'rpf-stop',
  WORKER: 'rpf-workerMode'
};


/**
 * Warns the user that the tab under record was closed.
 * @private
 */
rpf.ConsoleManager.prototype.warnRecordTabClosed_ = function() {
  var content = soy.renderAsElement(
      rpf.soy.Dialog.getRecordTabClosedUi,
      {});
  this.openInputDialog_('Warn', content);
};


/**
 * Automates the load dialog.
 * @param {boolean} isWeb Whether the location is the web.
 * @param {string} project The project name.
 * @param {string} test The test name.
 * @param {function(Object)} callback The callback function.
 * @private
 */
rpf.ConsoleManager.prototype.automateLoadDialog_ = function(
    isWeb, project, test, callback) {
  this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
  this.setLocation_(isWeb);
  this.checkLocationAndSetProjects_();
  this.setProjectName_(project);
  if (test) {
    this.changeProject_(
        true, goog.bind(this.changeProjectCallback_, this, test));
  } else {
    this.changeProject_(true);
  }
};


/**
 * Adds a new test. This method will clean up the console except the project.
 * @private
 */
rpf.ConsoleManager.prototype.addNewTest_ = function() {
  this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
  this.updateScriptInfo(
      '', '', '', '', '', '', this.getProjectName_());
  this.screenshotDialog_.getScreenshotManager().clear();
  this.saveScript_();
  this.setStatus('Ready to add new tests.', 'green');
};


/**
 * Gets the project name from UI.
 * @return {string} The project name.
 * @private
 */
rpf.ConsoleManager.prototype.getProjectName_ = function() {
  return this.projectSelector_.getValue();
};


/**
 * The callback function of changing project.
 * @param {string} test The test name.
 * @private
 */
rpf.ConsoleManager.prototype.changeProjectCallback_ = function(test) {
  this.setScriptName_(test);
  this.onScriptChangeHandler_();
};


/**
 * Sets the location where the project is loaded from.
 * @param {boolean} isWeb Whether the location is the web.
 * @private
 */
rpf.ConsoleManager.prototype.setLocation_ = function(isWeb) {
  goog.dom.getElement('location-local').checked = !isWeb;
  goog.dom.getElement('location-web').checked = isWeb;
};


/**
 * Sets the script name.
 * @param {string} script The script name.
 * @private
 */
rpf.ConsoleManager.prototype.setScriptName_ = function(script) {
  this.scriptSelector_.setValue(script);
};


/**
 * Sets the script name without triggering onchange event.
 * @param {string} script The script name.
 * @private
 */
rpf.ConsoleManager.prototype.setScriptNameStatic_ = function(script) {
  goog.events.unlisten(
      this.scriptSelector_, goog.ui.Component.EventType.CHANGE,
      this.boundOnScriptNameChange_);
  this.scriptSelector_.setValue(script);
  goog.events.listen(
      this.scriptSelector_, goog.ui.Component.EventType.CHANGE,
      this.boundOnScriptNameChange_);
};


/**
 * Sets the project name.
 * @param {string} projectName The project name.
 * @private
 */
rpf.ConsoleManager.prototype.setProjectName_ = function(projectName) {
  this.projectSelector_.setValue(projectName);
};


/**
 * Updates the element at the given step id.
 * @param {string} stepId The step id.
 * @param {Object} cmdMap The command info map.
 * @param {!Object} originalInfoMap The original script info map.
 * @return {string} The old xpath.
 * @private
 */
rpf.ConsoleManager.prototype.updateElement_ = function(
    stepId, cmdMap, originalInfoMap) {
  var elemId = originalInfoMap['steps'][stepId]['elemId'];
  var elem = originalInfoMap['elems'][elemId];
  var oldXpath = elem['xpaths'][0];
  elem['selectors'] = cmdMap['selectors'];
  elem['xpaths'] = cmdMap['xpaths'];
  elem['descriptor'] = cmdMap['descriptor'];
  elem['iframeInfo'] = cmdMap['iframeInfo'];
  return oldXpath;
};


/**
 * Updates the element at the given step id in a test.
 * @param {string} testName The test name.
 * @param {string} stepId The step id.
 * @param {Object} cmdMap The command info map.
 * @private
 */
rpf.ConsoleManager.prototype.updateElementInTest_ = function(
    testName, stepId, cmdMap) {
  var originalInfoMap = this.projectInfo_.getInfoMapByTest(testName);
  this.updateElement_(stepId, cmdMap, originalInfoMap);
  this.projectInfo_.saveInfoMapToTest(testName, originalInfoMap);
};


/**
 * Updates the element that at the given line with the updated element info
 * captured from the tab under record.
 * @param {number} line The line number.
 * @param {Object} cmdMap The command info map.
 * @param {function(Function, string)} callback The callback function.
 * @private
 */
rpf.ConsoleManager.prototype.updateElementAtLine_ = function(
    line, cmdMap, callback) {
  var lineContent = this.editorMngr_.getTextAtLine(line);
  var stepId = bite.base.Helper.getStepId(lineContent);
  var oldXpath = this.updateElement_(stepId, cmdMap, this.infoMap_ || {});
  var loadFrom = '';
  // If the project was loaded from local, we could update all of the
  // tests and save them back at once. Otherwise, we could only update
  // steps in the particular test for now. The second case includes
  // while creating a new test and loads a test from web.
  if (this.projectInfo_ && this.projectInfo_.getLoadFrom() ==
      rpf.LoaderDialog.Locations.LOCAL) {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.GET_TEST_NAMES_LOCALLY,
         'params': {'project': this.getProjectName_()}},
        goog.bind(this.showElementsAfterProjectUpdated_, this,
                  callback, cmdMap, oldXpath));
  } else {
    var data = this.getStepsFromInfoMap_(
        this.getTestName_(), this.infoMap_, oldXpath);
    this.showElementsWithSameXpath_(
        data, rpf.LoaderDialog.Locations.WEB, callback, cmdMap);
  }
};


/**
 * When the local project is updated, show the steps with the same xpath.
 * @param {function(Function, string)} callback The callback function.
 * @param {Object} cmdMap The command info map.
 * @param {string} oldXpath The old xpath.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.showElementsAfterProjectUpdated_ = function(
    callback, cmdMap, oldXpath, response) {
  this.setProjectInfo(
      response['name'],
      response['tests'],
      rpf.LoaderDialog.Locations.LOCAL,
      response['details']);
  var data = this.getStepsWithSameXpath_(oldXpath);
  this.showElementsWithSameXpath_(
      data, rpf.LoaderDialog.Locations.LOCAL, callback, cmdMap);
};


/**
 * Shows the steps that are with the same xpath.
 * @param {Object} data The data of the steps.
 * @param {string} loadFrom Where the project was loaded from.
 * @param {function(Function, string)} callback The callback function.
 * @param {Object} cmdMap The command info map.
 * @private
 */
rpf.ConsoleManager.prototype.showElementsWithSameXpath_ = function(
    data, loadFrom, callback, cmdMap) {
  if (!data) {
    return;
  }
  var html = element.helper.Templates.locatorsUpdater.
      showElementsWithSameXpath({'data': data, 'loadFrom': loadFrom});
  callback(goog.bind(this.registerEventsOnSameElements_, this, cmdMap), html);
};


/**
 * Registers events on replace and cancel buttons.
 * @param {Object} newCmdMap The new command's map info.
 * @param {function()} onCancelHandler The handler to cancel the update.
 * @private
 */
rpf.ConsoleManager.prototype.registerEventsOnSameElements_ = function(
    newCmdMap, onCancelHandler) {
  this.updateAllHandler_.listen(
      goog.dom.getElement('replaceAllXpaths'),
      goog.events.EventType.CLICK,
      goog.bind(this.handleReplaceButton_, this, newCmdMap, onCancelHandler));
  this.updateAllHandler_.listen(
      goog.dom.getElement('cancelReplaceXpaths'),
      goog.events.EventType.CLICK,
      goog.bind(this.handleCancelButton_, this, onCancelHandler));
};


/**
 * Replace button handler.
 * @param {Object} newCmdMap The new command map.
 * @param {function()} onCancelHandler The handler to cancel the update.
 * @private
 */
rpf.ConsoleManager.prototype.handleReplaceButton_ = function(
    newCmdMap, onCancelHandler) {
  var selectedSteps = goog.dom.getDocument().getElementsByName('selectedSteps');
  for (var i = 0, len = selectedSteps.length; i < len; ++i) {
    if (selectedSteps[i].checked) {
      var nameAndStep = selectedSteps[i].value.split('___');
      if (this.projectInfo_ && this.projectInfo_.getLoadFrom() ==
          rpf.LoaderDialog.Locations.LOCAL) {
        this.updateElementInTest_(nameAndStep[0], nameAndStep[1], newCmdMap);
      } else {
        this.updateElement_(nameAndStep[1], newCmdMap, this.infoMap_ || {});
      }
    }
  }
  // In this case, we need to load the project from local first to make sure
  // it's the latest code before modifing the tests.
  if (this.projectInfo_ && this.projectInfo_.getLoadFrom() ==
      rpf.LoaderDialog.Locations.LOCAL) {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SAVE_PROJECT_LOCALLY,
         'params': {'project': {'name': this.getProjectName_(),
                                'tests': this.projectInfo_.getTests()}}});
  }
  this.handleCancelButton_(onCancelHandler);
};


/**
 * Cancel button handler.
 * @param {function()} onCancelHandler The handler to cancel the update.
 * @private
 */
rpf.ConsoleManager.prototype.handleCancelButton_ = function(onCancelHandler) {
  onCancelHandler();
  this.updateAllHandler_.removeAll();
};


/**
 * Gets the steps with the same xpath in the current opened project.
 * @param {string} oldXpath The old xpath.
 * @return {Array} The array of steps.
 * @private
 */
rpf.ConsoleManager.prototype.getStepsWithSameXpath_ = function(oldXpath) {
  var allSteps = [];
  var tests = this.projectInfo_.getTests();
  for (var i = 0, len = tests.length; i < len; ++i) {
    var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
    var result = bite.console.Helper.trimInfoMap(testObj['datafile']);
    var testName = testObj['name'];
    var stepsOfTest = this.getStepsFromInfoMap_(
        testName, result['infoMap'], oldXpath);
    if (stepsOfTest) {
      allSteps = allSteps.concat(stepsOfTest);
    }
  }
  if (allSteps.length == 0) {
    return null;
  }
  return allSteps;
};


/**
 * Gets the steps with the same xpath from infoMap.
 * @param {string} testName The test name.
 * @param {Object} infoMap The infoMap of the test.
 * @param {string} oldXpath The old xpath.
 * @return {Array} The array of steps.
 * @private
 */
rpf.ConsoleManager.prototype.getStepsFromInfoMap_ = function(
    testName, infoMap, oldXpath) {
  var allSteps = [];
  var steps = infoMap['steps'];
  var elems = infoMap['elems'];
  for (var step in steps) {
    var elemId = steps[step]['elemId'];
    var elem = elems[elemId];
    if (elem && elem['xpaths'][0] == oldXpath) {
      allSteps.push({'testName': testName,
                     'stepName': steps[step]['stepName'],
                     'elemId': elemId});
    }
  }
  if (allSteps.length == 0) {
    return null;
  }
  return allSteps;
};


/**
 * @param {string} action The action to be logged in console.
 * @param {string} label The label string.
 * @private
 */
rpf.ConsoleManager.logEvent_ = function(action, label) {
  chrome.extension.sendRequest({'action': Bite.Constants.HUD_ACTION.LOG_EVENT,
                                'category': 'ConsoleManager',
                                'event_action': action,
                                'label': label});
};


/**
 * Sets the doc string.
 * @param {string} url The url.
 * @export
 */
rpf.ConsoleManager.prototype.setDocString = function(url) {
  var domain = new goog.Uri(url).getDomain();
  var docString = bite.console.Helper.getDocString(domain, this.userId_);
  this.editorMngr_.setCode(docString + this.editorMngr_.getCode());
};


/**
 * @return {boolean} Whether or not is recording.
 * @export
 */
rpf.ConsoleManager.prototype.isRecording = function() {
  return this.isRecording_;
};


/**
 * @return  {boolean} Whether or not is playing back.
 * @export
 */
rpf.ConsoleManager.prototype.isPlaying = function() {
  return this.isPlaying_;
};


/**
 * @return {Bite.Constants.ConsoleModes} The current mode.
 * @export
 */
rpf.ConsoleManager.prototype.getMode = function() {
  return this.mode_;
};


/**
 * @return {Object} The buttons displayed on console UI.
 * @export
 */
rpf.ConsoleManager.prototype.getButtons = function() {
  return this.btns_;
};


/**
 * @return {rpf.ConsoleManager.ModeInfo} The modeInfo static object.
 * @export
 */
rpf.ConsoleManager.prototype.getModeInfo = function() {
  return this.modeInfo_;
};


/**
 * @return {number} The line number that should be highlighted.
 * @export
 */
rpf.ConsoleManager.prototype.getLineHighlighted = function() {
  return this.lineHighlighted_;
};


/**
 * @return {Object} The mode selector.
 * @export
 */
rpf.ConsoleManager.prototype.getModeSelector = function() {
  return this.modeSelector_;
};


/**
 * @return {Bite.Constants.ViewModes} The current view mode.
 * @export
 */
rpf.ConsoleManager.prototype.getViewMode = function() {
  return this.viewMode_;
};


/**
 * @return {number} The line to be inserted.
 * @export
 */
rpf.ConsoleManager.prototype.getLineToInsert = function() {
  return this.lineToInsert_;
};


/**
 * @param {number} line The line to be inserted.
 * @export
 */
rpf.ConsoleManager.prototype.setLineToInsert = function(line) {
  this.lineToInsert_ = line;
};


/**
 * @return {rpf.EditorManager} The editor manager.
 * @export
 */
rpf.ConsoleManager.prototype.getEditorManager = function() {
  return this.editorMngr_;
};


/**
 * @return {rpf.ExportDialog} The loader dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getExportDialog = function() {
  return this.exportDialog_;
};


/**
 * @return {rpf.LoaderDialog} The loader dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getLoaderDialog = function() {
  return this.loaderDialog_;
};


/**
 * @return {rpf.ValidateDialog} The validation dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getValidationDialog = function() {
  return this.validationDialog_;
};


/**
 * @return {rpf.NotesDialog} The notes dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getNotesDialog = function() {
  return this.notesDialog_;
};


/**
 * @return {rpf.DetailsDialog} The details dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getDetailsDialog = function() {
  return this.detailsDialog_;
};


/**
 * @return {rpf.PlayDialog} The playback dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getPlaybackRuntimeDialog = function() {
  return this.playbackRuntimeDialog_;
};


/**
 * @return {rpf.ScreenShotDialog} The screenshot dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getScreenshotDialog = function() {
  return this.screenshotDialog_;
};


/**
 * @return {rpf.SettingDialog} The setting dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getSettingDialog = function() {
  return this.settingDialog_;
};


/**
 * @return {rpf.QuickCmdDialog} The quick commands dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getQuickDialog = function() {
  return this.quickDialog_;
};


/**
 * @return {rpf.InfoDialog} The info dialog.
 * @export
 */
rpf.ConsoleManager.prototype.getInfoDialog = function() {
  return this.infoDialog_;
};


/**
 * Pops up the detailed info dialog.
 * @param {Object} e The event object.
 * @private
 */
rpf.ConsoleManager.prototype.popupDetailedInfo_ = function(e) {
  var currentLineNumber = this.editorMngr_.getCurrentSelection().start['row'];
  this.popDescInfoMap_(currentLineNumber);
};


/**
 * Get desc info to pop up.
 * @param {number} lineNum The line number.
 * @return {boolean} Whether pops up the detail info.
 * @private
 */
rpf.ConsoleManager.prototype.popDescInfoMap_ = function(lineNum) {
  var desc = '';
  var translation = '';
  var id = '';
  var cmd = this.editorMngr_.getOriginalLineAt(lineNum);
  var xpath = '';

  var descObj = this.editorMngr_.checkHasDesc(lineNum);
  //To support legacy code format.
  if (descObj) {
    desc = descObj['desc'];
    translation = descObj['translation'];
    id = rpf.MiscHelper.getCmdId(cmd);
  } else {
    var elemMap = rpf.MiscHelper.getElemMap(
        this.editorMngr_.getTextAtLine(lineNum), this.infoMap_);
    if (elemMap['xpaths']) {
      // New code format.
      desc = elemMap['descriptor'];
      id = bite.base.Helper.getStepId(cmd);
      xpath = elemMap['xpaths'][0];
    }
  }

  if (desc) {
    this.updateHighlightLine(lineNum);
    this.detailsDialog_.updateInfo(
        desc, lineNum, translation, id, xpath, this.infoMap_);
    return true;
  } else {
    return false;
  }
};


/**
 * Finds the next command has descriptor.
 * @param {number} line The line number.
 * @export
 */
rpf.ConsoleManager.prototype.findNextCmd = function(line) {
  var lineNum = line + 1;
  var totalNum = this.editorMngr_.getTotalLineCount();
  for (var i = lineNum; i <= totalNum; i++) {
    if (this.popDescInfoMap_(i)) {
      return;
    }
  }
};


/**
 * Finds the previous command which has descriptor.
 * @param {number} line The line number.
 * @export
 */
rpf.ConsoleManager.prototype.findPrevCmd = function(line) {
  var lineNum = line - 1;
  if (lineNum < 0) {
    return;
  }
  for (var i = lineNum; i >= 0; i--) {
    if (this.popDescInfoMap_(i)) {
      return;
    }
  }
};


/**
 * Logs info on console.
 * @param {string} log Log string.
 * @param {rpf.ConsoleLogger.LogLevel=} opt_level Log level.
 * @param {rpf.ConsoleLogger.Color=} opt_color Log color.
 * @export
 */
rpf.ConsoleManager.prototype.logInfo = function(log, opt_level, opt_color) {
  var level = opt_level || rpf.ConsoleLogger.LogLevel.INFO;
  var color = opt_color || rpf.ConsoleLogger.Color.BLACK;
  console.log('On console side: ' + log);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.SAVE_LOG_AND_HTML,
       'params': {'log': log,
                  'level': level,
                  'color': color}});
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.GET_LOGS_AS_STRING,
       'params': {}},
      goog.bind(this.updateLogDialog_, this));
};


/**
 * Sets the console status.
 * @param {string} status Status string.
 * @param {string=} opt_color Status color.
 * @export
 */
rpf.ConsoleManager.prototype.setStatus = function(status, opt_color) {
  if (this.noConsole_) {
    return;
  }
  var color = opt_color || 'blue';
  var statusDiv = '<div style="color:' + color + '">' +
                  status + '</div>';
  goog.dom.getElement(Bite.Constants.RpfConsoleId.ELEMENT_STATUS).innerHTML =
      statusDiv;
};


/**
 * Updates the log dialog.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.updateLogDialog_ = function(response) {
  goog.dom.getElement('logs').innerHTML = response['logHtml'];
};


/**
 * Opens the validation dialog.
 * @param {Object} request The relevant info of an element.
 * @export
 */
rpf.ConsoleManager.prototype.openValidationDialog = function(request) {
  this.validationDialog_.openValidationDialog(request);
  this.validationDialog_.setVisible(true);
};


/**
 * Updates the playback status.
 * @param {string} status The status string.
 * @param {string} color The color code.
 * @export
 */
rpf.ConsoleManager.prototype.updatePlaybackStatus = function(status, color) {
  this.playbackRuntimeDialog_.updatePlaybackStatus(status, color);
};


/**
 * Adds a new created command in the UI.
 * @param {string} cmd The generated command.
 * @param {string} data The data string.
 * @export
 */
rpf.ConsoleManager.prototype.addNewCreatedCmdInBox = function(cmd, data) {
  goog.dom.getElement('newCmdBox').value = cmd;
  this.playbackRuntimeDialog_.tempCmd = cmd;
  this.playbackRuntimeDialog_.tempData = data;
};


/**
 * Pauses playback.
 * @param {boolean=} opt_uiOnly Whether to involve the call to
 *     the backend.
 * @export
 */
rpf.ConsoleManager.prototype.setPlaybackPause = function(opt_uiOnly) {
  this.playbackRuntimeDialog_.setPlaybackPause(opt_uiOnly);
};


/**
 * Stops playback.
 * @param {boolean=} opt_uiOnly Whether to involve the call to
 *     the backend.
 * @export
 */
rpf.ConsoleManager.prototype.setPlaybackStop = function(opt_uiOnly) {
  this.playbackRuntimeDialog_.setPlaybackStop(opt_uiOnly);
};


/**
 * Sets the project info.
 * @param {string} name The project name.
 * @param {Array} tests The test array.
 * @param {string} loadFrom Either from web or local.
 * @param {Object=} opt_details The optional details of the project.
 */
rpf.ConsoleManager.prototype.setProjectInfo = function(
    name, tests, loadFrom, opt_details) {
  this.projectInfo_.setProjectName(name);
  this.projectInfo_.setTests(tests);
  this.projectInfo_.setLoadFrom(loadFrom);
  this.projectInfo_.setDetails(opt_details);
  this.updateProjectInfoUi_();
  this.updateProjectJsFiles_(opt_details || {});
};


/**
 * Updates the project JS files.
 * @param {!Object} details The project details.
 * @private
 */
rpf.ConsoleManager.prototype.updateProjectJsFiles_ = function(details) {
  var file = '';
  if (details['js_files'] && typeof(details['js_files']) == 'object') {
    // Before implementing multiple JS supports,
    // we use the first JS in the file.
    if (details['js_files'][0]) {
      file = details['js_files'][0]['code'];
    }
  }
  this.notesDialog_.replaceContent(file);
};


/**
 * Updates the editor highlighted line.
 * @param {number} line Line number.
 * @export
 */
rpf.ConsoleManager.prototype.updateHighlightLine = function(line) {
  this.lineHighlighted_ = line;
  this.editorMngr_.clearGutterDecoration();
  if (line >= 0) {
    this.editorMngr_.addRunningClass(line);
  }
};


/**
 * Updates the current step in UI.
 * @param {number} curStep Current step.
 * @export
 */
rpf.ConsoleManager.prototype.updateCurrentStep = function(curStep) {
  var currentStep = '';
  this.editorMngr_.clearGutterDecoration();
  if (curStep >= 0) {
    for (var i = 0; i < curStep; i++) {
      this.editorMngr_.addPassedClass(i);
    }
    this.editorMngr_.addRunningClass(curStep);
    currentStep = curStep + 1 + '';
  }
  goog.dom.getElement('playbackcurrentstep').value = currentStep;
};


/**
 * Gets the to-be inserted line number.
 * @return {number} The line to be inserted.
 * @export
 */
rpf.ConsoleManager.prototype.getInsertLineNum = function() {
  if (this.lineToInsert_ != -1) {
    return this.lineToInsert_;
  } else {
    return this.editorMngr_.getTotalLineCount() - 1;
  }
};


/**
 * Adds a new generated command in console text fields.
 * @param {string} pCmd The generated puppet command.
 * @param {string=} opt_dCmd The generated data command (optional).
 * @param {number=} opt_index Add the commmand at the given line.
 * @param {Object=} opt_cmdMap The command map.
 * @export
 */
rpf.ConsoleManager.prototype.addNewCommand = function(
    pCmd, opt_dCmd, opt_index, opt_cmdMap) {
  // Save new command, if no rpf Console UI is constructed.
  if (this.noConsole_) {
    this.recordedScript_ += pCmd;
    return;
  }

  var dCmd = opt_dCmd || '';
  var code = this.editorMngr_.getTempCode();
  if (this.viewMode_ == Bite.Constants.ViewModes.CODE) {
    code = this.editorMngr_.getCode();
  }

  var scnshotId = goog.string.getRandomString();
  if (opt_cmdMap) {
    scnshotId = opt_cmdMap['id'];
    bite.console.Helper.assignInfoMap(this.infoMap_, opt_cmdMap);
  }

  var newCode = '';
  if (this.lineToInsert_ != -1) {
    var allLines = code.split('\n');
    allLines.splice(this.lineToInsert_, 0, pCmd);
    newCode = allLines.join('\n');
    this.lineToInsert_ += 1;
  } else {
    newCode = code + pCmd + '\n';
  }
  if (opt_index && opt_index == -1) {
    // TODO(phu): Optimize the way to get screenshots.
    this.screenshotDialog_.getScreenshotManager().addIndex(scnshotId);
  }
  this.addNewData_(dCmd);
  if (this.viewMode_ == Bite.Constants.ViewModes.CODE) {
    this.editorMngr_.setCode(newCode);
  } else {
    this.editorMngr_.setTempCode(newCode);
    this.editorMngr_.setReadableCode();
  }
  if (this.isPlaying_) {
    console.log('Will try to insert the generated line in playback script.');
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.INSERT_CMDS_WHILE_PLAYBACK,
         'params': {'scriptStr': pCmd,
                    'data': dCmd}});
  }
};


/**
 * Adds the new data in datafile.
 * @param {string=} opt_dCmd The generated data command.
 * @private
 */
rpf.ConsoleManager.prototype.addNewData_ = function(opt_dCmd) {
  if (opt_dCmd) {
    var curDataValue = this.getDatafile_();
    this.setDatafile_(curDataValue + opt_dCmd + '\n');
  }
};


/**
 * Shows the notes dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showNotes = function() {
  rpf.ConsoleManager.logEvent_('Notes', '');
  this.notesDialog_.setVisible(true);
};


/**
 * Shows the playback runtime dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showPlaybackRuntime = function() {
  rpf.ConsoleManager.logEvent_('Play', 'IS_RECORDING: ' + this.isRecording_);

  if (this.isRecording_) {
    this.setStatus('Can not playback while recording.', 'red');
    throw new Error('Can not play back during recording.');
  }
  this.playbackRuntimeDialog_.setVisible(true);
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_DIALOG_OPENED);
};


/**
 * Shows the screenshot dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showScreenshot = function() {
  rpf.ConsoleManager.logEvent_('ShowScreenshot', '');
  this.screenshotDialog_.setVisible(true);
};


/**
 * Shows the setting dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showSetting = function() {
  rpf.ConsoleManager.logEvent_('Setting', '');
  this.settingDialog_.setVisible(true);
};


/**
 * Shows the quick commands dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showQuickCmds = function() {
  rpf.ConsoleManager.logEvent_('AddComds', '');
  this.quickDialog_.setVisible(true);
};


/**
 * Shows the info dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showInfo = function() {
  rpf.ConsoleManager.logEvent_('Info', '');
  this.infoDialog_.setVisible(true);
};


/**
 * Shows the save dialog up.
 * @export
 */
rpf.ConsoleManager.prototype.showSaveDialog = function() {
  rpf.ConsoleManager.logEvent_('Save', '');
  this.saveTest();
};


/**
 * Gets the user lib if there is one.
 * @return {string} User's own lib string.
 * @export
 */
rpf.ConsoleManager.prototype.getUserLib = function() {
  return this.notesDialog_.getUserLib();
};


/**
 * Opens the project export dialog.
 */
rpf.ConsoleManager.prototype.showExportDialog = function() {
  rpf.ConsoleManager.logEvent_('Export', '');

  this.exportDialog_.setVisible(true);
};


/**
 * Opens the tests loader dialog.
 */
rpf.ConsoleManager.prototype.loadCmds = function() {
  rpf.ConsoleManager.logEvent_('Load', '');
  this.handleInfoPanelButton_(
      Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
};


/**
 * Gets the script id.
 * @return {string} The script id.
 * @private
 */
rpf.ConsoleManager.prototype.getScriptId_ = function() {
  var idElement = goog.dom.getElement(
    Bite.Constants.RpfConsoleId.ELEMENT_TEST_ID);
  return idElement.getAttribute('title') || '';
};


/**
 * Sets the script id.
 * @param {string} id Sets the id.
 * @private
 */
rpf.ConsoleManager.prototype.setScriptId_ = function(id) {
  var idElement = goog.dom.getElement(
      Bite.Constants.RpfConsoleId.ELEMENT_TEST_ID);
  idElement.setAttribute('title', id);
};


/**
 * Updates the script related information.
 * @param {string} name The test name.
 * @param {string} url The test start URL.
 * @param {string} script The test content.
 * @param {string} datafile The test input data.
 * @param {string} userLib The user's own lib.
 * @param {string=} opt_id The test id.
 * @param {string=} opt_projectName The project name.
 * @export
 */
rpf.ConsoleManager.prototype.updateScriptInfo = function(
    name, url, script, datafile, userLib, opt_id,
    opt_projectName) {
  var projectName = opt_projectName || '';
  this.setTestName_(name);
  this.setScriptId_(opt_id || '');

  this.setStartUrl(url);

  var result = bite.console.Helper.trimInfoMap(datafile);
  this.setDatafile_(result['datafile']);
  this.infoMap_ = result['infoMap'];

  if (this.viewMode_ == Bite.Constants.ViewModes.CODE) {
    this.editorMngr_.setCode(script);
    this.editorMngr_.setTempCode('');
  } else if (this.viewMode_ == Bite.Constants.ViewModes.READABLE) {
    this.editorMngr_.setTempCode(script);
    this.editorMngr_.setReadableCode();
  }
  this.projectInfo_.setProjectName(projectName);
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.FINISHED_LOAD_TEST_IN_CONSOLE);
};


/**
 * Gets the datafile content.
 * @return {string} The datafile string.
 * @private
 */
rpf.ConsoleManager.prototype.getDatafile_ = function() {
  return goog.dom.getElement(Bite.Constants.RpfConsoleId.DATA_CONTAINER).value;
};


/**
 * Sets the datafile content.
 * @param {string} value The datafile string.
 * @private
 */
rpf.ConsoleManager.prototype.setDatafile_ = function(value) {
  goog.dom.getElement(Bite.Constants.RpfConsoleId.DATA_CONTAINER).value = value;
};


/**
 * Checks if the current script is runnable.
 * @return {boolean} Whether or not the script is runnable.
 * @private
 */
rpf.ConsoleManager.prototype.checkRunnable_ = function() {
  if (this.noConsole_) {
    return true;
  }
  var startUrl = this.getStartUrl();
  var scripts = this.editorMngr_.getCode();
  return goog.string.trim(startUrl) != '' && goog.string.trim(scripts) != '';
};


/**
 * Playbacks the test in the console.
 * @param {Bite.Constants.PlayMethods} method Method of playback.
 * @param {string=} opt_script The script to play.
 * @export
 */
rpf.ConsoleManager.prototype.startPlayback = function(method, opt_script) {
  console.log('rpf.ConsoleManager.prototype.startPlayback');
  if (this.isRecording_) {
    this.setStatus('Can not playback while recording.', 'red');
    throw new Error('Can not play back during recording.');
  }
  var testNames = this.playbackRuntimeDialog_.getSelectedTests();
  // The current logic is to use the "multiple replay" mode when there
  // are multiple tests selected, or single test which is the same one
  // currently loaded in the console.
  if (testNames.length > 1 ||
      (testNames.length == 1 && testNames[0] != this.getTestName_())) {
    this.playbackRuntimeDialog_.setFinishedNumber(0);
    this.playbackRuntimeDialog_.setTotalNumber(testNames.length);
    this.playbackRuntimeDialog_.setMultipleTestsVisibility(true);
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.RUN_GROUP_TESTS,
         'params': {'testNames': testNames,
                    'tests': this.projectInfo_.getTests(),
                    'runName': this.getProjectName_(),
                    'location': this.loaderDialog_.getStorageLocation()}});
    return;
  }
  if (this.checkRunnable_()) {
    this.playbackRuntimeDialog_.setMultipleTestsVisibility(false);
    var scripts = opt_script ? opt_script : this.editorMngr_.getTempCode() ||
                  this.editorMngr_.getCode();
    if (this.noConsole_) {
      var datafile = '';
      var startUrl = goog.global.location.href;
      var userLib = '';
    } else {
      var datafile = this.getDatafile_();
      var startUrl = goog.string.trim(this.getStartUrl());
      var userLib = this.notesDialog_.getUserLibAsRunnable();
      this.playbackRuntimeDialog_.clearMatchHtml();
    }
    this.setPlayStatus(true);
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.CHECK_PLAYBACK_OPTION_AND_RUN,
         'params': {'method': method,
                    'startUrl': startUrl,
                    'scripts': scripts,
                    'infoMap': this.infoMap_,
                    'datafile': datafile,
                    'userLib': userLib,
                    'noConsole': this.noConsole_}},
        goog.bind(this.callbackOnStartPlayback_, this));
  } else {
    this.setStatus(
        'Please either load or record a script to playback.', 'red');
    throw new Error('Error: Necessary fields were not all filled.');
  }
};


/**
 * The callback for starting playback.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.callbackOnStartPlayback_ = function(response) {
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.PLAYBACK_STARTED);
  if (response['isPrepDone'] && !this.noConsole_) {
    this.playbackRuntimeDialog_.switchChoiceSet(false);
  }
};


/**
 * Starts recording user's interactions.
 * @param {boolean=} opt_pass Whether pass the isPlaying_ checking.
 * @export
 */
rpf.ConsoleManager.prototype.startRecording = function(opt_pass) {
  rpf.ConsoleManager.logEvent_('Record', 'IS_PLAYING: ' + this.isPlaying_);
  var pass = opt_pass || false;

  if (this.isPlaying_ && !pass) {
    this.setStatus('Can not record while playing back a script.', 'red');
    throw new Error('Can not record during playing back.');
  }

  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.CHECK_READY_TO_RECORD,
       'params': {}},
      goog.bind(this.checkReadyToRecordCallback_, this));
};


/**
 * Callback after checking the tab under record exists.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.checkReadyToRecordCallback_ = function(response) {
  if (response['success']) {
    var url = goog.string.trim(this.getStartUrl());
    if (!url) {
      this.setStartUrl(response['url']);
      this.setDocString(response['url']);
    }
    this.startRecording_();
  } else {
    this.setStatus(
        'The tab under record is missing. Please set a new one first.', 'red');
  }
};


/**
 * Starts recording user's interactions.
 * @private
 */
rpf.ConsoleManager.prototype.startRecording_ = function() {
  if (!this.noConsole_) {
    this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
    this.setRecordStatus(true);
    this.changeMode(Bite.Constants.ConsoleModes.RECORD);
    var url = goog.string.trim(this.getStartUrl());
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.START_RECORDING,
         'params': {'info': {'pageMap': this.projectInfo_.getPageMap(),
                             'xpathFinderOn':
                                 this.settingDialog_.getUseXpath()}}});
  } else {
    var url = goog.global.location.href;
    this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.START_RECORDING,
       'params': {'url': url, 'noConsole': this.noConsole_}});
  }
};


/**
 * Callback for saving the script in the cloud.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.saveTestCallback_ = function(response) {
  this.statusLogger_.setStatus(response['message'], response['color']);
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.TEST_SAVED);
  if (response['success']) {
    this.saveScript_();
    // After saving the test, it needs to load the project again to sync up.
    this.loaderDialog_.loadProject(
        this.getProjectName_(),
        goog.bind(this.loadTestsInSelector_, this, goog.nullFunction,
                  false, false));
  }
};


/**
 * Callback for loading the script in the cloud.
 * @param {Object} response The response object.
 * @private
 */
rpf.ConsoleManager.prototype.loadTestCallback_ = function(response) {
  this.statusLogger_.setStatus(response['message'], response['color']);
  this.changeMode(Bite.Constants.ConsoleModes.VIEW);
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.TEST_LOADED);
  if (response['success']) {
    var params = response['scriptInfo'];
    this.updateScriptInfo(
        params['name'],
        params['url'],
        params['script'],
        params['datafile'],
        params['userlib'],
        params['id'],
        params['projectname']);
    this.saveScript_();
  }
};


/**
 * Removes the redundant data from the ContentMap.
 * @param {string} datafile The data file.
 * @param {string} script The script.
 * @return {string} The new data file.
 * @private
 */
rpf.ConsoleManager.prototype.removeDatafileRedundant_ = function(
    datafile, script) {
  if (!datafile || !script) {
    return datafile;
  }
  // Assume each line contains only one data input in the following format:
  // ContentMap["abc"] = "hello";
  var dataLines = datafile.split('\n');
  for (var i = 0, len = dataLines.length; i < len; ++i) {
    var result = dataLines[i].match(/ContentMap\[\"(.*)\"\]/);
    if (!result || !result[1]) {
      continue;
    }
    if (script.indexOf(result[1]) == -1) {
      delete dataLines[i];
    }
  }
  return dataLines.join('\n');
};


/**
 * Removes the redundant data from the infoMap.
 * @param {Object} infoMap The info map.
 * @param {string} script The script.
 * @param {Object} screenshots The screenshots.
 * @private
 */
rpf.ConsoleManager.prototype.removeInfoMapRedundant_ = function(
    infoMap, script, screenshots) {
  if (!infoMap || !infoMap['steps'] || !infoMap['elems']) {
    return;
  }
  var steps = infoMap['steps'];
  for (var stepId in steps) {
    if (script.indexOf(stepId) == -1) {
      var elemId = steps[stepId]['elemId'];
      if (infoMap['elems'][elemId]) {
        delete infoMap['elems'][elemId];
      }
      if (screenshots[stepId]) {
        delete screenshots[stepId];
      }
      delete steps[stepId];
    }
  }
};


/**
 * Gets the formatted screenshots data.
 * @return {Object} The screenshots info.
 * @private
 */
rpf.ConsoleManager.prototype.getScreenshots_ = function() {
  var screenshots = {};
  var screenshotMgr = this.getScreenshotDialog().getScreenshotManager();
  var scrShots = screenshotMgr.getScreenshots();
  var scrSteps = screenshotMgr.getCmdIndices();
  for (var i = 0; i < scrShots.length; i++) {
    screenshots[scrSteps[i]] = {};
    screenshots[scrSteps[i]]['index'] = scrSteps[i];
    screenshots[scrSteps[i]]['data'] = scrShots[i];
  }
  return screenshots;
};


/**
 * Saves the script locally or in the cloud.
 * @export
 */
rpf.ConsoleManager.prototype.saveTest = function() {
  var testName = 'testName';
  var startUrl = goog.global.location.href;
  var scripts = this.recordedScript_;
  var datafile = 'datafile';
  var userLib = 'userLib';
  var projectName = 'projectName';
  var saveWeb = true;
  var scriptId = '';

  var screenshots = this.getScreenshots_();

  if (!this.noConsole_) {
    testName = this.getTestName_();
    saveWeb = goog.dom.getElement('location-web').checked;
    startUrl = this.getStartUrl();
    scripts = this.editorMngr_.getTempCode() ||
              this.getEditorManager().getCode();
    datafile = this.getDatafile_();
    // remove info map
    this.removeInfoMapRedundant_(this.infoMap_, scripts, screenshots);
    // remove data file
    datafile = this.removeDatafileRedundant_(datafile, scripts);

    datafile = bite.console.Helper.appendInfoMap(this.infoMap_, datafile);
    projectName = this.getProjectName_();
    userLib = this.getUserLib();
    scriptId = this.getScriptId_();
  }

  if (!goog.string.trim(testName) || !goog.string.trim(projectName)) {
    this.setStatus('Please provide both project and script name.', 'red');
    this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.PROJECT_INFO);
    return;
  }

  try {
    if (saveWeb) {
      this.messenger_.sendMessage(
          {'command': Bite.Constants.CONSOLE_CMDS.UPDATE_ON_WEB,
           'params': {'testName': testName,
                      'startUrl': startUrl,
                      'scripts': scripts,
                      'datafile': datafile,
                      'userLib': userLib,
                      'projectName': projectName,
                      'screenshots': screenshots,
                      'scriptId': scriptId,
                      'noConsole': this.noConsole_}},
           goog.bind(this.saveTestCallback_, this));
    } else {
      this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.SAVE_JSON_LOCALLY,
         'params': {'testName': testName,
                    'startUrl': startUrl,
                    'scripts': scripts,
                    'datafile': datafile,
                    'userLib': userLib,
                    'projectName': projectName}},
        goog.bind(this.saveTestCallback_, this));
    }
    // Set status in rpf Console UI.
    if (!this.noConsole_) {
      this.statusLogger_.setStatus(rpf.StatusLogger.SAVING, '#777');
    }
  } catch (e) {
    // Set status in rpf Console UI.
    if (!this.noConsole_) {
      this.setStatus('Failed saving because: ' + e.toString(), 'red');
    }
    throw new Error(e);
  }
};


/**
 * Sets the recording status.
 * @param {boolean} recording Whether or not is recording.
 * @export
 */
rpf.ConsoleManager.prototype.setRecordStatus = function(recording) {
  if (recording) {
    this.statusLogger_.setStatus(rpf.StatusLogger.START_RECORDING);
    this.isRecording_ = true;
  } else {
    this.statusLogger_.setStatus(rpf.StatusLogger.STOP_RECORDING);
    this.isRecording_ = false;
  }
};


/**
 * Sets the palyback status.
 * @param {boolean} playing Whether or not is playing back.
 * @param {string=} opt_result The result.
 * @export
 */
rpf.ConsoleManager.prototype.setPlayStatus = function(playing, opt_result) {
  var result = opt_result || '';
  if (playing) {
    this.statusLogger_.setStatus(rpf.StatusLogger.START_PLAYBACK);
    this.isPlaying_ = true;
    this.changeMode(Bite.Constants.ConsoleModes.PLAY);
  } else {
    if (opt_result.indexOf(rpf.ConsoleManager.Results.SUCCESS) != -1) {
      this.statusLogger_.setStatus(rpf.StatusLogger.PLAYBACK_SUCCESS, 'green');
    } else if (opt_result.indexOf(rpf.ConsoleManager.Results.STOP) != -1) {
      this.statusLogger_.setStatus(rpf.StatusLogger.PLAYBACK_STOPPED, 'brown');
    } else {
      this.statusLogger_.setStatus(rpf.StatusLogger.PLAYBACK_FAILED, 'red');
    }
    this.isPlaying_ = false;
    if (this.mode_ != Bite.Constants.ConsoleModes.WORKER) {
      this.changeMode(Bite.Constants.ConsoleModes.VIEW);
    }
  }
};


/**
 * Stops recording.
 * @export
 */
rpf.ConsoleManager.prototype.stopRecording = function() {
  rpf.ConsoleManager.logEvent_('Stop', '');
  // Just send message to stop recording, if no rpf Console UI is constructed.
  if (this.noConsole_) {
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});
    return;
  }

  this.setRecordStatus(false);
  this.changeMode(Bite.Constants.ConsoleModes.VIEW);
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.STOP_RECORDING});
};


/**
 * Enters worker mode.
 * @export
 */
rpf.ConsoleManager.prototype.startWorkerMode = function() {
  rpf.ConsoleManager.logEvent_('StartWorker', '');
  var workerSrc = goog.dom.getElement(rpf.ConsoleManager.Buttons.WORKER).src;
  if (workerSrc.indexOf('workermodeoff') != -1) {
    goog.dom.getElement(rpf.ConsoleManager.Buttons.WORKER).src =
        rpf.ConsoleManager.Images.WORKER;
    this.stopWorkerMode();
    this.changeMode(Bite.Constants.ConsoleModes.VIEW);
  } else {
    goog.dom.getElement(rpf.ConsoleManager.Buttons.WORKER).src =
        rpf.ConsoleManager.Images.WORKER_OFF;
    this.messenger_.sendMessage(
        {'command': Bite.Constants.CONTROL_CMDS.START_WORKER_MODE});
    this.changeMode(Bite.Constants.ConsoleModes.WORKER);
  }
};


/**
 * Stops worker mode.
 * @export
 */
rpf.ConsoleManager.prototype.stopWorkerMode = function() {
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONTROL_CMDS.STOP_WORKER_MODE});
};


/**
 * Sets the test start URL.
 * @param {string} url The test start URL.
 * @export
 */
rpf.ConsoleManager.prototype.setStartUrl = function(url) {
  goog.dom.getElement(Bite.Constants.RpfConsoleId.ELEMENT_START_URL).value =
      url;
};


/**
 * Gets the test start URL.
 * @return {string} The start url.
 * @export
 */
rpf.ConsoleManager.prototype.getStartUrl = function() {
  return goog.dom.getElement(
      Bite.Constants.RpfConsoleId.ELEMENT_START_URL).value;
};


/**
 * Sets the test name.
 * @param {string} name The test name.
 * @private
 */
rpf.ConsoleManager.prototype.setTestName_ = function(name) {
  this.scriptSelector_.setValue(name);
};


/**
 * Gets the test name.
 * @return {string} The test name.
 * @private
 */
rpf.ConsoleManager.prototype.getTestName_ = function() {
  return this.scriptSelector_.getValue();
};


/**
 * A class for handling flux modes info.
 * @constructor
 * @export
 */
rpf.ConsoleManager.ModeInfo = function() {
  /**
   * Mode and Buttons.
   * @type Object
   */
  this.modeAndBtns = {};
  this.modeAndBtns[Bite.Constants.ConsoleModes.IDLE] =
      {'desc': 'Load a script or begin recording to create a new one',
       'btns': [rpf.ConsoleManager.Buttons.ADD_TEST,
                rpf.ConsoleManager.Buttons.LOAD,
                rpf.ConsoleManager.Buttons.PLAY,
                rpf.ConsoleManager.Buttons.RECORD,
                rpf.ConsoleManager.Buttons.EXPORT,
                rpf.ConsoleManager.Buttons.CONTENT_MAP,
                rpf.ConsoleManager.Buttons.NOTES,
                rpf.ConsoleManager.Buttons.SETTING,
                rpf.ConsoleManager.Buttons.REFRESH]};

  this.modeAndBtns[Bite.Constants.ConsoleModes.RECORD] =
      {'desc': 'Take actions in the browser to record them as javascript',
       'btns': [rpf.ConsoleManager.Buttons.STOP,
                rpf.ConsoleManager.Buttons.CONTENT_MAP,
                rpf.ConsoleManager.Buttons.NOTES,
                rpf.ConsoleManager.Buttons.SETTING,
                rpf.ConsoleManager.Buttons.REFRESH]};

  this.modeAndBtns[Bite.Constants.ConsoleModes.PLAY] =
      {'desc': 'Play back a previously recorded script',
       'btns': [rpf.ConsoleManager.Buttons.SETTING,
                rpf.ConsoleManager.Buttons.CONTENT_MAP,
                rpf.ConsoleManager.Buttons.NOTES,
                rpf.ConsoleManager.Buttons.PLAY,
                rpf.ConsoleManager.Buttons.REFRESH]};

  this.modeAndBtns[Bite.Constants.ConsoleModes.DEFINE] = [];
  this.modeAndBtns[Bite.Constants.ConsoleModes.PAUSE] = [];
  this.modeAndBtns[Bite.Constants.ConsoleModes.WORKER] =
      {'desc': 'Serves as a worker, not under your control!',
       'btns': [rpf.ConsoleManager.Buttons.SETTING,
                rpf.ConsoleManager.Buttons.REFRESH]};

  this.modeAndBtns[Bite.Constants.ConsoleModes.UPDATER] =
      {'desc': 'Locator updater mode.',
       'btns': [rpf.ConsoleManager.Buttons.REFRESH]};

  this.modeAndBtns[Bite.Constants.ConsoleModes.VIEW] =
      {'desc': 'Review, modify or run a script',
       'btns': [rpf.ConsoleManager.Buttons.ADD_TEST,
                rpf.ConsoleManager.Buttons.LOAD,
                rpf.ConsoleManager.Buttons.SAVE,
                rpf.ConsoleManager.Buttons.PLAY,
                rpf.ConsoleManager.Buttons.SCREEN,
                rpf.ConsoleManager.Buttons.RECORD,
                rpf.ConsoleManager.Buttons.EXPORT,
                rpf.ConsoleManager.Buttons.CONTENT_MAP,
                rpf.ConsoleManager.Buttons.NOTES,
                rpf.ConsoleManager.Buttons.SETTING,
                rpf.ConsoleManager.Buttons.REFRESH]};
};


/**
 * The callback function when a key down happens.
 * @param {Object} e The event object.
 * @private
 */
rpf.ConsoleManager.prototype.onKeyDown_ = function(e) {
  switch (e.keyCode) {
    case goog.events.KeyCodes.ALT:
      this.keyAlt_ = true;
      break;
    case goog.events.KeyCodes.S:
      if (this.keyAlt_) {
        if (!this.editorMngr_.getTempCode()) {
          this.modeSelector_.setSelectedIndex(1);
          this.selectViewReadableMode_(null);
        } else {
          this.modeSelector_.setSelectedIndex(0);
          this.selectViewCodeMode_(null);
        }
        this.keyAlt_ = false;
      }
      break;
    case goog.events.KeyCodes.V:
      if (this.keyAlt_) {
        var windowParam = goog.string.buildString(
            'alwaysRaised=yes,',
            'location=no,',
            'resizable=yes,',
            'scrollbars=no,',
            'status=no,width=600,height=800,',
            'left=300,top=100');
        window.open(
            'visualview.html', 'Visual View', windowParam);
        this.keyAlt_ = false;
      }
      break;
  }
};


/**
 * The callback function when a key up happens.
 * @param {Object} e The event object.
 * @private
 */
rpf.ConsoleManager.prototype.onKeyUp_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ALT) {
    this.keyAlt_ = false;
  }
};


/**
 * Callback function for selecting code mode.
 * @param {Object} e The onclick event.
 * @private
 */
rpf.ConsoleManager.prototype.selectViewCodeMode_ = function(e) {
  rpf.ConsoleManager.logEvent_(
      'SelectViewMode',
      'VIEW_MODE: ' + Bite.Constants.ViewModes.CODE);

  if (this.viewMode_ == Bite.Constants.ViewModes.CODE) {
    return;
  }
  var bookData = goog.dom.getDocument().querySelector('#bookData');
  if (bookData) {
    goog.style.showElement(this.editorMngr_.getContainer(), true);
    this.editorMngr_.setCode(this.editorMngr_.getTempCode());
    bookData.innerHTML = '';
  }
  this.viewMode_ = Bite.Constants.ViewModes.CODE;
  this.editorMngr_.setCode(this.editorMngr_.getTempCode());
  this.editorMngr_.setTempCode('');
};


/**
 * Gets the infoMap object.
 * @return {Object} The info map of the script.
 */
rpf.ConsoleManager.prototype.getInfoMap = function() {
  return this.infoMap_;
};


/**
 * Callback function for selecting readable mode.
 * @param {Object} e The onclick event.
 * @private
 */
rpf.ConsoleManager.prototype.selectViewReadableMode_ = function(e) {
  rpf.ConsoleManager.logEvent_(
      'SelectViewMode',
      'VIEW_MODE: ' + Bite.Constants.ViewModes.READABLE);

  if (this.viewMode_ == Bite.Constants.ViewModes.READABLE) {
    return;
  }
  this.viewMode_ = Bite.Constants.ViewModes.READABLE;
  this.editorMngr_.setTempCode(this.editorMngr_.getCode());
  this.editorMngr_.setReadableCode();
};


/**
 * Callback function for selecting book mode.
 * @param {Object} e The onclick event.
 * @private
 */
rpf.ConsoleManager.prototype.selectViewBookMode_ = function(e) {
  rpf.ConsoleManager.logEvent_(
      'SelectViewMode',
      'VIEW_MODE: ' + Bite.Constants.ViewModes.BOOK);

  if (this.viewMode_ == Bite.Constants.ViewModes.BOOK ||
      this.viewMode_ == Bite.Constants.ViewModes.READABLE) {
    return;
  }
  this.editorMngr_.setTempCode(this.editorMngr_.getCode());
  this.viewMode_ = Bite.Constants.ViewModes.BOOK;
  goog.style.showElement(this.editorMngr_.getContainer(), false);
  var consoleBookData = goog.dom.getDocument().querySelector('#bookData');
  var steps = bite.console.Helper.getStepsInfo(
      this.getScreenshotDialog().getScreenshotManager(),
      this.infoMap_,
      this.editorMngr_.getCode());
  soy.renderElement(
      consoleBookData,
      bite.client.Templates.rpfConsole.showReadable,
      {'stepsInfo': steps});
  bite.console.Helper.registerScreenChangeEvents(
      steps, goog.bind(this.onScreenChange_, this));
  bite.console.Helper.changeScreen(steps[0]['id'], 'stepScreen');
};


/**
 * Callback function for selecting updater mode.
 * @param {Object} e The onclick event.
 * @private
 */
rpf.ConsoleManager.prototype.selectUpdaterMode_ = function(e) {
  this.changeMode(Bite.Constants.ConsoleModes.UPDATER);
  this.viewMode_ = Bite.Constants.ViewModes.UPDATER;
  goog.style.showElement(this.editorMngr_.getContainer(), false);
  this.modeSelector_.setVisible(false);
  this.locatorUpdater_ = new bite.locators.Updater(this.messenger_);
  this.locatorUpdater_.render(goog.dom.getElement('bookData'));
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONSOLE_CMDS.ENTER_UPDATER_MODE,
       'params': {}});
};


/**
 * On screenshot change handler.
 * @param {Event} e The event object.
 * @private
 */
rpf.ConsoleManager.prototype.onScreenChange_ = function(e) {
  var id = e.target.id;
  bite.console.Helper.changeScreen(id, 'stepScreen');
};


/**
 * Displays the mode text on console UI.
 * @param {Bite.Constants.ConsoleModes} mode The rpf mode.
 * @export
 */
rpf.ConsoleManager.prototype.changeMode = function(mode) {
  if (this.noConsole_) {
    return;
  }
  this.mode_ = mode;
  goog.global.document.title = 'RPF - ' + mode;
  for (var i in rpf.ConsoleManager.Buttons) {
    this.btns_[rpf.ConsoleManager.Buttons[i]].setVisible(false);
  }
  for (var i = 0;
       i < this.modeInfo_.modeAndBtns[this.mode_]['btns'].length;
       i++) {
    this.btns_[this.modeInfo_.modeAndBtns[this.mode_]['btns'][i]].
        setVisible(true);
  }
};


/**
 * Close the current RPF console.
 * @private
 */
rpf.ConsoleManager.prototype.onConsoleClose_ = function() {
  rpf.ConsoleManager.logEvent_('Close', '');
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONTROL_CMDS.REMOVE_WINDOW});
};


/**
 * Refresh the current RPF console.
 * @private
 */
rpf.ConsoleManager.prototype.onConsoleRefresh_ = function() {
  rpf.ConsoleManager.logEvent_('Refresh', '');
  this.messenger_.sendMessage(
      {'command': Bite.Constants.CONTROL_CMDS.CREATE_WINDOW,
       'params': {'refresh': true}});
};


/**
 * Show more info in the console.
 * @private
 */
rpf.ConsoleManager.prototype.onShowMoreInfo_ = function() {
};


/**
 * Handles button presses from the info panel toggling buttons.
 * @param {Bite.Constants.RpfConsoleInfoType} type The info state that was
 *     pushed.
 * @private
 */
rpf.ConsoleManager.prototype.handleInfoPanelButton_ = function(type) {
  // If the currently selected button is hit again, hide the info panel.
  if (this.moreInfoState_ == type) {
    this.switchInfoPanel_(Bite.Constants.RpfConsoleInfoType.NONE);
  } else {
    this.switchInfoPanel_(type);
  }
};


/**
 * Switches the info panel to the requested state.
 * @param {Bite.Constants.RpfConsoleInfoType} type The info state to switch to.
 * @private
 */
rpf.ConsoleManager.prototype.switchInfoPanel_ = function(type) {
  this.moreInfoState_ = type;
  // Shortcut for the ids enum.
  var ids = Bite.Constants.RpfConsoleId;
  var contentMap = goog.dom.getElement(ids.CONTENT_MAP_CONTAINER);
  var projectInfo = goog.dom.getElement(ids.PROJECT_INFO_CONTAINER);
  switch (type) {
    case Bite.Constants.RpfConsoleInfoType.NONE:
      this.btns_[rpf.ConsoleManager.Buttons.CONTENT_MAP].setSelected(false);
      this.btns_[rpf.ConsoleManager.Buttons.LOAD].setSelected(false);
      goog.style.showElement(contentMap, false);
      goog.style.showElement(projectInfo, false);
      break;
    case Bite.Constants.RpfConsoleInfoType.PROJECT_INFO:
      this.btns_[rpf.ConsoleManager.Buttons.CONTENT_MAP].setSelected(false);
      this.btns_[rpf.ConsoleManager.Buttons.LOAD].setSelected(true);
      goog.style.showElement(contentMap, false);
      goog.style.showElement(projectInfo, true);
      break;
    case Bite.Constants.RpfConsoleInfoType.CONTENT_MAP:
      this.btns_[rpf.ConsoleManager.Buttons.CONTENT_MAP].setSelected(true);
      this.btns_[rpf.ConsoleManager.Buttons.LOAD].setSelected(false);
      goog.style.showElement(contentMap, true);
      goog.style.showElement(projectInfo, false);
      break;
  }
  this.onResize_();
};


/**
 * Updates the UI to reflect the current project info.
 * @private
 */
rpf.ConsoleManager.prototype.updateProjectInfoUi_ = function() {
  this.setProjectNameUi_(this.projectInfo_.getProjectName());
};


/**
 * Sets the UI to reflect the project name.
 * @param {string} name The current project name.
 * @private
 */
rpf.ConsoleManager.prototype.setProjectNameUi_ = function(name) {
  var projectNameElement = goog.dom.getElement(
      Bite.Constants.RpfConsoleId.CURRENT_PROJECT);
  projectNameElement.value = name;
};

