//Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview This file contains some end-to-end tests for
 * adding suites, runs and fetching jobs.
 *
 * @author phu@google.com (Po Hu)
 */


goog.require('goog.dom');


/**
 * The global test list to be generated.
 * @type {Array}
 * @export
 */
var testList = [];


/**
 * Automatically generate tests.
 * @param {boolean} isRandom Whether needs random number ids.
 * @export
 */
function autoGenerateTests(isRandom) {
  var numStr = document.getElementById('numOfTests').value;
  var num = parseInt(numStr, 10);
  testList = [];
  var value = 0;
  for (var i = 0; i < num; ++i) {
    if (isRandom) {
      value = generateTest();
    } else {
      value = 'Test_' + i;
    }
    var automated = true;
    if (i % 3 == 0) {
      automated = false;
    }
    var tempDict = {'id': value, 'name': value, 'automated': automated};
    testList.push(tempDict);
  }
  var confirmDiv = document.getElementById('confirmDiv');
  confirmDiv.innerHTML = testList.length + ' tests were created.';
}


/**
 * Gets a random number.
 * @return {number} The random number.
 * @export
 */
function getRandomString() {
  return Math.floor(Math.random() * 9999999 + '');
}


/**
 * Generates a test.
 * @return {string} The test name.
 * @export
 */
function generateTest() {
  var test = {};
  var testName = 'Test_' + getRandomString();
  return testName;
}


/**
 * Loads all the suites of a project.
 * @export
 */
function loadSuitesOfProject() {
  var http = new XMLHttpRequest();
  var url = '/suite/load_project';
  var projectName = document.getElementById('projectName2').value;
  var params = 'projectName=' + escape(projectName);
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
      var result = JSON.parse(http.responseText);
      var suites = result['suites'];
      var select = document.getElementById('selectSuites');
      select.innerHTML = '';
      for (var i = 0; i < suites.length; i++) {
        var opt = document.createElement('option');
        opt.text = suites[i]['name'];
        opt.value = suites[i]['key'];
        select.add(opt, null);
      }
    }
  }
  http.send(params);
}


/**
 * Starts a run for a suite.
 * @export
 */
function runSuite() {
  var http = new XMLHttpRequest();
  var url = '/run/add';
  var key = document.getElementById('selectSuites').value;
  //alert(key);
  var params = 'suiteKey=' + key;
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}


/**
 * Checks all the scheduled suites.
 * @export
 */
function checkScheduledSuite() {
  var http = new XMLHttpRequest();
  var url = '/suite/check_scheduled_jobs';
  var params = 'test=true';
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}


/**
 * Schedules a suite to run automatically.
 * @export
 */
function scheduleSuite() {
  var http = new XMLHttpRequest();
  var url = '/suite/schedule_job';
  var key = document.getElementById('selectSuites').value;
  var interval = document.getElementById('intervalInMin').value;
  var paramsArr = ['suiteKey=' + escape(key),
                   'interval=' + interval];
  var params = paramsArr.join('&');
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}


/**
 * Shows all the runs of a suite.
 * @export
 */
function showRuns() {
  var http = new XMLHttpRequest();
  var url = '/run/get_runs';
  var key = document.getElementById('selectSuites').value;
  var params = 'suiteKey=' + key;
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
      var result = JSON.parse(http.responseText);
      var runs = result['runs'];
      var select = document.getElementById('selectRuns');
      select.innerHTML = '';
      for (var i = 0; i < runs.length; i++) {
        var opt = document.createElement('option');
        opt.text = runs[i]['name'];
        opt.value = runs[i]['key'];
        select.add(opt, null);
      }
    }
  }
  http.send(params);
}


/**
 * Deletes a run.
 * @export
 */
function deleteRun() {
  var http = new XMLHttpRequest();
  var url = '/run/delete';
  var key = document.getElementById('selectRuns').value;
  var params = 'runKey=' + key;
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}


/**
 * The ids that were fetched from server.
 * @type {Array}
 * @export
 */
var fetchedIds = [];


/**
 * Shows the test ids.
 * @export
 */
function showTestIds() {
  fetchedIds.sort();
  alert(fetchedIds);
}


/**
 * Fetches random jobs from server.
 * @export
 */
function fetchJobs() {
  fetchedIds = [];
  var number = document.getElementById('numOfResults').value;
  number = parseInt(number, 10);
  for (var i = 0; i < number; i++) {
    fetchJob(i);
  }
}


/**
 * Fetches a job from server.
 * @param {number} index The index of the job.
 * @export
 */
function fetchJob(index) {
  var http = new XMLHttpRequest();
  var url = '/result/fetch';
  var tokens = document.getElementById('tokens').value;
  var params = 'tokens=' + tokens;
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      if (!http.responseText) {
        console.log('Result ' + index + ': No more results.');
        return;
      }
      var http2 = new XMLHttpRequest();
      var url = '/result/update';
      var status = 'passed';
      if (Math.random() < 0.4) {
        status = 'failed';
      }
      var log = JSON.stringify({'projectName': 'p1',
                                'testLocation': 'web',
                                'testName': 't1'});
      var params = 'result=' + http.responseText + '&status=' + status +
                   '&log=' + log;
      http2.open('POST', url, true);
      http2.setRequestHeader(
          'Content-type', 'application/x-www-form-urlencoded');
      http2.onreadystatechange = function() {
        if (http2.readyState == 4 && http2.status == 200) {
          console.log('Result ' + index + ':' + http2.responseText);
          var id = parseInt(http2.responseText.split('_')[1], 10);
          fetchedIds.push(id);
        }
      }
      http2.send(params);
    }
  }
  http.send(params);
}


/**
 * Adds the suite with tests to server.
 * @export
 */
function addSuiteAndTests() {
  var http = new XMLHttpRequest();
  var url = '/suite/add';
  var suiteName = document.getElementById('suiteName').value;
  var projectName = document.getElementById('projectName').value;
  var description = document.getElementById('description').value;
  var tokens = document.getElementById('suiteTokens').value;
  var interval = document.getElementById('suiteInterval').value;
  var testInfo = JSON.stringify({'testInfoList': testList});
  var paramsArr = ['suiteName=' + escape(suiteName),
                   'projectName=' + escape(projectName),
                   'description=' + escape(description),
                   'tokens=' + escape(tokens),
                   'interval=' + escape(interval),
                   'testInfo=' + testInfo];
  var params = paramsArr.join('&');
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}


/**
 * Shows the number of suites.
 * @param {string} status The result's status.
 * @export
 */
function showNumOfSuite(status) {
  var http = new XMLHttpRequest();
  var url = '/run/get_num';
  var key = document.getElementById('selectRuns').value;
  var paramsArr = ['runKey=' + key,
                   'status=' + status];
  var params = paramsArr.join('&');
  http.open('POST', url, true);
  http.setRequestHeader(
      'Content-type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      alert(http.responseText);
    }
  }
  http.send(params);
}
