### Update to doc coming soon. ###

I have changed the folder structure and the build.py file.  I will address the new information soon as I am currently making some structural changes to the server.  In the mean time, the short version of the changes to build BITE is.

./build.py (or python build.py) will delete the extension and server created by this build script.
./build.py --clean will remove the compiled code
./build.py --expunge will remove the compiled code and the download dependencies.

When building the script will only download dependencies if they are not already downloaded.  The script will then only compile the JavaScript files if they are not already compiled.  Then it will remove the old build of the extension and server, and create a new one of each.  If you want to make a change or update a dependency then simply delete those specific items and run build again.

New folders:
deps - The location where all downloaded dependencies are stored
genfiles - The location where all compiled JavaScript files are put.
output - The location where the extension and server bundle are put.

To load the extension, go to chrome://extension and load unpacked extension by selecting the output/extension folder.

To try out the server, create an appengine account, download the appengine sdk, and run
appcfg.py -V {version name} -A {name of create app} update output/server

**I will return to update this doc in more detail soon.
Jason**

### Below is the documentation for building the original released version of BITE. ###


#summary How to build the BITE extension.

The BITE extension comes with a build.py file, which will automatically download the required external dependencies and use the closure compiler to build the scripts. This will create a directory named 'build'.

Load the build directory as an extension in Google Chrome. Go to chrome://extensions/ and select 'Load Unpacked Extension'. Select the build folder.

Downloading the external dependencies will use [subversion](http://subversion.apache.org/) ([win](http://sourceforge.net/projects/win32svn/)), [git](http://git-scm.com/) ([win](http://code.google.com/p/msysgit/downloads/detail?name=Git-1.7.7.1-preview20111027.exe&can=2&q=)), and [mercurial](http://mercurial.selenic.com/).

## How to manually download dependencies ##

If build.py is not working, you can try manually downloading the dependencies.

### Ace ###
Download the Ajax.org Cloud Editor from http://ace.ajax.org/

BITE uses ace/build/src/ace.js. Copy this file into build/ace.
### Selenium ###
To simulate user web actions, BITE uses Selenium. Download from http://code.google.com/p/selenium

The files used in BITE are in svn/trunk/javascript/atoms.
### Closure compiler and library ###
The JavaScript for BITE is written using Closure, and must be compiled with the Closure Compiler. Get the compiler and library from http://code.google.com/closure/

Soy templates are also used in BITE. Download the soy template compiler from http://code.google.com/closure/templates/docs/javascript_usage.html