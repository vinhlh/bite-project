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

"""Class to define how to export datasore entities to a file.

BugExporter tells appcfg.py how to export UrlBugMap entries to a file.
Use:
  appcfg.py download_data --config_file=bug_map_exporter.py
  --filename=urlbugmap.csv --kind=UrlBugMap <app-directory>
"""



# pylint: disable-msg=C6204
try:
  # COV_NF_START
  from google.appengine.tools import bulkloader
  # COV_NF_END
except ImportError:
  from google.appengine.tools import bulkloader


class UrlBugMapExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'UrlBugMap',
                                 [('url', str, None),
                                  ('hostname', str, None),
                                  ('path', str, None),
                                  ('status', str, None),
                                  ('bug', str, None),
                                  ('last_update', str, None)
                                 ])

exporters = [UrlBugMapExporter]
