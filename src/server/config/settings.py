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

"""Common settings for the AppEngine front-end."""

__author__ = 'michaelwill@google.com (Michael Williamson)'

import os

try:
  PORT = os.environ['SERVER_PORT']
  SERVER_NAME = os.environ['SERVER_NAME']
except KeyError:
  # Both of these environment variables are not defined in unit
  # tests, so we set them to something reasonable.
  PORT = '8080'
  SERVER_NAME = 'localhost'

if PORT:
  HOST_NAME_AND_PORT = '%s:%s' % (SERVER_NAME, PORT)
else:
  HOST_NAME_AND_PORT = SERVER_NAME


STORAGE_GMAIL_ACCOUNT = 'bite.storage@gmail.com'
