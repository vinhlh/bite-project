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

"""Model for bug templates.

Bug Templates provides a model for a template for a type of bug. A project
owner can define templates for their project, which pre-populate the
backend project that the bug should be filed to and provide a starting place for
the bug report writer to write their notes. Bug Templates are stored in
AppEngine's Datastore.
"""

__author__ = 'ralphj@google.com (Julie Ralph)'

import json

from google.appengine.ext import db


class BugTemplate(db.Model):
  """Models a Bug Template stored in AppEngine's Datastore.

  TODO(ralphj): urls should be more flexible and should be able to
      handle patterns.

  Attributes:
    template_id: A unique string identifier for this template.
    name: A human-readable name for this template.
    urls: A list of urls that this template should be used for.
    project: The human-readable project that this template is associated with.
    backend_project: An identifier for the project that is compatable with the
        backend provider.
    backend_provider: The issue tracking system that this template is
        associated with.
    selector_text: Text that should appear when the user is asked to pick a
        template, under 'What kind of problem are you reporting?'
    note_text: Text that should appear in the notes field.
    display_order: An integer declaring the relative position where this
        template should be displayed in lists. Higher numbers are displayed
        after lower numbers.

  """
  template_id = db.StringProperty(required=True)
  name = db.StringProperty(required=True)
  urls = db.StringListProperty(required=True)
  project = db.StringProperty(required=True)
  backend_project = db.StringProperty(required=True)
  backend_provider = db.StringProperty(required=True)
  selector_text = db.StringProperty(required=True)
  note_text = db.TextProperty(required=True)
  display_order = db.IntegerProperty(required=True, default=0)


class BugTemplateEncoder(json.JSONEncoder):
  """Encoder to properly encode Bug Template objects."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def default(self, obj):
    """Overrides the default JSONEncoder.

    Args:
      obj: Object to serialize.

    Returns:
      A serializable representation of the Bug Template object.
    """
    if isinstance(obj, BugTemplate):
      return {'id': obj.template_id,
              'name': obj.name,
              'urls': obj.urls,
              'project': obj.project,
              'backendProject': obj.backend_project,
              'backendProvider': obj.backend_provider,
              'selectorText': obj.selector_text,
              'noteText': obj.note_text,
              'displayOrder': obj.display_order}
    else:
      return json.JSONEncoder.default(self, obj)


def JsonEncode(template):
  """Encodes a bug template model as JSON.

  Args:
    template: A bug template to encode.

  Returns:
    A JSON-encoded string representation of the bug template list.
  """
  return json.dumps(template, cls=BugTemplateEncoder)


def StoreBugTemplate(template_id, name, urls, project, backend_project,
                     backend_provider, selector_text, note_text, display_order):
  """Stores a new bug template in the App Engine Datastore.

  If there is already a Bug Template with the same template_id, overwrites
  the old template.

  Args:
    template_id: A unique string identifier for this template.
    name: A human-readable name for this template.
    urls: A list of urls that this template should be used for.
    project: The project that this template is associated with.
    backend_project: An identifier for the project that is compatable with the
        backend provider.
    backend_provider: The issue tracking system that this template is
        associated with.
    selector_text: Text that should appear when the user is asked to pick a
        template, under 'What kind of problem are you reporting?'
    note_text: Text that should appear in the notes field.
    display_order: An integer declaring the relative position where this
        template should be displayed in lists. Higher numbers are displayed
        after lower numbers.

  Returns:
    The newly created bug template.
  """
  template = BugTemplate.get_by_key_name(template_id)
  if template is None:
    template = BugTemplate(key_name=template_id,
                           template_id=template_id,
                           name=name,
                           urls=urls,
                           project=project,
                           backend_project=backend_project,
                           backend_provider=backend_provider,
                           selector_text=selector_text,
                           note_text=note_text,
                           display_order=display_order)
  else:
    template.name = name
    template.urls = urls
    template.project = project
    template.backend_project = backend_project
    template.backend_provider = backend_provider
    template.selector_text = selector_text
    template.note_text = note_text
    template.display_order = display_order
  template.put()
  return template
