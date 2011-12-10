//Copyright 2010 Google Inc. All Rights Reserved.

/**
 * @fileoverview This file contains the tests' save and load manager.
 *
 * @author phu@google.com (Po Hu)
 */

goog.provide('rpf.SaveLoadManager');

goog.require('Bite.Constants');
goog.require('bite.options.constants');
goog.require('bite.options.data');
goog.require('goog.Uri');
goog.require('goog.net.XhrIo');
goog.require('rpf.DataModel');
goog.require('rpf.MiscHelper');
goog.require('rpf.ScriptManager');
goog.require('rpf.StatusLogger');



/**
 * A class for saving and loading tests from locally or cloud.
 * @param {rpf.ScriptManager} scriptMgr The script manager.
 * @param {function(Object, function(*)=)} sendMessageToConsole The
 *     function to send message to console world.
 * @param {function(Object, Object, function(Object))} eventMgrListener
 *     The listener registered in eventsManager.
 * TODO(phu): Consider splitting this into saveManager and loadManager.
 * @constructor
 */
rpf.SaveLoadManager = function(scriptMgr, sendMessageToConsole,
    eventMgrListener) {
  this.scriptMgr_ = scriptMgr;

  // TODO(phu): Put the test data in get method.
  this.server = bite.options.data.get(bite.options.constants.Id.SERVER_CHANNEL);

  /**
   * The function to send message to console world.
   * @type {function(Object, function(*)=)}
   * @private
   */
  this.sendMessageToConsole_ = sendMessageToConsole;

  /**
   * The event lisnener registered on event manager.
   * @type {function(Object, Object, function(Object))}
   * @private
   */
  this.eventMgrListener_ = eventMgrListener;
};


/**
 * The url path on the server to use for storage requests.
 * @const
 * @type {string}
 * @private
 */
rpf.SaveLoadManager.STORAGE_SERVER_PATH_ = '/storage';


/**
 * The test steps depository server.
 * @const
 * @type {string}
 * @private
 */
rpf.SaveLoadManager.STEPS_DEPOSIT_SERVER_ =
    'http://suite-executor.appspot.com';

/**
 * The local storage name.
 * @const
 * @type {string}
 * @private
 */
rpf.SaveLoadManager.LOCAL_STORAGE_NAME_ = 'rpfscripts';


/**
 * The default project name.
 * @const
 * @type {string}
 * @private
 */
rpf.SaveLoadManager.WEB_DEFAULT_PROJECT_ = 'rpf';


/**
 * Gets all the test names from cloud and updates the loader dialog.
 * @param {string} projectName The project name.
 * @param {function(Object)} sendResponse The response function.
 * @export
 */
rpf.SaveLoadManager.prototype.getAllFromWeb = function(
    projectName, sendResponse) {
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/getalltestsasjson',
      {'test_flavor': 'json',
       'project': projectName});
  // TODO(phu): If this causes memory leak, move it out.
  goog.net.XhrIo.send(requestUrl, function() {
    var jsonObj = this.getResponseJson();
    sendResponse({'jsonObj': jsonObj});
  });
};


/**
 * Gets project details and all its tests from cloud and updates.
 * @param {string} name The project name.
 * @param {string} userId A string representation of the current user.
 * @param {function(Object)} sendResponse The response function.
 * @export
 */
rpf.SaveLoadManager.prototype.getProject = function(name, userId,
                                                    sendResponse) {
  var requestUrl = this.server + rpf.SaveLoadManager.STORAGE_SERVER_PATH_ +
                   '/getproject';
  var parameters = goog.Uri.QueryData.createFromMap({'name': name}).toString();
  goog.net.XhrIo.send(requestUrl, goog.partial(function(userId, e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var jsonObj = this.getResponseJson();
      jsonObj['userId'] = userId;
      jsonObj['name'] = name;
      sendResponse({'jsonObj': jsonObj,
                    'location': 'web'});
    } else {
      sendResponse({'jsonObj': {'error': true}});
    }
  }, userId), 'POST', parameters);
};


