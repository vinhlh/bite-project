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
 * @fileoverview Tests for the BITE resizer.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


goog.require('bite.ux.Resizer');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.events');


var stubs_ = new goog.testing.PropertyReplacer();
var sandbox;
var container;


function getViewportSize() {
  return new goog.math.Size(1000, 1000);
}

function setUp() {
  stubs_.set(goog.dom, 'getViewportSize', getViewportSize);
  sandbox = goog.dom.createDom('div', {
      'id': 'sandbox',
      'style': 'position:fixed;top:0px;left:0px;width:1000px;height:1000px'});
  goog.dom.appendChild(document.body, sandbox);
  container = goog.dom.createDom('div', {
      'id': 'target',
      'style': 'position:fixed;top:100px;left:101px;width:300px;height:301px'});
  sandbox.appendChild(container);
}

function tearDown() {
  goog.dom.removeNode(container);
  container = null;
  sandbox = null;
  stubs_.reset();
  goog.events.removeAll();
}

function testUpdate() {
  var resizer = new bite.ux.Resizer(container, container);
  assertEquals(300, resizer.getSize().width);
  assertEquals(301, resizer.getSize().height);
  assertEquals(101, resizer.getPosition().x);
  assertEquals(100, resizer.getPosition().y);

  resizer.updateSize({width: 400, height: 500});
  resizer.updatePosition({x: 11, y: 12});

  assertEquals(400, resizer.getSize().width);
  assertEquals(500, resizer.getSize().height);
  assertEquals(11, resizer.getPosition().x);
  assertEquals(12, resizer.getPosition().y);
  assertEquals('400px', container.style.width);
  assertEquals('500px', container.style.height);
  assertEquals('11px', container.style.left);
  assertEquals('12px', container.style.top);
}

function testDrag() {
  var resizer = new bite.ux.Resizer(container, container);
  goog.testing.events.fireMouseDownEvent(
      container,
      goog.events.BrowserEvent.MouseButton.LEFT,
      {x: 450, y: 450});
  assertEquals('100px', container.style.top);
  assertEquals('101px', container.style.left);

  goog.testing.events.fireMouseMoveEvent(
      container,
      {x: 460, y: 470});
  assertEquals('120px', container.style.top);
  assertEquals('111px', container.style.left);

  goog.testing.events.fireMouseUpEvent(
      container,
      {x: 460, y: 470});
  assertEquals('120px', container.style.top);
  assertEquals('111px', container.style.left);
}

function testSEResize() {
  var resizer = new bite.ux.Resizer(container, container);

  var seCorner = goog.dom.getElementByClass('se-resizer');

  goog.testing.events.fireMouseDownEvent(
      seCorner,
      goog.events.BrowserEvent.MouseButton.LEFT,
      {x: 800, y: 800});

  goog.testing.events.fireMouseMoveEvent(
      seCorner,
      {x: 810, y: 820});

  goog.testing.events.fireMouseUpEvent(
      seCorner,
      {x: 810, y: 820});

  assertEquals('100px', container.style.top);
  assertEquals('101px', container.style.left);
  assertEquals('310px', container.style.width);
  assertEquals('321px', container.style.height);
}

function testNWResize() {
  var resizer = new bite.ux.Resizer(container, container);

  var nwCorner = goog.dom.getElementByClass('nw-resizer');

  goog.testing.events.fireMouseDownEvent(
      nwCorner,
      goog.events.BrowserEvent.MouseButton.LEFT,
      {x: 800, y: 800});

  goog.testing.events.fireMouseMoveEvent(
      nwCorner,
      {x: 790, y: 780});

  goog.testing.events.fireMouseUpEvent(
      nwCorner,
      {x: 790, y: 780});

  assertEquals('80px', container.style.top);
  assertEquals('91px', container.style.left);
  assertEquals('310px', container.style.width);
  assertEquals('321px', container.style.height);
}

