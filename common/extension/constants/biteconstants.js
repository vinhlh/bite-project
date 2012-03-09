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
 * @fileoverview BITE constants.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('Bite.Constants');



/**
 * Enum for result values.
 * @enum {string}
 */
Bite.Constants.WorkerResults = {
  FAILED: 'failed',
  PASS: 'passed',
  STOPPED: 'stop'
};


/**
 * The default function name for getting element's descriptor.
 * @const
 * @type {string}
 */
Bite.Constants.FUNCTION_PARSE_DESCRIPTOR = 'parseElementDescriptor';


/**
 * A list of URLs which should trigger automatic recording.
 * @const
 * @type {Array.<string>}
 */
Bite.Constants.AUTO_RECORD_URLS = [
    'maps.google.com'
];


/**
 * Enum of the commands for controlling rpf components.
 * @enum {string}
 */
Bite.Constants.CONTROL_CMDS = {
  CREATE_WINDOW: 'createWindow',
  OPEN_CONSOLE_AUTO_RECORD: 'openConsoleAutoRecord',
  REMOVE_WINDOW: 'removeWindow',
  SET_WORKER_TOKEN: 'setWorkerToken',
  SET_WORKER_URL: 'setWorkerUrl',
  START_WORKER_MODE: 'startWorkerMode',
  STOP_WORKER_MODE: 'stopWorkerMode'
};


/**
 * Enum of the event types when a step is completed.
 * @enum {string}
 */
Bite.Constants.COMPLETED_EVENT_TYPES = {
  AUTOMATE_SAVE_DIALOG: 'automateSaveDialog',
  DEFAULT: '',
  FAILED: 'failed',
  FINISHED_CURRENT_RUN: 'finishedCurrentRun',
  FINISHED_LOAD_TEST_IN_CONSOLE: 'finishedLoadTestInConsole',
  FINISHED_RUNNING_TEST: 'finishedRunningTest',
  FINISHED_UPDATE_TEST_RESULT: 'finishedUpdateTestResult',
  HIGHLIGHTED_LINE: 'highlightedLine',
  LINE_HIGHLIGHTED: 'lineHighlighted',
  LOCAL_PROJECT_LOADED: 'localProjectLoaded',
  PLAYBACK_DIALOG_OPENED: 'playbackDialogOpened',
  PLAYBACK_STARTED: 'playbackStarted',
  PROJECT_LOADED: 'projectLoaded',
  PROJECT_SAVED_LOCALLY: 'projectSavedLocally',
  RUN_PLAYBACK_COMPLETE: 'runPlaybackComplete',
  RUN_PLAYBACK_STARTED: 'runPlaybackStarted',
  STOPPED_GROUP_TESTS: 'stoppedGroupTests',
  TEST_LOADED: 'testLoaded',
  PROJECT_LOADED_IN_EXPORT: 'projectLoadedInExport',
  TEST_SAVED: 'testSaved',
  RPF_CONSOLE_OPENED: 'rpfConsoleOpened'
};


/**
 * Enum of the commands between rpf console and background world.
 * @enum {string}
 */
