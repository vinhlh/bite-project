// This file was automatically generated from run_details_settings.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.RunSettings');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunSettings.showTabSettings = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<td colspan="3"><table width="100%" style="border-spacing: 0;"><tr><td align="right" style="vertical-align:middle;" width="30%">Filtered results labels</td><td style="padding:5px"><input style="width: 400px;" id="runFilteredLabels"></td></tr><tr><td align="right" style="vertical-align:middle;">Test dimension labels</td><td style="padding:5px"><input style="width: 400px;" id="runDimensionLabels"></td></tr><tr><td align="right" style="vertical-align:middle;">Worker-mode token</td><td style="padding:5px"><input style="width: 400px;" id="runWorkerToken"></td></tr><tr><td align="right" style="vertical-align:middle;">Replace starting test URL</td><td style="padding:5px"><input style="width: 400px;" id="runStartUrl"></td></tr><tr><td colspan="2" align="center" style="vertical-align:middle;">Line Timeout limit (in sec)   <input style="width: 50px;" id="runLineTimeout"></td></tr><tr><td colspan="2" align="center" style="vertical-align:middle;">Max run time per test (in min)   <input style="width: 50px;" id="runTestTimeout"></td></tr><tr><td colspan="2" align="center" style="vertical-align:middle;">Save screenshots   <input type="checkbox" id="runSaveScnShots"></td></tr></table></td>');
  return opt_sb ? '' : output.toString();
};
