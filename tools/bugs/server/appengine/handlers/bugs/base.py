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

"""Common handling information and functionality for all bugs handlers.

Note the usage of '\n' in response messages.  This is to facilitate proper
formatting in environments other than the browser such as curl.  This applies
to all handlers derived from this class.
"""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'

import json
import logging
import urllib

from google.appengine.api import users

from handlers import base


class Error(base.Error):
  """Bugs base class for all exceptions defined using the BaseHandler error."""

  def __init__(self, msg=None, code=400, hdrs=None):
    base.Error.__init__(self, msg, code, hdrs)


class BugsHandler(base.BaseHandler):
  """Base handler class for all bugs handlers."""

  def GetData(self, expected_kind):
    """Retrieve data from the request.

    All bugs api calls that have data will pass that data as a JSON string in
    the body of the request.  Retrieve and parse that data for the handler
    that requests it.

    Args:
      expected_kind: The kind of data expected. (bugs.kind.Kind)
    Returns:
      An object holding the data for the request. (dict)
    Raises:
      Error: Raised if the request data is missing or invalid.
    """
    content_type = self.request.headers['Content-Type']
    if 'application/json' not in content_type:
      logging.info('Content-Type: %s', content_type)
      raise Error('Content-Type must be application/json.\n', code=415)

    body = self.request.body.decode('utf-8')
    if body is None:
      raise Error('JSON data required in message body.\n', code=400)

    try:
      data_json_str = urllib.unquote(body)
      parsed_data = json.loads(data_json_str)
      self.ValidateData(parsed_data, expected_kind)
    except AssertionError, e:
      raise Error('Invalid JSON data.\n%s\n' % e, code=400)
    except Exception, e:
      msg = ('Failure parsing request data.\n'
             'Request data required.\n'
             '%s\n' % e)
      raise Error(msg, code=400)

    return parsed_data


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

  def ValidateData(self, data, expected_kind):
    """Ensure the data is of the right kind by performing using assertions.

    Args:
      data: The data to validate. (dict)
      expected_kind: The expected kind for the data. (bugs.kind.Kind)
    Raises:
      AssertionError: Raised if an assertion is False.
    """
    assert data, 'No data provided.\n'
    assert isinstance(data, dict), 'Data is not a dictionary.\n'
    assert 'kind' in data, 'Data is missing kind information.\n'
    assert data['kind'] == expected_kind, ('Data has invalid kind; [expected='
                                           '%s] != [found=%s].\n' %
                                           (expected_kind, data['kind']))

  def WriteResponse(self, data):
    """Writes a response to the caller and passes on the given data.

    All bugs api calls that return data will have the data converted to a JSON
    string.  All data returned must be an object.

    Args:
      data: The object containing data to pass back to the caller. (dict)
    Raises:
      Error: Raised if the data could not be converted to a JSON string.
    """
    try:
      assert data, 'Data required.'
      assert isinstance(data, dict), 'Response data is not a dictionary.'

      self.response.headers['Content-Type'] = 'application/json'
      json.dump(data, self.response.out, indent=2)
      self.response.out.write('\n')
    except (AssertionError, Exception), e:
      raise Error('Invalid response data.\ne\n', code=400)
