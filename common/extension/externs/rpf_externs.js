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


var console = {};
var backgroundService = {};
var JSON = {};
var ContentMap = {};
var cmdIndex = 0;

/**
 * For selenium-atoms-lib : events.js.  Define createTouch for document which
 * refers to a touch pad device I believe.
 */
var doc = {};
doc.createTouch = function(a, b, c, d, e, f, g) {};
doc.createTouchList = function(a, b) {};
