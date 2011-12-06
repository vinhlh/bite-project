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
 * @fileoverview Tests for the Maps Helper.
 *
 * @author ralphj@google.com (Julie Ralph)
 */


/**
 * Testing bite.client.MapsHelper.isMapsUrl.
 * @this The context of the unit test.
 */
function testIsMapsUrl() {
  assertEquals(true,
      bite.client.MapsHelper.isMapsUrl('http://maps.google.com'));
  assertEquals(true,
      bite.client.MapsHelper.isMapsUrl(
          'http://maps.google.com/?ie=UTF8&spn=34.808514,74.443359&z=4'));
  assertEquals(false,
      bite.client.MapsHelper.isMapsUrl('http://google.com'));
  assertEquals(false,
      bite.client.MapsHelper.isMapsUrl('http://maps.mail.com'));
}

