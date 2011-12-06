// This file was automatically generated from result_page.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.ResultPage');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.ResultPage.showHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.ResultPage.showBodyArea = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%" style="border-spacing: 0;"><tr><td><img id="resultScreenshot" width="100%"></td></tr></table>');
  return opt_sb ? '' : output.toString();
};
