#!/usr/bin/python2.4
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

"""Provides an interface to Google docs.

The DocsGateway provides an interface to the Google Docs gdata service
using version 3 of the API.  It uses either AuthSub or ClientLogin for
authentication.

For detailed documentation, see
http://code.google.com/apis/documents/docs/3.0/developers_guide_python.html

NOTE: An annoyance of this interface is that we use the resource_id for
some of the functions and the resource_url for others.  This is an
unfortunate consequence of the current gdata docs client which uses
the two interchangeably, and there is not an easy way to generate
one from the other.
"""

__author__ = 'michaelwill@google.com (Michael Williamson)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import StringIO
import urllib

# For these imports to work on AppEngine, each has to be imported
# individually...e.g. below you need both gdata and gdata.docs.
# Be careful when changing.
import gdata
import gdata.docs
import gdata.docs.client
import gdata.docs.data
import gdata.gauth

from google.appengine.api import users


def GatewayForAppEngine(email):
  """Creates a DocsGateway to access the user's google docs.

  NOTE: We assume here that the user provided has already
  granted access to Google Docs and that they have a gdata
  access token already stored in the datastore using
  gdata.gauth.AeSave(email).

  Args:
    email: The user's email string.
  Returns:
    An instantiated DocsGateway object.
  Raises:
    Exception: If the user provided does not have a gdata
        access token stored in the datastore.
  """
  gdata_token = gdata.gauth.AeLoad(email)
  if not gdata_token:
    raise Exception('Error no gdata token for the user')
  client = gdata.docs.client.DocsClient(
      source='Bite',
      auth_token=gdata_token)
  return DocsGateway(client)


def GatewayForAppEngineForCurrentUser():
  """Creates a DocsGateway to access the user's google docs.

  NOTE: See GatewayForAppEngine() for assumptions we make.

  Returns:
    An instantiated DocsGateway object.
  Raises:
    Exception: If there is no current user or the current user
        does not have a stored gdata access token.
  """
  user = users.get_current_user()
  if not user:
    raise Exception('Login required!')
  return GatewayForAppEngine(user.email())


def GatewayForClientLogin(username, password):
  """Creates a DocsGateway to access the user's google docs.

  Logs in via ClientLogin and NOT via AuthSub.

  Args:
    username: The username to use to authenticate.
    password: The password for the given username.
  Returns:
    An instantiated DocsGateway object.
  """
  client = gdata.docs.client.DocsClient(source='Bite')
  client.ClientLogin(username, password, client.source)
  return DocsGateway(client)


class EasyDocsEntry(object):
  """Provides an abstraction layer between users and the Google Docs api."""

  def __init__(self, docs_entry):
    """Constructs a new EasyDocsEntry."""
    self.title = docs_entry.title.text
    self.src_url = docs_entry.content.src
    self.resource_id = docs_entry.resource_id.text
    self.docs_entry = docs_entry

  def GetDocumentType(self):
    return self.docs_entry.get_document_type()

  def IsFolder(self):
    """Returns true if this docs entry represents a folder."""
    if self.docs_entry.get_document_type() == gdata.docs.data.COLLECTION_LABEL:
      return True
    return False

  def __repr__(self):
    return ('(' + self.title + ', ' + self.src_url + ', ' +
            self.resource_id + ')')


