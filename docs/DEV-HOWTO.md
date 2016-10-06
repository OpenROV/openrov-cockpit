### How to develop without the embedded computer
This section covers development on your laptop or desktop.  This approach passes flags to the cockpit process which replace actualy interfaces to the hardware with "mock" interfaces that act like the underlying hardware.

Prerequisites:
* You have done a git clone of the openrov-cockpit repository
* Are *NOT* running as root (that requires additional flags when doing the install)
* You are not running on ARM (there were some intel only development dependencies that will break the default install)
* If using the mock video options, FFMPEG needs to be installed on your machine.

Step 1: Installation
You need to install all of the dependencies that are needed.  You do need an active internet connection when running this command.

```
npm run deploy:prod
```

> If you want to install the development dependencies for the system you have to ignore the shrinkwrap settings:
```
npm run deploy:dev
```


This will go through all of the directories and look for bower.json files and package.json files and install them.  It will take a few minutes to run.  The goemux project will show some error messages when installing on Intel hardware.  Those can be ignored as the project is setup as an optional dependency and will just keep going.  The install should exit cleanly:

```
  │   ├── lodash@3.10.1
  │   └── punycode@1.4.1
  ├─┬ tap-parser@1.2.2
  │ ├── events-to-array@1.0.2
  │ └─┬ js-yaml@3.5.5
  │   └── argparse@1.0.7
  └── tmatch@2.0.1

npm WARN OpenROV-Cockpit@30.1.0 No license field.
[brian@Babs openrov-cockpit]$
```

The node process expects certain environment flags to be set to change its behavior.  You can override all of the settings that are stored in the config files from the command-line.

> Windows users: You have to setup the environment variables manually before executing the node command

The minimal items that need to be specified to run in a mock mode are:
* USE_MOCK=true : Cockpit will load mock dependencies in place of the real ones (which also generate fake runtime events)
* HARDWARE_MOCK=true : Cockpit will load a mock MCU interface, simulating the firmware.
* configfile='<path'> : The location to read/write the rovconfig.json file.  Your account needs access to this location.
* pluginsDownloadDirectory='/tmp/plugins' : Folder that will be created if missing, for downloading plugins

```
USE_MOCK=true HARDWARE_MOCK=true configfile='/tmp/rovconfig.json' pluginsDownloadDirectory='/tmp/plugins' node src/cockpit.js
```

The minimal command line will start the node process, allowing you to connect to `http://localhost:8080` which will bring up the cockpit.  The mock dependencies will be sending fake data over the message bus causing compass dials to rotate etc.  The minimal command line will not start any video.

Some of the more common advanced command line options:
* GEO_MOCK=true : Starts the simulated MP4 video stream (a test pattern, requires FFMPEG to be installed on your computer)
* MJPEG_MOCK=true: Starts the simulated MJPEG video stream (rotating set of underwater images)
* env plugins__ui-manager__selectedUI='classic-ui': Override the default theme that is loaded  (the env command on linux is needed since the theme name contains a dash.

```
USE_MOCK=true DEV_MODE=true HARDWARE_MOCK=true GEO_MOCK=true configfile='/tmp/rovconfig.json' pluginsDownloadDirectory='/tmp/plugins' env plugins__ui-manager__selectedUI='classic-ui'  node src/cockpit.js
```

### Debugging the node processes
There are lots of tools for developing and debugging.  We include Cloud9 IDE on the ROV image that we distribute.  When developing locally pick your tool of choice.

##### Using node inspector
This NPM package will allow you to start a web server from the command-line that will allow debugging of a node process using a webkit based browser (Chrome, Firefox etc..).

To install:
```
npm install -g node-inspector
```

To start node inspector:

```
node-inspector --web-port 3080
```
We need to specify a web-port option because node-inspector by default tries to listen for brower requests on port 8080 which happens to be what we use for cockpit.

You then start the cockpit node process with the debug option (or --debug-brk if you want your process to pause until you connect your debugging session):

```
USE_MOCK=true DEV_MODE=true configfile='/tmp/rovconfig.json' pluginsDownloadDirectory='/tmp/plugins' node src/cockpit.js --debug
```

You should now be able to open a browser window to `http://localhost:3080` and get a debugging session.  And then open another browser window to `http://localhost:8080` to start interacting with cockpit.

##### Using node inspector with forever
You can setup your debug session so that when you make code changes, the system magically and near instantly restarts and reloads cockpit in the background.

You need to install forever
```
npm install -g forever
```

And you then change your command that start cockpit to let the forever program load it for you:

```
USE_MOCK=true DEV_MODE=true HARDWARE_MOCK=true configfile='/tmp/rovconfig.json' pluginsDownloadDirectory='/tmp/plugins' forever -w -c 'node --debug' src/cockpit.js
```

##### Using Visual Studio Code
Visual Studio Code is a fairly decent Cross-Platform IDE that can be used for writing and debugging in a variety of languages, primarily Node.JS. The cockpit project contains a set of default configuration files for debugging in Mock mode. The steps to debug with VSC are:

1. Install Visual Studio Code for your platform
2. Open the openrov-cockpit project folder in VSC
3. Hit F5 to start debugging
4. The cockpit software can now be accessed as usual from http://localhost:8080
5. Use VSC to place breakpoints, step through the code, inspect variables, and much more. See VSC docs for features.

Additionally, there are plugins that allow debugging the code running in the browser in VSC as well, which we will provide instructions for in the future.

## Other developer tasks:
### Bulk upgrade node dependencies:
https://docs.npmjs.com/cli/update

`ncu --updateAll`

### NPM shrinkwrap all of the packages:
Do this when readying the repo for the next release to prevent the dependencies from moving.

`npm run shrinkwrap`