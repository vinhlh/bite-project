#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

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
