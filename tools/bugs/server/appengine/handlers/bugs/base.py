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

"""Common handling information and functionality for all bugs handlers."""


__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

from handlers import base


class Error(base.Error):
  """Bugs base class for all exceptions defined using the BaseHandler error."""

  def __init__(self, msg, code=400, url='', hdrs='', fp=None):
    base.Error.__init__(self, msg, code, url, hdrs, fp)


class BugsHandler(base.BaseHandler):
  """Base handler class for all bugs handlers.

  TODO (jason.stredwick): Once the rest of the server is updated to webapp2
  change the inherited request handler to base.BaseHandler.
  """
  pass

