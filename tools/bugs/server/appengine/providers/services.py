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

"""Provides access to services for the various providers.

TODO (jason.stredwick): Return to address the potential for bugs to have
multiple providers when addressing changes to the bug model.

Three main functions:
    Crawl(provider)
    Index(id)
    Push(id)
"""

__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')

from bugs.models.bugs import bug
from bugs.providers import config
from bugs.providers import crawler_base
from bugs.providers import indexer_base
from bugs.providers import pusher_base
from bugs.providers.provider import Provider
from bugs.providers.service import Service


class Error(Exception):
  pass


class CrawlError(crawler_base.Error):
  pass


class IndexError(indexer_base.Error):
  pass


class InvalidIdError(Error):
  pass


class ProviderNotSupportedError(Error):
  pass


class PushError(pusher_base.Error):
  pass


def Crawl(provider):
  """Crawl the given provider.

  Args:
    provider: The provider to crawl. (string)

  Raises:
    ProviderNotSupported: The given provider is not supported.
  """
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported('Invalid provider; %s' % provider)
  crawler = config.PROVIDER_MAP[provider][Service.CRAWL]()
  crawler.Crawl()


def Index(id):
  """Build index for the given provider.

  Args:
    id: The id for the bug the service will act on. (integer)

  Raises:
    InvalidIdError: Raised if the given id does not map to a bug.
    ProviderNotSupported: The given provider is not supported.
  """
  try:
    bug_model = bug.Get(id)
  except bug.InvalidIdError, e:
    raise InvalidIdError(e)

  provider = bug_model.provider
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported('Invalid provider; %s' % provider)
  indexer = config.PROVIDER_MAP[provider][Service.INDEX]()

  try:
    indexer.Index(bug_model)
  except indexer_base.Error, e:
    raise InvalidIdError(e)


def Push(id):
  """Pushes the bug specified by the given id per the provided pusher.

  Args:
    id: The id for the bug the service will act on. (integer)

  Raises:
    InvalidIdError: Raised if the given id does not map to a bug.
    ProviderNotSupported: The given provider is not supported.
  """
  try:
    bug_model = bug.Get(id)
  except bug.InvalidIdError, e:
    raise InvalidIdError(e)

  provider = bug_model.provider
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported('Invalid provider; %s' % provider)
  pusher = config.PROVIDER_MAP[provider][Service.PUSH](bug_model)
  pusher.Push()
