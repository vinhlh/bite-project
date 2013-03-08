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

"""Representation of a Package and related functionality."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

from google.appengine.api import taskqueue
from google.appengine.ext import db
from google.appengine.ext.blobstore import blobstore

import logging
import webapp2

from third_party.prodeagle import counter


class Error(Exception):
  pass


class DuplicatePackageError(Error):
  pass


class PackageFile(db.Model):
  """A reference to a file in blobstore along with manifest information.

  Could also be a reference to a file somewhere on the web, in which case
  there will be no blobstore info."""

  # Must set either blob or url, but not both or neither.
  blob = blobstore.BlobReferenceProperty(required=False)

  # Must include relative file path and file name of destination.
  destination = db.TextProperty(required=True)
  # Mode of file.  755 for an executable, for instance.
  file_mode = db.TextProperty(required=True)
  download_url = db.TextProperty(required=True)


class Package(db.Model):
  """MrTaskman's representation of a Package.

  A Package will have a number of associated PackageFiles, all sharing the
  same unique parent key as the Package itself."""
  name = db.StringProperty(required=True)
  version = db.StringProperty(required=True)
  created = db.DateTimeProperty(auto_now_add=True)
  modified = db.DateTimeProperty(auto_now_add=True)
  created_by = db.UserProperty(required=False)


def MakePackageKey(name, version):
  return db.Key.from_path('Package', '%s^^^%s' % (name, version))


def CreatePackage(name, version, created_by, files, urlfiles):
  package_key = MakePackageKey(name, version)

  def tx():
    package = db.get(package_key)
    if package is not None:
      counter.incr('Packages.DuplicatePackageError')
      raise DuplicatePackageError()

    package = Package(key=package_key,
                      name=name,
                      version=version,
                      created_by=created_by)
    # TODO(jeff.carollo): Handle conflicting package name/version.
    db.put(package)

    package_files = []
    # Create PackageFiles with blob refs.
    for (blob_info, destination, file_mode, download_url) in files:
      # TODO(jeff.carollo): Create PackageFile.key from destination.
      package_files.append(PackageFile(parent=package_key,
                                       destination=destination,
                                       file_mode=file_mode,
                                       download_url=download_url,
                                       blob=blob_info))
    # Create PackageFiles with urls instead of blobrefs.
    for urlfile in urlfiles:
      package_files.append(PackageFile(parent=package_key,
                                       destination=urlfile['file_destination'],
                                       file_mode=urlfile['file_mode'],
                                       download_url=urlfile['url']))

    db.put(package_files)
    return package
  package = db.run_in_transaction(tx)
  if package:
    counter.incr('Packages.Created')
  return package


def GetPackageByNameAndVersion(name, version):
  return db.get(MakePackageKey(name, version))


def GetPackageFilesByPackageNameAndVersion(name, version):
  package_key = MakePackageKey(name, version)
  # Beyond 10 files or so, people would be better off tar'ing stuff up.
  return PackageFile.all().ancestor(package_key).fetch(limit=1000) or []


def DeletePackageByNameAndVersion(name, version):
  def tx():
    package_key = MakePackageKey(name, version)
    package_keys = [package_key]
    package_files = (
        PackageFile.all()
                   .ancestor(package_key)
                   .fetch(limit=1000))
    blob_keys = []
    for package_file in package_files:
      try:
        package_keys.append(package_file.key())
        blob_keys.append(package_file.blob.key())
        logging.info('Deleting %s', package_file.destination)
      except:
        continue

    # TODO(jeff.carollo): Make sure this doesn't sometimes leak.
    if blob_keys:
      logging.info('Deleting %d files from %d package files.',
                   len(blob_keys), len(package_files))
      blobstore.delete_async(blob_keys)

    db.delete(package_keys)
  return db.run_in_transaction(tx)


class BulkDeleteHandler(webapp2.RequestHandler):
  def get(self):
    name = self.request.get('name', 'monkey')
    task = taskqueue.Task(
        method='POST',
        params={'name': name},
        url='/packages/deleteall')
    task.add()
    self.response.out.write('Task enqueued.')

  def post(self):
    name = self.request.get('name', 'monkey')
    while True:
      packages = Package.all().filter('name=', name).fetch(limit=20)
      if not packages:
        return
      for package in packages:
        DeletePackageByNameAndVersion(package.name, package.version)


app = webapp2.WSGIApplication([
    ('/packages/deleteall', BulkDeleteHandler),
])
