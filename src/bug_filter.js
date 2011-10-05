// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Handles client-side filtering of bugs.
 *
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.provide('bite.bugs.filter');

goog.require('bite.options.constants');


/**
 * Filter bugs based on setting from the Options Page.  The filter will mark
 * bugs as visible or not.
 * @param {?Object} allBugs All the bugs fetched from the server.
 * @param {?Object} filters The filters to be applied.
 */
bite.bugs.filter = function(allBugs, filters) {
  if (!allBugs || !filters) {
    return;
  }

  for (var i = 0; i < allBugs.length; ++i) {
    var bugs = allBugs[i][1];

    for (var j = 0; j < bugs.length; ++j) {
      var bug = bugs[j];
      bug['visible'] = bite.bugs.isVisible_(bug, filters);
    }
  };
};


/**
 * Apply the filters to the given bug and determine if it should be visible.
 * @param {!Object} bug The bug to examine.
 * @param {!Object} filters The filters to apply.
 * @return {boolean} Whether or not the given bug should be marked visible.
 * @private
 */
bite.bugs.isVisible_ = function(bug, filters) {
  // TODO (jasonstredwick): Once projects are implemented, update this code.
  // HACK to get projects working immediately, using static ones.
  var project = bug['project'];
  var projectFilter = filters[bite.options.constants.Id.BUG_PROJECT];
  if (projectFilter != bite.options.constants.ProjectOption.ALL) {
    if (projectFilter == bite.options.constants.ProjectOption.NOT_TRASH) {
      if (project == 'trash') {
        return false;
      }

    // If the project filter doesn't match the start of the project
    // (which are treated as a separate projects) to be classified under one
    // filter.  For example "geo_other" will match projectFilter "geo".
    } else if(project.substr(0, projectFilter.length) != projectFilter) {
      return false;
    }
  }

  var state = bug['state'];
  var stateFilter = filters[bite.options.constants.Id.BUG_STATE];
  if (stateFilter != bite.options.constants.ThreeWayOption.ALL) {
    if (stateFilter != state) {
      return false;
    }
  }

  var all = bite.options.constants.ThreeWayOption.ALL;
  var no = bite.options.constants.ThreeWayOption.NO;
  var yes = bite.options.constants.ThreeWayOption.YES;

  var recording = bug['recording_link'];
  var recordingFilter = filters[bite.options.constants.Id.BUG_RECORDING];
  if (recordingFilter != all) {
    if ((recordingFilter == yes && !recording) ||
        (recordingFilter == no && recording)) {
      return false;
    }
  }

  var screenshot = bug['screenshot'];
  var screenshotFilter = filters[bite.options.constants.Id.BUG_SCREENSHOT];
  if (screenshotFilter != all) {
    if ((screenshotFilter == yes && !screenshot) ||
        (screenshotFilter == no && screenshot)) {
      return false;
    }
  }

  var target = bug['target_element'];
  var uiBinding = (target && target != 'null') ? target : null;
  var uiBindingFilter = filters[bite.options.constants.Id.BUG_UI_BINDING];
  if (uiBindingFilter != all) {
    if ((uiBindingFilter == yes && !uiBinding) ||
        (uiBindingFilter == no && uiBinding)) {
      return false;
    }
  }

  return true;
};

