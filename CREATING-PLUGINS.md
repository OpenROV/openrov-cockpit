#Plugin Lifecycle
##Node
Node index.js file constuctor called
##Browser 
plugin.js constuctor called
<document ready>
listen called
plugin enabled/disabled called

#Making plugins managable via the plugins applet
The plugin must have a disable function and enable function defined
The plugin must have a Plugin_Meta object defined

#Distributing your plugin
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

#Things to be aware of
In version 31 of the cockpit and above, the process for plugins is changing.  This document will be updated as it changes.