/**
 * Gets project details and all its tests from cloud and updates.
 * @param {string} name The project name.
 * @param {string} data A json string version of the project details.
 * @param {function(Object)} sendResponse The response function.
 * @export
 */
rpf.SaveLoadManager.prototype.saveProject = function(name, data,
                                                     sendResponse) {
  var requestUrl = this.server + rpf.SaveLoadManager.STORAGE_SERVER_PATH_ +
                   '/saveproject';
  var parameters = goog.Uri.QueryData.createFromMap({
    'name': name,
    'data': data
  }).toString();
  goog.net.XhrIo.send(requestUrl, function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      sendResponse({'success': true});
    } else {
      sendResponse({'success': false});
    }
  }, 'POST', parameters);
};


/**
 * Deletes a test from wtf.
 * @param {Array} jsonIds The tests ids.
 * @param {Function=} opt_callback The optional callback function.
 * @export
 */
rpf.SaveLoadManager.prototype.deleteTestOnWtf = function(
    jsonIds, opt_callback) {
  var callback = opt_callback || null;
  var parameters = goog.Uri.QueryData.createFromMap(
      {'ids': goog.json.serialize(jsonIds)}).toString();
  var requestUrl = this.server +
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/deletetest';

  goog.net.XhrIo.send(requestUrl, function() {
    if (callback) {
      callback();
    }
  }, 'POST', parameters);
};


/**
 * Create a new test in the cloud.
 * @param {string} jsonName the test name.
 * @param {Object} jsonObj the test object.
 * @param {string=} opt_projectName The project name.
 * @param {Object=} opt_screens The optional screen data url.
 * @param {string=} opt_url The optional url.
 * @param {boolean=} opt_noConsole Whether recording is done not or from rpf
 *     Console UI.
 * @param {function(Object)=} opt_callback The response function.
 * @param {string=} opt_userLib The user library.
 * @export
 */
rpf.SaveLoadManager.prototype.createNewTestOnWeb = function(
    jsonName, jsonObj, opt_projectName, opt_screens, opt_url, opt_noConsole,
    opt_callback, opt_userLib) {
  var projectName = opt_projectName ||
                    rpf.SaveLoadManager.WEB_DEFAULT_PROJECT_;
  var url = opt_url || '';
  var screens = opt_screens || '';
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/addtest',
      {});

  var params = {
    'project': projectName,
    'name': jsonName,
    'url_to_test': url,
    'test_flavor': 'json',
    'json': goog.json.serialize(jsonObj)};
  if (opt_userLib) {
    params['jsFiles'] = opt_userLib;
  }
  var parameters = goog.Uri.QueryData.createFromMap(params).toString();

  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var idStr = xhr.getResponseText().split('=')[1];
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.SAVE_SUCCESS,
                      'color': 'green'});
      }
      this.getJsonFromWTF(idStr, null);
      if (screens) {
        this.saveScreens_(idStr, screens);
      }
    } else {
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.SAVE_FAILED,
                      'color': 'red'});
      }
      throw new Error('Failed to create the new test. Error status: ' +
                      xhr.getStatus());
    }
  }, this), 'POST', parameters);
};


/**
 * Saves the screenshots.
 * @param {string} idStr The test id.
 * @param {Object} screens The screen shots.
 * @private
 */
rpf.SaveLoadManager.prototype.saveScreens_ = function(idStr,
    screens) {
  var requestUrl = '';
  var parameters = '';
  requestUrl = rpf.MiscHelper.getUrl(
      rpf.SaveLoadManager.STEPS_DEPOSIT_SERVER_,
      '/requests',
      {});
  parameters = goog.Uri.QueryData.createFromMap(
      {'cmd': '23',
       'id': idStr,
       'steps': goog.json.serialize(screens)}).toString();
  goog.net.XhrIo.send(requestUrl, function() {}, 'POST', parameters);
};


