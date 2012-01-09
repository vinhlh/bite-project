/** @interface */
var AceSession = function() {};

/** @interface */
var AceSessionDoc = function() {};

/** @interface */
var AceRenderer = function() {};

/** @interface */
var AceEditor = function() {};

/** @type {AceSessionDoc} */
AceSession.prototype.doc;

/** @interface */
var RequireOutput = function() {};

/** @return {RequireOutput} */
var require = function(path) {};

/**
 * @constructor */
RequireOutput.prototype.Mode;

/** @type {AceRenderer} */
AceEditor.prototype.renderer;

/**
 * @param {number} row
 * @param {string} className */
AceRenderer.prototype.addGutterDecoration = function(row, className) {};

/**
 * @param {number} row
 * @param {string} className */
AceRenderer.prototype.removeGutterDecoration = function(row, className) {};

/** @param {boolean} alwaysVisible */
AceRenderer.prototype.setHScrollBarAlwaysVisible = function(alwaysVisible) {};

/** @param {Object} range */
AceSessionDoc.prototype.getTextRange = function(range) {};

/** @return {number} */
AceSession.prototype.getLength = function() {};

/**
 * @param {number} row
 * @return {string} */
AceSession.prototype.getLine = function(row) {};

/** @return {string} */
AceSession.prototype.getValue = function() {};

/** @param {boolean} useWrap */
AceSession.prototype.setUseWrapMode = function(useWrap) {};

/** @param {string} text */
AceSession.prototype.setValue = function(text) {};

/**
 * @param {number} min
 * @param {number} max
 */
AceSession.prototype.setWrapLimitRange = function(min, max) {};

/** @param {RequireOutput.prototype.Mode} mode */
AceSession.prototype.setMode = function(mode) {};

/** @return {AceSession} */
AceEditor.prototype.getSession = function() {};

/** @return {Object} */
AceEditor.prototype.getSelectionRange = function() {};

/***/
AceEditor.prototype.resize = function() {};

/** @constructor */
var ace;

/**
 * @param {string} elementName The name of the editor element.
 * @return {AceEditor}
 */
ace.edit = function(elementName) {};