Bite.Constants.CONSOLE_CMDS = {
  AUTOMATE_RPF: 'automateRpf',
  CALLBACK_AFTER_EXEC_CMDS: 'callBackAfterExecCmds',
  CHECK_PLAYBACK_OPTION_AND_RUN: 'checkPlaybackOptionAndRun',
  CHECK_READY_TO_RECORD: 'checkReadyToRecord',
  CLOSE_CURRENT_TAB: 'closeCurrentTab',
  DELETE_CMD: 'deleteCommand',
  DELETE_TEST_LOCAL: 'deleteTestLocal',
  DELETE_TEST_ON_WTF: 'deleteTestOnWTF',
  END_UPDATER_MODE: 'endUpdaterMode',
  ENTER_UPDATER_MODE: 'enterUpdaterMode',
  EVENT_COMPLETED: 'eventCompleted',
  EXECUTE_SCRIPT_IN_RECORD_PAGE: 'executeScriptInRecordPage',
  FETCH_DATA_FROM_BACKGROUND: 'fetchDataFromBackground',
  FINISH_CURRENT_RUN: 'finishCurrentRun',
  GENERATE_NEW_COMMAND: 'generateNewCommand',
  GET_ALL_FROM_WEB: 'getAllFromWeb',
  GET_HELPER_NAMES: 'getHelperNames',
  GET_LAST_MATCH_HTML: 'getLastMatchHtml',
  GET_LOCAL_PROJECT: 'getLocalProject',
  GET_LOGS_AS_STRING: 'getLogsAsString',
  GET_JSON_FROM_WTF: 'getJsonFromWTF',
  GET_JSON_LOCALLY: 'getJsonLocally',
  GET_PROJECT: 'getProject',
  GET_PROJECT_NAMES_FROM_LOCAL: 'getProjectNamesFromLocal',
  GET_PROJECT_NAMES_FROM_WEB: 'getProjectNamesFromWeb',
  GET_TEST_NAMES_LOCALLY: 'getTestNamesLocally',
  INSERT_CMDS_WHILE_PLAYBACK: 'insertCmdsWhilePlayback',
  LOAD_PROJECT_FROM_LOCAL_SERVER: 'loadProjectFromLocalServer',
  OPEN_XPATH_FINDER: 'openXpathFinder',
  PAGE_LOADED_COMPLETE: 'pageLoadedComplete',
  PREPARE_RECORD_PLAYBACK_PAGE: 'prepareRecordPlaybackPage',
  PREPARE_XPATH_FINDER: 'prepareXpathFinder',
  RECORD_PAGE_LOADED_COMPLETE: 'recordPageLoadedComplete',
  REFRESH_CODE_TREE: 'refreshCodeTree',
  RUN_GROUP_TESTS: 'runGroupTests',
  RUN_TEST: 'runTest',
  SAVE_LOG_AND_HTML: 'saveLogAndHtml',
  SAVE_JSON_LOCALLY: 'saveJsonLocally',
  SAVE_PROJECT: 'saveProject',
  SAVE_PROJECT_LOCALLY: 'saveProjectLocally',
  SAVE_PROJECT_METADATA_LOCALLY: 'saveProjectMetadataLocally',
  SAVE_ZIP: 'saveZip',
  SET_ACTION_CALLBACK: 'setActionCallback',
  SET_CONSOLE_TAB_ID: 'setConsoleTabId',
  SET_DEFAULT_TIMEOUT: 'setDefaultTimeout',
  SET_INFO_MAP_IN_PLAYBACK: 'setInfoMapInPlayback',
  SET_MAXIMUM_RETRY_TIME: 'setMaximumRetryTime',
  SET_PLAYBACK_INTERVAL: 'setPlaybackInterval',
  SET_RECORDING_TAB: 'setRecordingTab',
  SET_TAB_AND_START_RECORDING: 'setTabAndStartRecording',
  SET_TAKE_SCREENSHOT: 'setTakeScreenshot',
  SET_USE_XPATH: 'setUseXpath',
  SET_USER_SPECIFIED_PAUSE_STEP: 'setUserSpecifiedPauseStep',
  START_AUTO_RECORD: 'startAutoRecord',
  START_RECORDING: 'startRecording',
  STOP_GROUP_TESTS: 'stopGroupTests',
  STOP_RECORDING: 'stopRecording',
  TEST_LOCATOR: 'testLocator',
  TEST_DESCRIPTOR: 'testDescriptor',
  UPDATE_ON_WEB: 'updateOnWeb',
  UPDATE_TEST_RESULT_ON_SERVER: 'updateTestResultOnServer',
  USER_SET_PAUSE: 'userSetPause',
  USER_SET_STOP: 'userSetStop'
};


/**
 * Enum for playback methods.
 * @enum {string}
 */
Bite.Constants.PlayMethods = {
  ALL: 'all',
  STEP: 'step'
};


/**
 * Key codes used by BITE
 * @enum {number}
 */
Bite.Constants.KeyCodes = {
  B_KEY: 66
};


/**
 * Urls used to control the Layer Manager.
 * @enum {string}
 */
Bite.Constants.LayerUrl = {
  DEFAULT_LAYER_LIST: '/layer/config/default_list',
  STATIC_RESOURCES: '/layer/'
};


