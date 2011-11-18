#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Utilities which operate on URL strings."""

__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jcarollo@google.com (Jeff Carollo)')

import logging
import re
import sha

from urlparse import urlparse
from urlparse import urlunparse
from third_party import urlnorm


class InvalidUrlError(Exception):
  pass


# Compiled regular expression used by GetBaseUrl.
_GET_BASE_URL_RE = re.compile('(^http[s:]*//[a-zA-Z0-9.-]*[:]?[0-9]*)(.*)')


def GetBaseUrl(url):
  """Turns http://www.foo.com/bar/baz -> http://www.foo.com.

  Needed for making requests to ourselves.

  Args:
    url: URL to extract base from.

  Example:
    url = self.request.uri
    base_url = GetBaseUrl(url)
    forarding_url = base_url + '/tasks/foo'

  Returns:
    The base str for the given URL.

  Raises:
    InvalidUrlError: Raised when the passed URL is not a valid one.
  """
  result = _GET_BASE_URL_RE.match(url)
  try:
    return result.group(1)
  except AttributeError:
    raise InvalidUrlError(url)


def EncodeToAscii(string):
  """Needed to encode unicode into a datastore supported encoding.

  Args:
    string: String to encode.

  Returns:
    An utf-8 encoded string.
  """
  try:
    result = string.encode('ascii', 'ignore')
  except UnicodeDecodeError:
    logging.debug('String contains unicode characters, normalizing')
    new_str = unicode(string, encoding='utf-8', errors='ignore')
    result = new_str.encode('ascii', 'ignore')
  return result


class NormalizedUrlResult(object):
  """Normalized URL result object.

  All attribute values are converted to lowercase as part of the
  normalization process.

  Attributes:
    url: The fully qualified normalized URL.
    hostname: The hostname part of the URL.
    path: The path part of the URL.
  """

  def __init__(self, url='', hostname='', path=''):
    """Initializes NormalizeUrlResult object."""
    self.url = EncodeToAscii(url).lower()
    self.hostname = EncodeToAscii(hostname).lower()
    self.path = EncodeToAscii(path).lower()


def _GetNormalizationTuple(url):
  """Parse a URL into a components tuple.

  Parse a URL into 6 components:
  <scheme>://<netloc>/<path>;<params>?<query>#<fragment>

  Args:
    url:A URL string.

  Returns:
    A 6-tuple: (scheme, netloc, path, params, query, fragment).
  """
  url = EncodeToAscii(url)
  up = urlparse(url, 'http')
  authority = up[1]
  path = up[2]
  if not authority:
    end_index = path.find('/')
    if end_index == -1:
      end_index = len(path)
    authority = path[:end_index]
    path = path[end_index:]

  path = path.rstrip('/')  # Ignore trailing slashes on the path.
  return (up[0], authority, path, up[3], up[4], up[5])


def NormalizeUrl(url):
  """Normalizes the given URL.

  Normalizes a URL, and adds the http schema to a URL without one,
  converting a URL of the form:
  'www.foo.com' to 'http://www.foo.com'.

  Additionally, it prepends 'www.' to the hostname, when only the
  url is in the form of 'foo.com', resulting in 'www.foo.com'.

  Args:
    url: A URL string.

  Returns:
    A NormalizeUrlResult object containing the normalized URL.
  """
  logging.debug('Normalizing %s', url)
  if not url or not url.strip():
    return None
  try:
    norm_result = urlnorm.norm(_GetNormalizationTuple(url))
  except AttributeError, err:
    if url.count(':') > 1:
      try:
        logging.warning('Failed to normalize, try to without schema. Error: %s',
                        str(err))
        url_modified = url[url.find(':') + 1:]
        logging.debug('Original: %s, modified: %s', url, url_modified)
        norm_result = urlnorm.norm(_GetNormalizationTuple(url_modified))
      except AttributeError, err2:
        logging.error('urlnorm.norm raise an error for the second time: %s',
                      str(err2))
        return None
    else:
      logging.error('urlnorm.norm raise an error: %s', str(err))
      return None
  hostname = norm_result[1]
  if hostname.count('.') == 1:
    # Seems like we have a host name in the form of 'foo.com',
    # prefix with 'www' to produce 'www.foo.com'.
    logging.debug('Prefixing www. in front of hostname: %s', hostname)
    hostname = 'www.%s' %hostname

  path = norm_result[2]
  normalized_url = urlunparse(
      (norm_result[0], hostname, norm_result[2],
       norm_result[3], norm_result[4], norm_result[5]))

  logging.debug('Normalized URL from %s to %s.', url, normalized_url)
  return NormalizedUrlResult(
      url=normalized_url, hostname=hostname, path=path)


def HashUrl(url):
  """Hashes the given URL.

  Args:
    url: URL str to hash.

  Returns:
    A string containing only hexadecimal digits
  """
  return sha.sha(url).hexdigest()


# Regular expression pattern used used to find URLs in a string of text.
_REGEX_PATTERNS_URLS_MATCH = [
    re.compile('\s+https?://[\w\d\.\:%@#&=/\-\?]{2,}[\w\d]'),
    re.compile('(@?[\w\d][\w\d\.:/\-]{2,}\.com([\w\d\.\:@%#&=/\-\?]*[\w\d])?)'),
    re.compile('(@?[\w\d][\w\d\.:/\-]{2,}\.org([\w\d\.\:@%#&=/\-\?]*[\w\d])?)')]


# Regular expression pattern used to identify URLs we want to ignore.
# Most of the time, these are considered noise, for example a link to the
# fix should not be considered a repro URL.
_REGEX_URL_IGNORE = re.compile(
    r'(chromium.org|http://crash/|^@)')


def IsIgnorableUrl(url):
  """Identifies ignorable URLs.

  Args:
    url: Str with the URL categorize as ignorable or not.

  Returns:
    Wheter the given URL is an ignorable URL.
  """
  return bool(_REGEX_URL_IGNORE.search(url))


def ExtractUrls(text):
  """Extracts a urls from the given text.

  Args:
    text: Text as a str.

  Returns:
    A list with of the unique URLs found on the text, if any.
  """
  urls = []
  for pattern in _REGEX_PATTERNS_URLS_MATCH:
    matches = pattern.findall(text)
    for url in matches:
      if isinstance(url, tuple):
        url = url[0]  # Use the full match.
      url = url.strip().replace('\n', '').replace('\r', '')
      if not IsIgnorableUrl(url):
        urls.append(url)
  return list(set(urls))  # Return only unique URLs.
