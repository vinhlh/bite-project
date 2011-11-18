// This file was automatically generated from run_details_page.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.RunPage');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunPage.showHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div style="display: inline" id="savedTime"></div><div style="display: none" id="saveRunButton"></div><div style="display: inline" id="loadRunButton"></div></td>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunPage.showBodyArea = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div id="setTabDetailDiv"></div>');
  return opt_sb ? '' : output.toString();
};
