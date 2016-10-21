(function(window, document) 
{
  'use strict';
  class InputController
  {
    constructor(cockpit)
    {
      console.log("Starting Input Controller");

      var self = this;
      self.cockpit = cockpit;
      
      //Data structure to hold our presets on the browser side
      //key: "preset-name" value: ["controller1", "controller2", ..., "controllerN"]
      //where controller is, for example, keyboard
      self.presets = new Map();

      //The OpenROV default mapping preset. Defined by crawling the plugins
      self.openrovPreset = new InputController.Preset("OpenROV Preset");

      //Add our default controllers
      self.openrovPreset.addController("keyboard");
      self.openrovPreset.addController("gamepad");

      //Add it to the map
      self.presets.set("OpenROV Preset", self.openrovPreset);

      //Function to crawl all of the plugins that loaded before us to find their defaults
      self.loadPluginDefaults();
    };

    //Member functions

    listen()
    {
      var self = this;

      this.cockpit.on('plugin.inputController.debug', function() {
        self.loadPluginDefaults();
      });

      this.cockpit.on('plugin.inputController.defaults', function(defaults) {
        self.register(defaults);
      });

    };

    loadPluginDefaults()
    {
      var self = this;

      self.cockpit.loadedPlugins.forEach( function(plugin) {
        if(plugin.inputDefaults !== null)
        {
          self.register(plugin.inputDefaults);
        }
      });
    };

    register(input)
    {
      if(input == null)
      {
        console.error("Tried to register an undefined input!");
        return;
      }
      console.log("Registering a plugin:", input);
    };


  }

  // Add plugin to the window object and add it to the plugins list
  var systemPlugins = namespace('systemPlugin');
  systemPlugins.InputController = InputController;
  window.Cockpit.plugins.push( systemPlugins.InputController );

}(window, document));