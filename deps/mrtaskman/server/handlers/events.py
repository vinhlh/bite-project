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

"""Handlers for the MrTaskman Events API."""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import json
import logging
import urllib
import webapp2

from models import events
from util import model_to_dict


class EventsError(Exception):
  def __init__(self, message):
    Exception.__init__(self, message)


class EventsHandler(webapp2.RequestHandler):
  """Handles requests for Events."""

  def get(self, arg='all'):
    """Dispatches GET request to the right method according to form."""
    logging.info('got arg: %s', arg)
    if arg.isdigit():
      return self.GetEventById(arg)
    if arg == 'all':
      return self.GetAllEvents()

    self.response.out.write('Invalid argument: %s' % arg)
    self.response.set_status(400)
    return

  def GetAllEvents(self):
    """Convenience HTML form for testing."""
    accept_type = self.GetAcceptTypeHtmlOrJson()
    self.response.headers['Content-Type'] = accept_type

    event_list = events.GetEventList()

    if 'html' in accept_type:
      # TODO(jeff.carollo): Extract out to Django templates.
      self.response.out.write(
          """
          <html><head><title>Events</title></head><body>
          <pre><code>%s</code><pre>
          </body></html>
          """ % '<br/>'.join([
              json.dumps(model_to_dict.ModelToDict(event), indent=2)
              for event in event_list]))
      self.response.out.write('\n')
      return

    if 'json' in accept_type:
      response = dict()
      response['kind'] = 'mrtaskman#event_list'
      response['event_list'] = [
          model_to_dict.ModelToDict(event) for event in event_list]
      json.dump(response, self.response.out, indent=2)
      self.response.out.write('\n')
      return

    # Should never get here.
    logging.error('Sending 500 because we could not determine a Content-Type.')
    self.response.out.write('Accept type not text/html or application/json.')
    self.response.set_status(500)
    return

  def post(self):
    """Creates an Event from a worker."""

    logging.info('Request: %s', self.request.body)

    event = urllib.unquote(self.request.body.decode('utf-8'))

    try:
      event = json.loads(event, 'utf-8')
    except ValueError, e:
      logging.info(e)
      event = None

    if not event or not event.get('kind', '') == 'mrtaskman#event':
      self.response.out.write('POST body must contain an Event entity.')
      self.response.set_status(400)
      return

    try:
      event = events.CreateEvent(event)
    except events.ClientEventError, e:
      self.response.out.write('Error creating event: %s' % e.message)
      self.response.set_status(400)
      return
    except events.ServerEventError, e:
      self.response.out.write('Error creating event: %s' % e.message)
      self.response.set_status(500)
      return

    self.response.headers['Content-Type'] = 'application/json'
    response = model_to_dict.ModelToDict(event)
    response['kind'] = 'mrtaskman#event'
    json.dump(response, self.response.out, indent=2)
    self.response.out.write('\n')

  def GetAcceptTypeHtmlOrJson(self):
    """Parses Accept header and determines whether to send HTML or JSON.

    Defaults to 'application/json' unless HTML comes first in Accept line.

    Returns:
      Accept type as str.
    """
    accept = self.request.headers.get('Accept', '')
    accepts = accept.split(';')
    accept = 'application/json'
    for candidate_accept in accepts:
      if 'json' in candidate_accept:
        break
      if 'html' in candidate_accept:
        accept = 'text/html'
        break
    return accept

  def GetEventById(self, event_id):
    """Retrieves an Event."""
    try:
      event_id = int(event_id)
    except:
      self.response.out.write('event_id must be numeric')
      self.response.set_status(400)
      return

    try:
      event = events.GetEventById(event_id)
    except events.ClientEventError, e:
      logging.exception(e)
      self.response.out.write('Error retrieving Event info: %s' % e.message)
      self.response.set_status(400)
      return
    except events.ServerEventError, e:
      logging.exception(e)
      self.response.out.write('Error retrieving Event info: %s' % e.message)
      self.response.set_status(500)
      return

    if not event:
      logging.info('No event found with id %d', event_id)
      self.response.set_status(404)
      return

    response = model_to_dict.ModelToDict(event)
    response['kind'] = 'mrtaskman#event'
    self.response.headers['Content-Type'] = 'application/json'
    json.dump(response, self.response.out, indent=2)
    self.response.out.write('\n')

  def delete(self, event_id):
    """Deletes a package and its associated blobs."""
    try:
      event_id = int(event_id)
    except:
      self.response.out.write('event_id must be numeric')
      self.response.set_status(400)
      return

    deleted = events.DeleteEventById(event_id)
    if not deleted:
      self.response.set_status(404)
      return


app = webapp2.WSGIApplication([
    ('/events/([a-z0-9]+)', EventsHandler),
    ('/events', EventsHandler),
    ], debug=True)
