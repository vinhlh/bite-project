# Copyright 2011 Google Inc. All Rights Reserved.
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

"""The common lib utils."""

__author__ = 'phu@google.com (Po Hu)'


from models import bite_event
from utils import bite_constants


def GetEventData(event):
  """Gets the events data."""
  event_id = str(bite_event.BiteEvent.host.get_value_for_datastore(event))
  event_type = event.event_type
  name = event.name or ''
  labels = event.labels or []

  if event_type == 'project':
    icon = '/images/spec/performance.png'
  elif event_type == 'suite' or event_type == 'set':
    event_type = 'set'
    icon = '/images/artifacts/testautomated.png'
  elif event_type == 'run':
    icon = '/images/sample/run01-pie.png'
  elif event_type == 'schedule':
    icon = '/images/spec/security.png'
  elif event_type == 'run_template':
    icon = '/images/sample/run01-pie.png'
    event_type = 'runTemplate'
  action = ''
  if event.action:
    action = bite_constants.EVENT_ACTION_TO_READABLE[event.action]
    action = ' '.join([event_type, action])
  email = ''
  if event.created_by:
    email = event.created_by.email()
  return {'id': event_id,
          'extraId': str(event.key()),
          'type': event_type,
          'title': name,
          'labels': labels,
          'icon': icon,
          'actions': [
              {'title': 'View details',
               'operation': 'viewDetails'}],
          'props': [{'label': 'action', 'value': action},
                    {'label': 'by', 'value': email},
                    {'label': 'around', 'value': str(event.created_time)}]}

