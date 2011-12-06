// This file was automatically generated from run_details_overview.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.RunOverview');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunOverview.showTabOverview = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<td colspan="3"><table width="100%" style="border-spacing: 0;"><tr><td align="right" style="vertical-align:middle;" width="30%">Name</td><td style="padding:5px"><input style="width: 400px;" id="runName"></td></tr><tr><td align="right" style="vertical-align:middle;">Description</td><td style="padding:5px"><textarea style="width: 400px;" rows="3" id="runDesc"></textarea></td></tr><tr><td align="right" style="vertical-align:middle;">Run occurrence</td><td style="vertical-align:middle; padding:5px">every  <input type="text" name="interval" id="interval">  minutes</td></tr></table></td>');
  return opt_sb ? '' : output.toString();
};
