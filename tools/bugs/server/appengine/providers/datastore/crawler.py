# Copyright 2011 Google Inc. All Rights Reserved.
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


"""Datastore crawler object; does nothing."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

from bugs.providers import crawler_base


class Error(crawler_base.Error):
  pass


class Crawler(crawler_base.CrawlerBase):
  """Crawler base class.

  Crawlers move bug data from a provider database to the Datastore.  It also
  provides translation from the provider bug data to BITE bug data.  This is a
  no op for the Datastore Crawler.
  """

  def __init__(self, max_retries=3):
    crawler_base.CrawlerBase.__init__(self, max_retries)

  def Crawl(self):
    """Crawl provider database.

    Raises:
      Error: Raised if there was an error creating an index.
    """
    pass