/**
 * BITE lock, to ensure only one content script is running on a page.
 *
 * @type {string}
 */
Bite.Constants.BITE_CONSOLE_LOCK = 'biteConsoleLock';


/**
 * Define common actions that everyone can use.
 * @enum {string}
 */
Bite.Constants.Action = {
  XHR_REQUEST: 'xhrRequest'
};


/**
 * Enum of actions handled by the Background script.
 * @enum {string}
 */
Bite.Constants.HUD_ACTION = {
  CHANGE_RECORD_TAB: 'changeRecordTab',
  CREATE_BUG: 'createBug',
  CREATE_RPF_WINDOW: 'createRpfWindow',
  ENSURE_CONTENT_SCRIPT_LOADED: 'ensureContentScriptLoaded',
  FETCH_BUGS: 'fetchBugs',
  FETCH_TEST_DATA: 'fetchTestData',
  FETCH_BUGS_DATA: 'fetchBugsData',
  GET_CURRENT_USER: 'getCurrentUser',
  GET_LOCAL_STORAGE: 'getLocalStorage',
  GET_RECORDING_LINK: 'getRecordingLink',
  GET_SCREENSHOT: 'getScreenshot',
  GET_SETTINGS: 'getSettings',
  GET_SERVER_CHANNEL: 'getServerChannel',
  GET_TEMPLATES: 'getTemplates',
  HIDE_ALL_CONSOLES: 'hideAllConsoles',
  HIDE_CONSOLE: 'hideConsole',
  LOAD_CONTENT_SCRIPT: 'loadContentScript',
  LOG_EVENT: 'logEvent',
  LOG_TEST_RESULT: 'logTestResult',
  REMOVE_LOCAL_STORAGE: 'resetLocalStorage',
  SET_LOCAL_STORAGE: 'setLocalStorage',
  START_NEW_BUG: 'startNewBug',
  TOGGLE_BUGS: 'toggleBugs',
  TOGGLE_TESTS: 'toggleTests',
  UPDATE_BUG: 'updateBug',
  UPDATE_DATA: 'updateData'
};


/**
 * Bug binding actions.
 * @enum {string}
 */
Bite.Constants.BugBindingActions = {
  UPDATE: 'update',
  CLEAR: 'clear'
};


/**
 * Bug recording actions.
 * @enum {string}
 */
Bite.Constants.BugRecordingActions = {
  UPDATE: 'update'
};


/**
 * Playback failure reasons.
 * @enum {string}
 */
Bite.Constants.PlaybackFailures = {
  MULTIPLE_RETRY_FIND_ELEM: 'MultipleRetryFindElemFailure',
  MULTIPLE_RETRY_CUSTOM_JS: 'MultipleRetryCustomJsFailure',
  TIMEOUT: 'TimeoutFailure',
  UNSUPPORTED_COMMAND_FAILURE: 'UnsupportedCommandFailure',
  USER_PAUSE_FAILURE: 'UserPauseFailure'
};


/**
 * HUD console types.
 * @enum {string}
 */
Bite.Constants.TestConsole = {
  NONE: 'none',
  BUGS: 'bugsConsole',
  TESTS: 'testConsole',
  NEWBUG: 'newBugConsole'
};


/**
 * Test result types.
 * @enum {string}
 */
Bite.Constants.TestResult = {
  PASS: 'pass',
  FAIL: 'fail',
  SKIP: 'skip'
};


/**
 * Bug DB Providers.
 * @enum {string}
 */
Bite.Constants.Providers = {
  DATASTORE: 'datastore',
  ISSUETRACKER: 'issuetracker'
};


/**
 * Returns the url of the options page.
 * @return {string} The url.
 */
Bite.Constants.getOptionsPageUrl = function() {
  return chrome.extension.getURL('options.html');
};


/**
 * The test's own lib name.
 * @type {string}
 */
Bite.Constants.TEST_LIB_NAME = 'This Test';


/**
 * Enum for modes.
 * @enum {string}
 */
Bite.Constants.ConsoleModes = {
  DEFINE: 'define',
  IDLE: 'idle',
  PAUSE: 'pause',
  PLAY: 'play',
  RECORD: 'record',
  UPDATER: 'updater',
  VIEW: 'view',
  WORKER: 'worker'
};


