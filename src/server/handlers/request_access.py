#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Access requests handlers."""

__author__ = 'alexto@google.com (Alexis O. Torres)'

# Disable 'Import not at top of file' lint error.
# pylint: disable-msg=C6204
try:
  import auto_import_fixer
except ImportError:
  pass  # This will fail on unittest, ok to pass.

import sys

from google.appengine.api import mail
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from handlers import base
from models import counter


class CompatAccessHandler(base.BaseHandler):
  """Handles requests to gain access to the site compatibility feature."""

  # Disable 'Invalid method name' lint error.
  # pylint: disable-msg=C6409
  def get(self):
    """Handles the GET request for the home page."""
    # TODO(alexto): Add link send an email requesting access to the site.
    counter.Increment('compat_access_request')

    mail.send_mail(sender='alexto@google.com',
                   to=['alexto@google.com', 'joemu@google.com',
                       'bustamante@google.com'],
                   subject='Access request failed',
                   body=('Access by %s failed.' %
                         users.get_current_user().email()))

    title = 'You are not authorized to access this content.'
    content = ('The account %s is not authorized to access this content. '
               'Please contact the person that referred you to this site '
               'and request to be added to the list of authorized users.' %
               users.get_current_user().email())
    self.RenderTemplate('notify.html', {'title': title,
                                        'content': content})


application = webapp.WSGIApplication(
    [('/request_compat_access', CompatAccessHandler)],
    debug=True)


def main(unused_argv):
  run_wsgi_app(application)


if __name__ == '__main__':
  main(sys.argv)
