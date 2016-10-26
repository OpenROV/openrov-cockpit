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
        self.controllers = new Map();
        //Data structure to hold our presets on the browser side
        //key: "preset-name" value: ["controller1", "controller2", ..., "controllerN"]
        //where controller is, for example, keyboard
        self.presets = new Map();

        //The OpenROV default mapping preset. Defined by crawling the plugins
        self.openrovPreset = new inputController.Preset("OpenROV Preset");

        //Add our default controllers
        self.openrovPreset.addController("keyboard");
        self.keyboard = new Keyboard(cockpit);
        self.controllers.set("keyboard", self.keyboard);


        self.openrovPreset.addController("gamepad");
        self.gamepad = new Gamepad(cockpit);
        self.controllers.set("gamepad", self.gamepad);

        //Add it to the map
        self.presets.set("OpenROVDefault", self.openrovPreset);

        //If plugins have loaded before us, let's get their defaults
        self.cockpit.loadedPlugins.forEach(function(plugin) {
          if(plugin.inputDefaults !== undefined)
          {
            //Do not support functions. Probably should
            if(typeof plugin.inputDefaults !== 'function')
            {
              plugin.inputDefaults.forEach(function(input) {
                self.register(input, self.currentPreset);
              });
            }
          }
        });

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
          self.register(input, self.currentPreset);
        });

        console.log(self.presets.get(self.currentPreset));
      });
    };

    //Registration of a single input
    //This function will register an input with the passed preset
    register(input, preset)
    {
      var self = this;

      if(input == null)
      {
        console.error("Tried to register an undefined input!");
        return;
      }
      console.log("Registering an input:", input, "to preset:", preset);

      self.registerInputWithPreset(input, preset);
      self.registerInputWithHardware(input);
    };

    registerInputWithHardware(input)
    {
      var self = this;

      //iterate through controllers associated with the input
      input.bindings.forEach(function(binding) {
        //Grab the hardware interface and add the binding
        var controller = self.controllers.get(binding.controller);
        controller.register(binding.input, binding.actions);
      });
    };

    registerInputWithPreset(input, preset)
    {
      var self = this;

      var currentPreset = self.presets.get(preset);
      currentPreset.addInput(input);
    };

    //Registration of a preset with hardware interfaces
    registerPreset(preset)
    {
      var self = this;

      if(preset == null)
      {
        console.error("Tried to register an undefined preset!");
        return;
      }

      //Iterate through the list of hardware controllers
      var currentPreset = self.presets.get(preset);
      currentPreset.controllers.forEach(function(value, controller) {
        
        var hardware = self.controllers.get(controller);
        //Iterate through the inputs for this controller
        value.forEach(function(actions, input) {
          hardware.register(input, actions);
        });
      }); 
    };

    resetControllers()
    {
      var self = this;
      self.controllers.forEach(function(controller) {
        controller.reset();
      });
    }

    //Unregistration of a single input
    //This function will unregister an input with the current preset
    unregister(input, preset)
    {
      var self = this;

      if(input == null)
      {
        console.error("Tried to unregister an undefined input!");
        return;
      }
      console.log("Unregistering an input:", input, "to preset:", preset);
      
      //Before we create a new object, make sure that it doesn't already exists
      var currentPreset = self.presets.get(preset);
      currentPreset.removeInput(input);
    };
  }

  //Helper classes
  /*Gamepad abstraction*/
  class GamepadAbstraction
  {
    constructor(cockpit)
    {
      var self = this;
      console.log("Starting gamepad abstraction");
      
      self.assignments = new Map();
      self.cockpit = cockpit;
      self.gamepadHardware = new HTML5Gamepad();
      
      self.currentTime = new Date();

      //Ignore until time
      self.ignoreInputUntil = 0;

      //Bindings
      self.gamepadHardware.bind(HTML5Gamepad.Event.AXIS_CHANGED, function(e) {
        if(self.currentTime.getTime() < self.ignoreInputUntil)
        {
          //Avoids inacurrate readings when the gamepad has just been connected
          return;
        }
        var axis = e.axis;

        if(self.assignments.has(axis))
        {
          var assignment = self.assignments.get(axis);
          if(typeof assignment[0].axis == 'function')
          {
            assignment[0].axis(e.value);
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_DOWN, function(e) {
        var control = e.control;
        
        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button[0].down == 'function')
          {
            button[0].down();
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_UP, function(e) {
        var control = e.control;

        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button[0].up == 'function')
          {
            button[0].up();
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.CONNECTED, function(device) {
        self.ignoreInputUntil = self.currentTime + 1000;
        console.log("Gamepad connected", device);
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.DISCONNECTED, function(device) {
        console.log("Gamepad disconnected", device);
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.UNSUPPORTED, function(device) {
        console.error("Gamepad unsupported", device);
      });


      if(!self.gamepadHardware.init())
      {
        console.error("Your browser doesn't support this gamepad");
        return;
      }

    };

  };

  /*Gamepad interface*/
  class Gamepad
  {
    constructor(cockpit)
    {
      console.log("Starting gamepad interface");
      
      var self = this;
      self.gamepadAbstraction = new GamepadAbstraction(cockpit);
    };

    register(key, actions)
    {
      var self = this;
      if(key == null)
      {
        console.error("Tried to register an undefined key with gamepad");
        return;
      }

      console.log("Registering input:", key, "to gamepad");
      self.gamepadAbstraction.assignments.set(key, actions);
    };

    registerPreset(preset)
    {
      var self = this;

      if(preset == null)
      {
        console.error("Tried to register an undefined preset with gamepad");
        return;
      }

      var gamepadPreset = preset.controllers.get("gamepad");
      gamepadPreset.forEach(function(value, key) {
        self.register(key, value);
      });
    }

    reset()
    {
      var self = this;

      console.log("Resetting gamepad");
      self.gamepadAbstraction.assignments.clear();
    };
    unregister(key, actions)
    {
      var self = this;
      if(key == null)
      {
        console.error("Tried to unregister an undefined key with gamepad");
        return;
      }

      console.log("Unregistering:", key, "from gamepad");
      self.gamepadAbstraction.assignments.delete(key);
    };
  };

  /*Keyboard Interface*/
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
        if(action.up !== undefined)
        {
          Mousetrap.bind(key, function() {
            action.up();
            return false;
          }, 'keyup');
        }

        //Down Binding
        if(action.down !== undefined)
        {
          Mousetrap.bind(key, function() {
            action.down();
            return false;
          }, 'keydown');
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