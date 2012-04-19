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


"""Build BITE.

The build works by first checking out the BITE build system from
https://code.google.com/p/bite-project.build.  The build system is then
imported and the build process ensues.

See the build file flags.py for a list of command line flags.
"""


__author__ = 'jasonstredwick@google.com (Jason Stredwick)'


import os
import subprocess
import shutil


BUILD_ROOT = os.path.join('bite_build')


# Attempt to import BITE build files.
bite_build_imported = False
try:
  from bite_build import clean
  from bite_build import deps as DEPS
  from bite_build import extension as EXTENSION
  from bite_build import flags as FLAGS
  from bite_build import paths as PATHS
  from bite_build import rpf as RPF
  from bite_build import server as SERVER
  from bite_build import tools
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
  from bite_build import clean
  from bite_build import deps as DEPS
  from bite_build import extension as EXTENSION
  from bite_build import flags as FLAGS
  from bite_build import paths as PATHS
  from bite_build import rpf as RPF
  from bite_build import server as SERVER
  from bite_build import tools


def Main():
  """The main entry point for the build system."""
  cmdline_flags = FLAGS.FLAGS
  args = FLAGS.Process(cmdline_flags)
  verbose = not args[FLAGS.QUIET]

  # Prioritized process of command line arguments
  if args[FLAGS.EXPUNGE]:
    clean_paths = clean.CLEAN_PATHS
    expunge_paths = clean.EXPUNGE_PATHS
    expunge_paths['bite_build'] = BUILD_ROOT
    clean.RemovePaths(clean_paths.values() + expunge_paths.values())
    exit()
  elif args[FLAGS.CLEAN]:
    clean_paths = clean.CLEAN_PATHS
    clean.RemovePaths(clean_paths.values())
    exit()

  # Set up the directories that will be built into.
  output_paths = [PATHS.GENFILES_ROOT, PATHS.DEPS_ROOT]
  for path in output_paths:
    if not os.path.exists(path):
      os.mkdir(path)

  # Verify required tools
  req_tools = tools.TOOLS
  if not tools.Verify(req_tools, verbose):
    print 'Build failed ... exiting.'
    exit()
  if verbose:
    print ''

  # Verify and download dependencies
  deps = DEPS.CreateDeps()
  if not DEPS.VerifyAndDownload(deps, verbose):
    print 'Build failed ... exiting.'
    exit()
  if verbose:
    print ''

  if args[FLAGS.DEPS]: # Stop here if deps flag is given; only download deps.
    exit()

  # Remove outputs, so they will be created again.
  if os.path.exists(PATHS.OUTPUT_ROOT):
    shutil.rmtree(PATHS.OUTPUT_ROOT)
  os.mkdir(PATHS.OUTPUT_ROOT)

  # T T -> Build
  # T F -> Build
  # F T -> No build
  # F F -> Build
  if args[FLAGS.EXTENSION_ONLY] or not args[FLAGS.SERVER_ONLY]:
    if args[FLAGS.RPF]:
      rpf = RPF.RPF(deps, debug=True, deps_root='', src_root='', dst_root='')
      rpf.Construct(verbose, deps,
                    start_msg='Creating RPF extension bundle ...',
                    fail_early=True,
                    deps_root='')
    else:
      extension = EXTENSION.Extension(deps, debug=True, deps_root='',
                                      src_root='', dst_root='')
      extension.Construct(verbose, deps,
                          start_msg='Creating extension bundle ...',
                          fail_early=True,
                          deps_root='')

  # T T -> No build
  # T F -> No build
  # F T -> Build
  # F F -> Build
  if not args[FLAGS.EXTENSION_ONLY]:
    server = SERVER.Server(deps, debug=True, deps_root='', src_root='',
                           dst_root='')
    server.Construct(verbose, deps,
                     start_msg='Creating server bundle ...',
                     fail_early=True,
                     deps_root='')


if __name__ == '__main__':
  Main()