/**
 * Enum for modes.
 * @enum {string}
 */
Bite.Constants.ListenerDestination = {
  CONSOLE: 'console',
  EVENT_MANAGER: 'eventManager',
  RPF: 'rpf',
  CONTENT: 'content'
};


/**
 * Enum for console events.
 * @enum {string}
 */
Bite.Constants.UiCmds = {
  // For main console.
  ADD_GENERATED_CMD: 'addGeneratedCmd',
  ADD_NEW_COMMAND: 'addNewCommand',
  ADD_NEW_TEST: 'addNewTest',
  ADD_SCREENSHOT: 'addScreenShot',
  CHANGE_MODE: 'changeMode',
  CHECK_TAB_READY: 'checkTabReady',
  CHECK_TAB_READY_TO_UPDATE: 'checkTabReadyToUpdate',
  HIGHLIGHT_LINE: 'highlightLine',
  LOAD_CMDS: 'loadCmds',
  LOAD_TEST_FROM_LOCAL: 'loadTestFromLocal',
  LOAD_TEST_FROM_WTF: 'loadTestFromWtf',
  ON_CONSOLE_CLOSE: 'onConsoleClose',
  ON_CONSOLE_REFRESH: 'onConsoleRefresh',
  ON_KEY_DOWN: 'onKeyDown',
  ON_KEY_UP: 'onKeyUp',
  ON_SHOW_MORE_INFO: 'onShowMoreInfo',
  ON_SHOW_MORE_OPTIONS: 'onShowMoreOptions',
  OPEN_GENERATE_INVOCATION: 'openGenerateInvocation',
  OPEN_VALIDATION_DIALOG: 'openValidationDialog',
  RECORD_TAB_CLOSED: 'recordTabClosed',
  RESET_SCREENSHOTS: 'resetScreenShots',
  SET_CONSOLE_STATUS: 'setConsoleStatus',
  SET_FINISHED_TESTS_NUMBER: 'setFinishedTestsNumber',
  SET_SHOW_TIPS: 'setShowTips',
  SET_START_URL: 'setStartUrl',
  SHOW_EXPORT: 'showExport',
  SHOW_INFO: 'showInfo',
  SHOW_NOTES: 'showNotes',
  SHOW_QUICK_CMDS: 'showQuickCmds',
  SHOW_SAVE_DIALOG: 'showSaveDialog',
  SHOW_SCREENSHOT: 'showScreenshot',
  SHOW_SETTING: 'showSetting',
  SHOW_PLAYBACK_RUNTIME: 'showPlaybackRuntime',
  START_RECORDING: 'startRecording',
  START_WORKER_MODE: 'startWorkerMode',
  STOP_RECORDING: 'stopRecording',
  TOGGLE_CONTENT_MAP: 'showContentMap',
  TOGGLE_PROJECT_INFO: 'showProjectInfo',
  UPDATE_CURRENT_STEP: 'updateCurrentStep',
  UPDATE_ELEMENT_AT_LINE: 'updateElementAtLine',
  UPDATE_LOCATOR: 'updateLocator',
  UPDATE_PLAYBACK_STATUS: 'updatePlaybackStatus',
  UPDATE_SCRIPT_INFO: 'updateScriptInfo',
  UPDATE_WHEN_ON_FAILED: 'updateWhenOnFailed',
  UPDATE_WHEN_RUN_FINISHED: 'updateWhenRunFinished',

  // For console helper.
  LOAD_SELECTED_LIB: 'loadSelectedLib',
  GENERATE_CUSTOMIZED_FUNCTION_CALL: 'generateCustomizedFunctionCall',

  // For details dialog.
  ON_CMD_MOVE_DOWN: 'onCmdMoveDown',
  ON_CMD_MOVE_UP: 'onCmdMoveUp',
  ON_EDIT_CMD: 'onEditCmd',
  ON_INSERT_ABOVE: 'onInsertAbove',
  ON_INSERT_BELOW: 'onInsertBelow',
  ON_LEAVE_COMMENTS: 'onLeaveComments',
  ON_PREV_PAGE: 'onPrevPage',
  ON_NEXT_PAGE: 'onNextPage',
  ON_REMOVE_CUR_LINE: 'onRemoveCurLine',
  POST_DEADLINE: 'postDeadline',
  UPDATE_HIGHLIGHT_LINE: 'updateHighlightLine',

  // For playback dialog.
  AUTOMATE_PLAY_MULTIPLE_TESTS: 'automatePlayMultipleTests',
  DELETE_CMD: 'deleteCmd',
  FAIL_CMD: 'failCmd',
  INSERT_CMD: 'insertCmd',
  OVERRIDE_CMD: 'overrideCmd',
  SET_PLAYBACK_ALL: 'setPlaybackAll',
  SET_PLAYBACK_PAUSE: 'setPlaybackPause',
  SET_PLAYBACK_STEP: 'setPlaybackStep',
  SET_PLAYBACK_STOP: 'setPlaybackStop',
  SET_PLAYBACK_STOP_ALL: 'setPlaybackStopAll',
  UPDATE_CMD: 'updateCmd',
  UPDATE_COMMENT: 'updateComment',

  // For validation dialog.
  ADD_VALIDATE_POSITION_CMD: 'addValidatePositionCmd',
  CHOOSE_VALIDATION_POSITION: 'chooseValidatePosition',
  DISPLAY_ALL_ATTRIBUTES: 'displayAllAttributes',

  // For savedialog.
  SAVE_TEST: 'saveTestToServer',

  // For loaddialog.
  AUTOMATE_DIALOG_LOAD_PROJECT: 'automateDialogLoadProject',
  AUTOMATE_DIALOG_LOAD_TEST: 'automateDialogLoadTest',
  SET_PROJECT_INFO: 'setProjectInfo',

  // For quick command dialog.
  UPDATE_INVOKE_SELECT: 'updateInvokeSelect',

  // For settings dialog.
  GENERATE_WEBDRIVER_CODE: 'generateWebdriverCode'
};


