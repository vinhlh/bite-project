// This file was automatically generated from set_details_runs.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.details.SetRuns');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.SetRuns.showTabRuns = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%"><tr><td width="20%" style="vertical-align:top;"><div class="sidebarHolder" style="float:left;"><div id="leftnav-bar" class="kd-content-sidebar"><ul class="iconlist">');
  var rowList301 = opt_data.data;
  var rowListLen301 = rowList301.length;
  for (var rowIndex301 = 0; rowIndex301 < rowListLen301; rowIndex301++) {
    var rowData301 = rowList301[rowIndex301];
    output.append('<li class="kd-sidebarlistitem" id="', soy.$$escapeHtml(rowData301.name), '"><a>', soy.$$escapeHtml(rowData301.title), '</a></li>');
  }
  output.append('</ul></div></div></td><td width="50%" style="vertical-align:top;font-size:16px;"><div style="float: left; padding: 15px 0 0 5px;"><div id="filteredRuns"></div></div></td><td width="30%" style="font-size:16px;vertical-align:top;"><div style="float: left; padding: 15px 0 0 5px;"><div id="main_preview"></div></div></td></tr></table>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.details.SetRuns.showFilteredRuns = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  var runList310 = opt_data.runs;
  var runListLen310 = runList310.length;
  for (var runIndex310 = 0; runIndex310 < runListLen310; runIndex310++) {
    var runData310 = runList310[runIndex310];
    output.append('<div class="data-row" id="artifact', runData310.type, '_', runData310.id, '" name="', soy.$$escapeHtml(runData310.title), '" onclick=""><div id="artifact', runData310.type, '_', runData310.id, 'main" style="height: 65px;"><img class="data-icon" src="', soy.$$escapeHtml(runData310.icon), '" /><div class="data-title">', soy.$$escapeHtml(runData310.title), '</div>');
    var labelList330 = runData310.labels;
    var labelListLen330 = labelList330.length;
    for (var labelIndex330 = 0; labelIndex330 < labelListLen330; labelIndex330++) {
      var labelData330 = labelList330[labelIndex330];
      output.append('<div class="data-label">', soy.$$escapeHtml(labelData330), '</div>');
    }
    if (runData310.highs) {
      var highlightList337 = runData310.highs;
      var highlightListLen337 = highlightList337.length;
      for (var highlightIndex337 = 0; highlightIndex337 < highlightListLen337; highlightIndex337++) {
        var highlightData337 = highlightList337[highlightIndex337];
        output.append('<div class="data-label data-highlight" title="', soy.$$escapeHtml(highlightData337.note), '">', soy.$$escapeHtml(highlightData337.title), '</div>');
      }
    }
    output.append('<br />');
    var propList345 = runData310.props;
    var propListLen345 = propList345.length;
    for (var propIndex345 = 0; propIndex345 < propListLen345; propIndex345++) {
      var propData345 = propList345[propIndex345];
      output.append('<span><span class="prop-label">', soy.$$escapeHtml(propData345.label), '</span> <span class="prop-value">', (propData345.href) ? '<a onclick="swallowEvent" href="' + soy.$$escapeHtml(propData345.href) + '">' : '', soy.$$escapeHtml(propData345.value), (propData345.href) ? '</a>' : '', '</span>', (! (propIndex345 == propListLen345 - 1)) ? '<span class="prop-separator"> | </span>' : '', '</span>');
    }
    output.append((runData310.description) ? '<div class="data-notes">' + soy.$$escapeHtml(runData310.description) + '</div>' : '', '</div><div id="artifact', runData310.type, '_', runData310.id, 'more" class="data-more"><div class="data-actions">');
    if (runData310.actions) {
      var actionList378 = runData310.actions;
      var actionListLen378 = actionList378.length;
      for (var actionIndex378 = 0; actionIndex378 < actionListLen378; actionIndex378++) {
        var actionData378 = actionList378[actionIndex378];
        output.append('<span class="data-action" id="', soy.$$escapeHtml(actionData378.operation), '">', soy.$$escapeHtml(actionData378.title), '</span> ');
      }
    }
    output.append('</div><table cellpadding="4"><tr><td></td></tr></table></div></div>');
  }
  return opt_sb ? '' : output.toString();
};
