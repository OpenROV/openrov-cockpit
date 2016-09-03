# Testing
pre-req: The polymer command line (`npm install -g polymer-cli`)
From the ui-manager/public folder:
```
polymer serve -o --port 3000 --root ./webcomponents/test/  --open-path .
```
navigate to http://localhost:3000/components/public/orov-widget-registry.html


#orov-widget-registry

### messages
`widget-registry-enumerate-widgets(filterFunction,callback([widget-tags]))` : 
This message requests that the widget registry find all of the widgets, apply the included filter on those widgets and then return the tag for all matching widgets.

#orov-panel
This is a basic panel that dynamically loads widgets that meet its filter criteria.  It currently only loads the widgets with their default properties and then sets the event-emitter attribute for the same one the panel is connected to.

Properties:
* panelType: A comma delimited string of categories of ui-widgets that this container supports

Functions:
* panelFilter: The filter used to determine which widgets to process.  By default, filters for widgets that have a defaultPanel property that matches one of the values in panelType 
