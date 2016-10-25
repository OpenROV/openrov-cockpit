(function(window, document) 
{
  'use strict';

  
  loadScript('components/mousetrap-js/mousetrap.js');

  var inputController = namespace('systemPlugin.inputController');
  inputController.InputController = class InputController
  {
    constructor(cockpit)
    {
      console.log("Starting Input Controller");
      this.cockpit = cockpit;
      this.currentPreset = "OpenROVDefault";

      this.deferSetupForMousetrap();
    };

    deferSetupForMousetrap()
    {
        var self = this;

        if( self.setup() == false )
        {
          // Call timeout again
          setTimeout( self.deferSetupForMousetrap.bind( self ), 1000 );
        }
    }

    setup()
    {
      var self = this;

      if (typeof Mousetrap !== "undefined")
      {
        self.controllers = [];
        //Data structure to hold our presets on the browser side
        //key: "preset-name" value: ["controller1", "controller2", ..., "controllerN"]
        //where controller is, for example, keyboard
        self.presets = new Map();

        //The OpenROV default mapping preset. Defined by crawling the plugins
        self.openrovPreset = new inputController.Preset("OpenROV Preset");

        //Add our default controllers
        self.openrovPreset.addController("keyboard");
        self.keyboard = new Keyboard(cockpit);

        self.openrovPreset.addController("gamepad");
        self.gamepad = new Gamepad(cockpit);

        //Add it to the map
        self.presets.set("OpenROVDefault", self.openrovPreset);

        return true;
      }
      else
      {
        return false;
      }
    }

    //Member functions
    listen()
    {
      var self = this;

      this.cockpit.on('plugin.inputController.debug', function() {
        
      });

      this.cockpit.on('plugin.inputController.defaults', function(defaults) {
        
        //Listen for plugins asking to register their default input configurations

        //Make sure we got a valid input
        if(defaults == null)
        {
          console.error("A plugin tried to register undefined defaults!");
          return;
        }

        //This can be an array of inputs, treat it as such
        defaults.forEach(function(input){
          self.register(input);
        });

      });
    };

    //Registration of a single input
    //This function will register an input with the current preset
    register(input)
    {
      var self = this;

      if(input == null)
      {
        console.error("Tried to register an undefined input!");
        return;
      }
      console.log("Registering an input:", input, "to preset:", self.currentPreset);

      //Before we create a new object, make sure that it doesn't already exists
      var currentPreset = self.presets.get(self.currentPreset);
      var newInput = new inputController.Input(input);
      currentPreset.addInput(newInput);
    };
  }



  //Helper classes
  /*Gamepad abstraction*/
  class Gamepad
  {
    constructor(cockpit)
    {
      console.log("Starting gamepad abstraction");
      var gamepadHardware = new HTML5Gamepad();

    };
  };

  /*Keyboard abstraction*/
  class Keyboard
  {
    constructor(cockpit)
    {
      var self = this;

      console.log("Started keyboard abstraction");
    };

    register(key, actions)
    {
      if(key == null)
      {
        console.error("Tried to register an undefined key from Mousetrap");
        return;
      }
      console.log("Registering:", key, "with Mousetrap");
      
      //Register actions
      actions.forEach(function(action) {
        //Up binding
        if(action.up !== null)
        {
          Mousetrap.bind(key, function() {
            action.up();
            return false;
          });
        }

        //Down Binding
        if(action.down !== null)
        {
          Mousetrap.bind(key, function() {
            action.down();
            return false;
          });
        }
      });
    };

    registerPreset(preset)
    {

      //Preset for a keyboard controller object
      var self = this;

      var keyboardPreset = preset.controllers.get("keyboard");
      keyboardPreset.forEach(function(value, key) {
        self.register(key, value);
      });

    }

    reset()
    {
      console.log("Resetting keyboard interface");
      Mousetrap.reset();
    };

    unregister(key)
    {
      if(key == null)
      {
        console.error("Tried to unregister an undefined key from Mousetrap");
        return;
      }

      console.log("Unregistering:", key.key, "from Mousetrap");
      Mousetrap.unbind(key.key);
    };

  };

  window.Cockpit.plugins.push(inputController.InputController);
}(window, document));