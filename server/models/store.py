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

"""The store db class and the related functions."""

__author__ = 'phu@google.com (Po Hu)'

import json
import logging
from google.appengine.ext import db


class CodeData(db.Model):
  """Stores the code."""

  text = db.TextProperty(required=True)


class DependencyMetaData(db.Model):
  """Stores the dependency metadata."""

  name = db.StringProperty(required=True)
  code = db.ReferenceProperty(reference_class=CodeData)


class MethodMetaData(db.Model):
  """Stores the js method metadata."""

  name = db.StringProperty(required=True)
  description = db.TextProperty(required=True)

  code = db.ReferenceProperty(reference_class=CodeData)
  dependency = db.ReferenceProperty(reference_class=DependencyMetaData)

  primary_label = db.StringProperty(required=True)
  addl_labels = db.StringListProperty(default=[])

  author = db.StringProperty(required=False)

  added = db.DateTimeProperty(required=False, auto_now_add=True)
  modified = db.DateTimeProperty(required=False, auto_now=True)


def GetDepsByNames(names):
  """Gets the deps string by names."""

  result = ''
  temp_code = ''
  for name in names:
    method = GetMethodByName(name)
    if method:
      temp_code = method.code.text
      if method.dependency:
        temp_code = method.dependency.code.text + temp_code
      result += temp_code
  return result


def UpdateDependency(deps_name, deps_code):
  """Updates the dependency."""

  deps_instance = GetDepsByName(deps_name)

  if deps_instance:
    code_instance = deps_instance.code
    code_instance.text = deps_code
    code_instance.put()
  else:
    code_instance = CodeData(text=deps_code)
    code_instance.put()
    deps_instance = DependencyMetaData(name=deps_name,
                                       code=code_instance)
    deps_instance.put()

  return deps_instance


def InsertMethod(method_code, method_name, description,
                 primary_label, addl_labels, deps_reference,
                 author):
  """Inserts the method."""

  code_instance = CodeData(text=method_code)
  code_instance.put()

  method = MethodMetaData(name=method_name,
                          description=description,
                          code=code_instance,
                          dependency=deps_reference,
                          primary_label=primary_label,
                          addl_labels=addl_labels,
                          author=author)
  method.put()

  return method


def UpdateMethod(method_code, method_name, description,
                 primary_label, addl_labels):
  """Updates the method."""

  method_instance = GetMethodByName(method_name)
  code_instance = method_instance.code
  code_instance.text = method_code
  code_instance.put()

  method_instance.description = description
  method_instance.primary_label = primary_label
  method_instance.addl_labels = addl_labels
  method_instance.put()


def GetDepsByName(deps_name):
  """Gets the entity of the given dependency name."""

  q = DependencyMetaData.all()
  q.filter('name = ', deps_name)
  return q.get()


def GetMethodByName(method_name):
  """Gets the entity of the given method name."""

  q = MethodMetaData.all()
  q.filter('name = ', method_name)
  return q.get()


def GetMethodsByPrimaryLabel(label):
  """Gets the methods by primary label."""
  q = MethodMetaData.all()
  if label:
    q.filter('primary_label = ', label)
  # We'll have better way to handle the number of methods shown in page.
  methods = q.fetch(9999)

  results = []
  for method in methods:
    results.append(GetMethodDetailsByInstance(method))

  return results


def GetMethodDetails(method_name):
  """Gets the method details object."""
  method = GetMethodByName(method_name)

  return GetMethodDetailsByInstance(method)


def DeleteMethod(key):
  """Deletes the given method."""
  method = MethodMetaData.get(db.Key(key))
  if method:
    db.delete(method.code)
    db.delete(method)


def GetMethodDetailsByInstance(method):
  """Gets the method details object from the given method instance."""
  result = {}
  if method:
    deps_name = ''
    deps_code = ''
    if method.dependency:
      deps_name = method.dependency.name
      deps_code = method.dependency.code.text

    result['methodName'] = method.name
    result['methodCode'] = method.code.text
    result['description'] = method.description
    result['primaryLabel'] = method.primary_label
    result['addlLabels'] = method.addl_labels
    result['author'] = method.author
    result['depsName'] = deps_name
    result['depsCode'] = deps_code
    result['key'] = str(method.key())

  return result

