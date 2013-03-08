#!/usr/bin/env python
#
# Copyright 2012 MiuMeet AG.
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

# --------------------------- General Settings --------------------------------

# String
# The namespace that ProdEagle will use in memcache and datastore
NAMESPACE = "prodeagle"

# Boolean
# If True, ProdEagle will export the overhead of datastore accesses it added.
SAVE_PRODEAGLE_STATS = True

# String
# The relative url to the harvest.py handler
PRODEAGLE_HARVEST_URL = "/prodeagle/"

# -------------------------- AppStats Configuration ---------------------------

# Boolean
# If True then ProdEagle will export data from AppStats.
APPSTATS_ENABLE = True

# List[Integers]
# Here is an exmaple with APPSTATS_PERCENTILE = [90].
# ProdEagle will export separate stats for the 'best' 90% of the requests.
# (Best for latency means lower latency, best for RPCs this means fewer RPCs)
APPSTATS_PERCENTILES = []

# Boolean
# If True then ProdEagle exports separate AppStat results for
# POST and GET requests.
APPSTATS_DIFFERENTIATE_BETWEEN_POST_AND_GET = True

# Boolean or regexp String
# If not False then ProdEagle will export detailed AppStat results for all
# requests that have a url that match the regexp.
APPSTATS_PER_REQUESTS = '/tasks/.*'

# ----------------------- ErrorLog export Configuration -----------------------

# Boolean
# If True then ProdEagle exports the http response codes of the Application
# logs with minimum severity "Error"
ERROR_LOG_EXPORT_ENABLE = True

# Int
# The maximum amount of entries in the ErrorLog that should be fetched.
ERROR_LOG_EXPORT_AMOUNT = 100

# False or regexp String
# ProdEagle will export export urls of log entries that match the regexp.
# If the value is False, ProdEagle will not export any URLs.
ERROR_LOG_EXPORT_URL = ".*"

#--------------------------- Log Export Configuration -------------------------

# Boolean
# If True then ProdEagle exports cost per request & amount of requests from the
# Applications logs.
# If you have a lot of traffic, we recommend that you set SAVE_IN_BETWEEN to 60
# at least 60 so you have a continues graph.
LOG_EXPORT_ENABLE = False

# Int
# The maximum amount of entries in the ErrorLog that should be fetched.
LOG_EXPORT_AMOUNT = 500

# False or regexp String
# ProdEagle will export export urls of log entries that match the regexp.
# If the value is False, ProdEagle will not export any URLs.
LOG_EXPORT_URL = False

#------------------------- Memcache Export Configuration ----------------------

# Boolean
# If True then ProdEagle exports memcache stats.
MEMCACHE_EXPORT_ENABLE = False

# --------- Settings if you have low accuracy or missing data -----------------

# Integer
# If greater than 0 ProdEagle will automatically add a TaskQueue job to collect
# incremented counters after SAVE_IN_BETWEEN seconds at the latest. This makes
# sense if you see low accuracy in your dashboard (because your counters are
# falling out of memcache before they can get collected).
SAVE_IN_BETWEEN = 0

# Integer
# How many seconds we should look back in time in case the ProdEagle export
# didn't happen for a long time.
MAX_LOOK_BACK = 3600

# Integer
# The amount of test counters we right into memcache servers to see if data
# was lost the between two exports.
EXPECTED_MEMCACHE_SERVERS = 1024

# Integer
# How many seconds the clocks of google servers can be apart.
MAX_CLOCK_SKEW = 60


# ---------------------------- DO NOT CHANGE ---------------------------------

# The minimum slot size in seconds that the ProdEagle host can handle.
MIN_SLOT_SIZE = 60
# The secure ProdEagle host, that collects data from your app.
SECURE_HOST = "https://prod-eagle.appspot.com"
