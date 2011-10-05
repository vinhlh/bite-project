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
 * @fileoverview This file contains the Rhino helper which is used to
 * generate java files on user's client.
 *
 * @author phu@google.com (Po Hu)
 * @author jasonstredwick@google.com (Jason Stredwick)
 */


goog.require('bite.webdriver');
goog.require('goog.json');
goog.require('rpf.DataModel');
goog.require('rpf.MiscHelper');


/**
 * Runs the Rhino commands to generate the WebDriver code.
 * @param {string} inputFilename The file containing the JavaScript code to
 *     translate into WebDriver Jave code.
 */
function runRhino(inputFilename) {
  var contents = '';
  try {
    contents = readFile(inputFilename);
    if (!contents) {
      throw 'File missing or no content.';
    }
  } catch (error) {
    print('ERROR: Failed to read specified file (' + inputFilename + '): ' +
          error);
    return;
  }

  var data = {};
  try {
    data = goog.json.parse(contents) || {};
  } catch (error) {
    print('ERROR: Failed to parse input file into object from JSON.');
    return;
  }

  var output = generateContents(data);
  for (var filename in output) {
    // Contents has to be pre-processed as it is passed through the shell
    // wrapped in double quotes.  Thus all double quotes in the contents must
    // be escapped and those already escapped must be doubly escaped.  To
    // accomplish this three steps are used:
    //    1. '\"' are converted to '&backslashdoublequote;'
    //    2. '"' are converted to '\"'
    //    3. '&backslashdoublequote;' converted to '\\\"'
    // This works assuming another combination of '\' and '"' does not exist.
    var rawContent = output[filename];
    var replaceBDQ = rawContent.replace(/[\\]["]/g, '&backslashdoublequote;');
    var replaceQ = replaceBDQ.replace(/["]/g, '\\"');
    contents = replaceQ.replace(/[&]backslashdoublequote[;]/g, '\\\\\\\"');

    var command = 'echo -nE "' + contents + '" > ' + filename;
    var obj = {'args': [command]};

    runCommand('sh', ['-c'], obj);
  }
}


/**
 * Creates the generated WebDriver Java files for the given project data.
 * @param {!Object} data The object containing information about the project
 *     such as project details, tests, etc.
 * @return {!Object} A mapping of filenames to file content strings; one for
 *     each generated file.  Returns null if there is no output.
 */
function generateContents(data) {
  if (!data) {
    return {};
  }

  var dataModel = new rpf.DataModel();
  var processedData = dataModel.convertDataToRaw(data);
  var pages = bite.webdriver.getWebdriverCode(processedData);

  var files = {};
  for (var pageName in pages) {
    var filename = pageName + '.java';
    var page = pages[pageName];
    files[filename] = page;
  }

  return files;
}

runRhino(inputFilename);
quit();

