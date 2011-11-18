// This file was automatically generated from project_details_page.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.ProjectPage');

goog.require('soy');
goog.require('soy.StringBuilder');
goog.require('bite.server.templates.explore');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.ProjectPage.showHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div style="display: inline" id="savedTime"></div><div style="display: inline" id="saveProjectButton"></div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.ProjectPage.showBodyArea = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%" style="border-spacing: 0;"><tr class="mainnav"><td colspan="3"><div id="mainnav-group">');
  bite.server.templates.explore.showMainNavs(opt_data, output);
  output.append('</div></td></tr><tr><td id="setTabDetailDiv"></td></tr></table>');
  return opt_sb ? '' : output.toString();
};