/**
 * Updates an existing test in the cloud.
 * @param {string} jsonName the test name.
 * @param {Object} jsonObj the test object.
 * @param {string} jsonId the test id.
 * @param {string=} opt_projectName The project name.
 * @param {Object=} opt_screens The optional screen data url object.
 * @param {function(Object)=} opt_callback The response function.
 * @param {string=} opt_userLib The user library.
 * @export
 */
rpf.SaveLoadManager.prototype.updateTestOnWeb = function(
    jsonName, jsonObj, jsonId, opt_projectName, opt_screens,
    opt_callback, opt_userLib) {
  var projectName = opt_projectName ||
                    rpf.SaveLoadManager.WEB_DEFAULT_PROJECT_;
  var screens = opt_screens || null;
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/updatetest',
      {});
  var params = {
    'id': jsonId,
    'project': projectName,
    'name': jsonName,
    'url_to_test': 'na',
    'test_flavor': 'json',
    'json': goog.json.serialize(jsonObj)};
  if (opt_userLib) {
    params['jsFiles'] = opt_userLib;
  }
  var parameters = goog.Uri.QueryData.createFromMap(params).toString();
  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.SAVE_SUCCESS,
                      'color': 'green'});
      }
      this.getJsonFromWTF(jsonId, null);
    } else {
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.SAVE_FAILED,
                      'color': 'red'});
      }
      throw new Error('Failed to update the test. Error status: ' +
                      xhr.getStatus());
    }
  }, this), 'POST', parameters);
  if (screens) {
    this.saveScreens_(jsonId, screens);
  }
};


/**
 * Updates an existing test in the cloud.
 * @param {string} jsonId the test id.
 * @param {Function=} opt_callback The optional callback function.
 * @export
 */
rpf.SaveLoadManager.prototype.getJsonFromWTF = function(jsonId, opt_callback) {
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/gettestasjson',
      {'id': jsonId});

  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var jsonObj = goog.json.parse(xhr.getResponseText());
      var jsonObjprop = goog.json.parse(jsonObj[0].json);
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.LOAD_TEST_SUCCESS,
                      'color': 'green'});
      }

      this.scriptMgr_.parseJsonObj(jsonObjprop);
      this.scriptMgr_.idOnWeb = jsonObj[0].id;

      this.sendMessageToConsole_(
          {'command': Bite.Constants.UiCmds.UPDATE_SCRIPT_INFO,
           'params': {'name': jsonObjprop['name'],
                      'url': jsonObjprop['url'],
                      'script': jsonObjprop['script'],
                      'datafile': jsonObjprop['datafile'],
                      'userlib': jsonObjprop['userlib'],
                      'id': jsonId,
                      'projectname': jsonObjprop['projectname']}});
    } else {
      console.log(requestUrl + 'not successful...');
      if (opt_callback) {
        opt_callback({'message': rpf.StatusLogger.LOAD_TEST_FAILED,
                      'color': 'red'});
      }
    }
  }, this));

  // Saves the screenshots to server.
  requestUrl = rpf.MiscHelper.getUrl(
      rpf.SaveLoadManager.STEPS_DEPOSIT_SERVER_,
      '/requests',
      {'cmd': '24',
       'id': jsonId});
  var that = this;
  goog.net.XhrIo.send(requestUrl, function() {
    var jsonObj = this.getResponseJson();
    that.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.RESET_SCREENSHOTS,
         'params': {'screenshots': jsonObj}});
  });
};


/**
 * Creates new or updates an existing script.
 * @param {string} name Test name.
 * @param {string} url Test start url.
 * @param {string} script Test script.
 * @param {string} datafile Test datafile.
 * @param {string} userLib User's own lib for the project.
 * @param {string} projectName Project name.
 * @param {Object} screenshots The img data url.
 * @param {boolean} noConsole Whether it's called not or from rpf
 *     Console UI.
 * @param {string} scriptId The script id.
 * @param {function(Object)} sendResponse The response function.
 * @export
 */
