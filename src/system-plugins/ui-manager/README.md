#UI-manager
A collection of simple node.js services, HTML5 webcomponent, and node EJS templates that tie together individual plugins in to a responsive HTML Single Page Application.

```
.
├── README.md
├── base.ejs  :  template used as the base for all UI pages
├── index.js  :  node.js module for ui-manager
├── popup.ejs :  template used as the base for popup windows
└── public      
    ├── bower.json
    ├── js
    │   └── ui-manager.js  : browser module for ui-manager
    └── webcomponents

```

Widget documentation (when running the application locally): http://localhost:8080/components/ui-manager/

Overview of the parts of the UI

```
+--------------------Page (base.ejs)-----------------------------------------------------------------+
|                                                                                                    |
|  +-----------------Applet---------------------------------------------------------------------+    |
|  | +---------------Panel-------------------------------|                                      |    |
|  | | +-----------+  +--------------+ +-----------------|  <---------------+                   |    |
|  | | |           |  |              | |                ||                  |                   |    |
|  | | |widget     |  |widget        | |widget          ||    Panels are web-controls that      |    |
|  | | |           |  |              | |                ||    can dynamically find other        |    |
|  | | +-----------+  +--------------+ +-----------------|    web-controls that should be hosted|    |
|  | +---------------------------------------------------+    as child elements.                |    |
|  |                                                                                            |    |
|  |                                                                                            |    |
|  |       A widget is just a standard HTML5 webcontrol that                                    |    |
|  |       has been configured to use the ui-bus to pass              +----widget-collection+   |    |
|  |       messages.                                                  |-------------------+ |   |    |
|  |                                                                  || widget           | |   |    |
|  |                                                                  ||                  | |   |    |
|  |       An applet is a web "page" that contains the HTML           ||                  | |   |    |
|  |       and webcontrols on the page.  It is simply a               |-------------------+ |   |    |
|  |       node EJS template.                                         |-------------------+ |   |    |
|  |                                                                  || widget           | |   |    |
|  |       Applets are swapped in and out of the browser by           ||                  | |   |    |
|  |       the ui-manager which has a base.ejs template that          ||                  | |   |    |
|  |       includes a page router for navigating between the          +-------------------+ |   |    |
|  |       applets.                                                   |                     |   |    |
|  |                                                       +------->  +---------------------+   |    |
|  |       The Applets is inside a HTML5 Template          |                                    |    |
|  |       which means you use {{}} style                  +                                    |    |
|  |       data binding to the HTML elements     There are "collections" which are a kind       |    |
|  |       on the page                           of panel that can dynamically create widgets   |    |
|  |                                             and place them inside of another panel.        |    |
|  |                                                                                            |    |
|  |                                                                                            |    |
|  +--------------------------------------------------------------------------------------------+    |
|                                                                                                    |
|  +--------------------------------------------------------------------------------------------+    |
|  |                                UI bus                                                      |    |
|  +--------------------------------------------------------------------------------------------+    |
|  +----plugin svc----+ +--------------------+ +-------------------+ +---+system services-+          |
|  |  Lights          | |                    | |                   | | ui-manager         |  <----------------+ We have services that run in the page
|  |  telemetry...    | |                    | |                   | | settings...        |          |          of the browser handling the messages
|  +------------------+ +--------------------+ +-------------------+ +--------------------+          |          from and to the widgets in the applet.
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+


```

