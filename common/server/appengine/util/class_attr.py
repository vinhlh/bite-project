# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Define utility functions related to class attributes."""

__author__ = 'jason.stredwick@gmail.com (Jason Stredwick)'


def GetPODAttrsValue(obj_def, exceptions=None):
  """Returns a list of values for attributes in POD object definitions.

  This method does not work for instances.  It also will not return private
  data members.

  Args:
    obj_def: The object definition. (class definition)
    exceptions: Attributes to ignore. (list of string)
  Returns:
    The user-defined attributes. (list of string)
  """
  exceptions = exceptions or []
  if not obj_def:
    return []
  return [getattr(obj_def, attr) for attr in dir(obj_def)
          if not callable(attr) and not attr.startswith("__") and
             attr not in exceptions]


def GetPODAttrs(obj_def, exceptions=None):
  """Returns a list of attributes from POD object definitions.

  This method does not work for instances.  It also will not return private
  data members.

  Args:
    obj_def: The object definition. (class definition)
    exceptions: Attributes to ignore. (list of string)
  Returns:
    The user-defined attributes. (list of string)
  """
  exceptions = exceptions or []
  if not obj_def:
    return []
  return [attr for attr in dir(obj_def)
          if not callable(attr) and not attr.startswith("__") and
             attr not in exceptions]
