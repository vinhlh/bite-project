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

"""BrowserVersion model and associated logic.

BrowserVersion model stores information about a given browser version.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.api import memcache
from google.appengine.ext import db


class BrowserVersion(db.Model):
  """Tracks browser version information."""
  platform = db.StringProperty(required=True)
  platform_version = db.StringProperty(required=True)
  webkit_version = db.StringProperty(required=True)
  chrome_version = db.StringProperty(required=True)
  user_locale = db.StringProperty(required=True)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)


def GetBrowserVersionKeyName(
    platform, platform_version, webkit_version,
    chrome_version, locale):
  """Returns a str key name used that uniquely identify a browser.

  Args:
    platform: str with the name of the OS.
    platform_version:  str with the Platform version string.
    webkit_version: str with the WebKit version number.
    chrome_version: str with the Chrome version number.
    locale: str with the user agent language.

  Returns:
    A str that can be used to uniquely identify a given browser version.
  """
  return 'BrowserVersion_%s_%s_%s_%s_%s' % (platform,
                                            platform_version,
                                            webkit_version,
                                            chrome_version,
                                            locale)


def GetBrowserVersionKey(
    platform, platform_version, webkit_version,
    chrome_version, locale):
  """Returns a Key used to uniquely identify a browser.

  Args:
    platform: str with the name of the OS.
    platform_version:  str with the Platform version string.
    webkit_version: str with the WebKit version number.
    chrome_version: str with the Chrome version number.
    locale: str with the user agent language.

  Returns:
    A Key object.
  """
  return db.Key.from_path('BrowserVersion',
                          GetBrowserVersionKeyName(platform,
                                                   platform_version,
                                                   webkit_version,
                                                   chrome_version,
                                                   locale))


def GetBrowserVersionByKeyName(key_name):
  """Gets the browser with the specified key name.

  Args:
    key_name: str that uniquely identifies a browser version.

  Returns:
    A BrowserVersion object.
  """
  return BrowserVersion.get_by_key_name(key_name)


def GetBrowserVersionsByKeyName(key_names):
  """Gets the browsers for the the specified key names.

  Args:
    key_names: key_names list.

  Returns:
    A BrowserVersion list or None.
  """
  keys = [db.Key.from_path('BrowserVersion', k) for k in key_names]
  return db.get(keys)


def GetBrowserVersion(platform, platform_version,
                      webkit_version, chrome_version, locale):
  """Gets the browsers for the the specified parameters."""
  key_name = GetBrowserVersionKeyName(platform,
                                      platform_version,
                                      webkit_version,
                                      chrome_version,
                                      locale)
  browser_version = memcache.get(key_name)
  if not browser_version:
    browser_version = GetBrowserVersionByKeyName(key_name)
    memcache.set(key_name, browser_version)
  return browser_version


def GetOrInsertBrowserVersion(platform, platform_version,
                              webkit_version, chrome_version, locale):
  """Gets or inserts the BrowserVersion object for the given parameters.

  Args:
    platform: str with the name of the OS.
    platform_version:  str with the Platform version string.
    webkit_version: str with the WebKit version number.
    chrome_version: str with the Chrome version number.
    locale: str with the user agent language.

  Returns:
    A BrowserVersion object.
  """
  browser_version = GetBrowserVersion(platform,
                                      platform_version,
                                      webkit_version,
                                      chrome_version,
                                      locale)
  if not browser_version:
    key_name = GetBrowserVersionKeyName(platform,
                                        platform_version,
                                        webkit_version,
                                        chrome_version,
                                        locale)
    browser_version = BrowserVersion(
        key_name=key_name,
        platform=platform,
        platform_version=platform_version,
        webkit_version=webkit_version,
        chrome_version=chrome_version,
        user_locale=locale)
    browser_version.put()
  return browser_version


def _FetchAll(q):
  """Gets all entities from the datastore."""
  results = []
  curr_result = q.fetch(9999)
  cursor = q.cursor()
  while curr_result:
    results.extend(curr_result)
    q = q.with_cursor(cursor)
    curr_result = q.fetch(9999)
    cursor = q.cursor()
  return results


def GetBrowserVersionsByChromeVersion(chrome_version):
  """Gets an iterator for BrowserVersion matching the given chrome version."""
  q = BrowserVersion.all().filter('chrome_version =', chrome_version)
  return _FetchAll(q)


def GetBrowserVersions(order_by='chrome_version', reverse=False):
  """Gets an iterator for the BrowserVersion model."""
  q = BrowserVersion.all()
  if order_by:
    ordering = order_by
    if reverse:
      ordering = '-%s' % order_by
    q.order(ordering)
  return _FetchAll(q)
