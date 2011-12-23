#!/usr/bin/python
#
# Copyright 2010 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests testing.chronos.bite.server.crawlers.issuetracker_crawler

TODO(alexto): Aadd more unit tests to exercise issuetracker_crawler handler.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from .pyglib import app
from .testing.pybase import googletest
from crawlers import issuetracker_crawler

class IssueTrackerCrawlerTest(googletest.TestCase):
  """Tests the IssueTrackerCrawler."""

  def testImports(self):
    # This is just a blank test that only ensures that all the imports are
    # working correctly.  If we get to this point, then the test
    # passes.
    pass


def main(unused_):
  googletest.main()


if __name__ == '__main__':
  app.run()

