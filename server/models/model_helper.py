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

"""BITE model help.

The model helper is a series of functions that work on model objects and
perform convenience functions.
"""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

import json


def Compare(obj, data):
  """Compare the given dictionary to see if it is the same as the model."""
  if not data:
    return False

  for key in data:
    if not CompareProperty(obj, key, data[key]):
      return False
  return True


def CompareProperty(obj, key, value):
  """Compare the property value for the given key with the given value."""
  if not hasattr(obj, key) or str(getattr(obj, key)) != str(value):
    return False
  return True


def ToDict(obj):
  """Convert model into a json serializable dict."""
  # The properties function is part of db.Model.
  return dict([(p, str(getattr(obj, p))) for p in obj.properties()])


def ToJson(obj):
  """Convert the dictionary version of the model to a json string."""
  return json.dumps(ToDict(obj))


def Update(obj, data, exclude=None):
  """Given a dictionary, update appropriate properties.

  Args:
    obj: A db.Model object that is to be update.
    data: A dictionary of data used to update the model's properties.  Only
         those keys that exist that are in both model and data will be used
         to update the model.
    exclude: A set of strings corresponding to model keys that should not
             be updated within the model even if data values are present.
  """
  if not data:
    return

  exclude = exclude or []

  for key in data:
    if key not in exclude and hasattr(obj, key):
      setattr(obj, key, data[key])

