#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Bite basic util lib.

Bite basic util lib contains a bunch of common useful functions.
"""

__author__ = 'phu@google.com (Po Hu)'

import datetime
import logging
import urllib2
#Import not at top
#pylint: disable-msg=C6204
#Unused argument
#pylint: disable-msg=W0613
import simplejson as json
from bite_exceptions import basic_exception

def ParseJsonStr(json_str):
  """Parses a Json string."""
  if not json_str:
    return ''
  try:
    return json.loads(json_str)
  except ValueError:
    logging.error('The json string is: ' + json_str)
    raise basic_exception.ParsingJsonError()


def DumpJsonStr(json_obj):
  """Dumps a Json object."""
  if not json_obj:
    return ''
  try:
    return json.dumps(json_obj)
  except ValueError:
    raise basic_exception.DumpingJsonError()


def GetPercentStr(first, second, digits=0):
  """Gets a percent string."""
  if second:
    return str(round(float(first) / second * 100, digits)) + '%'
  else:
    return '0%'


def ConvertFromUtcToPst(date_time):
  """Converts a datetime from UTC to PST format."""
  return date_time.replace(tzinfo=UTC()).astimezone(PacificTzinfo())


def CreateStartStr(date_time):
  return '%d/%d/%d %d:%d PST' % (date_time.month, date_time.day,
                                 date_time.year,
                                 date_time.hour, date_time.minute)


class UTC(datetime.tzinfo):
  """UTC."""

  def utcoffset(self, dt):
    return datetime.timedelta(0)

  def tzname(self, dt):
    return 'UTC'

  def dst(self, dt):
    return datetime.timedelta(0)


class PacificTzinfo(datetime.tzinfo):
  """Implementation of the Pacific timezone."""

  def utcoffset(self, dt):
    return datetime.timedelta(hours=-8) + self.dst(dt)

  def _FirstSunday(self, dt):
    """First Sunday on or after dt."""
    return dt + datetime.timedelta(days=(6-dt.weekday()))

  def dst(self, dt):
    # 2 am on the second Sunday in March
    dst_start = self._FirstSunday(datetime.datetime(dt.year, 3, 8, 2))
    # 1 am on the first Sunday in November
    dst_end = self._FirstSunday(datetime.datetime(dt.year, 11, 1, 1))

    if dst_start <= dt.replace(tzinfo=None) < dst_end:
      return datetime.timedelta(hours=1)
    else:
      return datetime.timedelta(hours=0)

  def tzname(self, dt):
    if self.dst(dt) == datetime.timedelta(hours=0):
      return 'PST'
    else:
      return 'PDT'


def SetMainNav(main_nav, name):
  """Sets the main nav."""
  for nav in main_nav['scopes']:
    if nav['name'] == name:
      nav['selected'] = True
      break
  main_nav['name'] = name
