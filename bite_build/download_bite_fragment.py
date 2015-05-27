#!/usr/bin/python
#
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


"""Code fragment for downloading the BITE build system.

Code fragment for all build.py that wish to incorporate the dynamic download of
the BITE build system.
"""


__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import subprocess
import shutil


# The root folder that contains the root of the build system is recommended to
# be named build_support rather than build.  Calling the folder build can have
# unintended consequences because the entry point to the build system is the
# build.py file.
BUILD_ROOT = os.path.join('build_support')


# Attempt to import BITE build files.
bite_build_imported = False
try:
  # Import BITE build system here.
  bite_build_imported = True
except ImportError:
  # On failure to import build files, download them.  This code should only
  # be called upon import failure, so no need to verify existence of the target
  # just download it again to ensure all parts are present.
  def DownloadBITEBuild():
    """Check that opensource BITE is installed and install if not."""
    print 'Opensource BITE build is not downloaded.  Downloading now ...'

    def GetExecutable(executable):
      """Derived from bite_build.tools.GetExecutable."""
      extensions = os.environ.get('PATHEXT', '').split(os.pathsep)
      paths = os.environ.get('PATH', '').split(os.pathsep)

      # Loop over every combination of path and file extension.
      for extension in extensions:
        for path in paths:
          full_path = os.path.join(path, '%s%s' % (executable, extension))
          if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
            return full_path

      return None

    try:
      target = BUILD_ROOT
      url = 'https://code.google.com/p/bite-project.build'
      git = GetExecutable('git')
      if git is None:
        raise Exception

      process = subprocess.Popen([git, 'clone', url, target],
                                 stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)
      (out, _) = process.communicate()

      if process.returncode:
        raise Exception
      else:
        print '[SUCCESS] Download of BITE build complete.'
        print ''
    except Exception:
      print '[FAILED]  Could not download BITE build from %s.' % url
      print '  %s' % out
      print 'Build failed ... exiting.'
      exit()

  DownloadBITEBuild()


# If the build files failed to be imported then try again after download phase.
if not bite_build_imported:
  # Import BITE build system here.
