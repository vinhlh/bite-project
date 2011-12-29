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
    BuildIndex()
    Crawl()
    Push(key)
"""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


from bugs.models.bugs import get
from bugs.providers import config
from bugs.providers import crawler_base
from bugs.providers import indexer_base
from bugs.providers import pusher_base


class Error(Exception):
  """General exception for this module."""
  pass


class CrawlError(crawler_base.Error):
  """General push related exception."""
  pass


class IndexError(indexer_base.Error):
  """General push related exception."""
  pass


class InvalidKeyError(Error):
  """Raised when retrieving a bug object for an invalid key."""
  pass


class ProviderNotSupportedError(Error):
  """Raised if the provider is not supported."""
  pass


class PushError(pusher_base.Error):
  """General push related exception."""
  pass


def Crawl(provider):
  """Crawl the given provider.

  Args:
    provider: The provider to crawl. (string)

  Raises:
    ProviderNotSupported: The given provider is not supported.
  """
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported
  crawler = config.PROVIDER_MAP[provider][config.Service.CRAWL]()
  crawler.Crawl()


def Index(key):
  """Build index for the given provider.

  Args:
    key: The key for the bug the service will act on. (integer)

  Raises:
    InvalidKeyError: Raised if the given key does not map to a bug.
    ProviderNotSupported: The given provider is not supported.
  """
  try:
    bug = get.Get(key)
  except get.InvalidKeyError:
    raise InvalidKeyError

  provider = bug['provider']
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported
  indexer = config.PROVIDER_MAP[provider][config.Service.INDEX]()

  try:
    # TODO (jason.stredwick): Should I pass the bug too? Both?
    indexer.Index(key)
  except indexer_base.InvalidKeyError:
    raise InvalidKeyError


def Push(key):
  """Pushes the bug specified by the given key per the provided pusher.

  Args:
    key: The key for the bug the service will act on. (integer)

  Raises:
    InvalidKeyError: Raised if the given key does not map to a bug.
    ProviderNotSupported: The given provider is not supported.
  """
  try:
    bug = get.Get(key)
  except get.InvalidKeyError:
    raise InvalidKeyError

  provider = bug['provider']
  if not provider or provider not in config.PROVIDER_MAP:
    raise ProviderNotSupported
  # TODO (jason.stredwick): Should I pass the bug too? Both?
  pusher = config.PROVIDER_MAP[provider][config.Service.PUSH](key)
  pusher.Push()
