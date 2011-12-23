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

"""Site model and associated logic.

Site stores information about a site used during a compatibility run.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

from google.appengine.ext import db
from utils import url_util


class Site(db.Model):
  """Tracks sites available."""
  url = db.LinkProperty(required=True)
  hidden = db.BooleanProperty(required=False, default=False)
  created = db.DateTimeProperty(required=False, auto_now_add=True)
  created_by = db.UserProperty(required=False, auto_current_user_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)
  modified_by = db.UserProperty(required=False, auto_current_user=True)


def GetSiteKeyName(url):
  return 'Site_' + url_util.HashUrl(url)


def AddSite(url):
  """Adds a site with the specified URL."""
  url = url.lower()
  site = Site(key_name=GetSiteKeyName(url),
              url=url)
  site.put()
  return site


def GetSiteByKeyName(key_name):
  """Gets the site with the specified key name."""
  return Site.get_by_key_name(key_name)


def GetSites():
  """Returns an iterator for the Site model."""
  return Site.all().filter('hidden = ', False)


def Update(key_name, url):
  """Updates the site with the given key name."""

  def _Txn():
    site = Site.get_by_key_name(key_name)
    site.url = url
    site.put()
    return site
  return db.run_in_transaction(_Txn)


def SetVisibility(key_name, hidden):
  """Sets the visibility of the site with the specified key name."""

  def _Txn():
    site = Site.get_by_key_name(key_name)
    site.hidden = hidden
    site.put()
    return site
  return db.run_in_transaction(_Txn)

