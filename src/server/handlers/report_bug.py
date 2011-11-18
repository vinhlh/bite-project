#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Bug reporting handlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import datetime
import logging
import sys
import urllib
import gdata
import gdata.client
import gdata.gauth
import gdata.projecthosting.client
import simplejson

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from crawlers import crawler_util
from handlers import base
from models import bugs
from models import bugs_util
from models import credentials
from models import screenshots
from models import url_bug_map
from utils import url_util
from utils import screenshots_util


class Error(Exception):
  pass


class UnrecognizedProvider(Error):
  pass


class UnrecognizedBindingAction(Error):
  pass


class ReportBugHandler(base.BaseHandler):
  """Base handler for the all other bug reporting handlers."""

  _SCOPE = ('http://code.google.com/feeds/issues',)

  def NotifyUser(self, title, content):
    """Renders the notification page."""
    self.RenderTemplate('notify.html', {'title': title,
                                        'content': content})

  def GetUserInfo(self):
    """Gets user information used by the django template."""
    user = users.get_current_user()
    return {'email': user.email(),
            'signUrl': users.create_logout_url(
                url_util.GetBaseUrl(self.request.url))}

  def GetAuthSubUrl(self):
    """Gets the URL string to obtain an authentication token."""
    secure = False
    session = True
    return gdata.gauth.generate_auth_sub_url(
        self.request.url, self._SCOPE, secure, session)

  def IsUserAuthorized(self):
    """Whether the specified user has authorized the app."""
    current_user = users.get_current_user()
    if gdata.gauth.AeLoad(current_user.user_id()):
      return True

    token = self.request.get('token', None)
    if token:
      try:
        auth_token = gdata.gauth.AuthSubToken(token, self._SCOPE)
        client = gdata.projecthosting.client.ProjectHostingClient()
        client.auth_token = auth_token
        client.upgrade_token()
        gdata.gauth.AeSave(client.auth_token, current_user.user_id())
        return True
      except gdata.client.Error, error:
        # Typically, a 403 has happend indicating that the
        # AuthSub token is invalid.
        gdata.gauth.AeDelete(current_user.user_id())
        self.response.set_status(403, 'Invalid Authorization token.')
        self.NotifyUser('Invalid Authorization token, please try again.',
                        'Error message: %s' % error.message)
        return False
    else:
      self.response.set_status(
          403, 'Need authorization to access Issue Tracker')
      self.redirect(self.GetAuthSubUrl().__str__())
      return False


class CreateBugHandler(ReportBugHandler):
  """Handles the creation of a new bug into Issue Tracker."""

  def get(self):
    provider = self.GetOptionalParameter('provider',
                                         bugs_util.ISSUETRACKER)
    if not self.IsUserAuthorized():
      return

    project = self.GetOptionalParameter('project', 'chromium')

    version = self.GetRequiredParameter('version')
    url = self.GetRequiredParameter('url')
    self.RenderTemplate('report_bug.html',
                        {'project': project,
                         'provider': provider,
                         'version': version,
                         'url': url,
                         'postback_url': self.request.url,
                         'user': self.GetUserInfo()})
    return

  def post(self):
    current_user = users.get_current_user()
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')

    screenshot_link = ''
    screenshot = self.GetOptionalParameter('screenshot', None)
    if screenshot:
      # Store the screenshot data and get the link.
      new_screenshot = screenshots.Add(
          data=screenshots_util.DecodeBase64PNG(screenshot),
          source=provider, project=project)
      screenshot_link = screenshots_util.RetrievalUrl(
          self.request.url, new_screenshot.key().id())

    title = self.GetTitle()
    body = self.GetBody(screenshot_link=screenshot_link)
    user_name = current_user.nickname()
    url = urllib.unquote(self.GetRequiredParameter('url'))


    if provider == bugs_util.ISSUETRACKER:
      if not self.IsUserAuthorized():
        return
      client = gdata.projecthosting.client.ProjectHostingClient()
      client.auth_token = gdata.gauth.AeLoad(current_user.user_id())
    else:
      raise UnrecognizedProvider(provider)

    try:
      issue = client.add_issue(
          project,
          title,
          body,
          user_name,
          labels=['Type-Defect', 'Priority-Medium', 'HeadsUp', 'FiledByBITE'])
    except gdata.client.Error, error:
      gdata.gauth.AeDelete(current_user.user_id())
      self.response.set_status(400, 'Failed to create the bug.')
      self.NotifyUser('Failed to create the bug, please try again.',
                      'Error message: %s' % error.message)
      return

    details_link = None
    bug_id = None
    priority = None
    report_date = str(datetime.datetime.now())
    target_element = urllib.unquote(self.GetRequiredParameter('target_element'))
    recording_link = self.GetOptionalParameter('recording_link', '')
    urls = [(url, url_bug_map.UrlPosition.MAIN)]

    bug_id = crawler_util.ExtractIssueTrackerBugId(issue)
    details_link = issue.GetAlternateLink().href
    priority = '2'
    status = 'Available'

    crawler_util.StoreBug(bug_id=bug_id,
                          title=title,
                          summary=body,
                          priority=priority,
                          project_name=project,
                          provider=provider,
                          status=status,
                          author=user_name,
                          details_link=details_link,
                          reported_on=report_date,
                          last_update=report_date,
                          last_updater=user_name,
                          target_element=target_element,
                          screenshot=screenshot_link,
                          urls=urls,
                          recording_link=recording_link)

    self.response.out.write(details_link)


  def GetTitle(self):
    """Returns the title string used for the bug report."""
    return self.GetRequiredParameter('title')

  def GetBody(self, screenshot_link=''):
    """Returns a formatted string that used as the body of the report."""
    version = urllib.unquote(self.GetRequiredParameter('version'))
    url = urllib.unquote(self.GetRequiredParameter('url'))
    repro = self.GetOptionalParameter('repro', 'N/A')
    return ('Chrome Version       : %s\n'
            'URLs (if applicable) : %s\n'
            'Screenshot (if available): %s\n'
            '\n'
            'Steps to reproduce the problem:\n'
            '%s')  % (version,
                      url,
                      screenshot_link,
                      repro)


