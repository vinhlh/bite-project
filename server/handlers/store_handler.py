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

"""Handles the JS methods store."""

__author__ = 'phu@google.com (Po Hu)'

import logging
import json
import webapp2

from google.appengine.api import users

from common.handlers import base
from models import store


class Error(Exception):
  pass


class DuplicateMethodNameError(Error):
  """An error encountered if the method is duplicated."""


class EditJsMethodHandler(base.BaseHandler):
  """Edit page request handler."""

  def GetUserInfo(self):
    user = users.get_current_user()
    if user:
      return {'isSigned': True,
              'email': user.email(),
              'signOut': ''}
    else:
      return {'isSigned': False,
              'signIn': ''}

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Handles the GET request for the home page."""

    method_name = self.GetOptionalParameter('methodName')

    if method_name:
      details = store.GetMethodDetails(method_name)
      method_details = ''
      if details:
        method_details = json.dumps(details)

      self.RenderTemplate('store_edit.html',
                          {'method': method_details})
    else:
      self.RenderTemplate('store_edit.html',
                          {'user': self.GetUserInfo(),
                           'method': ''})


class SaveNewMethodHandler(base.BaseHandler):
  """Submit method handler."""

  def get(self):
    self.post()

  def post(self):
    method_code = self.GetRequiredParameter('methodCode')
    method_name = self.GetRequiredParameter('methodName')
    description = self.GetRequiredParameter('description')
    primary_label = self.GetRequiredParameter('primaryLabel')

    addl_labels = self.GetOptionalParameter('addlLabels')
    deps_name = self.GetOptionalParameter('depsName')
    deps_code = self.GetOptionalParameter('depsCode')

    temp_method = store.GetMethodByName(method_name)
    if temp_method:
      raise DuplicateMethodNameError()

    labels = []
    if addl_labels:
      labels = json.loads(addl_labels)

    user = users.get_current_user()
    if user:
      author = user.email()
    else:
      author = 'unknown'

    deps_reference = None
    if deps_name:
      deps_reference = store.UpdateDependency(deps_name, deps_code)

    method_instance = store.InsertMethod(
        method_code, method_name, description,
        primary_label, labels, deps_reference, author)

    result = {'key': str(method_instance.key())}

    self.response.out.write(json.dumps(result))


class UpdateMethodHandler(base.BaseHandler):
  """Submit method handler."""

  def get(self):
    self.post()

  def post(self):
    method_code = self.GetRequiredParameter('methodCode')
    method_name = self.GetRequiredParameter('methodName')
    description = self.GetRequiredParameter('description')
    primary_label = self.GetRequiredParameter('primaryLabel')

    addl_labels = self.GetOptionalParameter('addlLabels')
    deps_name = self.GetOptionalParameter('depsName')
    deps_code = self.GetOptionalParameter('depsCode')

    labels = []
    if addl_labels:
      labels = json.loads(addl_labels)

    if deps_name:
      store.UpdateDependency(deps_name, deps_code)

    store.UpdateMethod(
        method_code, method_name, description,
        primary_label, labels)


class ViewMethodsHandler(base.BaseHandler):
  """View methods handler."""

  def get(self):
    label = self.GetOptionalParameter('label', '')
    if label.lower() == 'all':
      label = ''
    methods = store.GetMethodsByPrimaryLabel(label)
    methods_string = ''
    if methods:
      methods_string = json.dumps(methods)

    self.RenderTemplate('store_view.html',
                        {'methods': methods_string,
                         'label': label})


class GetMethodHandler(base.BaseHandler):
  """Submit method handler."""

  def get(self):
    self.post()

  def post(self):
    method_name = self.GetRequiredParameter('methodName')
    method_details = store.GetMethodDetails(method_name)
    self.response.out.write(json.dumps(method_details))


class DeleteMethodHandler(base.BaseHandler):
  """Delete method handler."""

  def get(self):
    self.post()

  def post(self):
    key = self.GetRequiredParameter('key')
    store.DeleteMethod(key)


class CheckMethodNameHandler(base.BaseHandler):
  """Checks the method name handler."""

  def get(self):
    self.post()

  def post(self):
    name = self.GetRequiredParameter('name')
    method = store.GetMethodByName(name)
    if method:
      raise DuplicateMethodNameError()


app = webapp2.WSGIApplication([
     ('/store/edit', EditJsMethodHandler),
     ('/store/save_new_method', SaveNewMethodHandler),
     ('/store/update_method', UpdateMethodHandler),
     ('/store/get_method', GetMethodHandler),
     ('/store/view', ViewMethodsHandler),
     ('/store/delete', DeleteMethodHandler),
     ('/store/check_method_name', CheckMethodNameHandler)
    ])

