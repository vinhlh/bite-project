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

"""Retrieve bugs based on url from mapping functionality.

The retrieval returns the following data

    [[url, [bug*]]+]

url associated with a set of bugs.  The url can be a full url, domain, domain +
path, etc.
bug is the entire details of a given bug.

The data returned will be a list containing all the given urls and
componentized versions of those urls.  Each url will be broken into the
following:

    full url, url_domain + url_path, url_domain

Each component will contain all the bugs that contain those components.
"""


__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.


from bugs.models.bugs import bug


class Error(Exception):
  """Raised if an exception occurs while retrieving all bugs by url."""
  pass


def Urls(data):
  pass

