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
 * @fileoverview This file contains the webdriver code generator.
 *
 * @author phu@google.com (Po Hu)
 */


goog.provide('bite.webdriver');

goog.require('bite.base.Helper');
goog.require('common.client.ElementDescriptor');
goog.require('goog.string');
goog.require('rpf.CodeGenerator');



/**
 * Gets the WebDriver code. This is the entry function of the file, which
 * takes in a group of test information, and generate pages and tests in
 * WebDriver/Java format.
 *
 * The data is in the format of:
 * {project_details: {name: string,
 *                    page_map: Object,
 *                    java_package_path: string},
 *  tests: [{id: string, test: string, test_name: string} ...],
 *  userId: string}
 *
 * The generated files are:
 * 1. BasePage, which contains common properties and methods.
 * 2. Test, which contains all of the unit tests.
 * 3. A group of Page files, each of which contains the locator/action/module
 *    info belonging to it. Take a look at the
 *    bite.webdriver.getPageClassHeader_ which shows the structure of a page.
 *
 * The parameters that could control the generated Webdriver code:
 * interval: The interval between each generated lines.
 * waitVisible: Whether needs to wait until the element is visible.
 *
 * @param {!Object} data The original projec/test data.
 * @return {Object} Contains code.
 */
bite.webdriver.getWebdriverCode = function(data) {
  var wdData = bite.webdriver.convertProjectData_(data);

  bite.webdriver.author_ = data['userId'];
  bite.webdriver.packageName_ = wdData.packageNames.source;

  var pages = bite.webdriver.generatePages_(wdData.codeArr,
                                            wdData.infoMap,
                                            wdData.startUrlArr,
                                            wdData.urlPageMap,
                                            wdData.testNameArr,
                                            wdData.datafileArr);
  pages['BasePage'] = bite.webdriver.generateBasePage_(
      data['project_details']['name']);
  pages['CustomException'] = bite.webdriver.generateExceptionFile_();
  return pages;
};


/**
 * Converts a project and associated tests into an object with the data
 * formatted for WebDriver.
 *
 * @param {!Object} data The original projec/test data.
 * @return {!Object} WebDriver version of the data.
 * @private
 */
bite.webdriver.convertProjectData_ = function(data) {
  var details = data['project_details'];
  var tests = data['tests'];

  var codeArr = [];
  var datafileArr = [];
  var startUrlArr = [];
  var testNameArr = [];
  var infoMapArr = [];
  var infoMap = {};
  for (var i = 0, len = tests.length; i < len; ++i) {
    if (!tests[i]['test']) {
      continue;
    }

    var test = bite.base.Helper.getTestObject(tests[i]['test']);

    codeArr.push(test['script']);
    startUrlArr.push(test['url']);
    testNameArr.push(test['name']);

    var result = bite.console.Helper.trimInfoMap(test['datafile']);
    datafileArr.push(result['datafile']);
    infoMapArr.push(result['infoMap']);
  }

  bite.webdriver.codeParams_ =
      details['params'] ? goog.json.parse(details['params']) || {} : {};

  return {
    codeArr: codeArr,
    datafileArr: datafileArr,
    infoMap: bite.console.Helper.mergeInfoMaps(infoMapArr),
    packageNames: {
      source: details['java_package_path']
    },
    startUrlArr: startUrlArr,
    testNameArr: testNameArr,
    urlPageMap: details['page_map']
  };
};


/**
 * Gets the page class object, which has the following format:
 * {pageName: {'copyright': string,
 *             'imports': string,
 *             'classSig': string,
 *             'properties': [var declaration string],
 *             'rest': string,
 *             'selectors': {xpath/selector string: true},
 *             'modules': {module name:
 *                {'methodNames': [{'className': the class the method belongs,
 *                                  'xpathName': the xpath variable name,
 *                                  'action': the action,
 *             // data input could be a string or an object
 *             // The Object is for verifying different attributes in a command.
 *                                  'data': [data input]}],
 *                 'isModule': boolean,
 *                 'startUrl': string}}},
 *  ...
 * }
 * @param {string} pageName The page name.
 * @return {Object} The code of page class object.
 * @private
 */
bite.webdriver.getPageClassHeader_ = function(pageName) {
  var copyright = bite.webdriver.generateCopyrightAndPackage_();
  var imports = bite.webdriver.generatePageImports_();
  var classDoc = bite.webdriver.generateClassDoc_(pageName);
  var classSig = bite.webdriver.generateClass_(pageName, 'BasePage');
  var logger = bite.webdriver.generateLogger_(pageName, 2);
  var constructor = bite.webdriver.generateConstructor_(2, pageName);
  constructor += bite.webdriver.generateCommands_(4, ['super(driver);']);
  constructor += '\n' + bite.webdriver.generateClosing_(2);

  return {'copyright': copyright,
          'imports': imports,
          // Class signature.
          'classSig': [classDoc, classSig, logger].join('\n'),
          // A list of selector/xpath variables to declare.
          'properties': [],
          // The page string after constructor and including it.
          'rest': constructor,
          // A map to make sure no dup selector/xpath exists.
          'selectors': {},
          // Key is module name and value is a tuple of
          // original name and real name.
          'modules': {}};
};


/**
 * The package name.
 * @type {string}
 * @private
 */
bite.webdriver.packageName_ = 'testing.chronos.bite.webdriver';


/**
 * The package name of tests.
 * @type {string}
 * @private
 */
bite.webdriver.packageNameTest_ = '';


/**
 * The code generation parameters.
 * @type {!Object}
 * @private
 */
bite.webdriver.codeParams_ = {};


/**
 * The page index.
 * @type {number}
 * @private
 */
bite.webdriver.pageIndex_ = 0;


/**
 * The hashmap variable index in the generated test.
 * @type {number}
 * @private
 */
bite.webdriver.variableIndex_ = 0;


/**
 * The author.
 * @type {string}
 * @private
 */
bite.webdriver.author_ = '';


/**
 * The supported actions.
 * @type {Array}
 * @private
 */