rpf.SaveLoadManager.prototype.updateOnWeb = function(
    name, url, script, datafile, userLib, projectName,
    screenshots, noConsole, scriptId, sendResponse) {
  // Tests are saved as new all the time, if recorded not from rpf Console UI.
  if (scriptId && !noConsole) {
    this.updateTestOnWeb(
        name,
        this.scriptMgr_.createJsonObj(
            name, url, script, datafile,
            '', projectName),
        this.scriptMgr_.idOnWeb, projectName,
        screenshots, sendResponse, userLib);
  } else {
    this.createNewTestOnWeb(
        name,
        this.scriptMgr_.createJsonObj(
            name, url, script, datafile, '', projectName),
        projectName,
        screenshots,
        url,
        noConsole,
        sendResponse,
        userLib);
  }
};


/**
 * Gets all the local projects. Returns a map of project names to project
 *     objects. If the input project name is not already in the map, adds it.
 * @param {string} projectName The project name. If no project exists, then
 *     creates one.
 * @return {Object} The projects object.
 * @private
 */
rpf.SaveLoadManager.prototype.getAllLocalProjects_ = function(projectName) {
  var allEntries = {};
  if (goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]) {
    allEntries = goog.json.parse(
        goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]);
  }
  if (!allEntries[projectName]) {
    allEntries[projectName] = {'project_details': {},
                               'tests': {}};
  }
  return allEntries;
};


/**
 * Saves the test in JSON format locally.
 * The local storage has the following format:
 * 'rpfscripts': {projectName: { project_details: {...},
 *                               tests: {...}}}
 *
 * @param {string} jsonName the test name.
 * @param {Object} jsonObj the test object.
 * @param {string} projectName The project name.
 * @param {function({message: string, color: string})} callback
 *     The callback to update status.
 * @param {string} userLib The user lib string.
 * @export
 */
rpf.SaveLoadManager.prototype.saveJsonLocally = function(
    jsonName, jsonObj, projectName, callback, userLib) {
  try {
    var allEntries = this.getAllLocalProjects_(projectName);
    allEntries[projectName]['tests'][jsonName] = jsonObj;
    this.updateLocalProjectDetails_(
        allEntries[projectName], {'js_files': userLib, 'name': projectName});
    goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_] =
        goog.json.serialize(allEntries);
    callback({'message': rpf.StatusLogger.SAVE_SUCCESS,
              'color': 'green'});
    this.getJsonLocally(jsonName, projectName, goog.nullFunction);
  } catch (e) {
    callback({'message': rpf.StatusLogger.SAVE_FAILED,
              'color': 'red'});
  }
};


/**
 * Updates the local project's details property.
 * @param {Object} project The local project.
 * @param {Object} details The details object.
 * @private
 */
rpf.SaveLoadManager.prototype.updateLocalProjectDetails_ = function(
    project, details) {
  if (!project['project_details']) {
    project['project_details'] = {};
  }
  if (!project['project_details']['page_map']) {
    project['project_details']['page_map'] = {};
  }
  if (!project['project_details']['java_package_path']) {
    project['project_details']['java_package_path'] = '';
  }
  for (var key in details) {
    // js_files is in the format of JSON string, need to parse it first.
    if (key == 'js_files') {
      project['project_details'][key] = goog.json.parse(details[key]);
    } else {
      project['project_details'][key] = details[key];
    }
  }
};


/**
 * Loads the project data model from user's local server.
 * @param {string} path The path where the data.rpf is stored.
 * @param {function(Object)} callback The callback function after the data
 *     is fetched from local server.
 */
rpf.SaveLoadManager.prototype.loadProjectFromLocalServer = function(
    path, callback) {
  var requestUrl = rpf.MiscHelper.getUrl(
      'http://localhost:7171',
      '',
      {'command': 'getDatafile',
       'datafilePath': path.split('.').join('/'),
       'fileName': 'data.rpf'});

  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      try {
        var project = xhr.getResponseJson();
        var dataModel = new rpf.DataModel();
        callback(dataModel.convertDataToRaw(project));
      } catch (exception) {
        alert('Invalid json: ' + exception.message());
      }
    } else {
      alert('Error reading the data file.');
    }
  }, this), 'GET');
};


