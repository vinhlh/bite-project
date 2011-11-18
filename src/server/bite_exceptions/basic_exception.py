#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Bite basic exception.

Bite basic exception contains a bunch of common exceptions.
"""

__author__ = 'phu@google.com (Po Hu)'


class Error(Exception):
  pass


class ParsingJsonError(Error):
  """Exception encountered while parsing a Json string."""


class DumpingJsonError(Error):
  """Exception encountered while dumping a Json object."""
