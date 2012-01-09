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

"""Base class for all request handlers.

Provides functionality useful to all request handlers, including extraction and
validation of request parameters.
"""

__author__ = 'alexto@google.com (Alexis O. Torres)'

import json
import logging
import os
import urllib
import webapp2

from google.appengine.api import users
from google.appengine.ext import ereporter
from google.appengine.ext.webapp import template

from common import root


ereporter.register_logger()


class Error(webapp2.HTTPException):
  """Base class for all exceptions defined in this module."""

  # TODO (jason.stredwick): Discover what the removed params were used for;
  # url and fp.
  def __init__(self, msg=None, code=400, hdrs=None):
    """Base Error class for the BITE server.

    Args:
      msg: The message to send to the user. (string or None)
      code: The status code for the user. (integer)
      hdrs: A map of header information to user. (dict or None)
    """
    self.msg = msg
    self.code = code
    self.hdrs = hdrs


class MissingRequiredParameterError(Error):
  """Raised when the request is missing a required parameter."""

  def __init__(self, parameter_name):
    msg = 'Request missing required parameter: %s' % parameter_name
    Error.__init__(self, msg=msg)


class InvalidIntValueError(Error):
  """Raised when a request parameter is expected to be an int, but it isn't."""

  def __init__(self, parameter_name, parameter_value):
    msg = ('The specified value for parameter "%s" is not '
           'a valid int: %s' % (parameter_name, parameter_value))
    Error.__init__(self, msg=msg)


class BaseHandler(webapp2.RequestHandler):
  """Base class for the application handlers.

  Defines common functionality used by various handlers. As a rule of thumb,
  most code that extracts and validates parameters from the request belongs to
  this class.

  If any of the validations fails, one of the exceptions defined in this module
  is raised; all of which inherits from the Error class, also defined in this
  module.

  The most basic type of retrieval is to retrieve an optional str
  argument from the request. This is accomplished by calling
  GetOptionalParameter, for example:
    value = self.GetOptionalParameter('optional_param_name')
    value = self.GetOptionalParameter('optional_param_name', 'default_value')

  If the parameter is required by the request handler, this can be enforced
  by calling GetRequiredParameter, for example
    value = self.GetRequiredParameter('required_param_name')

  In addition to enforcing wheter a parameter is required or not, there are
  variations to enforce the parameter value is of a specific type. Some of
  the methods we have implemented at the moment retrieve an optional int
  and a required URL, for example:
    # Note that 10 is just an optional default value.
    value = self.GetOptionalIntParameter('int_parameter_name', 10)
  """

  def handle_exception(self, exception, debug):
    logging.exception('Exception handled by common.handlers.base.BaseHandler.')

    # If the exception is a HTTPException, use its error code.
    # Otherwise use a generic 500 error code.
    if isinstance(exception, webapp2.HTTPException):
      if exception.hdrs is not None and exception.hdrs:
        for (k, v) in exception.hdrs.items():
          self.response.headers[k] = v
      self.response.set_status(exception.code)
      if exception.msg is not None:
        logging.exception(exception.msg)
        self.response.write(exception.msg)
    else:
      try:
        logging.exception(exception)
      except Exception:
        pass
      self.response.set_status(500)
      self.response.write('Unmanaged exception')

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

  def GetRequiredParameter(self, parameter_name):
    """Retrieves the value of a required request parameter.

    Args:
      parameter_name: Name of the parameter to get from the request.

    Returns:
      The value of the specified parameter as a str.

    Raises:
      MissingRequiredParameterError: The specified parameter was not found in
                                     the request.
    """
    str_value = self.GetOptionalParameter(parameter_name)
    if not str_value:
      raise MissingRequiredParameterError(parameter_name)

    return str_value

  def GetOptionalParameter(self, parameter_name, default_value=None):
    """Retrieves the value of an optional request parameter.

    Args:
      parameter_name: Name of the parameter to get from the request.
      default_value: Value to return if the parameter is not found.

    Returns:
      The value of the specified parameter as a str, or default_value
      if the parameter was not present in the request.
    """
    return self.request.get(parameter_name, default_value)

  def GetOptionalIntParameter(self, parameter_name, default_value):
    """Retrieves the value of an optional request parameter.

    Args:
      parameter_name: Name of the parameter to get from the request.
      default_value: Value to return if the parameter is not found.

    Returns:
      An int object with the value of the specified parameter as a str.

    Raises:
      InvalidIntValueError: The value of the specified parameter is
                            not a valid integer number.
    """
    str_value = self.GetOptionalParameter(parameter_name)
    # If the following line raises a ValueError, the calling code
    # has a bug where they passed an invalid default_value.  We let
    # that exception propagate, causing a 400 response to client and
    # sufficient error logging.
    if not str_value:
      return int(default_value)
    try:
      return int(str_value)
    except ValueError:
      raise InvalidIntValueError(parameter_name, str_value)

  def RenderTemplate(self, name, template_args, path='../templates'):
    """Renders the specified django template.

    If path is not specified, the we assume the hander and templates are on
    different folders:
      - root
        - handlers
        - templates
    Args:
      name: Str name of the file template.
      template_args: Dict argument passed to the template.
      path: relative path to the template.
    """
    path = os.path.join(root.ROOT, path, name)
    self.response.out.write(template.render(path, template_args))

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
      raise Error('Invalid response data.\n%s\n' % e, code=400)
