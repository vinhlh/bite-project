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

"""Controls the available providers."""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

from bugs.providers.service import Service
from bugs.providers.provider import Provider
from bugs.providers.datastore import crawler as datastore_crawler
from bugs.providers.datastore import indexer as datastore_indexer
from bugs.providers.datastore import pusher as datastore_pusher
from bugs.providers.issuetracker import crawler as issuetracker_crawler
from bugs.providers.issuetracker import indexer as issuetracker_indexer
from bugs.providers.issuetracker import pusher as issuetracker_pusher


PROVIDER_MAP = {
  Provider.DATASTORE: {
    Service.CRAWL: datastore_crawler.Crawler,
    Service.INDEX: datastore_indexer.Indexer,
    Service.PUSH: datastore_pusher.Pusher
  },
  Provider.ISSUETRACKER: {
    Service.CRAWL: issuetracker_crawler.Crawler,
    Service.INDEX: issuetracker_indexer.Indexer,
    Service.PUSH: issuetracker_pusher.Pusher
  }
}
