(function(window, document) 
{
  'use strict';
  class InputController
  {
    constructor(cockpit)
    {
      console.log("Starting Input Controller");

      var self = this;
      
      //Data structure to hold our presets on the browser side
      //key: "preset-name" value: ["controller1", "controller2", ..., "controllerN"]
      //where controller is, for example, keyboard
      self.presets = new Map();

      //The OpenROV default mapping preset. Defined by crawling the plugins
      self.openrovPreset = new InputController.Preset("OpenROV Preset");

      //Add our default controllers
      self.openrovPreset.addController("keyboard");
      self.openrovPreset.addController("gamepad");

      //Function to crawl all of the plugins to find their defaults
    }
  }

  // Add plugin to the window object and add it to the plugins list
  var systemPlugins = namespace('systemPlugin');
  systemPlugins.InputController = InputController;
  window.Cockpit.plugins.push( systemPlugins.InputController );

}(window, document));