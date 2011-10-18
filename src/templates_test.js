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
 * @fileoverview Tests for the BugTemplate and TemplateManager.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.require('Bite.Constants');
goog.require('bite.client.TemplateManager');
goog.require('bite.common.net.xhr.async');
goog.require('goog.json');
goog.require('goog.testing.PropertyReplacer');


var stubs = new goog.testing.PropertyReplacer();


var testTemplates = {
 'geo_tiles':
     {id: 'geo_tiles',
      urls: ['http://maps.google.com'],
      project: 'Geo',
      name: 'Map Tiles',
      backendProject: 'geo_map_tiles',
      backendProvider: Bite.Constants.Providers.ISSUETRACKER,
      selectorText: 'A problem with a map tile',
      displayOrder: 0,
      noteText: 'Enter your problem description. TILES'
     },

 'geo_address':
     {id: 'geo_address',
      urls: ['http://maps.google.com'],
      project: 'Geo',
      name: 'Address/Business Search',
      backendProject: 'geo_address_business_search',
      backendProvider: Bite.Constants.Providers.ISSUETRACKER,
      selectorText: 'Inaccurate or incorrect search results',
      displayOrder: 0,
      noteText: 'Enter your problem description. ADDRESS'
     },

 'chrome_render':
     {id: 'chrome_render',
      urls: [],
      project: 'Chrome',
      name: 'Directions',
      backendProject: 'geo_directions',
      backendProvider: Bite.Constants.Providers.ISSUETRACKER,
      selectorText: 'Wrong or missing directions',
      displayOrder: 0,
      noteText: 'Enter your problem description. DIRECTIONS'
     },

 'all_other':
     {id: 'all_other',
      urls: [],
      project: 'Default',
      name: 'Public Transit',
      backendProject: 'geo_public_transit',
      backendProvider: Bite.Constants.Providers.ISSUETRACKER,
      selectorText: 'An issue with public transit directions',
      displayOrder: 5,
      noteText: 'Enter your problem description. TRANSIT'
     }
};


/**
 * Asserts that the template list passed in has template ids equal to the
 * list passed in.
 * @param {Array.<string>} expectedIds A list of expected template ids.
 * @param {bite.client.BugTemplateList} templates The list of templates.
 */
var assertTemplateIdsEqual = function(expectedIds, templates) {
  var i = 0;
  for (templateid in templates) {
    assertEquals(expectedIds[i], templateid);
    ++i;
  }
};


/**
 * Used to mock bite.common.net.xhr.async.get
 * @param {string} url The url.
 * @param {Function} callback The callback.
 */
var mockXhr = function(url, callback) {
  callback(true, goog.json.serialize(testTemplates));
};


function setUp() {
  stubs.set(bite.options.data, 'get', function() {return 'a_string'});
}


function tearDown() {
  stubs.reset();
}


/**
 * Tests the GetTemplatesByProject() static function.
 * @this The context of the unit test.
 */
function testGetTemplatesByProject() {
  var projects =
      bite.client.TemplateManager.getTemplatesByProject(testTemplates);
  assertEquals(3, projects.length);
  assertEquals('Geo', projects[0].name);
  assertEquals(2, projects[0].templates.length);
  assertEquals('Chrome', projects[1].name);
  assertEquals(1, projects[1].templates.length);
}


/**
 * Tests the GetTemplates() function.
 * @this The context of the unit test.
 */
function testGetTemplates() {
  templateManager = bite.client.TemplateManager.getInstance();
  stubs.set(bite.common.net.xhr.async, 'get', mockXhr);
  templateManager.getAllTemplates(
      goog.partial(assertTemplateIdsEqual,
                   ['geo_tiles', 'geo_address, chrome_render, all_other']));
}


/**
 * Tests the GetTemplates() function when there are no templates in the
 * backend.
 * @this The context of the unit test.
 */
function testDefaultTemplate() {
  templateManager = bite.client.TemplateManager.getInstance();
  stubs.set(bite.common.net.xhr.async, 'get', function() {return null;});
  templateManager.getAllTemplates(goog.partial(assertTemplateIdsEqual,
                                               ['bite_default_bug']));
}