/**
 * The options for the more information panel of the RPF console. This is
 * the panel beneath the toolbar, which can be hidden or can show
 * additional information about the current test.
 * @enum {string}
 */
Bite.Constants.RpfConsoleInfoType = {
  NONE: 'none',
  PROJECT_INFO: 'projectInfo',
  CONTENT_MAP: 'contentMap'
};


/**
 * Define ConsoleManager ids for data and management.
 * @enum {string}
 */
Bite.Constants.RpfConsoleId = {
  CONTENT_MAP_CONTAINER: 'rpf-content-map',
  CURRENT_PROJECT: 'rpf-current-project',
  DATA_CONTAINER: 'datafileContainer',
  ELEMENT_START_URL: 'startUrl',
  ELEMENT_STATUS: 'statusLog',
  ELEMENT_TEST_ID: 'testId',
  ELEMENT_TEST_NAME: 'testName',
  PROJECT_INFO_CONTAINER: 'rpf-project-info',
  SCRIPTS_CONTAINER: 'scriptsContainer'
};


/**
 * The commands in record helper.
 * @enum {string}
 */
Bite.Constants.RECORD_ACTION = {
  OPEN_XPATH_FINDER: 'openXpathFinder',
  START_RECORDING: 'startRecording',
  START_UPDATE_MODE: 'startUpdateMode',
  STOP_RECORDING: 'stopRecording'
};


/**
 * The commands to automate RPF.
 * @enum {string}
 */
Bite.Constants.RPF_AUTOMATION = {
  AUTOMATE_SINGLE_SCRIPT: 'automateSingleScript',
  LOAD_AND_RUN_FROM_LOCAL: 'loadAndRunFromLocal',
  PLAYBACK_MULTIPLE: 'playbackMultiple'
};


/**
 * The constants to playback scripts.
 * @enum {number}
 */
Bite.Constants.RPF_PLAYBACK = {
  INTERVAL: 700,
  REDIRECTION_TIMEOUT: 40 * 1000
};


/**
 * Enum for view modes.
 * @enum {string}
 */
Bite.Constants.ViewModes = {
  CODE: 'code',
  READABLE: 'readable',
  BOOK: 'book',
  UPDATER: 'updater'
};

