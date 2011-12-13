// This file was automatically generated from run_details_results.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.RunResults');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunResults.showResultsData = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%"><tr><td id="detailedResultsTable" width="70%" style="vertical-align:top;"></td><td id="summaryResultsData" style="padding:0 0 0 20px;"></td></tr></table>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunResults.showResultsSummaryData = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%"><tr><td><div id="visualization" style="text-align:center;"></div></td></tr><tr><td><table width="100%" height="200px" style="font-size:16px;"><tr><td><ul>');
  var rowList231 = opt_data.data.summaryRows;
  var rowListLen231 = rowList231.length;
  for (var rowIndex231 = 0; rowIndex231 < rowListLen231; rowIndex231++) {
    var rowData231 = rowList231[rowIndex231];
    output.append('<li><div><span class="prop-label">Pass:</span> <span class="prop-value">', soy.$$escapeHtml(rowData231.pass), '</span></div></li><li><div><span class="prop-label">Fail:</span> <span class="prop-value">', soy.$$escapeHtml(rowData231.fail), '</span></div></li><li><div><span class="prop-label">Not Run:</span> <span class="prop-value">', soy.$$escapeHtml(rowData231.notRun), '</span></div></li><li><div><span class="prop-label">Total number:</span> <span class="prop-value">', soy.$$escapeHtml(rowData231.total), '</span></div></li>');
  }
  output.append('<li><div><span class="prop-label">Run duration:</span> <span class="prop-value">', soy.$$escapeHtml(opt_data.data.elapsedTimeStr), '</span></div></li><li><div><span class="prop-label">Started:</span> <span class="prop-value">', soy.$$escapeHtml(opt_data.data.startTimeStr), '</span></div></li><li><div><span class="prop-label">Number of testers:</span> <span class="prop-value">', soy.$$escapeHtml(opt_data.data.numOfTesters), '</span></div></li><li><div><span class="prop-label">Results labels:</span> <span class="prop-value">', soy.$$escapeHtml(opt_data.data.resultsLabels), '</span></div></li></ul></td></tr></table></td></tr></table>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.RunResults.showDetailedResultsTable = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div style="height:25px;padding:10px 0px;"><span class="title-style">Tests In This Run (', soy.$$escapeHtml(opt_data.data.numOfTests), ')</span></div><div class="kd-toolbar kd-buttonbar"><div class="kd-button kd-toolbarbutton small left" id="playbackTests" style="float:left;"><img src="images/toolbar/play.png" width="21px" height="21px" title="Replay the selected tests."></div></div><table width="100%" border="0" cellspacing="0" cellpadding="0" class="kd-table" id="resultTable"><thead><tr><th width="10%"></th><th width="20%"><span style="font-weight: bold;">Title</span></th><th width="15%"><span style="font-weight: bold;">Result</span></th><th width="20%"><span style="font-weight: bold;">Ago</span></th><th width="20%"><span style="font-weight: bold;">IP address</span></th><th width="15%"><span style="font-weight: bold;">Screenshot</span></th></tr></thead><tbody>');
  var rowList255 = opt_data.data.resultRows;
  var rowListLen255 = rowList255.length;
  for (var rowIndex255 = 0; rowIndex255 < rowListLen255; rowIndex255++) {
    var rowData255 = rowList255[rowIndex255];
    output.append('<tr><td><input id="', soy.$$escapeHtml(rowIndex255), '-checkbox" type="checkbox" name="resultCheckbox"></td><td><span id="', soy.$$escapeHtml(rowIndex255), '_testName" style="font-weigth: bold;" title="', soy.$$escapeHtml(rowData255.id), '">', soy.$$escapeHtml(rowData255.name), '</span></td><td>', (rowData255.status == 'passed') ? '<span style="color: green;">' : (rowData255.status == 'failed') ? '<span style="color: red;">' : '<span>', soy.$$escapeHtml(rowData255.status), '</span></td><td><span>', soy.$$escapeHtml(rowData255.when), '</span></td><td><span>', soy.$$escapeHtml(rowData255.tester), '</span></td><td>', (rowData255.status == 'failed') ? '<a href="/home#page=result&resultKey=' + soy.$$escapeHtml(rowData255.resultKey) + '" target="_blank">here</a>' : '', '<div id="', soy.$$escapeHtml(rowIndex255), '_log" style="display:none">', soy.$$escapeHtml(rowData255.log), '</div></td></tr>');
  }
  output.append('</tbody><div id="rpfLaunchData" style="display:none;"></div></table>');
  return opt_sb ? '' : output.toString();
};
