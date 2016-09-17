# Overview
The OpenROV Cockpit is fully extendable via plugins.  You can start simply with a light weight theme change, or completely rewite the look and feel of each widget on the page.  You can add brand new widgets and incorporate them in to existing pages.

Each plugin is a self contained module that is capabable of adding code that executes at the browser, server (node.js), or MCU (adruino) layer.

The plugins can themselves have dependencies on other popular software libraries with the use of both bower and npm package managers.

The user interface for OpenROV can use any web technology that you like as long as it is okay running inside an HTML5 template section. Each theme has full access to the DOM to move and organize widgets.  All the widgets on the page have self contained behaviors and skinning available through standard HTML tag attributes.

All of the widgets on the web page are standard HTML web components.  We Polymer as the helper library to write most of our components, but any webcomponents will work.  We use web components because they make each UI widget self contained and completely isolated form all other javascript or css that is running on the page. 

All of the plugins created by the community live in the authors own github repository.  Our system uses Bower as a centralized registry of all available plugins.  When cockpit runs, users have an option to search and install any plugin that has been registerd with Bower.

# Getting Started
We try our best to keep our example plugin up to date with the best practices for writing a typical plugins.  Your always welcome to copy the sample, rename it, and use it as the foundation of your own component.

* [Example](src/plugins/example) - Typical plugin that has code at every layer and responds to most of the lifecycle events available to a plugin.
* [Basic Theme](src/plugins/basictheme) - In 5 lines of code and css, shows how to make a new css driven theme 

To start a plugin, create a new github project for your plugin.  Below is the full structure that your plugin may contain.  Most layers are optional.  Behind the sceens the OpenROV plugin manager crawls the physical folders containing plugins and looks for the index.js to "register" the plugin.
```
.
├── firmware  <- Optional: For MCU code
│   ├── CExample.cpp
│   ├── CExample.h
│   └── example.h
├── index.js <- Required: 
├── example.ejs <- Optional: EJS template that is loaded as an applet in the UI
├── example.ejs.icon <- Optional: Text file with the name of the icon to user for the applet
├── package.json <- Optional: For storing NPM dependencies
├── bower.json <- Required: Defines your plugin
├── public <- Optional: Files made available to the browser
│   ├── bower.json <- Optional: for storing bower dependencies
│   ├── css <- Optional (mapped to "plugins/<plugin-name/css")
│   │   └── style.css
│   ├── js <- Optional: (mapped to "plugins/<plugin-name/js")
│   │   ├── example-widgets-autodiscovery.js
│   │   └── example.js
│   ├── tests <- Optional: Front end tests
│   │   ├── specs
│   │   │   └── example.spec.js
│   │   └── test.html
│   └── webcomponents <- Optional: For storing web components (mapped to "components/<plugin-name>/<component>.html")
│       └── example.html
└── tests <- Optional: Node.js tests
    └── index.js
```

# Creating a new widet
We highly encourage the user of web components for developing UI widgets.  Our helper library of choise is [Polymer Web Components](https://polymer-project.org), but it is not a requirement.
Polymer promotes a nice code seperation between behaviors and templates. As a widget developer that wants to simply theme existing widgets, you can inherit the behavior of existing widgets and simply provide a new HTML template.  For example the [time widget](src/plugins/controllerboard2x/plublic/webcomponents/orov-time.html) is a very light theme

```
  <template>
    <div id="time-container" class="center">
      <div class="time-row">
        <div id="time" class="time-cell text-center">{{time}}</div>
      </div>
      <div class="time-row">
        <div class="time-cell">
          <span class="line-cell"><hr></span>
          <span class="time-cell description-cell text-center">{{__('RUN')}}</span>
          <span class="line-cell"><hr></span>
        </div>
      </div>
      <div class="time-row">
        <div id="runtime" class="time-cell text-center">{{ runtime }}</div>
      </div>
    </div>
  </template>
```
All of the values for the template are provided by the (orov-time-behavior)[src/plugins/controllerboard2x/plublic/webcomponents/orov-time-behavior.html].  If you want a different looking clock, you can simply link in the existing orov-time-behavior and then provide your own template.

Our hope is that the complex behaviors that might go in to a widget end up only getting created once and then shared be all of the widget develoeprs so that we benefit from centrazlied bug fixes and the like, while giving us all the flexibiliy in the world to make the widgets look and move in any way we like.

# Integrating a new widget to existing pages
TDB  - In the meantime, you can always deploy your new widget standalone by creating a <yourwidget>.ejs file that will make it an applet that can be navigated to as a seperate page.

# Overridding an existing applet 
If you have created a theme plugin, you can override the applets provided by the system be simply redefining them in your theme by creates applet.ejs files of the same name.  For instance to provide a whole new cockpit interface create a "cockpit.ejs" file.

# Creating theme headers and footers
The following EJS templates if defined in your theme directory will be injected in to every applet on the site:

* header.ejs
* footer.ejs
* head.ejs (for html injected in the HEAD tag of the page)

# Plugin Lifecycle
## Node
Node index.js file constuctor called
plugin listen() called
plugin getSettingSchema() called
plugin start() is called

## Browser 
plugin.js constuctor called
document ready event called
plugin listen() called
plugin enabled()/disabled() called

## Firmware
on compile all enabled plugins firmware files are copied in to the central firmware folder 

# Making plugins managable via the plugins applet
A well behaved plugin will allow the user to enable/disable the plugin after it has been installed. That requires the plugin:

### Browser plugin
* The plugin must have a disable function and enable function defined. These must be idempotent.
* The plugin must have a Plugin_Meta object defined

### Node plugin
* The plugin must have a disable function and enable function defined. These must be idempotent.
* The plugin must have a Plugin_Meta object defined

### MCU firmware plugin

## How it works
The applet manager behavior that shows the applets has its list dynamically updated from the node server.
Do we disable across all levels by default?  That is a global enable/disable.
Do we allow disabling for just a user? The node process still generates GPS data, but this users browser has the receiver disabled


# Distributing your plugin
The cockpit software has a built in search feature that looks for plugins that are registered in the bower.io registry.

All plugins will show, but to install your plugin you must indicate which plugin API was being developed against.  The current version is V2.  You indicate this by adding the keyword "plugin-api-2" to your bower.json file.

Bower.io requires you to "tag" your code so that it knows its okay to distribute.  There are lots of ways to tag your project. An easy way using github is to create a release for your code.
https://help.github.com/articles/creating-releases/  (the documentation may be a little out of data, but the UI will walk you through the process)

You can add you plugin to the registry using the following command.
```
$ bower register <my-package-name> <git-endpoint>
# for example
$ bower register openrov-plugin-example git://github.com/user/example.git
```
Note: You can name the plugin something different than the name your github repository has.

The commands to manage your entry in the registry can be found in the bower.io documentation: https://bower.io/docs/creating-packages/

That will register your plugin with the bower registry that is used by OpenROV cockpit. You can see your plugin in the registry by typing `bower search openrov-plugin`.