/**
 * Gets the specified project from localStorage.
 * @param {string} name The project name.
 * @param {string} userId A string representation of the current user.
 * @param {function(Object)} sendResponse The response function.
 */
rpf.SaveLoadManager.prototype.getLocalProject = function(
    name, userId, sendResponse) {
  var allEntries = {};
  var names = [];
  if (goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]) {
    allEntries = goog.json.parse(
        goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]);
  }
  var project = allEntries[name];
  if (!project) {
    sendResponse({'jsonObj': {'error': true}});
    return;
  }
  project['userId'] = userId;
  var tests = project['tests'];
  var testMetaArr = [];
  for (var test in tests) {
    testMetaArr.push({
      'test_name': test,
      'test': tests[test]});
  }
  project['tests'] = testMetaArr;
  sendResponse({'jsonObj': project,
                'location': 'local'});
};


/**
 * Saves the meta data from the export dialog to localStorage.
 * @param {string} name The project name.
 * @param {string} data A json string version of the project details.
 * @param {function(Object)} sendResponse The response function.
 */
rpf.SaveLoadManager.prototype.saveProjectMetadataLocally = function(
    name, data, sendResponse) {
  var allEntries = this.getAllLocalProjects_(name);
  allEntries[name]['project_details'] = goog.json.parse(data);
  allEntries[name]['project_details']['name'] = name;
  goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_] =
      goog.json.serialize(allEntries);
  sendResponse({'success': true});
};


/**
 * Saves the project information from localserver to
 *     localStorage including the tests and project details.
 * @param {function(Object.<string, string>)} callback The callback function.
 * @param {Object} project The project information object.
 */
rpf.SaveLoadManager.prototype.saveProjectLocally = function(
    callback, project) {
  var projectName = project['name'];
  var tests = project['tests'];
  var details = project['project_details'];
  try {
    var allEntries = this.getAllLocalProjects_(projectName);
    // Overwrites all of the tests of the project locally.
    if (details) {
      allEntries[projectName]['project_details'] = details;
    }
    allEntries[projectName]['tests'] = {};
    for (var i = 0, len = tests.length; i < len; ++i) {
      var testObj = bite.base.Helper.getTestObject(tests[i]['test']);
      var testName = testObj['name'];
      allEntries[projectName]['tests'][testName] =
          this.scriptMgr_.createJsonObj(testName, testObj['url'],
              testObj['script'], testObj['datafile'], testObj['userlib'],
              testObj['projectname'], []);
    }
    goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_] =
        goog.json.serialize(allEntries);
    callback({'message': 'Saved the project to localStorage successfully.',
              'color': 'green',
              'project': projectName});
  } catch (exception) {
    callback({'message': 'Failed to save the project to localStorage.',
              'color': 'red'});
  }
  this.eventMgrListener_(
      {'command': Bite.Constants.CONSOLE_CMDS.EVENT_COMPLETED,
       'params': {'eventType':
           Bite.Constants.COMPLETED_EVENT_TYPES.PROJECT_SAVED_LOCALLY}},
      {}, goog.nullFunction);
};


/**
 * Sends an update message to the console with the specified test.
 * @param {string} testName the test name.
 * @param {string} projectName The project name.
 * @param {function({message: string, color: string})} callback
 *     The callback function to update the status on console.
 * @export
 */
rpf.SaveLoadManager.prototype.getJsonLocally = function(
    testName, projectName, callback) {
  try {
    var allEntries = goog.json.parse(
        goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]);
    var jsonTestObject = allEntries[projectName]['tests'][testName];
    this.scriptMgr_.parseJsonObj(jsonTestObject);
    // TODO(phu): Implement idOnWeb related part.
    this.scriptMgr_.idOnWeb = '';
    this.sendMessageToConsole_(
        {'command': Bite.Constants.UiCmds.UPDATE_SCRIPT_INFO,
         'params': {'name': jsonTestObject['name'],
                    'url': jsonTestObject['url'],
                    'script': jsonTestObject['script'],
                    'datafile': jsonTestObject['datafile'],
                    'userlib': jsonTestObject['userlib'],
                    'projectname': projectName}});
    callback({'message': rpf.StatusLogger.LOAD_TEST_SUCCESS,
              'color': 'green'});
  } catch (e) {
    callback({'message': rpf.StatusLogger.LOAD_TEST_FAILED,
              'color': 'red'});
  }
};


