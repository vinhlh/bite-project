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


import json
import logging

from google.appengine.api import users

from handlers import base


class Error(base.Error):
  """Bugs base class for all exceptions defined using the BaseHandler error."""

  def __init__(self, msg, code=400, url='', hdrs='', fp=None):
    base.Error.__init__(self, msg, code, url, hdrs, fp)


class MissingDataError(base.MissingRequiredParameterError):
  """Overriding the base handler's version."""
  pass


class InvalidJson(Error):
  """Raised if an error occurs processing input data."""

  def __init__(self, json_str):
    msg = ('Creating new bug failed due to invalid json data: %s' % json_str)
    base.Error.__init__(self, msg=msg)


class NotImplementedError(Error):
  """Raised if an error occurs processing input data."""

  def __init__(self, name):
    msg = ('%s not implemented.' % name)
    base.Error.__init__(self, msg=msg)


class BugsHandler(base.BaseHandler):
  """Base handler class for all bugs handlers."""

  def GetData(self):
    """Retrieve data from the request.

    All bugs api calls that have data will pass that data as a JSON string in
    the body of the request.  Retrieve and parse that data for the handler
    that requests it.

    Returns:
      An object holding the data for the request. (dict)

    Raises:
      InvalidJson: Raised if the data false to be JSON parsed.
      MissingDataError: Raised if data is not present.
    """
    try:
      data_json_str = self.GetRequiredParameter('data_json_str')
    except base.MissingRequiredParameterError:
      raise MissingDataError('data_json_str')

    if not data_json_str:
      return {}
    else:
      try:
        return json.loads(data_json_str)
      except (ValueError, TypeError, OverflowError):
        raise InvalidJson(data_json_str)

  def GetEmail(self, override_email=None):
    """Get the current user's email if logged in or override if admin.

    Gets the current user's email if they are logged in.  If the user is an
    admin and an alternative email is specified in the REST call then given
    email will be used instead of the actual user.

    Args:
      override_email: An alternative email to use rather than the current users
          email; must have admin privilege. (string or None)

    Returns:
      User email. (string)
    """
    current_user = users.get_current_user()
    user_email = None
    if current_user:
      user_email = current_user.email()

    if override_email and users.is_current_user_admin():
      # If current user is an admin allow the overriding of the user_email.
      user_email = override_email

    return user_email

  def WriteResponse(self, data=None):
    """Writes a response to the caller and passes the given data.

    All bugs api calls that return data will have the data converted to a JSON
    string.  All data returned must be an object.

    Args:
      data: The object containing data to pass back to the caller.
          (dict or None)

    Raises:
      InvalidJson: Raised if the data could not be converted to a JSON string.
    """
    output = ''
    if data:
      try:
        self.response.headers['Content-Type'] = 'application/json'
        output = json.dumps(data)
      except (ValueError, TypeError, OverflowError):
        raise InvalidJson('Invalid')

    self.response.code = 200
    self.response.out.write(output)
