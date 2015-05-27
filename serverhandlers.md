# Introduction #

The BITE extension must be connected to a server which supports the following handlers. To define the address for your server, edit **bite.options.constants.ServerChannelOption** in [src/options/constants.js](http://code.google.com/p/bite-project/source/browse/trunk/src/client/options/constants.js).

## General handlers ##
  * /[check\_login\_status](check_login_status.md)
## Bug related handlers ##
The following handlers interacts with the [bite bugs](bite_bugs.md):
  * [/get\_bugs\_for\_url](get_bugs_for_url.md)
  * [/bugs/get](bugs_get.md)
  * [/bugs/new](bugs_new.md)
  * [/bugs/update\_status](bugs_update_status.md)
  * [/bugs/update\_binding](bugs_update_binding.md)
  * [/bugs/update\_recording](bugs_update_recording.md)

The following handlers interacts with the [bite bugs templates](bite_bug_templates.md):
  * [/get\_templates](get_templates.md)
  * [/new\_template](new_template.md)


## Test suite related handlers ##
  * [/compat/test](compat_test.md)
  * [/compat/redirect](compat_redirect.md)
  * [/get\_my\_compat\_test](get_my_compat_test.md)


## Test and Project related handlers ##
  * [/storage/getproject](storage_getproject.md)
  * [/storage/saveproject ](storage_saveproject.md)
  * [/storage/deletetest](storage_deletetest.md)
  * [/storage/addtest](storage_addtest.md)
  * [/storage/updatetest](storage_updatetest.md)
  * [/storage/gettestasjson](storage_gettestasjson.md)
  * [/storage/getprojectnames](storage_getprojectnames.md)


## Screenshots handlers ##
  * [/screenshots/upload](screenshots_upload.md)
  * [/screenshots/fetch](screenshots_fetch.md)
  * [/screenshots/search](screenshots_search.md)