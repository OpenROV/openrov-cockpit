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
This is a basic panel that dynamically loads widgets that meet its filter criteria.  It currently only loads the widgets with their default properties and then sets the event-emitter attribute for the same one the panel is connected to. It is intended that developers extend the panel by inheriting the orov-panel-behavior with custom widget selection criteria and orov-panel with custom layout.

Properties:
* panelType: A comma delimited string of categories of ui-widgets that this container supports

Functions:
* panelFilter: The filter used to determine which widgets to process.  By default, filters for widgets that have a defaultPanel property that matches one of the values in panelType 

#orov-widget-collection
TODO: Need to turn the external lights collection in to a generic orov-widget-collection with a behavior that developers can then extend

#orov-appletswitcher
Provides the interface for selecting the applet to view on the page.  Theme developers should take the orov-appletswitcher-behavior and create their own UI for new and unqiue looks.

#switch-behavior
This is one of what will be a set of "well-known" interfaces for the web controls so the panels can interact with controls from plugins.  Any webcontrol that impliments the switch-behavior can be automatically discovered and loaded by panels such as the new-ui/settings.html panel.  The switch exposes standard on(), off(), and switchState interfaces.