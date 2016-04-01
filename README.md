# bite-project
BITE is a suite of tools that lets you test the web from the web, offering tools that inform and accelerate manual and exploratory testing. It is currently available as an extension for the Chrome browser.

BITE offers:

In-browser bug reporting which grabs context.
Test suite management.
Visualization of bugs that have already been filed against a page.
Automatic recording and playback of user actions on a page.
The extension must be connected to a server to fetch information on bugs, tests, and new bug templates. See the wiki for more information on the necessary server extensions.



## Build
```sh
./build.py

usage: bb [-h] [--clean] [--expunge] [--quiet] [--deps] [--rpf]
          [--server_only] [--extension_only]

optional arguments:
  -h, --help        show this help message and exit
  --clean           Remove all generated and output files.
  --expunge         Remove all generated, output files, and dependencies.
  --quiet           Minimal build output.
  --deps            Download depenedencies only; no building.
  --rpf             Build RPF extension.
  --server_only     Only build the server
  --extension_only  Only build the extension.
  ```

### Extract RPF
Run command
``` ./build.py --rpfl```



It will generate 2 files:
```
- rpf_background_script.js Control listener, received all results which returned from listener.
- rpf_content_script.js Listen all user actions in a webpage.
```

### Server Delpoy
1. Change [application:id] in file app.yaml
2. Use command \path to GAE SDK\appcfg.py update server

### Fix type text issue
Comment out row #3127 in extesion "content_script.js" file after build
