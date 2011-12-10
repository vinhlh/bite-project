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
 * @fileoverview Tests for the code generator.
 *
 * @author ralphj@google.com (Julie Ralph)
 */

goog.require('rpf.CodeGenerator');

function testUrlMatching() {
  var commandNoQuotes = 'redirectTo(theUrl)';
  var commandQuotes = 'redirectTo("theUrl")';
  var changeCommand = 'changeUrl(theUrl)';
  var changeCommandQuotes = 'changeUrl("theUrl")';
  assertEquals('theUrl',
               rpf.CodeGenerator.getUrlInRedirectCmd(commandNoQuotes));
  assertEquals('theUrl', rpf.CodeGenerator.getUrlInRedirectCmd(commandQuotes));
  assertEquals('theUrl', rpf.CodeGenerator.getUrlInRedirectCmd(changeCommand));
  assertEquals('theUrl',
               rpf.CodeGenerator.getUrlInRedirectCmd(changeCommandQuotes));
}

