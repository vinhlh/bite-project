# Copyright 2011 Google Inc.  All Rights Reserved.
# Author: jasonstredwick@google.com (Jason Stredwick)
#
# Common build definitions for packages within BITE's server code base.


# Commonly used unit testing support.  To use, depend on this library.
TESTING_DEPS = [
    '//apphosting/ext/webapp',
    '//pyglib',
    '//testing/pybase',
    '//third_party/py/mox',
]

