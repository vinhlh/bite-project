//Copyright 2010 Google Inc. All Rights Reserved.

/**
 * @fileoverview This file contains the console manager.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.SaveDialog');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.Dialog');
goog.require('rpf.Console.Messenger');



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

  var saveButton = {};
  var cancelButton = {};
  var lastProject = goog.global.localStorage.getItem('last-project');
  lastProject = lastProject ? lastProject : '';

  var contentDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'class': 'content-canvas'},
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'section-title'},
          'Test Information'),
      goog.dom.createDom(goog.dom.TagName.TABLE,
          {'width': '100%'},
          goog.dom.createDom(goog.dom.TagName.TR, {},
              goog.dom.createDom(goog.dom.TagName.TD,
                  {'class': 'dialog-label'},
                  goog.dom.createDom(goog.dom.TagName.LABEL,
                      {'for': Bite.Constants.RpfConsoleId.CONSOLE_PROJECT_NAME,
                       'class': 'dialog-label'},
                       'Project')),
              goog.dom.createDom(goog.dom.TagName.TD, {},
              goog.dom.createDom(goog.dom.TagName.INPUT,
                  {'type': 'text',
                   'name': Bite.Constants.RpfConsoleId.CONSOLE_PROJECT_NAME,
                   'value': lastProject,
                   'id': Bite.Constants.RpfConsoleId.CONSOLE_PROJECT_NAME,
                   'class': 'dialog-text'}))),
          goog.dom.createDom(goog.dom.TagName.TR, {},
              goog.dom.createDom(goog.dom.TagName.TD,
                  {'class': 'dialog-label'},
                  goog.dom.createDom(goog.dom.TagName.LABEL,
                      {'for': Bite.Constants.RpfConsoleId.ELEMENT_TEST_NAME,
                       'class': 'dialog-label'},
                       'Test Name')),
              goog.dom.createDom(goog.dom.TagName.TD, {},
              goog.dom.createDom(goog.dom.TagName.INPUT,
                  {'type': 'text',
                   'name': Bite.Constants.RpfConsoleId.ELEMENT_TEST_NAME,
                   'id': Bite.Constants.RpfConsoleId.ELEMENT_TEST_NAME,
                   'class': 'dialog-text'})))),
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'section-title'},
          'Location'),
      goog.dom.createDom(goog.dom.TagName.DIV,
          {'class': 'option-row'},
          goog.dom.createDom(goog.dom.TagName.INPUT,
              {'type': 'radio',
               'name': 'SaveLocation',
               'id': 'localBox',
               'class': 'dialog-option'}),
          goog.dom.createDom(goog.dom.TagName.LABEL,
              {'for': 'localBox'},
              goog.dom.createDom(goog.dom.TagName.SPAN, {},
                  'Local'),
              goog.dom.createDom(goog.dom.TagName.SPAN,
                  {'class': 'option-note'},
                  ' (save to your browser\'s local storage)'))),
          goog.dom.createDom(goog.dom.TagName.DIV,
              {'class': 'option-row'},
              goog.dom.createDom(goog.dom.TagName.INPUT,
                  {'type': 'radio',
                   'name': 'SaveLocation',
                   'id': 'webBox',
                   'checked': 'True',
                   'class': 'dialog-option'}),
              goog.dom.createDom(goog.dom.TagName.LABEL,
                  {'for': 'webBox'},
                  goog.dom.createDom(goog.dom.TagName.SPAN, {},
                      'Web'),
                      goog.dom.createDom(goog.dom.TagName.SPAN,
                          {'class': 'option-note'},
                           ' (save to the cloud for sharing)'))));

  var buttonDiv = goog.dom.createDom(goog.dom.TagName.DIV,
      {'class': 'console-save-dialog-button-div console-footer'},
      saveButton = goog.dom.createDom(goog.dom.TagName.INPUT,
          {'id': 'saveTestDialog',
           'type': 'button',
           'value': 'Save'}),
      cancelButton = goog.dom.createDom(goog.dom.TagName.INPUT,
          {'id': 'cancelTestDialog',
           'type': 'button',
           'value': 'Cancel'}));

  dialogElem.appendChild(contentDiv);
  dialogElem.appendChild(buttonDiv);
  this.saveDialog_.setTitle('Save Script');
  this.saveDialog_.setButtonSet(null);
  this.saveDialog_.setVisible(true);
  this.saveDialog_.setVisible(false);

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

