#!/usr/bin/python
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

"""MrTaskman package installer library for MacOS X."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import logging
import os
import subprocess
import urllib2

from client import mrtaskman_api


class TmpDir(object):
  """Wrapper for a temporary directory in which files are staged."""

  def __init__(self):
    # Create the temporary directory
    self.dir_ = os.path.join('/tmp', os.tmpnam())
    os.mkdir(self.dir_, int('777', 8))
    logging.info('dir: %s', self.dir_)

  def GetTmpDir(self):
    """Retreives the directory path created in __init__()."""
    return self.dir_

  def CleanUp(self):
    """Removes the directory tree and all files under it.

    Returns:
      Return code as int. 0 is good.
    """
    command = '/bin/rm -rf %s' % self.dir_
    rm = subprocess.Popen(command, shell=True)
    ret = rm.wait()
    if ret:
      logging.error('Error invoking %s. Exit code: %d', command, ret)
    return ret


def DownloadFileWithTimeout(url, destination, timeout=30*60):
  """Downloads given file from the web to destination file path.

  Times out after given timeout in seconds.

  Args:
    url: Where to download from as str.
    destination: Local filepath to write to as str.
    timeout: How long to wait before giving up in seconds as float.

  Raises:
    urllib2.HTTPError on HTTP error.
    urllib2.URLError on timeout or other error resolving URL.
  """
  webfile = urllib2.urlopen(url, timeout=timeout)
  try:
    # TODO(jeff.carollo): Checksums.
    localfile = open(destination, 'wb')
    BLOCK_SIZE = 8192
    while True:
      buffer = webfile.read(BLOCK_SIZE)
      if not buffer:
        break
      localfile.write(buffer)
  finally:
    localfile.close()


def DownloadAndInstallPackage(package_name, package_version, root_dir):
  """Downloads given package and installs it locally.

  Args:
    package_name: Name of package as str
    package_version: Version of package as int
    root_dir: Fully-qualified file path to install package under

  Returns:
    None

  Raises:
    urllib2.HTTPError on packages not being available.
    urllib2.URLError if mrtaskman is not reachable.
  """
  logging.info('DownloadAndInstallPackage %s %d %s',
               package_name, package_version, root_dir)
  api = mrtaskman_api.MrTaskmanApi()

  package = api.GetPackage(package_name, package_version)

  package_files = package['files']

  for package_file in package_files:
    DownloadAndInstallFile(package_file, root_dir)


def DownloadAndInstallFile(package_file, root_dir):
  """Downloads and installs file linked to in given package_file object.

  Args:
    package_file: A mrtaskman#file_info object

  Returns:
    None
  """
  logging.info('DownloadAndInstallFile %s %s %s',
               package_file['destination'], root_dir,
               package_file['download_url'])
  file_path = os.path.join(root_dir, package_file['destination'])

  last_slash = file_path.rfind(os.sep)
  file_path_sans_filename = file_path[0:last_slash]

  # Create requisite directory tree if necessary.
  try:
    os.makedirs(file_path_sans_filename, int('777', 8))
  except OSError:
    pass

  # Download the file into the correct place.
  DownloadFileWithTimeout(package_file['download_url'], file_path)

  # Set file mode using octal digits.
  os.chmod(file_path, int(package_file['file_mode'], 8))