class UpdateStatusHandler(ReportBugHandler):
  """Handles updating the status of bugs in Issue Tracker."""

  def post(self):
    issue_id = self.GetRequiredParameter('id')
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    clear_bindings = self.GetOptionalParameter('clear_binding', False)
    if clear_bindings:
      comment = self.GetOptionalParameter('comment', None)
    else:
      comment = self.GetRequiredParameter('comment')
    target_element = self.GetOptionalParameter('target_element')
    status = self.GetOptionalParameter('status')

    issue_key = bugs.GenerateKeyName(issue_id, project, provider)

    current_user = users.get_current_user()
    if provider == bugs_util.ISSUETRACKER:
      if not self.IsUserAuthorized():
        return
      client = gdata.projecthosting.client.ProjectHostingClient()
      client.auth_token = gdata.gauth.AeLoad(current_user.user_id())
    else:
      raise UnrecognizedProvider(provider)

    result = None
    try:
      # Including a status in update_issue can require more permissions, so
      # split the call depending on whether a status change was provided.
      if status:
        client.update_issue(
            project,
            issue_id=issue_id,
            status=status,
            author=current_user.nickname(),
            comment=comment)
        bugs.UpdateStatus(issue_key, status)
      else:
        client.update_issue(
            project,
            issue_id=issue_id,
            author=current_user.nickname(),
            comment=comment)
      result = {'success': True}
    except gdata.client.RequestError, e:
      logging.exception('Error updating bug %s on project %s. Error: %s',
                        issue_id, project, str(e))
      result = {'success': False,
                'error': str(e)[:300]}

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(result))

class BindingActions(object):
  """Holds the valid actions during binding operations."""
  UPDATE = 'update'
  CLEAR = 'clear'


class UpdateBindingHandler(base.BaseHandler):
  """Handles updating the binding of bugs to controls."""

  def post(self):
    issue_id = self.GetRequiredParameter('id')
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    action = self.GetRequiredParameter('action')

    target_element = ''
    if action == BindingActions.UPDATE:
      target_element = self.GetRequiredParameter('target_element')
    elif not action == BindingActions.CLEAR:
      raise UnrecognizedBindingAction('Action: ' + action)

    issue_key = bugs.GenerateKeyName(issue_id, project, provider)
    logging.info('Updating target_element of bug %s, target_element: %s',
                 issue_id, target_element)
    bugs.UpdateTargetElement(issue_key, target_element)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps({'success': True}))


class UpdateRecordingHandler(base.BaseHandler):
  """Handles adding recording to the bug."""

  def post(self):
    issue_id = self.GetRequiredParameter('id')
    project = self.GetRequiredParameter('project')
    provider = self.GetRequiredParameter('provider')
    action = self.GetRequiredParameter('action')

    recording_link = self.GetRequiredParameter('recording_link')
    issue_key = bugs.GenerateKeyName(issue_id, project, provider)
    logging.info('Update recording link of bug %s, recording_link: %s',
                 issue_id, recording_link)
    bugs.UpdateRecording(issue_key, recording_link)

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps({'success': True}))


application = webapp.WSGIApplication(
    [('/bugs/new', CreateBugHandler),
     ('/bugs/update_binding', UpdateBindingHandler),
     ('/bugs/update_recording', UpdateRecordingHandler),
     ('/bugs/update_status', UpdateStatusHandler)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