class DocsGateway(object):
  """Provides an interface to interact with Google Docs."""

  def __init__(self, client):
    """Constructs a new DocsGateway object.

    Args:
      client: An instantiated gdata.docs.client.DocsClient() to
          use to access docs.
    """
    self.client = client

  def GetRootFolders(self):
    """Returns the root folders in the user's docs account.

    Returns:
      A list of EasyDocsEntry objects, one for each root folder.
    """
    return self.GetFolderContents('/feeds/default/private/full/-/folder')

  def GetAllDocs(self):
    returned_entries = []
    entries = self.client.GetEverything()
    for entry in entries:
      returned_entries.append(EasyDocsEntry(entry))

    return returned_entries

  def GetFolderContents(self, folder_src_url):
    """Returns all the doc entries in the given folder including subfolders.

    Args:
      folder_src_url: The source url for the folder entry.
    Returns:
      A list of EasyDocsEntry objects, one for each file in the folder.
    """
    feed = self.client.GetAllResources(uri=folder_src_url)
    folder_entries = []
    for entry in feed:
      folder_entries.append(EasyDocsEntry(entry))
    return folder_entries

  def GetSubFolders(self, folder_src_url):
    """Returns only the folders beneath a given parent folder.

    Args:
      folder_src_url: The source url for the parent folder.
    Returns:
      A list of EasyDocsEntry objects, one for each subfolder.
    """
    entries = self.GetFolderContents(folder_src_url)
    folders = []
    for entry in entries:
      if entry.IsFolder():
        folders.append(entry)
    return folders

  def CreateRootFolder(self, folder_name):
    """Creates a folder in the user's docs account at the root level.

    Args:
      folder_name: What the folder will be called.  Spaces allowed.
    Returns:
      An EasyDocsEntry describing the new folder.
    """
    resource = gdata.docs.data.Resource(type=gdata.docs.data.COLLECTION_LABEL,
                                        title=folder_name)
    return EasyDocsEntry(self.client.CreateResource(resource))

  def CreateSubFolder(self, folder_name, parent_folder_resource_id):
    """Creates a folder in the user's docs account within the specified folder.

    Args:
      folder_name: What the folder will be called.  Spaces allowed.
      parent_folder_resource_id: (string) The resource id of the parent folder.
    Returns:
      An EasyDocsEntry describing the new folder.
    """
    resource = gdata.docs.data.Resource(type=gdata.docs.data.COLLECTION_LABEL,
                                        title=folder_name)
    parent = self.client.GetResourceById(parent_folder_resource_id)
    return EasyDocsEntry(
        self.client.CreateResource(resource, collection=parent))

  def CreateNewDoc(self, title, contents=None):
    """Creates a new doc in the user's root document list."""
    return self.CreateNewDocInFolder(title=title, contents=contents)

  def CreateNewDocInFolder(self, title, parent_folder_src_url=None,
                           contents=None, content_type='text/plain'):
    """Creates a new document inside of the specified folder.

    All new documents are saved as plain text.
    Args:
      title: What the new doc will be called.
      parent_folder_src_url: The docs url of the parent folder.
      contents: An optional argument used to set the initial contents.
      content_type: An optional argument used to set the initial content type.
    Returns:
      An EasyDocEntry object describing the new doc.
    """
    if not contents:
      contents = ''
    resource = gdata.docs.data.Resource(title=title)
    parent = None
    if parent_folder_src_url:
      parent = self.client.GetResourceBySelfLink(parent_folder_src_url)
    media_source = gdata.data.MediaSource(
        file_handle=StringIO.StringIO(contents),
        content_length=len(contents),
        content_type=content_type)
    return EasyDocsEntry(self.client.CreateResource(resource, media_source,
                                                    collection=parent))

  def GetFileContentAsText(self, src_url):
    """Returns a doc's content as text.

    Args:
      src_url: The DocsEntry resource url.
    Returns:
      The document text in string format.
    """
    src_url += '&' + urllib.urlencode({'exportFormat': 'txt'})
    contents = self.client._get_content(src_url)

    # Get rid of the byte order mark (BOM):
    #    ef bb bf
    # that Google Docs inserts at the beginning of files.
    return contents[3:]

  def UpdateDocument(self, resource_id, new_title=None, new_contents=None,
                     content_type='text/plain'):
    """Replaces the title and/or text of a document with those passed in.

    Args:
      resource_id: The resource id of the docs entry.
      new_title: An optional new title string, if the title is to be changed.
      new_contents: An optional new content string.
      content_type: An optional string describing the content type of the
          new contents.
    """
    if not new_title and not new_contents:
      return

    doc_entry = self.client.GetResourceById(resource_id)
    if new_title:
      doc_entry.title.text = new_title
    media_source = None
    if new_contents:
      media_source = gdata.data.MediaSource(
          file_handle=StringIO.StringIO(new_contents),
          content_length=len(new_contents),
          content_type=content_type)

    self.client.UpdateResource(doc_entry, media=media_source)

  def Delete(self, resource_id):
    """Deletes a document."""
    doc_entry = self.client.GetResourceById(resource_id)
    self.client.DeleteResource(doc_entry)
