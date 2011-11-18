#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""BITE model help.

The model helper is a series of functions that work on model objects and
perform convenience functions.
"""

__author__ = 'jasonstredwick@google.com (Jason Stredwick)'

import simplejson


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
  return simplejson.dumps(ToDict(obj))


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

