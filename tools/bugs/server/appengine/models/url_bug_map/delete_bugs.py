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

"""Remove all mappings for a bug."""

__author__ = ('alexto@google.com (Alexis O. Torres)',
              'jason.stredwick@gmail.com (Jason Stredwick)')


from bugs.models.url_bug_map import url_bug_map


class Error(Exception):
  pass


def DeleteAllMappingsForBug(key_name):
  """Deletes all mappings for the specified bug.

  Args:
    key_name: The key name of the bug.
  Returns:
    The total amount of mappings deleted.
  """
  total_deleted = 0
  bug = bugs.GetBugByKey(key_name)
  query = UrlBugMap.all(keys_only=True).filter('bug = ', bug)
  mappings = query.fetch(_MAX_RESULTS_CAP)
  while mappings:
    total_deleted += len(mappings)
    db.delete(mappings)
    mappings = query.fetch(_MAX_RESULTS_CAP)

  logging.info(
      'DeleteAllMappingsForBug: total mappings deleted for bug %s: %d.',
      key_name, total_deleted)
  return total_deleted
