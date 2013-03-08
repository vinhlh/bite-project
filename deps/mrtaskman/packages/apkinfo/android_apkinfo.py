#!/usr/bin/python

"""Cracks open a given Android .apk file and retrieves APK info."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import logging
import os
import subprocess
import sys
import time

from tasklib import apklib


def main(argv):
  my_name = argv.pop(0)

  try:
    apk_file_path = argv.pop(0)
  except:
    sys.stderr.write('Must give apk_file_path as first argument.\n')
    sys.exit(-1)

  FORMAT = '%(asctime)-15s %(message)s'
  logging.basicConfig(format=FORMAT, level=logging.DEBUG)

  result_metadata = {}
  try:
    manifest = apklib.ReadAndroidManifest(apk_file_path)
    result_metadata[u'AndroidManifest.xml'] = manifest.encode('utf-8')
    apklib.WriteResultMetadata(result_metadata)
    return 0
  finally:
    logging.shutdown()


if __name__ == '__main__':
  main(sys.argv)
