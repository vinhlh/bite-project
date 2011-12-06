// This file was automatically generated from explore_page.soy.
// Please don't edit this file by hand.

goog.provide('bite.server.templates.explore');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showPageTopRow = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  var topnavList3 = opt_data.data.topnavs;
  var topnavListLen3 = topnavList3.length;
  for (var topnavIndex3 = 0; topnavIndex3 < topnavListLen3; topnavIndex3++) {
    var topnavData3 = topnavList3[topnavIndex3];
    output.append('<div class="topnav-item" id="topnav-', soy.$$escapeHtml(topnavData3.name), '" style="width: 50px;">', soy.$$escapeHtml(topnavData3.title), '</div>');
  }
  output.append('<span class="topnav-username" style="text-align: right;"></span>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div id="projectSelector"></div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showMainNavs = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  var mainNavList14 = opt_data.data.mainNavs;
  var mainNavListLen14 = mainNavList14.length;
  for (var mainNavIndex14 = 0; mainNavIndex14 < mainNavListLen14; mainNavIndex14++) {
    var mainNavData14 = mainNavList14[mainNavIndex14];
    output.append('<div class="mainnav-item" id="mainnav-', soy.$$escapeHtml(mainNavData14.name), '">', soy.$$escapeHtml(mainNavData14.title), '</div>');
  }
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showLeftNavs = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  var leftNavList22 = opt_data.data.filters;
  var leftNavListLen22 = leftNavList22.length;
  for (var leftNavIndex22 = 0; leftNavIndex22 < leftNavListLen22; leftNavIndex22++) {
    var leftNavData22 = leftNavList22[leftNavIndex22];
    output.append('<div class="leftnav-item" id="leftnav-', soy.$$escapeHtml(leftNavData22.name), '">', soy.$$escapeHtml(leftNavData22.title), '</div>');
  }
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showBodyArea = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table width="100%" height="100%" cellspacing="0" cellpadding="0"><tr class="mainnav"><td style="width: 180px; background-color: rgb(222, 228, 251); text-align: center; height: 24px;"><button id="createButton" style="width: 60%;">Create</button></td><td style="width: 10px;" rowspan="2"><td>');
  bite.server.templates.explore.showMainNavs(opt_data, output);
  output.append('</td><td style="width: 2px" rowspan="2"></td><td></td></tr><tr><td id="leftnav-bar" style="vertical-align: top; padding-top: 4px;"></td><td style="vertical-align: top; padding: 4px 4px 4px 4px; min-width: 300px;"><div id="main_content"></div></td><td><div id="main_preview"></div></td></tr></table>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showArtifactHeader = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<img class="artifact-logo" src="', soy.$$escapeHtml(opt_data.data.artifactHeader.icon), '"><div class="artifact-title">', (opt_data.data.artifactHeader.artifactTitle) ? soy.$$escapeHtml(opt_data.data.artifactHeader.artifactTitle) : soy.$$escapeHtml(opt_data.data.artifactHeader.title), '</div><div class="artifact-notes">', soy.$$escapeHtml(opt_data.data.artifactHeader.description), '</div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showArtifactContent = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  var rowList46 = opt_data.data.artifacts;
  var rowListLen46 = rowList46.length;
  for (var rowIndex46 = 0; rowIndex46 < rowListLen46; rowIndex46++) {
    var rowData46 = rowList46[rowIndex46];
    output.append('<div class="data-row" id="artifact', rowData46.type, '_', (rowData46.id) ? rowData46.id : rowData46.templateId, (rowData46.extraId) ? '_' + rowData46.extraId : '', '" name="', soy.$$escapeHtml(rowData46.title), '"><div id="artifact', soy.$$escapeHtml(rowData46.type), '_', soy.$$escapeHtml(rowData46.id), 'main" style="height: 50px;"><img class="data-icon" src="', soy.$$escapeHtml(rowData46.icon), '" /><div class="data-title">', soy.$$escapeHtml(rowData46.title), '</div>');
    if (rowData46.labels) {
      var labelList76 = rowData46.labels;
      var labelListLen76 = labelList76.length;
      for (var labelIndex76 = 0; labelIndex76 < labelListLen76; labelIndex76++) {
        var labelData76 = labelList76[labelIndex76];
        output.append((labelData76) ? '<div class="data-label">' + soy.$$escapeHtml(labelData76) + '</div>' : '');
      }
    }
    if (rowData46.highs) {
      var highlightList85 = rowData46.highs;
      var highlightListLen85 = highlightList85.length;
      for (var highlightIndex85 = 0; highlightIndex85 < highlightListLen85; highlightIndex85++) {
        var highlightData85 = highlightList85[highlightIndex85];
        output.append('<div class="data-label data-highlight" title="', soy.$$escapeHtml(highlightData85.note), '">', soy.$$escapeHtml(highlightData85.title), '</div>');
      }
    }
    if (rowData46.lows) {
      var lowlightList94 = rowData46.lows;
      var lowlightListLen94 = lowlightList94.length;
      for (var lowlightIndex94 = 0; lowlightIndex94 < lowlightListLen94; lowlightIndex94++) {
        var lowlightData94 = lowlightList94[lowlightIndex94];
        output.append('<div class="data-label data-lowlight" title="', soy.$$escapeHtml(lowlightData94.note), '">', soy.$$escapeHtml(lowlightData94.title), '</div>');
      }
    }
    output.append('<br />');
    var propList102 = rowData46.props;
    var propListLen102 = propList102.length;
    for (var propIndex102 = 0; propIndex102 < propListLen102; propIndex102++) {
      var propData102 = propList102[propIndex102];
      output.append((propData102.value) ? '<span><span class="prop-label">' + soy.$$escapeHtml(propData102.label) + '</span> <span class="prop-value">' + ((propData102.href) ? '<a onclick="swallowEvent" href="' + soy.$$escapeHtml(propData102.href) + '">' : '') + soy.$$escapeHtml(propData102.value) + ((propData102.href) ? '</a>' : '') + '</span>' + ((! (propIndex102 == propListLen102 - 1)) ? '<span class="prop-separator"> | </span>' : '') + '</span>' : '');
    }
    output.append((rowData46.description) ? '<div class="data-notes">' + soy.$$escapeHtml(rowData46.description) + '</div>' : '', '</div></div><div id="artifact', rowData46.type, '_', (rowData46.id) ? rowData46.id : rowData46.templateId, (rowData46.extraId) ? '_' + rowData46.extraId : '', 'more" class="data-more"><div class="data-actions">');
    if (rowData46.actions) {
      var actionList147 = rowData46.actions;
      var actionListLen147 = actionList147.length;
      for (var actionIndex147 = 0; actionIndex147 < actionListLen147; actionIndex147++) {
        var actionData147 = actionList147[actionIndex147];
        output.append('<span class="data-action" id="', soy.$$escapeHtml(actionData147.operation), '">', soy.$$escapeHtml(actionData147.title), '</span> ');
      }
    }
    output.append('</div><table cellpadding="4"><tr><td></td></tr></table></div>');
  }
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showContent = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div style="height: 55px;">');
  bite.server.templates.explore.showArtifactHeader(opt_data, output);
  output.append('</div><div class="action-row"><span class="action-label">sort by</span><span class="action-link">Time</span></div><div id="artifactItems"></div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showPreview = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div id="detailsPanel" style="padding-left: 10px; display: none"><div id="visualization"></div><div><table><tr><td><span class="prop-label">Completed:</td><td><span class="prop-value" id="detailCompleted"></span></td></tr></table></div><div><table><tr><td><span class="prop-label">Passed:</td><td><span class="prop-value" id="detailPassed"></span></td></tr></table></div><div><table><tr><td><span class="prop-label">Failed:</td><td><span class="prop-value" id="detailFailed"></span></td></tr></table></div><div><table><tr><td><span class="prop-label">Run duration:</span></td><td><span class="prop-value" id="detailDuration"></span></td></tr></table></div><div><table><tr><td><span class="prop-label">Started:</span></td><td><span class="prop-value" id="detailStartTime"></span></td></tr></table></div><div><table><tr><td><span class="prop-label">Run lead:</span></td><td><span class="prop-value" id="detailLead"></span></td></tr></table></div></div>');
  return opt_sb ? '' : output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string}
 * @notypecheck
 */
bite.server.templates.explore.showResults = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<table>');
  var resultList164 = opt_data.results;
  var resultListLen164 = resultList164.length;
  for (var resultIndex164 = 0; resultIndex164 < resultListLen164; resultIndex164++) {
    var resultData164 = resultList164[resultIndex164];
    output.append('<tr><td><span class="prop-value">', soy.$$escapeHtml(resultData164.id), '</span></td><td><span class="prop-value">', soy.$$escapeHtml(resultData164.name), '</span></td><td>', (resultData164.status == 'passed') ? '<img src="/images/state/teststate-passed-16.png">' : (resultData164.status == 'failed') ? '<img src="/images/state/teststate-failed-16.png">' : '<span class="prop-value">' + soy.$$escapeHtml(resultData164.status) + '</span>', '</td></tr>');
  }
  output.append('</table>');
  return opt_sb ? '' : output.toString();
};