/**
 * Gets all the test names locally.
 * @param {string} projectName The project name.
 * @return {Array} The tests of the project.
 * @export
 */
rpf.SaveLoadManager.prototype.getTestNamesLocally = function(projectName) {
  var allEntries = {};
  var tests = [];
  if (goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]) {
    allEntries = goog.json.parse(
        goog.global.localStorage[rpf.SaveLoadManager.LOCAL_STORAGE_NAME_]);
  }
  var project = allEntries[projectName];
  if (!project) {
    return [];
  }
  for (var entry in project['tests']) {
    tests.push({'test_name': entry,
                'test': project['tests'][entry]});
  }
  return tests;
};


/**
 * Deletes a test locally.
 * @param {string} project The project name.
 * @param {Array} testNames The test names.
 * @param {Function=} opt_callback The optional callback function.
 * @export
 */
rpf.SaveLoadManager.prototype.deleteLocalTest = function(
    project, testNames, opt_callback) {
  var callback = opt_callback || null;
  var allEntries = this.getAllLocalProjects_(project);

  // delete all of the tests required.
  for (var i = 0, len = testNames.length; i < len; ++i) {
    delete allEntries[project]['tests'][testNames[i]];
  }
  goog.global.localStorage.setItem(
      rpf.SaveLoadManager.LOCAL_STORAGE_NAME_,
      goog.json.serialize(allEntries));
  if (callback) {
    callback();
  }
};


/**
 * Sends an array of file strings to server and download a zip file.
 * @param {Object.<string, string|Object>} files The file strings.
 * @param {Function} callback To open a new page and download the zip.
 * @export
 */
rpf.SaveLoadManager.prototype.saveZip = function(files, callback) {
  var jsonObj = {
    'title': 'tests.zip',
    'files': files
  };
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/savezip',
      {});
  var parameters = goog.Uri.QueryData.createFromMap(
      {'json': goog.json.serialize(jsonObj)}).toString();


  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var key = xhr.getResponseText();
      var url = rpf.MiscHelper.getUrl(
          this.server,
          rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/getzip',
          {'key': key});
      callback({'url': url});
    } else {
      throw new Error('Failed to save the zip. Error status: ' +
          xhr.getStatus());
    }
  }, this), 'POST', parameters);
};


/**
 * Gets all of the project names from local.
 * @param {function(Object.<string, Array>)} callback
 *     The callback function.
 */
rpf.SaveLoadManager.prototype.getProjectNamesFromLocal = function(callback) {
  var allEntries = {};
  var temp = goog.global.localStorage.getItem(
      rpf.SaveLoadManager.LOCAL_STORAGE_NAME_);
  if (temp) {
    allEntries = goog.json.parse(temp);
  }
  var names = [];
  for (var project in allEntries) {
    names.push(project);
  }
  callback({'names': names});
};


/**
 * Gets all of the project names from web.
 * @param {function(Object.<string, Array>)} callback The callback function.
 */
rpf.SaveLoadManager.prototype.getProjectNamesFromWeb = function(callback) {
  var requestUrl = rpf.MiscHelper.getUrl(
      this.server,
      rpf.SaveLoadManager.STORAGE_SERVER_PATH_ + '/getprojectnames',
      {});

  goog.net.XhrIo.send(requestUrl, goog.bind(function(e) {
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var names = xhr.getResponseJson();
      callback({'names': names});
    } else {
      throw new Error('Failed to get the project names. Error status: ' +
          xhr.getStatus());
    }
  }, this), 'GET');
};

