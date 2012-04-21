/**
 * The ChromeFormData is a hack necessary to overcome some compiler errors
 * when using FormData with 3 parameters.
 *
 * @param {?Element=} opt_form An optional form to use for constructing the form
 *     data set.
 * @constructor
 * @see http://www.w3.org/TR/XMLHttpRequest2/#the-formdata-interface
 * @extends FormData
 */
function ChromeFormData(opt_form) {}

//BiteFormData.prototype = new FormData();
/**
 * @param {string} name
 * @param {Blob|string} value
 * @param {string=} opt_filename
 */
ChromeFormData.prototype.append = function(name, value, opt_filename) {};
