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

import os
import urllib2
import webapp2

from google.appengine.ext import ereporter
from google.appengine.ext.webapp import template


ereporter.register_logger()


class Error(urllib2.HTTPError):
  """Base class for all exceptions defined in this module."""

  def __init__(self, msg, code=400, url='', hdrs='', fp=None):
    urllib2.HTTPError.__init__(
        self, msg=msg, code=code, url=url, hdrs=hdrs, fp=fp)


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
    path = os.path.join(os.path.dirname(__file__), path, name)
    self.response.out.write(template.render(path, template_args))

