/**
 * Custom build: to extract the framework
 *
 * @author VinhLH
 */

goog.provide('rpf.Utils');

goog.require('rpf.Constants');
goog.require('rpf.Rpf');

goog.require('bite.console.Helper');
goog.require('bite.console.Screenshot');

/**
 * Utility functions
 * @constructor
 * @export
 */
rpf.Utils = function () {
    /**
     * @type {rpf.Rpf}
     * @private
     */
    this.rpf_ = rpf.Rpf.getInstance();

    /**
     * The info map.
     * @type {Object}
     */
    this.infoMap = {};

    /**
     * data File
     * @type {Array}
     */

    this.dataFile = [];

    /**
     * The screenshot manager instance.
     * @type {bite.console.Screenshot}
     * @private
     */
    this.screenshotMgr_ = new bite.console.Screenshot();
};
goog.addSingletonGetter(rpf.Utils);

/**
 * @return {rpf.Rpf} The RPF object.
 * @export
 */
rpf.Utils.prototype.getRpfObj = function() {
  return this.rpf_;
};

/**
 * Sets a new RPF object.
 * @param {rpf.Rpf} rpfObj The new RPF obj.
 * @export
 */
rpf.Utils.prototype.setRpfObj = function(rpfObj) {
  this.rpf_ = rpfObj;
};

/**
 * @return {bite.console.Screenshot} The screenshot manager instance.
 * @export
 */
rpf.Utils.prototype.getScreenshotManager =
    function() {
  return this.screenshotMgr_;
};

rpf.Utils.prototype.startRecording = function (tabId, windowId) {
    this.rpf_.getEventsManager().setConsoleTabId(tabId);
    this.rpf_.getEventsManager().getRecorder().startRecording(null, tabId, windowId);

    this.infoMap = {};
    this.getScreenshotManager().clear();
};

rpf.Utils.prototype.stopRecording = function () {
    this.rpf_.getEventsManager().getRecorder().stopRecording();
};

rpf.EventsManager.prototype.isInjected = function (tabId) {
    return this.injectedTabs_[tabId] ? true : false;
};

rpf.Utils.prototype.setRecordingTab = function (tabId, windowId) {
    var eventMgr = this.rpf_.getEventsManager();

    if (!eventMgr.isInjected(tabId)) {
        return false;
    }

    eventMgr.getRecorder().setRecordingTab(tabId, windowId);
    return true;
};

rpf.Utils.prototype.getRecordingData = function () {
    var screenMgr = this.getScreenshotManager(),
        screenshots = screenMgr.getScreenshots(),
        cmds = screenMgr.getCmdIndices(),
        newScreenshots = {};

    for (var i = 0; i < screenshots.length; i++) {
        newScreenshots[cmds[i]] = screenshots[i];
    }

    return {
        infoMap: this.infoMap,
        screenshots: newScreenshots,
        dataFile: this.dataFile
    };
};

rpf.Utils.prototype.isRecording = function () {
    return this.rpf_.getEventsManager().getRecorder().isRecording();
};

/**
 * Override this fucntion to save all generated commands
 *
 * @param {Object} request The request object.
 * @param {function(*)=} opt_callback The callback function.
 * @private
 */
rpf.EventsManager.prototype.sendMessageToConsole_ = function (request, opt_callback) {
    if (!request.command) {
        return;
    }

    console.log(request.command, request.params);

    var rpfUtils = rpf.Utils.getInstance();

    switch (request.command) {
        case Bite.Constants.UiCmds.ADD_GENERATED_CMD:
            rpfUtils.getScreenshotManager().addGeneratedCmd(request.params['cmd']);
            // console.log(rpfUtils.getScreenshotManager().getGeneratedCmds());
            break;

        case Bite.Constants.UiCmds.ADD_NEW_COMMAND:
            // TODO: store a command
            if (request.params['cmdMap']) {
                bite.console.Helper.assignInfoMap(rpfUtils.infoMap, request.params['cmdMap']);
                rpfUtils.getScreenshotManager().addIndex(request.params['cmdMap']['id']);

                if (request.params['dCmd']) {
                    rpfUtils.dataFile.push(request.params['dCmd']);
                }
            } else {
                rpfUtils.getScreenshotManager().addGeneratedCmd(request.params['pCmd']);
            }
            break;

        case Bite.Constants.UiCmds.ADD_SCREENSHOT:
            rpfUtils.getScreenshotManager().addScreenShot(request.params['dataUrl'], request.params['iconUrl']);
            break;

        case Bite.Constants.UiCmds.UPDATE_PLAYBACK_STATUS:
            var playbackTabId = CaptureBackground.getPlaybackTabId();

            playbackTabId && chrome.tabs.sendMessage(playbackTabId, {
                type: 'updatePlaybackStatus',
                data: request.params
            });
            break;
        case Bite.Constants.UiCmds.UPDATE_CURRENT_STEP:
            var playbackTabId = CaptureBackground.getPlaybackTabId();

            playbackTabId && chrome.tabs.sendMessage(playbackTabId, {
                type: 'updateCurrentStep',
                data: request.params
            });
            break;
        case Bite.Constants.UiCmds.UPDATE_WHEN_ON_FAILED:
            var playbackTabId = CaptureBackground.getPlaybackTabId();

            playbackTabId && chrome.tabs.sendMessage(playbackTabId, {
                type: 'updateWhenOnFailed',
                data: request.params
            });
            break;
    }
};

var rpfUtils = rpf.Utils.getInstance();

