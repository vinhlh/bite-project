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

"""TaskResult file download handler.

This module uses blobstore_handlers, which is webapp1 stuff.
No available AppEngine documentation talks about having a webapp2
equivalent for doing blobstore_handlers.BlobstoreDownloadHandler.send_blob.
This should all be converted to webapp2 when send_blob becomes available.
"""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

from google.appengine.ext import blobstore
from google.appengine.ext import webapp
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext.webapp.util import run_wsgi_app

import webapp2


class TaskResultFileDownloadHandler(
    blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, file_key):
    blob = blobstore.get(file_key)
    if not blob:
      self.error(404)
    else:
      # TODO(jeff.carollo): Actually keep track of mimetypes.
      # TODO(jeff.carollo): Paginate output.
      if 'text' in self.request.headers.get('Accept', ''):
        self.response.headers['Content-Type'] = 'text/plain'
        data = blobstore.fetch_data(file_key, 0,
                                    blobstore.MAX_BLOB_FETCH_SIZE-1)
        self.response.out.write(data)
        if len(data) >= blobstore.MAX_BLOB_FETCH_SIZE-1:
          self.response.out.write('\n----RESULT-TRUNCATED----\n')
      else:
        self.send_blob(file_key)


app = webapp2.WSGIApplication([
    ('/taskresultfiles/(.+)', TaskResultFileDownloadHandler),
    ], debug=True)
