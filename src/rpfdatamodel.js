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
 * @fileoverview This file is used to generate rpf project data model file
 * which can be exported to users and imported back.
 *
 * For the raw data it is in a format of
 * {'name': ...
 *  'project_details': {'package': ...},
 *  'tests': [{'script': ...,
 *             'datafile': {dataInput, infoMap: {
 *                 Please see biteconcolehelper for the details}}},
 *             'name': ...,
 *             'url': ...} ...]}
 *
 * During the conversion, we'll trim off the info like selectors, which
 * is not needed in webdriver code.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('rpf.DataModel');

goog.require('bite.base.Helper');
goog.require('bite.console.Helper');
goog.require('common.client.ElementDescriptor');



/**
 * A class for handling data model related operations.
 * @constructor
 */
rpf.DataModel = function() {
};


/**
 * Consolidates the raw data of the descriptor string.
 * @param {Object} descriptor The original descriptor object which
 *     contains element's attributes information.
 * @return {Object} The consolidated descriptor object.
 * @private
 */
rpf.DataModel.prototype.consolidateDescriptor_ = function(descriptor) {
  var newDescriptor = {'attributes': {}};
  newDescriptor['tagName'] = descriptor['tagName'];
  var verifications = common.client.ElementDescriptor.getAttrsToVerify(
      descriptor, unescape);
  for (var name in verifications) {
    switch (name) {
      case 'elementText':
        newDescriptor['elementText'] = verifications['elementText'];
        break;
      case 'checked':
        newDescriptor['checked'] = verifications['checked'];
        break;
      case 'disabled':
        newDescriptor['disabled'] = verifications['disabled'];
        break;
      case 'selectedIndex':
        newDescriptor['selectedIndex'] = verifications['selectedIndex'];
        break;
      default:
        newDescriptor['attributes'][name] = verifications[name];
    }
  }
  return newDescriptor;
};


/**
 * Reverts to the raw data of the descriptor string..
 * @param {Object} descriptor The consolidated descriptor object which
 *     contains element's attributes information.
 * @return {Object} The raw descriptor object.
 * @private
 */
rpf.DataModel.prototype.revertDescriptor_ = function(descriptor) {
  function createMap(value) {
    return {'show': 'must', 'value': value};
  }
  var newDescriptor = {'attributes': {}};
  newDescriptor['tagName'] = descriptor['tagName'];
  for (var name in descriptor) {
    switch (name) {
      case 'elementText':
      case 'checked':
      case 'disabled':
      case 'selectedIndex':
        newDescriptor[name] = createMap(descriptor[name]);
        break;
      case 'attributes':
        for (var attr in descriptor[name]) {
          newDescriptor[name][attr] = createMap(descriptor[name][attr]);
        }
        break;
    }
  }
  return newDescriptor;
};


/**
 * Consolidates the raw data of the information map.
 * @param {Object} infoMap The original information map object.
 * @return {Object} The consolidated information map object.
 * @private
 */
rpf.DataModel.prototype.consolidateInfoMap_ = function(infoMap) {
  var newInfoMap = {
    'steps': {},
    'elems': {}
  };
  for (var step in infoMap['steps']) {
    var curStep = infoMap['steps'][step];
    newInfoMap['steps'][step] = {
      'elemId': curStep['elemId'],
      'action': curStep['action'],
      'stepName': curStep['stepName'],
      'varName': curStep['varName'],
      'tagName': curStep['tagName'],
      'pageName': curStep['pageName']
    };
  }
  for (var elem in infoMap['elems']) {
    var curElem = infoMap['elems'][elem];
    newInfoMap['elems'][elem] = {
      'xpaths': curElem['xpaths'],
      'descriptor': this.consolidateDescriptor_(curElem['descriptor']),
      'iframeInfo': curElem['iframeInfo']
    };
  }
  return newInfoMap;
};


/**
 * Reverts to the raw data of the information map.
 * @param {Object} infoMap The consolidated information map object.
 * @return {Object} The raw information map object.
 * @private
 */
rpf.DataModel.prototype.revertInfoMap_ = function(infoMap) {
  var newInfoMap = {
    'steps': {},
    'elems': {}
  };
  for (var step in infoMap['steps']) {
    var curStep = infoMap['steps'][step];
    newInfoMap['steps'][step] = {
      'elemId': curStep['elemId'],
      'action': curStep['action'],
      'stepName': curStep['stepName'],
      'varName': curStep['varName'],
      'tagName': curStep['tagName'],
      'pageName': curStep['pageName']
    };
  }
  for (var elem in infoMap['elems']) {
    var curElem = infoMap['elems'][elem];
    newInfoMap['elems'][elem] = {
      'xpaths': curElem['xpaths'],
      'descriptor': this.revertDescriptor_(curElem['descriptor']),
      'iframeInfo': curElem['iframeInfo']
    };
  }
  return newInfoMap;
};


/**
 * Consolidates the raw data of the project object.
 * @param {{name: string, tests: Array}} projectInfo
 *     The project information map, which contains
 *     project specific information and a group of test information.
 * @return {!Object} The consolidated project info object.
 */
rpf.DataModel.prototype.consolidateData = function(projectInfo) {
  var result = {'name': projectInfo['name'],
                'project_details': projectInfo['project_details'],
                'tests': []};
  var tests = projectInfo['tests'];
  for (var i = 0, len = tests.length; i < len; ++i) {
    var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
    var data = bite.console.Helper.trimInfoMap(testObj['datafile']);
    testObj['datafile'] = data['datafile'];
    testObj['infoMap'] = this.consolidateInfoMap_(data['infoMap']);
    result['tests'].push(testObj);
  }
  return result;
};


/**
 * Converts the data model object to raw information object.
 * @param {!Object} projectInfo The project information map, which contains
 *     project specific information and a group of test information.
 * @return {!Object} The raw project info object.
 */
rpf.DataModel.prototype.convertDataToRaw = function(projectInfo) {
  var newProject = {};
  newProject['project_details'] = projectInfo['project_details'];
  newProject['userId'] = projectInfo['userId'];
  newProject['name'] = projectInfo['name'];
  newProject['tests'] = [];
  var tests = projectInfo['tests'];
  for (var i = 0, len = tests.length; i < len; ++i) {
    var testObj = tests[i];
    testObj['datafile'] = bite.console.Helper.appendInfoMap(
        this.revertInfoMap_(testObj['infoMap']), testObj['datafile']);
    newProject['tests'].push({'test_name': testObj['name'],
                              'test': goog.json.serialize(testObj)});
  }
  return newProject;
};

