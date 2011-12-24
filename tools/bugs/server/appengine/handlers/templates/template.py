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

"""Gets and stores templates from the BITE server.

Called by clients to retrieve a list of bug templates that have been stored on
the BITE server, or to add a template to the BITE server.
"""

__author__ = 'ralphj@google.com (Julie Ralph)'

# Disable 'Import not at top of file' and 'Statement before imports' lint
# errors.
# pylint: disable-msg=C6204
# pylint: disable-msg=C6205
try:
  import auto_import_fixer  #pylint: disable-msg=W0611
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import sys

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from handlers import base
from models import bug_template


MAX_RESULTS_CAP = 1000


class GetTemplatesHandler(base.BaseHandler):
  """Handles GET requests to the '/get_templates' URI."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Retrieves all bug templates.

    TODO(ralphj): Add a function that retrieves templates for only a
    specific url or project.

    Returns:
      A list of JSON-encoded templates.
    """
    query = bug_template.BugTemplate.all()
    templates_list = query.fetch(MAX_RESULTS_CAP)
    result = bug_template.JsonEncode(templates_list)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(result)


class NewTemplateHandler(base.BaseHandler):
  """Handles requests to the '/new_template' URI.

  GET requests will load a form allowing the user to write a new Bug Template.
  Submitting the form will result in a POST request, which adds the
  Bug Template to the AppEngine Datastore.
  """

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Displays a form for adding a new template."""

    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    self.RenderTemplate('templates.html', {})

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def post(self):
    """Adds a new template, or replaces a current template with the same id."""

    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    template_id = self.GetRequiredParameter('id')
    name = self.GetRequiredParameter('name')
    urls = self.GetRequiredParameter('urls')
    project = self.GetRequiredParameter('project')
    backend_project = self.GetRequiredParameter('backend_project')
    backend_provider = self.GetRequiredParameter('backend_provider')
    selector_text = self.GetRequiredParameter('selector_text')
    note_text = self.GetRequiredParameter('note_text')
    display_order = self.GetOptionalIntParameter('display_order', 0)

    url_list = urls.split(',')
    bug_template.StoreBugTemplate(template_id=template_id,
                                  name=name,
                                  urls=url_list,
                                  project=project,
                                  backend_project=backend_project,
                                  backend_provider=backend_provider,
                                  selector_text=selector_text,
                                  note_text=note_text,
                                  display_order=display_order)
    self.RenderTemplate('templates.html',
                        {'alert': 'Bug Template succesfully created.'})


app = webapp.WSGIApplication(
    [('/get_templates', GetTemplatesHandler),
     ('/new_template', NewTemplateHandler)],
    debug=True)

