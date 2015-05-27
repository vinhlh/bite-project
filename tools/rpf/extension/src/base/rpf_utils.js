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
};

rpf.Utils.prototype.stopRecording = function () {
    this.rpf_.getEventsManager().getRecorder().stopRecording();
};

var rpfUtils = rpf.Utils.getInstance();

/**
 * Override
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
            console.log(rpfUtils.getScreenshotManager().getGeneratedCmds());
            break;

        case Bite.Constants.UiCmds.ADD_NEW_COMMAND:
            // TODO: store a command
            if (request.params['cmdMap']) {
                bite.console.Helper.assignInfoMap(rpfUtils.infoMap, request.params['cmdMap']);
            }
            break;

        case Bite.Constants.UiCmds.ADD_SCREENSHOT:
            rpfUtils.getScreenshotManager().addScreenShot(request.params['dataUrl'], request.params['iconUrl']);
            break;
    }
};