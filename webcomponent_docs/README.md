*THIS IS A WORK IN PROGRESS*

This folder holds a configuration file and script for generating a static install of the webcomponents suitable for publishing to github for viewing as documentation.

## To view the documentation locally
```
bower install
python -m SimpleHTTPServer 8000
```
Documentation will be available on http://localhost:8000

## To add additional components to the documentation:
* Initialize a bower config in the webcomponents folder of the plugins.  Be sure to name the project the same name as the plugin.
```
cd ../src/plugins/example/public/webcomponents
bower init 
<set project name as example instead of webcomponents which is what it will default to>
```
* Make sure the component is a dependency of this project
```
bower install --save ../src/plugins/example/public/webcomponents
``` 
* Update the all-imports.html file with the component to include

## Handling dependencies
If you have components that have a dependency on other components that are not easily put in to the bower dependency section (such as relative paths), it may be easier to simply add the relative path and project as a dependency to this documentation project in its bower.json.


## Todo:
- [ ] Figure out how to get rid of the Polymer components that end up in the documentation because the component imports Polymer.
