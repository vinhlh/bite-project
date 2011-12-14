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
 * @fileoverview Provides access to Bug Templates used in BITE.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.provide('bite.client.BugTemplate');
goog.provide('bite.client.BugTemplateList');
goog.provide('bite.client.TemplateManager');

goog.require('Bite.Constants');
goog.require('bite.common.net.xhr.async');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.string');


/**
 * A template for filing a new bug. The id is assumed to be unique.
 * Urls will determine which sites the bug is visible for.
 *
 * @typedef {{id: string,
 *            name: string,
 *            urls: Array.<string>,
 *            project: string,
 *            backendProject: string,
 *            backendProvider: string,
 *            selectorText: string,
 *            displayOrder: number,
 *            noteText: string}}
 */
bite.client.BugTemplate;


/**
 * A map of bug templates, keyed by templateId.
 * @typedef {Object.<string, bite.client.BugTemplate>}
 */
bite.client.BugTemplateList;



/**
 * A template manager grabs bug templates from the server.
 * @constructor
 */
bite.client.TemplateManager = function() {
  /**
   * An object holding all possible templates that have been retrieved from
   * the server, keyed by their template id.
   * @type {bite.client.BugTemplateList}
   * @private
   */
  this.templates_ = {};

  /**
   * Whether or not the list of templates has finished loading.
   * @type {boolean}
   * @private
   */
  this.loaded_ = false;
};
goog.addSingletonGetter(bite.client.TemplateManager);


/**
 * URL path for the get templates API.
 * @type {string}
 * @private
 */
bite.client.TemplateManager.FETCH_TEMPLATE_PATH_ = '/get_templates';


/**
 * The default bug template.  It is used when no other template is provide.
 * @type {bite.client.BugTemplate}
 * @private
 */
bite.client.TemplateManager.DEFAULT_TEMPLATE_ = {
  id: 'bite_default_bug',
  name: 'Other',
  urls: [],
  project: 'Other',
  backendProject: '',
  backendProvider: Bite.Constants.Providers.ISSUETRACKER,
  selectorText: 'Other',
  displayOrder: 0,
  noteText: 'Describe your problem: '
};


/**
 * Helper function which converts a BugTemplateList into an array of objects
 * where each object contains the project name and a list of templates
 * within in the project.
 *
 * @param {bite.client.BugTemplateList} templates The raw templates.
 * @return {!Array.<{name: string, templates: Array.<bite.client.BugTemplate>}>}
 */
bite.client.TemplateManager.getTemplatesByProject = function(templates) {
  var projects = {};
  for (var templateId in templates) {
    var template = templates[templateId];
    var projectName = template['project'];
    if (!projects[projectName]) {
      projects[projectName] = {'templates': []};
    }
    projects[projectName]['templates'].push(template);
  }
  var templatesByProject = [];
  for (var project in projects) {
    templatesByProject.push({name: project,
                             templates: projects[project]['templates']});
  }
  return templatesByProject;
};


/**
 * Asks the Template Manager to load templates from the server. This can be
 * used to pre-load templates and avoid a pause later in the application, or
 * to force the Template Manager to refresh its cache of templates.
 */
bite.client.TemplateManager.prototype.forceLoadTemplates = function() {
  this.loadTemplates_(function() {});
};


/**
 * Passes a list of all loaded templates to the callback.
 * @param {function(bite.client.BugTemplateList)} callback A callback.
 */
bite.client.TemplateManager.prototype.getAllTemplates = function(callback) {
  if (!this.loaded_) {
    this.loadTemplates_(callback);
  } else {
    callback(this.templates_);
  }
};


/**
 * Creates an array of all templates relevant to the input URL.
 * @param {function(bite.client.BugTemplateList)} callback A callback.
 * @param {string} url The URL to find templates for.
 */
bite.client.TemplateManager.prototype.getTemplatesForUrl =
    function(callback, url) {
  if (!this.loaded_) {
    this.loadTemplates_(goog.bind(this.getTemplatesForUrlInternal_,
                                  this,
                                  callback,
                                  url));
  } else {
    this.getTemplatesForUrlInternal_(callback, url, this.templates_);
  }
};


/**
 * Passes a list of all templates relevant to the URL to the callback.
 * TODO(ralphj): Implement a smarter system of URL matching.
 *
 * @param {function(bite.client.BugTemplateList)} callback The callback.
 * @param {string} url the URL to find templates for.
 * @param {bite.client.BugTemplateList} templates The bug templates to search
 *     through.
 * @private
 */
bite.client.TemplateManager.prototype.getTemplatesForUrlInternal_ =
    function(callback, url, templates) {
  var hasTemplate = false;
  var relevantTemplates = {};
  for (var templateId in templates) {
    var template = templates[templateId];
    for (var i = 0; i < template.urls.length; ++i) {
      var curUrl = template.urls[i];
      if (curUrl == 'all' || goog.string.startsWith(url, curUrl)) {
        relevantTemplates[templateId] = template;
        hasTemplate = true;
      }
    }
  }

  // Add default template if no templates are relevant.
  if (!hasTemplate) {
    template = bite.client.TemplateManager.DEFAULT_TEMPLATE_;
    relevantTemplates[template.id] = template;
  }

  callback(relevantTemplates);
};


/**
 * Handles the template data returned by the server.
 * @param {function(bite.client.BugTemplateList)} callback Function to call
 *     with the loaded templates.
 * @param {boolean} success Whether or not the request was successful.
 * @param {Object} data The data received by the request or an error string.
 * @private
 */
bite.client.TemplateManager.prototype.loadTemplatesCallback_ =
    function(callback, success, data) {
  if (!success) {
    console.error('Failed to connect to load templates: ' + data);
    this.useDefaultTemplate_();
  } else {
    // The data is in the form of a list of templates.
    try {
      var templates = goog.json.parse(data);
      if (templates.length < 1) {
        this.useDefaultTemplate_();
      } else {
        this.templates_ = {};
        for (var i = 0; i < templates.length; ++i) {
          var template = templates[i];
          this.templates_[template.id] = template;
        }
      }
    }
    catch (error) {
      this.useDefaultTemplate_();
    }
  }
  this.loaded_ = true;
  callback(this.templates_);
};


/**
 * Loads all templates from the server.
 * @param {function(bite.client.BugTemplateList)} callback Function to call
 *     with the loaded templates.
 * @private
 */
bite.client.TemplateManager.prototype.loadTemplates_ = function(callback) {
  var server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);
  var url = goog.Uri.parse(server);
  url.setPath(bite.client.TemplateManager.FETCH_TEMPLATE_PATH_);
  bite.common.net.xhr.async.get(url.toString(),
      goog.bind(this.loadTemplatesCallback_, this, callback));
};


/**
 * Handles the case where there are no templates available.
 * @private
 */
bite.client.TemplateManager.prototype.useDefaultTemplate_ = function() {
  template = bite.client.TemplateManager.DEFAULT_TEMPLATE_;
  this.templates_ = {};
  this.templates_[template.id] = template;
};
