// This file was automatically generated from set_details_page.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showTabSettings = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<td colspan="3"><table width="100%" style="border-spacing: 0;"><tr><td align="right" style="vertical-align: middle;" width="30%">Worker-mode Token</td><td style="padding: 5px"><input style="width: 400px;" id="setToken"><img src="/images/bugstate-resolved-32.png" width="15px"></td></tr><tr><td align="right" style="vertical-align: middle;" width="30%">Replace starting test URL</td><td style="padding: 5px"><input style="width: 400px;" id="setReplaceUrl"><img src="/images/bugstate-resolved-32.png" width="15px"></td></tr><tr><td align="right" style="vertical-align: middle;">Interval</td><td style="padding: 5px"><input style="width: 50px;" id="setInterval"> minutes <img src="/images/bugstate-resolved-32.png" width="15px"></td></tr></tr></table><table width="100%" style="border-spacing: 0;"><tr><td align="right" style="vertical-align: middle;" width="30%">Email-from address</td><td style="padding: 5px"><input style="width: 400px;" id="setEmailFrom"></td></tr><tr><td align="right" style="vertical-align: middle;">Email-to address</td><td style="padding: 5px"><input style="width: 400px;" id="setEmailTo"></td></tr><tr><td align="right" style="vertical-align: middle;">Test failure email threshold %</td><td style="padding: 5px"><input style="width: 50px;" id="setEmailThreshold"><img src="/images/bugstate-resolved-32.png" width="15px"></td></tr></table></td>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showTabOverview = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<td colspan="3"><table width="100%" style="border-spacing: 0;"><tr><td align="right" style="vertical-align: middle;" width="30%">Project</td><td style="padding: 5px"><input style="width: 400px;" id="setProject"></td></tr><tr><td align="right" style="vertical-align: middle;">Description</td><td style="padding: 5px"><textarea style="width: 400px;" rows="3" id="setDesc"></textarea></td></tr><tr><td align="right" style="vertical-align: middle;">Labels (separated by comma)</td><td style="padding: 5px"><input style="width: 400px;" id="setLabels"></td></tr></table></td>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showTabTests = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<td colspan="3"><table width="100%" style="border-spacing: 0;"><tr class="mainnav"><td style="padding: 8px" colspan="2"><div style="display: inline">Pick test cases using</div><div style="display: inline"><input type="radio" name="testsSrc" id="acc">ACC</div></td></tr><tr><td><div id="loadTestsFromDiv"></div></td></tr><tr><td><div id="showTestsDiv"></div></td></tr></table></td>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showTestList = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%"><tr><td align="center"><div style="padding: 10px" class="artifact-title">Tests included in This Set (', soy.$$escapeHtml(opt_data.tests.length), ')</div></td></tr></table><table width="100%" style="border-spacing: 0;"><tr class="mainnav"><td style="vertical-align: middle; min-width: 3px;" rowspan="', soy.$$escapeHtml(opt_data.tests.length + 2), '"></td><td style="vertical-align: middle;" width="10%">id</td><td style="vertical-align: middle;" width="50%">Title</td><td style="vertical-align: middle;" width="15%">Author</td><td style="vertical-align: middle;" width="25%">Labels</td><td style="vertical-align: middle; min-width: 3px;" rowspan="', soy.$$escapeHtml(opt_data.tests.length + 2), '"></td></tr>');
  var testList197 = opt_data.tests;
  var testListLen197 = testList197.length;
  for (var testIndex197 = 0; testIndex197 < testListLen197; testIndex197++) {
    var testData197 = testList197[testIndex197];
    output.append('<tr><td style="vertical-align: middle;" width="10%">', soy.$$escapeHtml(testData197['id']), '</td><td style="vertical-align: middle;" width="50%">', soy.$$escapeHtml(testData197['title']), '</td><td style="vertical-align: middle;" width="15%">', (testData197['author']) ? soy.$$escapeHtml(testData197['author']) : '', '</td><td style="vertical-align: middle;" width="25%">');
    var labelList207 = testData197['labels'];
    var labelListLen207 = labelList207.length;
    for (var labelIndex207 = 0; labelIndex207 < labelListLen207; labelIndex207++) {
      var labelData207 = labelList207[labelIndex207];
      output.append('<div class="data-label">', soy.$$escapeHtml(labelData207), '</div>');
    }
    output.append('</td></tr>');
  }
  output.append('<tr class="mainnav"><td height="3px" colspan="4"></td></tr></table>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<input type="text" id="setName" style="width: 150px;display: none;"><div style="display: inline" id="savedTime"></div><div style="display: none" id="saveSuiteButton"></div><div style="display: inline" id="loadSuiteButton"></div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.showBodyArea = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div id="setTabDetailDiv"></div>');
  return opt_sb ? '' : output.toString();
};
