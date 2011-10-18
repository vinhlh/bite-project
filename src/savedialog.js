//Copyright 2010 Google Inc. All Rights Reserved.

/**
 * @fileoverview This file contains the console manager.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.SaveDialog');

goog.require('bite.common.mvc.helper');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');
goog.require('rpf.soy.Dialog');



/**
 * A class for handling console's save dialog.
 * @param {rpf.Console.Messenger} messenger The messenger instance.
 * @param {function(Bite.Constants.UiCmds, Object, Event, function(Object)=)}
 *     onUiEvents The function to handle the specific event.
 * @constructor
 * @export
 */
rpf.SaveDialog = function(messenger, onUiEvents) {
  /**
   * The save dialog.
   * @type Object
   * @private
   */
  this.saveDialog_ = new goog.ui.Dialog();

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
   * Inits the save dialog.
   */
  this.initSaveDialog_();
};


/**
 * Inits the save dialog.
 * @private
 */
rpf.SaveDialog.prototype.initSaveDialog_ = function() {
  var dialogElem = this.saveDialog_.getContentElement();
  var buttonSet = new goog.ui.Dialog.ButtonSet();
  buttonSet.set('saveDialogSave', 'Save', true, false);
  buttonSet.set('saveDialogCancel', 'Cancel', false, true);
  var lastProject = goog.global.localStorage.getItem('last-project');
  lastProject = lastProject ? lastProject : '';

  bite.common.mvc.helper.renderModelFor(dialogElem,
                                        rpf.soy.Dialog.saveContent,
                                        {'lastProject' : lastProject});
  this.saveDialog_.setTitle('Save Script');
  this.saveDialog_.setButtonSet(buttonSet);
  this.saveDialog_.setVisible(true);
  this.saveDialog_.setVisible(false);
  var saveButton = buttonSet.getButton('saveDialogSave');
  var cancelButton = buttonSet.getButton('saveDialogCancel');

  goog.events.listen(
      saveButton,
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.SAVE_TEST,
          {}));
  goog.events.listen(
      cancelButton,
      'click',
      goog.partial(
          this.onUiEvents_,
          Bite.Constants.UiCmds.CANCEL_CMDS,
          {}));
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
rpf.SaveDialog.prototype.setProjectAutoComplete_ = function(names) {
  var projectId = Bite.Constants.RpfConsoleId.CONSOLE_PROJECT_NAME;
  new goog.ui.AutoComplete.Basic(names, goog.dom.getElement(projectId), false);
};


/**
 * Sets the location of where the test should save to.
 * @param {boolean} isWeb Whether the location is web.
 * @private
 */
rpf.SaveDialog.prototype.setLocation_ = function(isWeb) {
  goog.dom.getElement('localBox').checked = !isWeb;
  goog.dom.getElement('webBox').checked = isWeb;
};


/**
 * Sets the project name.
 * @param {string} projectName The project name.
 * @private
 */
rpf.SaveDialog.prototype.setProjectName_ = function(projectName) {
  goog.dom.getElement('projectName').value = projectName;
};


/**
 * Automate setting the fields in this dialog.
 * @param {string} projectName The project name.
 * @param {boolean} isWeb Whether the location is web.
 */
rpf.SaveDialog.prototype.automateDialog = function(projectName, isWeb) {
  this.setLocation_(isWeb);
  this.setProjectName_(projectName);
  this.messenger_.sendStatusMessage(
      Bite.Constants.COMPLETED_EVENT_TYPES.AUTOMATE_SAVE_DIALOG);
};


/**
 * Sets the visibility of the save dialog.
 * @param {boolean} display Whether or not to show the dialog.
 * @export
 */
rpf.SaveDialog.prototype.setVisible = function(display) {
  this.saveDialog_.setVisible(display);
};


/**
 * Dismisses the dialog without saving.
 * @export
 */
rpf.SaveDialog.prototype.cancelCmds = function() {
  this.saveDialog_.setVisible(false);
};