bite.webdriver.supportedActions_ = [
  rpf.CodeGenerator.RecordActions.CLICK,
  rpf.CodeGenerator.RecordActions.ENTER,
  rpf.CodeGenerator.RecordActions.TYPE,
  rpf.CodeGenerator.RecordActions.MOVE,
  rpf.CodeGenerator.RecordActions.CHANGE,
  rpf.CodeGenerator.RecordActions.VERIFY,
  rpf.CodeGenerator.RecordActions.VERIFYNOT,
  rpf.CodeGenerator.RecordActions.SUBMIT,
  rpf.CodeGenerator.RecordActions.DRAG,
  rpf.CodeGenerator.PlaybackActions.SELECT
];


/**
 * Escapes all of the double quotes.
 * @param {string} str The given string.
 * @return {string} The string with double quotes escaped.
 * @private
 */
bite.webdriver.escapeDoubleQuotes_ = function(str) {
  return str.replace(/\"/g, '\\\"');
};


/**
 * Generates a WebDriver command to navigate to an url.
 * @param {string} url The start url.
 * @return {string} The WebDriver navigation command.
 * @private
 */
bite.webdriver.generateNavigation_ = function(url) {
  return 'driver.get("' + bite.webdriver.escapeDoubleQuotes_(url) + '");';
};


/**
 * Generates the command to instantiate a wait instance.
 * @return {string} The command in webdriver format.
 * @private
 */
bite.webdriver.generateWaitInstance_ = function() {
  return 'WebDriverWait wait = new WebDriverWait(driver, 6);';
};


/**
 * Generates the Java method waitAndGetElement.
 * @param {number} num The number of spaces.
 * @return {string} The WebDriver waitAndGetElement command.
 * @private
 */
bite.webdriver.generateWaitAndGetElement_ = function(num) {
  return bite.webdriver.addIndentations(num, [
    'public Function<WebDriver, WebElement> waitAndGetElement' +
    '(final By locator) {',
    '  return new Function<WebDriver, WebElement>() {',
    '    public WebElement apply(WebDriver driver) {',
    '      return driver.findElement(locator);',
    '    }',
    '  };',
    '}']).join('\n');
};


/**
 * Generates the Java copyright and package info.
 * @param {string=} opt_package The package name.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateCopyrightAndPackage_ = function(opt_package) {
  var packageName = opt_package || bite.webdriver.packageName_;
  return ['// Copyright 2011 Google Inc. All Rights Reserved.',
          '',
          'package ' + packageName + ';',
          ''].join('\n');
};


/**
 * Generates the Java class doc.
 * @param {string} page The page name.
 * @param {string=} opt_desc The description.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateClassDoc_ = function(page, opt_desc) {
  var desc = opt_desc || ('The ' + page +
             ' class which contains its locators and actions.');
  var authorLine = '@author ' + bite.webdriver.author_;
  var docs = bite.webdriver.generateJavaDoc_([desc, '', authorLine]);
  return docs.join('\n');
};


/**
 * Generates the Java doc string.
 * @param {Array} lines The doc string content array.
 * @return {Array} The generated lines.
 * @private
 */
bite.webdriver.generateJavaDoc_ = function(lines) {
  var javaDoc = ['', '/**'];
  for (var i = 0, len = lines.length; i < len; ++i) {
    javaDoc.push(' * ' + lines[i]);
  }
  javaDoc.push(' */');
  return javaDoc;
};


/**
 * Generates the Java imports for base page.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateImports_ = function() {
  return [
    'import com.google.common.base.Function;',
    'import com.google.common.time.DefaultSleeper;',
    'import com.google.common.time.Sleeper;',
    'import com.google.testing.webdriver.support.ui.ExpectedConditions;',
    'import org.openqa.selenium.By;',
    'import org.openqa.selenium.JavascriptExecutor;',
    'import org.openqa.selenium.Keys;',
    'import org.openqa.selenium.WebDriver;',
    'import org.openqa.selenium.WebElement;',
    'import org.openqa.selenium.interactions.Actions;',
    'import org.openqa.selenium.support.ui.WebDriverWait;',
    'import java.util.HashMap;',
    'import java.util.List;',
    'import java.util.concurrent.TimeUnit;',
    'import java.util.logging.Level;',
    'import java.util.logging.Logger;'
  ].join('\n');
};


/**
 * Generates the Java imports for page classes.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generatePageImports_ = function() {
  return [
    'import org.openqa.selenium.WebDriver;',
    'import java.util.logging.Level;',
    'import java.util.logging.Logger;',
    'import java.util.HashMap;'
  ].join('\n');
};


/**
 * Generates the Java class.
 * @param {string} name The name string.
 * @param {string=} opt_extends The optional extends part.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateClass_ = function(name, opt_extends) {
  var extendsPart = opt_extends ? (' extends ' + opt_extends) : '';
  return 'public class ' + name + extendsPart + ' {';
};


/**
 * Add indents for lines.
 * @param {number} num The number of indentations.
 * @param {Array} lines The given array of lines.
 * @return {Array} The generated lines.
 * @export
 */
bite.webdriver.addIndentations = function(num, lines) {
  var newLines = [];
  for (var i = 0, len = lines.length; i < len; ++i) {
    newLines.push(bite.base.Helper.spaces(num) + lines[i]);
  }
  return newLines;
};


/**
 * Generates the class variables.
 * @param {number} num The number of indentations.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateBaseClassVariables_ = function(num) {
  return bite.webdriver.addIndentations(num, [
    'private static final Logger logger =' +
    ' Logger.getLogger(BasePage.class.getName());',
    'protected final WebDriver driver;',
    'protected final WebDriverWait wait;',
    'WebElement element;',
    'String selector;',
    'Sleeper sleeper;',
    ''
  ]).join('\n');
};


/**
 * Generates commands.
 * @param {number} num The number of indentations.
 * @param {Array} cmdArr The array of commands.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateCommands_ = function(num, cmdArr) {
  return bite.webdriver.addIndentations(num, cmdArr).join('\n');
};


/**
 * Generates the constructor.
 * @param {number} num The number of indentations.
 * @param {string} name The constructor name.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateConstructor_ = function(num, name) {
  return [bite.base.Helper.spaces(num) +
          'public ' + name + '(WebDriver driver) {',
          ''].join('\n');
};


/**
 * Adds the ending }.
 * @param {number} num The number of spaces.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateClosing_ = function(num) {
  return [bite.base.Helper.spaces(num) + '}',
          ''].join('\n');
};


/**
 * Generates a WebDriver command to create a WebElement.
 * @param {string} selector The css selector string.
 * @param {string} action The action string.
 * @return {string} The WebDriver command.
 * @private
 */
bite.webdriver.generateWebElementBySelector_ = function(selector, action) {
  if (action != 'verifyNot') {
    if (bite.webdriver.codeParams_['waitVisible'] == undefined ||
        bite.webdriver.codeParams_['waitVisible']) {
      return ['element = wait.until(',
              '        ExpectedConditions.visibilityOfElementLocated(' +
              'By.xpath(' + selector + ')));'].join('\n');
    } else {
      return ['element = wait.until(',
              '        waitAndGetElement(By.xpath(' + selector +
              ')));'].join('\n');
    }
  }
  return ['Boolean isThrow = true;',
          '    try {',
          '      element = wait.until(',
          '          waitAndGetElement(By.xpath(' + selector + ')));',
          '    } catch (Exception e) {',
          '      isThrow = false;',
          '    }',
          '    if (isThrow) {',
          '      throw new CustomException("Element should not exist.");',
          '    }'].join('\n');
};


/**
 * Generates a WebDriver command.
 * @param {string} action The action string.
 * @return {Array} The generated commands.
 * @private
 */
bite.webdriver.generateWebdriverCmd_ = function(action) {
  switch (action) {
    case rpf.CodeGenerator.RecordActions.CLICK:
      return ['element.click();'];
    case rpf.CodeGenerator.RecordActions.ENTER:
      return ['element.sendKeys(Keys.ENTER);'];
    case rpf.CodeGenerator.RecordActions.TYPE:
      return ['element.clear();',
              'element.sendKeys(data);'];
    case rpf.CodeGenerator.RecordActions.MOVE:
      return ['Actions moveAction = new Actions(this.driver);',
              'moveAction.moveToElement(element).perform();'];
    case rpf.CodeGenerator.RecordActions.CHANGE:
      return ['element.clear();',
              'element.sendKeys(data);'];
    case rpf.CodeGenerator.RecordActions.VERIFY:
      return ['verifyElement(element, data);'];
    case rpf.CodeGenerator.RecordActions.SUBMIT:
      return ['element.submit();'];
    case rpf.CodeGenerator.PlaybackActions.SELECT:
      return ['selectOption(element, data);'];
    case rpf.CodeGenerator.RecordActions.DRAG:
      return [''];
  }
  return [''];
};


/**
 * Generates the exception file.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateExceptionFile_ = function() {
  var header = bite.webdriver.generateCopyrightAndPackage_();
  var classDoc = bite.webdriver.generateClassDoc_('', 'The exception class.');
  var classSig = bite.webdriver.generateClass_(
      'CustomException', 'RuntimeException');
  var constructor = bite.webdriver.addIndentations(2,
      ['public CustomException(String message) {',
       '  super(message);',
       '}']).join('\n');
  return [header, '', classDoc, classSig, constructor, '}'].join('\n');
};


/**
 * Generates the base page code.
 * @param {string} project The project name.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateBasePage_ = function(project) {
  var header = bite.webdriver.generateCopyrightAndPackage_();
  var imports = bite.webdriver.generateImports_();
  var classDoc = bite.webdriver.generateClassDoc_('', 'The base class.');
  var classSig = bite.webdriver.generateClass_('BasePage');
  var classProperties = bite.webdriver.generateBaseClassVariables_(2);
  var constructor = bite.webdriver.generateConstructor_(2, 'BasePage');
  constructor += bite.webdriver.generateCommands_(4,
      ['this.driver = driver;',
       'sleeper = new DefaultSleeper();',
       'wait = new WebDriverWait(driver, 6);',
       'selector = "";',
       'element = null;']);
  constructor += ['', bite.webdriver.generateClosing_(2)].join('\n');
  var waitElementFunc = bite.webdriver.generateWaitAndGetElement_(2);
  var verifyTextEquals = bite.webdriver.addIndentations(2, [
      'public void verifyTextEquals(WebElement elem, String text) {',
      '  if (!elem.getText().equals(text)) {',
      '    throw new CustomException("Can not match the text.");',
      '  }',
      '}']).join('\n');
  var selectOption = bite.webdriver.addIndentations(2, [
      'public void selectOption(WebElement elem, String value) {',
      '  List<WebElement> options = elem.findElements(By.tagName("option"));',
      '  for (WebElement option : options) {',
      '    if (value.equals(option.getAttribute("value"))) {',
      '      option.click();',
      '      break;',
      '    }',
      '  }',
      '}']).join('\n');
  var sleep = bite.webdriver.addIndentations(2, [
      'public void sleep(Integer time) {',
      '  try {',
      '    sleeper.sleep(time, TimeUnit.MILLISECONDS);',
      '  } catch (Exception e) {',
      '    throw new CustomException("Sleep error:" + e.toString());',
      '  }',
      '}']).join('\n');
  var debugLog = bite.webdriver.addIndentations(2, [
      'public void logDebugInfo(String stepId) {',
      '  StackTraceElement[] stacktrace =',
      '      Thread.currentThread().getStackTrace();',
      '  StackTraceElement caller = stacktrace[3];',
      '  logger.log(Level.WARNING, "The RPF debugging info is: " +',
      '      "python localserver.py " +',
      '      "--url=\\\"http://localhost:7171/request?" +',
      '      "testName=" + caller.getMethodName() + "&" +',
      '      "project=' + project + '&" +',
      '      "stepId=" + stepId + "&" +',
      '      "path=' + escape(bite.webdriver.packageName_) + '\\\"");',
      '}'
  ]).join('\n');
  var verify = bite.webdriver.addIndentations(2, [
     'public void verifyElement(WebElement elem,' +
     ' HashMap<String, String> data) {',
     '  for (String key : data.keySet()) {',
     '    String value = data.get(key);',
     '    if (key == "elementText") {',
     '      if (!elem.getText().equals(value)) {',
     '        throw new CustomException("Can not match the text. Expected: " +',
     '            value + ", Actual: " + elem.getText());',
     '      }',
     '    } else if (key == "checked") {',
     '      Boolean isChecked = Boolean.parseBoolean(value);',
     '      if (elem.isSelected() != isChecked) {',
     '        throw new CustomException("Element checked issue.");',
     '      }',
     '    } else if (key == "disabled") {',
     '      Boolean isEnabled = !Boolean.parseBoolean(value);',
     '      if (elem.isEnabled() != isEnabled) {',
     '        throw new CustomException("Element disabled issue.");',
     '      }',
     '    } else if (key == "selectedIndex") {',
     '      By byTag = By.tagName("option");',
     '      List<WebElement> options = elem.findElements(byTag);',
     '      String selectedIndex = value;',
     '      WebElement option = options.get(Integer.parseInt(selectedIndex));',
     '      if (!option.isSelected()) {',
     '        throw new CustomException("Element selected issue.");',
     '      }',
     '    } else if (key == "href") {',
     '      String actual = elem.getAttribute(key);',
     '      if (!actual.equals(value) && !actual.matches(value + "/")) {',
     '        throw new CustomException("Can not match the attribute " + key);',
     '      }',
     '    } else if (elem.getAttribute(key) != null) {',
     '      if (!elem.getAttribute(key).equals(value)) {',
     '        throw new CustomException("Can not match the attribute " + key);',
     '      }',
     '    }',
     '  }',
     '}']).join('\n');
  var executeJavascript = bite.webdriver.addIndentations(2, [
     '',
     'public void executeJavascript(String code) {',
     '  ((JavascriptExecutor) driver).executeScript(code);',
     '}']).join('\n');
  var actions = '';
  for (var i = 0, len = bite.webdriver.supportedActions_.length; i < len; ++i) {
    actions += bite.webdriver.getActionMethod_(
        bite.webdriver.supportedActions_[i]);
  }
  var classEnd = bite.webdriver.generateClosing_(0);
  return [header, '', imports, '', classDoc, classSig, classProperties,
          constructor, '', waitElementFunc, '', verifyTextEquals, '',
          selectOption, '', sleep, '',
          debugLog, '', verify, '', executeJavascript, '',
          actions, '', classEnd].join('\n');
};


/**
 * Generates the logger instance.
 * @param {string} page The page name.
 * @param {number} num The space number.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateLogger_ = function(page, num) {
  return bite.webdriver.addIndentations(num,
      ['private static final Logger logger =',
       '    Logger.getLogger(' + page + '.class.getName());']).join('\n');
};


/**
 * Changes the step name to be the selector name
 * @param {string} stepName The step name.
 * @return {string} The selector name.
 * @private
 */
bite.webdriver.getSelectorName_ = function(stepName) {
  // In the auto generated step id, there will be "-" in it.
  // So in this case, it means users have renamed it.
  var index = stepName.indexOf('-');
  if (index == -1) {
    return stepName;
  }
  // Remove the action prefix
  var temp = stepName.substr(index + 1, stepName.length);
  temp = temp.toLowerCase();
  temp = goog.string.toCamelCase(temp);
  return temp.replace(/-/g, '').toUpperCase();
};


/**
 * Generates the selector declaration.
 * @param {string} name The name of the selector.
 * @param {string} value The value of the selector.
 * @param {number} num The space number.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateSelectorVar_ = function(name, value, num) {
  return bite.webdriver.addIndentations(num,
      ['public static final String ' + name + ' =',
       '    "' + bite.webdriver.escapeDoubleQuotes_(value) + '";']).join('\n');
};


/**
 * Constructs the page class strings.
 * @param {Object} pages The pages object.
 * @return {Object} The page strings.
 * @private
 */
bite.webdriver.constructPageStrings_ = function(pages) {
  var pageStrs = {};
  for (var page in pages) {
    var imports = [pages[page]['imports'], ''].join('\n');
    var properties = bite.webdriver.addIndentations(
        2, pages[page]['properties']).join('\n');
    pageStrs[page] = [pages[page]['copyright'],
                      imports,
                      pages[page]['classSig'],
                      properties,
                      '',
                      pages[page]['rest'],
                      '}',
                      ''].join('\n');
  }
  return pageStrs;
};


/**
 * Gets the page name if the pattern matches the url as a substring.
 * @param {Object} urlPageMap The url page map.
 * @param {string} url The url string.
 * @param {Object} pages The object contains all of the pages information.
 * @return {string} The new page name.
 * @private
 */
bite.webdriver.getPageName_ = function(urlPageMap, url, pages) {
  // Loop through all url patterns in the url/page map.  If the pattern is a
  // substring of the url then return the corresponding name for the pattern.
  for (var reg in urlPageMap) {
    if (url.indexOf(reg) != -1) {
      return urlPageMap[reg];
    }
  }

  // Construct a new name from the url's domain and path and add it to the
  // url/page map.
  var uri = new goog.Uri(url);
  var domain = uri.getDomain();
  var path = uri.getPath();
  var domainPath = domain + path;
  var pageName = bite.webdriver.getPageNameBasedOnUrl_(domain, path);
  pages[pageName] = bite.webdriver.getPageClassHeader_(pageName);
  urlPageMap[domainPath] = pageName;
  return pageName;
};


/**
 * Gets the page name based on domain name.
 * @param {string} domain The domain string.
 * @param {string} path The path string.
 * @return {string} The page name.
 * @private
 */
bite.webdriver.getPageNameBasedOnUrl_ = function(domain, path) {
  var domainParts = domain.split('.');
  var pathParts = path.split('/');
  var temp = 'Page';
  if (domainParts[0] != 'www') {
    temp += bite.webdriver.captitalizeFirstLetter_(domainParts[0], 20);
  }
  temp += bite.webdriver.captitalizeFirstLetter_(domainParts[1], 20);
  if (pathParts[0]) {
    temp += bite.webdriver.captitalizeFirstLetter_(pathParts[0], 20);
  }
  return temp + bite.webdriver.pageIndex_++;
};


/**
 * Gets the first letter capitalized string if the length is proper.
 * @param {string} str The given raw string.
 * @param {number} limit The max length of the string.
 * @return {string} The result.
 * @private
 */
bite.webdriver.captitalizeFirstLetter_ = function(str, limit) {
  str = str.replace(/\W+/g, '');
  if (!str || str.length > limit) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};


/**
 * Quotes the given string.
 * @param {string=} opt_str The given raw string.
 * @return {string} The string with quotes.
 * @private
 */
bite.webdriver.quote_ = function(opt_str) {
  if (!goog.isDef(opt_str)) {
    return '';
  }
  return '"' + bite.webdriver.escapeDoubleQuotes_(unescape(opt_str)) + '"';
};


/**
 * Gets the data argument.
 * @param {string} action The action string.
 * @return {string} The data argument string.
 * @private
 */
bite.webdriver.getDataArg_ = function(action) {
  if (action == rpf.CodeGenerator.RecordActions.TYPE ||
      action == rpf.CodeGenerator.RecordActions.CHANGE ||
      action == rpf.CodeGenerator.PlaybackActions.SELECT) {
    return 'String data';
  } else if (action == rpf.CodeGenerator.RecordActions.VERIFY) {
    return 'HashMap<String, String> data';
  }
  return '';
};


/**
 * Generates an action method.
 * @param {string} action The action string.
 * @private
 */
bite.webdriver.getActionMethod_ = function(action) {
  // The following code adds javadoc, method signature, log, and action.
  var wdCode = bite.webdriver.generateJavaDoc_(
      ['Performs a ' + action + ' on an element.']);
  var args = ['String xpath'];
  var actionArg = bite.webdriver.getDataArg_(action);
  if (actionArg) {
    args.push(actionArg);
  }
  var argStr = args.join(', ');
  wdCode.push('public void ' + action + '(' + argStr + ') {');
  var tempArr = ['logger.log(Level.INFO, "Performed a ' + action +
                 ' action on the element with xpath: " + xpath);'];
  if (bite.webdriver.codeParams_['interval']) {
    tempArr.push('sleep(' + bite.webdriver.codeParams_['interval'] + ');');
  }
  tempArr = tempArr.concat(bite.webdriver.generateWebElementBySelector_(
      'xpath', action));
  tempArr = tempArr.concat(
      bite.webdriver.generateWebdriverCmd_(action));
  tempArr = bite.webdriver.addIndentations(2, tempArr);
  wdCode = wdCode.concat(tempArr);
  wdCode.push('}');
  wdCode.push('');
  return bite.webdriver.addIndentations(2, wdCode).join('\n');
};


/**
 * Gets the page name from a line.
 * @param {string} line The current line of code.
 * @param {Object} urlPageMap The mapping from an url to a page.
 * @param {Object} pages The object contains all of the pages information.
 * @return {Object} The url and page name.
 * @private
 */
bite.webdriver.getPageInfoFromLine_ = function(line, urlPageMap, pages) {
  var url = rpf.CodeGenerator.getUrlInRedirectCmd(line);
  return {'url': url,
          'pageName': bite.webdriver.getPageName_(urlPageMap, url, pages)};
};


/**
 * Gets the correct selectorMap reference.
 * @param {string} curPageName The current page name.
 * @param {Object} pages The page objects.
 * @return {Object} The current selectorMap object.
 * @private
 */
bite.webdriver.getSelectorMap_ = function(curPageName, pages) {
  return pages[curPageName]['selectors'];
};


/**
 * Generates the module method.
 * @param {Array} moduleSteps The module step object.
 * @param {string} curPageName The returning page name.
 * @param {string} moduleName The module name.
 * @param {number} num The number of spaces.
 * @param {string} startUrl The start url.
 * @param {Object} page The page object.
 * @return {string} The generated code.
 * @private
 */
bite.webdriver.generateModuleMethod_ = function(
    moduleSteps, curPageName, moduleName, num, startUrl, page) {
  // Adds the javadoc.
  var wdCode = bite.webdriver.generateJavaDoc_(
      ['Performs a sequence of actions for ' + moduleName + '.']);
  // Adds the log.
  var tempArr = ['logger.log(Level.INFO, "' + moduleName + ' started.");'];

  // Adds the chained steps.
  var stepsChain = [];
  var allArgs = [];
  var index = 0;
  for (var i = 0, len = moduleSteps.length; i < len; ++i) {
    var prefix = 'this.';
    var data = moduleSteps[i]['data'];
    // This is used to show the arguments in each step call.
    var tempArg = [];
    // This is used to show the arguments in module signature.
    var tempArg2 = [];
    // Prepares the args strings for both in the signature and in each
    // individual step call.
    for (var k = 0, lenK = data.length; k < lenK; ++k) {
      if (data[k]) {
        var varId = 'data' + index++;
        tempArg.push(varId);
        var argType = 'String';
        if (typeof(data[k]) == 'object') {
          argType = 'HashMap<String, String>';
        }
        // The format is like  HashMap data1
        tempArg2.push(argType + ' ' + varId);
      }
    }
    var tempArgStr = tempArg.join(', ');

    if (tempArgStr) {
      // Format: HashMap data0, String data1, ...
      allArgs.push(tempArg2.join(', '));
    }

    if (moduleSteps[i]['className'] && moduleSteps[i]['xpathName']) {
      var xpathName = moduleSteps[i]['className'] + '.' +
                      moduleSteps[i]['xpathName'];
      if (tempArgStr) {
        tempArgStr = [xpathName, tempArgStr].join(', ');
      } else {
        tempArgStr = xpathName;
      }
    }

    stepsChain.push(prefix + moduleSteps[i]['action'] +
                    '(' + tempArgStr + ');');
  }
  tempArr = tempArr.concat(stepsChain);

  //Adds the method signature.
  wdCode.push('public void ' +
              moduleName + '(' + allArgs.join(', ') + ') {');

  wdCode = wdCode.concat(
      bite.webdriver.addIndentations(2, tempArr));
  wdCode.push('}');
  wdCode.push('');
  return bite.webdriver.addIndentations(num, wdCode).join('\n');
};


/**
 * Generates the test page code.
 * @param {Object} pages The page objects.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.generateBiteTest_ = function(pages) {
  var copyright = bite.webdriver.generateCopyrightAndPackage_(
      bite.webdriver.packageNameTest_);
  var imports = ['import com.google.common.base.Charsets;',
                 'import com.google.common.io.Files;',
                 'import com.google.testing.util.Tag;',
                 'import com.google.testing.util.TestUtil;',
                 'import junit.framework.TestCase;',
                 'import org.openqa.selenium.WebDriver;',
                 'import org.openqa.selenium.remote.DesiredCapabilities;',
                 'import org.openqa.selenium.remote.RemoteWebDriver;',
                 'import java.io.*;',
                 'import java.net.URL;',
                 'import java.util.HashMap;',
                 'import java.util.logging.Level;',
                 'import java.util.logging.Logger;',
                 ''];
  imports = imports.join('\n');
  var classDoc = bite.webdriver.generateClassDoc_('', 'The test file.');
  var classSig = bite.webdriver.generateClass_('Tests', 'TestCase');
  var logger = bite.webdriver.generateLogger_('Tests', 2);
  var driver = '  protected WebDriver driver;';
  var jsStr = '  String jsStr;';
  var getJsStr = [
    'public String getJsAsString() {',
    '  String location = TestUtil.getSrcDir() + "/' +
    bite.webdriver.packageName_.split('.').join('/') + '/generated_js";',
    '  File folder = new File(location);',
    '  File[] listOfFiles = folder.listFiles();',
    '  String jsStr = "";',
    '  if (listOfFiles == null) {',
    '    return jsStr;',
    '  }',
    '  for (int i = 0; i < listOfFiles.length; ++i) {',
    '    File currentFile = listOfFiles[i];',
    '    if (currentFile.isFile()) {',
    '      if (currentFile.getName().indexOf(".js") != -1) {',
    '        try {',
    '          jsStr += Files.toString(currentFile, Charsets.UTF_8);',
    '        } catch (IOException e) {',
    '          logger.log(Level.INFO, "Can not load the JS file.");',
    '        }',
    '      }',
    '    }',
    '  }',
    // The following JS function is from actionshelper.js, which is used to
    // run the generated JS command.
    '  jsStr += ("BiteRpfAction = {}; BiteRpfAction.call = function() {" +',
    '            "  var func = null;" +',
    '            "  var async = false;" +',
    '            "  var args = [];" +',
    '            "  var firstIndex = 1;" +',
    '            "  if (typeof arguments[0] == \'boolean\') {" +',
    '            "    if (typeof arguments[1] != \'function\' ||" +',
    '            "        typeof arguments[2] != \'function\') {" +',
    '            "      throw new Error(\'The command is malformatted.\');}" +',
    '            "    async = arguments[0];args.push(arguments[1]);" +',
    '            "    func = arguments[2];firstIndex = 3;}else{" +',
    '            "    func = arguments[0];}" +',
    '            "  for (var i = firstIndex; i < arguments.length; ++i) {" +',
    '            "    args.push(arguments[i]);}func.apply(null, args);};");',
    // This method is defined in RPF to indicate aync call ends.
    '  jsStr += "var sendResultToBackground = function() {};";',
    '  return jsStr;',
    '}',
    '',
    'public String getCurrentJsCommand(String cmd) {',
    '  return jsStr + cmd;',
    '}'];
  getJsStr = bite.webdriver.addIndentations(2, getJsStr).join('\n');

  var testMethods = [
      '@Override',
      'public void setUp() throws Exception {',
      '  super.setUp();',
      '  driver = new RemoteWebDriver(new URL("http://127.0.0.1:9515"),',
      '      DesiredCapabilities.chrome());',
      '  jsStr = getJsAsString();',
      '}',
      '',
      '@Override',
      'public void tearDown() throws Exception {',
      '  driver.quit();',
      '  super.tearDown();',
      '}',
      ''];
  testMethods = [bite.webdriver.addIndentations(2, testMethods).join('\n')];

  for (var page in pages) {
    for (var module in pages[page]['modules']) {
      var startUrl = pages[page]['modules'][module]['startUrl'];

      // Ensure the module name starts with 'test' so it will be picked up by
      // webdriver.
      var moduleName = module;
      if (!goog.string.startsWith(moduleName, 'test')) {
        moduleName = 'test' + moduleName;
      }
      testMethods = testMethods.concat(
          ['  @Tag("SmokeTest")',
           '  public void ' + moduleName + '() {',
           '    try {',
           '      ' + bite.webdriver.generateNavigation_(startUrl),
           '      ' + page + ' page = new ' + page + '(driver);',
           bite.webdriver.getTestMethod_(
               pages[page]['modules'][module], module),
           '    } catch (CustomException e) {',
           '      e.printStackTrace();',
           '      fail(e.getMessage());',
           '    }',
           '  }',
           '']);
    }
  }

  testMethods = testMethods.join('\n');

  return [copyright, imports, classDoc, classSig,
          logger, driver, jsStr, '',
          getJsStr, '', testMethods, '}', ''].join('\n');
};


/**
 * Generates the test methods.
 * @param {Object} module The module object.
 * @param {string} moduleName The module name.
 * @return {string} The generated lines.
 * @private
 */
bite.webdriver.getTestMethod_ = function(module, moduleName) {
  // Iterates each module in each page, and adds it as a test method.
  // The format depends on whether it is a module.
  var methodNames = module['methodNames'];
  var isModule = module['isModule'];
  var argStr = '';
  var argArr = [];
  var methodArr = [];
  var declarationArr = [];
  bite.webdriver.variableIndex_ = 0;

  for (var i = 0, len = methodNames.length; i < len; ++i) {
    var prefix = 'page';
    var method = methodNames[i];

    var xpathName = '';
    if (method['className'] && method['xpathName']) {
      xpathName = method['className'] + '.' + method['xpathName'];
    }
    var methodInfo = {'action': method['action'],
                      'xpath': xpathName};

    bite.webdriver.pushDataInput_(
        method['data'], argArr, methodArr, prefix,
        methodInfo, declarationArr);

  }
  if (isModule) {
    // Format: HashMap data0 = new HashMap();
    //         page.moduleName(data0);
    declarationArr = bite.webdriver.addIndentations(6, declarationArr);
    declarationArr.push('      page.' + moduleName +
                        '(' + argArr.join(', ') + ');');
    return declarationArr.join('\n');
  }
  // Format: HashMap data0 = new HashMap();
  //         page.methodName1(data0)
  //             .methodName2();
  declarationArr = declarationArr.concat(methodArr);
  return bite.webdriver.addIndentations(6, declarationArr).join('\n');
};


/**
 * Pushes the data input info in the given arrays.
 * @param {Array} dataArr The data array.
 * @param {Array} argArr An array of arguments.
 * @param {Array} methodArr An array of method calls.
 * @param {string} prefix The prefix of the method call.
 * @param {Object} methodInfo The method related info.
 * @param {Array} declarationArr The array of hashmap declarations.
 * @private
 */
bite.webdriver.pushDataInput_ = function(
    dataArr, argArr, methodArr, prefix, methodInfo,
    declarationArr) {
  var data = dataArr[0];
  if (typeof(data) == 'object') {
    var curVarName = 'data' + bite.webdriver.variableIndex_++;
    declarationArr.push(
        'HashMap<String, String> ' + curVarName +
        ' = new HashMap<String, String>();');
    for (var name in data) {
      var tempData = data[name] ? data[name] : '""';
      declarationArr.push(
          curVarName + '.put("' + name + '", ' + tempData + ');');
    }
    data = curVarName;
  }
  if (data) {
    // This array has the arguments to call a module.
    // ex. ['arg1']
    argArr.push(data);
  }
  if (methodInfo['xpath']) {
    if (data) {
      // In the format of page.action(Page1.xpath1, "user inputs")
      data = [methodInfo['xpath'], data].join(', ');
    } else {
      // In the format of page.action(Page1.xpath1)
      data = methodInfo['xpath'];
    }
  }
  // This array has the individual action method calls.
  // ex. ['.method1("arg1")']
  methodArr.push(prefix + '.' + methodInfo['action'] + '(' + data + ');');
};


/**
 * Checks if the given code is a module.
 * @param {string} code The code string.
 * @return {boolean} Whether the given code is a module.
 * @private
 */
bite.webdriver.isModule_ = function(code) {
  return code.indexOf('@type module') != -1 ||
         code.indexOf('@type Module') != -1;
};


/**
 * Checks if the given class name belongs to the urlPageMap.
 * @param {string} className The class name.
 * @param {Object} urlPageMap The url and page mapper.
 * @return {boolean} Whether the given class name is valid.
 * @private
 */
bite.webdriver.containClass_ = function(className, urlPageMap) {
  for (var item in urlPageMap) {
    if (urlPageMap[item] == className) {
      return true;
    }
  }
  return false;
};


/**
 * Gets the line content of the last redirection before the next command.
 * @param {Array} lines The lines of the test.
 * @param {number} curIndex The current line index.
 * @param {Object} infoMap The info map.
 * @param {Object} urlPageMap The url and page name mapper.
 * @return {Object} The redirection content and the next cmd's class name.
 * @private
 */
bite.webdriver.getLastRedirection_ = function(
    lines, curIndex, infoMap, urlPageMap) {
  var len = lines.length;
  var lastRedirectionIndex = 0;
  while (curIndex < len) {
    var line = lines[curIndex];
    var curId = bite.base.Helper.getStepId(line);
    // Returns the redirection index if the current line is a command.
    if (curId) {
      var pageName = infoMap['steps'][curId]['pageName'];
      var className = '';
      if (bite.webdriver.containClass_(pageName, urlPageMap)) {
        className = pageName;
      }
      return {'redirection': lastRedirectionIndex ?
                             lines[lastRedirectionIndex] : '',
              'className': className};
    }
    if (line.indexOf(rpf.CodeGenerator.PlaybackActions.REDIRECT_TO) == 0) {
      lastRedirectionIndex = curIndex;
    }
    ++curIndex;
  }
  return {'redirection': lastRedirectionIndex ?
                         lines[lastRedirectionIndex] : ''};
};


/**
 * Goes through the test script and collect relevant info.
 * @param {Array} lines The lines of a test script.
 * @param {Object} infoMap This map contains steps and elements info of project.
 * @param {string} curPageName The current page class name.
 * @param {string} curUrl The current test's start url.
 * @param {Object} urlPageMap The url pattern and page class name mapper.
 * @param {number} selectorIndex The selector index counter.
 * @param {Object} selectorMap A mppater for whether the given selector exists.
 * @param {Object} pages The page object containing info to construct the class.
 * @param {Array} moduleSteps The steps of a module.
 * @return {Object} The updated selector index, page name and url.
 * @private
 */
bite.webdriver.parseTestLines_ = function(
    lines, infoMap, curPageName, curUrl, urlPageMap, selectorIndex,
    selectorMap, pages, moduleSteps) {
  var playbackActions = rpf.CodeGenerator.PlaybackActions;
  var page = null;
  var pageName = '';
  var defaultPageName = curPageName;
  for (var i = 0, len = lines.length; i < len; ++i) {
    var line = lines[i];
    var results = bite.webdriver.getLastRedirection_(
        lines, i + 1, infoMap, urlPageMap);
    var nextRedirect = results['redirection'];
    var nextCmdClassName = results['className'];

    // Gets the id from a given line.
    var curId = bite.base.Helper.getStepId(line);
    if (curId) {
      var stepInfo = infoMap['steps'][curId];
      var realAction = line.split('(')[0];
      // TODO(phu): We should always use the real action.
      if (realAction == 'verifyNot') {
        stepInfo['action'] = realAction;
      }

      // Sets the curPageName.
      // If the step is associated with a Class name, then use it.
      // Otherwise, uses the given class name which is probably based on URL.
      if (stepInfo['pageName'] &&
          bite.webdriver.containClass_(stepInfo['pageName'], urlPageMap)) {
        curPageName = stepInfo['pageName'];
      } else {
        stepInfo['pageName'] = defaultPageName;
        curPageName = defaultPageName;
      }
      selectorMap = bite.webdriver.getSelectorMap_(curPageName, pages);

      stepInfo['url'] = curUrl;
      var elemInfo = infoMap['elems'][stepInfo['elemId']];
      var curStep = curId;

      // This peeps ahead to observe if the current action will result in
      // a url redirection, and then set the return page correctly.
      if (!nextCmdClassName && nextRedirect) {
        page = bite.webdriver.getPageInfoFromLine_(
            nextRedirect, urlPageMap, pages);
        nextCmdClassName = page['pageName'];
      }

      var selector = elemInfo['xpaths'][0];
      var selectorKey = selector.replace(/\W+/g, '');

      // Only adds the selector declaration if it doesn't exist yet.
      if (!selectorMap[selectorKey]) {
        selectorIndex++;
        selectorMap[selectorKey] = bite.webdriver.getSelectorName_(
            stepInfo['stepName']);
        pages[curPageName]['properties'].push(
            bite.webdriver.generateSelectorVar_(
            selectorMap[selectorKey], selector, 0));
      }

      moduleSteps.push(
          {'className': curPageName,
           'xpathName': selectorMap[selectorKey],
           'action': stepInfo['action'],
           'data': [bite.webdriver.getDataValue_(stepInfo, elemInfo)]});
    } else if (line.indexOf(rpf.CodeGenerator.PlaybackActions.CALL) == 0) {
      var command = 'getCurrentJsCommand("BiteRpfAction.' + line + '")';
      // TODO(phu): Add executeAsyncScript method.
      moduleSteps.push({
        'action': 'executeJavascript',
        'data': [command]});
    } else if (line.indexOf(playbackActions.REDIRECT_TO) == 0) {
      page = bite.webdriver.getPageInfoFromLine_(line, urlPageMap, pages);

      // When enters a new page, the relavent info should be reset.
      if (typeof page == 'object') {
        if (page['pageName'] != curPageName) {
          defaultPageName = page['pageName'];
          curPageName = defaultPageName;
          curUrl = page['url'];
          selectorMap = bite.webdriver.getSelectorMap_(curPageName, pages);
        }
      }
    }
  }
  return {'selectorIndex': selectorIndex,
          'curPageName': curPageName,
          'curUrl': curUrl};
};


/**
 * Gets the data value.
 * @param {Object} stepInfo The step related info object.
 * @param {Object} elemInfo The element related info object.
 * @return {Object|string} Either a string or an object as the data input.
 * @private
 */
bite.webdriver.getDataValue_ = function(stepInfo, elemInfo) {
  var verificationMap = {};
  if (stepInfo['action'] == rpf.CodeGenerator.RecordActions.VERIFY) {
    return common.client.ElementDescriptor.getAttrsToVerify(
        elemInfo['descriptor'], bite.webdriver.quote_);
  }
  return bite.webdriver.quote_(bite.base.Helper.dataFile[stepInfo['varName']]);
};


/**
 * Inits the pages that are defined in urlPageMap.
 * @param {Object} urlPageMap The url and page mapper.
 * @param {Object} pages The pages object that contains all of the pages info.
 * @private
 */
bite.webdriver.initExistingPages_ = function(urlPageMap, pages) {
  for (var urlPattern in urlPageMap) {
    pages[urlPageMap[urlPattern]] =
        bite.webdriver.getPageClassHeader_(urlPageMap[urlPattern]);
  }
};


/**
 * Generates the pages code.
 * @param {Array} codeArr The rpf test code string array.
 * @param {Object} infoMap This map contains steps and elements info of project.
 * @param {Array} startUrlArr The start url array for each rpf test.
 * @param {!Object} urlPageMap A map of urls to page name.
 * @param {Array} testNameArr The rpf test name array.
 * @param {Array} datafileArr The data file array.
 * @return {Object} The generated pages.
 * @private
 */
bite.webdriver.generatePages_ = function(
    codeArr, infoMap, startUrlArr, urlPageMap, testNameArr, datafileArr) {
  var pages = {};
  var selectorMap = {};
  var selectorIndex = 0;
  var curId = '';
  var curStep = '';
  bite.webdriver.pageIndex_ = 0;
  bite.webdriver.initExistingPages_(urlPageMap, pages);

  // This loops through all of the rpf tests and collect info.
  for (var j = 0; j < codeArr.length; ++j) {
    var code = codeArr[j];
    var startUrl = startUrlArr[j];
    var moduleName = testNameArr[j];
    var datafile = datafileArr[j];
    var isModule = bite.webdriver.isModule_(code);

    var lines = code.split('\n');

    // Gets the current page name based on the url pattern.
    var curPageName = bite.webdriver.getPageName_(urlPageMap, startUrl, pages);

    // Get the first cmd's class name if any.
    var resultPair = bite.webdriver.getLastRedirection_(
        lines, 0, infoMap, urlPageMap);
    if (resultPair['className']) {
      curPageName = resultPair['className'];
    }

    pages[curPageName]['modules'][moduleName] = {
      'methodNames': [],
      'isModule': isModule,
      'startUrl': startUrl
    };
    var moduleStartPage = curPageName;
    var moduleSteps = pages[curPageName]['modules'][moduleName]['methodNames'];

    // This makes sure one selector only appears once in a page class.
    selectorMap = bite.webdriver.getSelectorMap_(curPageName, pages);
    var curUrl = startUrl;

    // Evals the datafile to get data.
    bite.base.Helper.evalDatafile(datafile);

    // Loops through the test script and collect info.
    var results = bite.webdriver.parseTestLines_(
        lines, infoMap, curPageName, curUrl, urlPageMap, selectorIndex,
        selectorMap, pages, moduleSteps);
    curUrl = results['curUrl'];
    curPageName = results['curPageName'];
    selectorIndex = results['selectorIndex'];

    if (isModule) {
      // This adds a module to the page class as a method.
      pages[moduleStartPage]['rest'] +=
          bite.webdriver.generateModuleMethod_(
          moduleSteps, curPageName, moduleName, 2, startUrl,
          pages[moduleStartPage]);
    }
  }

  var testPage = bite.webdriver.generateBiteTest_(pages);
  pages = bite.webdriver.constructPageStrings_(pages);
  pages['Tests'] = testPage;
  return pages;
};

