This document is intended to give a developer background on why we have made some of the technical decisions that we have.

## Its Web Based ##
Goals: 
* Easy for developers to hack

Benefits that we enjoy:
* Users can run all of the primary use cases of the ROV without needing to install any software.  It just works.
* Technology is one of the most widely understood in the world: HTML, CSS and Javascript
* Rich library of pre-built functionality and modules.
* Massively large device reach. The web runs everywhere.

## Its Modular ##
Goals: 
* Easy for developers to hack
* Minimize testing

Benefits that we enjoy:
* Easier to GROK the code as a developer sees the functionality start and stop with well defined interfaces
* Safer to hack as side-effects from hacking are limited to the module that was hacked
* Faster to test, we only have to test the module(s) that were changed
* Easier to make large scale changes, we can roll them out one module at a time

## It only runs on the latest browsers ##
Goals:
* Capable system that can harness the full power of the topside hardware
* Minimize support costs

Benefits that we enjoy:
* Reasonable computational capability with any other platform that might be used
* We avoid the whole legacy browser issue

This document is intended to give a developer an overview of how the UI portion of the OpenROV stack is arranged.

##Code Organization:##
```
\
+ -- src  [ cockpit.js is the root of the app, app.js launches it ]
|     |
|     + -- lib  [ Holds the node.js files ]
|     |
|     + -- plugins   [ Feature plugins that have browser, Node, and Arduino files ]
|     |
|     + -- static  [ The browser code ]
|     |
|     + -- system-plugins  [ Infrastructure plugins ]
|     |
|     + -- ui-plugins [ UI themes and components ]
|     |
|     + -- views [ Base page templates ]
```

## UI-Manager
The page discovery and layout are handled by the UI-Manager system service.  You can read more [here](../src/system-plugins/ui-manager/README.md)


##SPA Initialization Sequence Diagram##
```
Cockpit SPA initialization Sequence

static/index.html->plugins/plugin.html: load
static/index.html->static/cockpit_eventemitter: new
plugins/plugin.html->static/cockpit_eventemitter: listen(event list)
static/cockpit_eventemitter->plugins/plugin.html: requested events
cockpit.js(node)->/lib/eventemitter: new
cockpit.js(node)->plugins/index.js: load

static/index.html->cockpit.js(node): socket.io connect()
cockpit.js(node)->static/cockpit_eventemitter: all events
cockpit.js(node)->/lib/OpenROVController.js: start
/lib/OpenROVController.js->/lib/hardware.js: start serial to ROV
/lib/OpenROVController.js->arduino/settings.cpp: config settings
arduino/settings.cpp->/lib/OpenROVController.js: capabilities
/lib/OpenROVController.js->static/cockpit_eventemitter: capabilities
static/cockpit_eventemitter->plugins/plugin.html: capabilities
plugins/plugin.html->static/index.html: inject html
arduino/device.cpp->/lib/eventemitter: telemetry data
/lib/eventemitter->plugins/index.js: subscribed telemetry data
plugins/index.js->static/cockpit_eventemitter: plugin events
static/cockpit_eventemitter->plugins/plugin.html: subscribed events
plugins/plugin.html->static/index.html: DOM updates
```
![Sequence Diagram](http://www.websequencediagrams.com/cgi-bin/cdraw?lz=CnN0YXRpYy9pbmRleC5odG1sLT5wbHVnaW5zLwACBgAQBTogbG9hZAAZFAA5B2NvY2twaXRfZXZlbnRlbWl0dGVyOiBuZXcKADsTABcfbGlzdGVuKABGBQAIBSkAgR4IAFIUAIEZF3JlcXVlc3RlZCAAgQ4FcwoAgRsHLmpzKG5vZGUpLT4vbGliLwCBHxIAFxIAggkIAIIfBmpzAIIHBwCCKBQAVhA6IHNvY2tldC5pbyBjb25uZWN0KCkAeRMAgiodYWxsAIEnH09wZW5ST1ZDb250cm9sbGVyAIEhBXN0YXJ0CgAIGQCBewdoYXJkd2FyZQApCiBzZXJpYWwgdG8gUk9WACUcYXJkdWluby9zZXR0aW5ncy5jcHA6IGNvbmZpZyAADQgKABIUAIEcHWNhcGFiaWxpdGllcwCBJBwAhGAdADgNAIQPMgB3DQCFKRwAhjEKOiBpbmplY3QgaHRtbACBbQlkZXZpY2UAgWkLAIYWDnRlbGVtZXRyeSBkYXRhAIMoBgCFShYAhHUKc3Vic2NyaWJlZAAvEACFGxAAhwIfAIdlBgCGGwgAhjQyAH4LAIZgBwCCAihET00gdXBkYXRlcw&s=napkin)

