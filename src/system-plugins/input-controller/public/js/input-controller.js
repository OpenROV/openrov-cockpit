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
        //key: "preset-name" value: ["preset1", "preset2", ..., "presetN"]
        self.presets = new Map();

        //The OpenROV default mapping preset. Defined by crawling the plugins
        self.openrovPreset = new inputController.Preset("OpenROV Preset");

        //Add our default controllers
        self.keyboard = new Keyboard(cockpit);
        self.controllers.set("keyboard", self.keyboard);

        self.gamepad = new Gamepad(cockpit);
        self.controllers.set("gamepad", self.gamepad);

        //Add the default preset to the map
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

        //Tell everyone else we got presets to use
        self.cockpit.emit('plugin.inputController.updatedPreset', self.presets.get(self.currentPreset));
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

      this.cockpit.on('plugin.inputController.defaults', function(defaults) {
        
        //Listen for plugins asking to register their default input configurations
        //Make sure we got a valid input
        if(defaults == null)
        {
          console.error("A plugin tried to register undefined defaults!");
          return;
        }

        self.register(input, self.currentPreset);

        self.cockpit.emit('plugin.inputController.updatedPreset', self.presets.get(self.currentPreset));
      });

      this.cockpit.on('plugin.inputController.sendPreset', function() {

        if(self.presets !== undefined)
        {
          console.log(self.presets.get(self.currentPreset));
          self.cockpit.emit('plugin.inputController.updatedPreset', self.presets.get(self.currentPreset));
        }
        
      });

      this.cockpit.on('plugin.inputController.resetControllers', function() {
        self.resetControllers();
      });

      this.cockpit.on('plugin.inputController.updateInput', function(input) {

        //Try to update that input
        self.updateInput(input, self.currentPreset);
      });

      this.cockpit.on('plugin.inputController.unregisterInput', function(input) {

        //Try to update that input
        self.unregisterInput(input, self.currentPreset);
      });

    };

    unregisterInput(input, preset)
    {
      var self = this;

      if(input == null)
      {
        console.error("Tried to update a null input");
        return;
      }

      var currentPreset = self.presets.get(preset);

      //Unregister the input with hardware
      var controller = self.controllers.get(input.controller);
      controller.unregister(input.input);

      //Update the input with the preset
      currentPreset.unregisterInput(input);
      
      //Let everyone know we just updated
      self.cockpit.emit('plugin.inputController.updatedPreset', currentPreset);
    };

    updateInput(input, preset)
    {
      var self = this;

      if(input == null)
      {
        console.error("Tried to update a null input");
        return;
      }

      //The preset we are using
      var currentPreset = self.presets.get(preset);

      //The hardware we are interacting with
      var controller = self.controllers.get(input.controller);


      //Update the input with the hardware
      //We need a handle on what the previous input key was, so let's get it
      var previousInput = currentPreset.inputs.get(input.name);
      controller.update(previousInput, input);

      //Update the input with the preset
      var currentPreset = self.presets.get(preset);
      currentPreset.updateInput(input);

      //Let everyone know we just updated
      self.cockpit.emit('plugin.inputController.updatedPreset', currentPreset);
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
      input.controllers.forEach(function(value, controller) {
        
        //Grab the hardware interface and add the binding
        var hardware = self.controllers.get(controller);
        hardware.register(value, input.actions);

      });
    };

    registerInputWithPreset(input, preset)
    {
      var self = this;

      var currentPreset = self.presets.get(preset);

      //If this preset already exists, just update the preset
      if(currentPreset.inputs.has(input.name))
      {
        console.log("Input:", input.name, "already is registered with preset:", currentPreset.name);
      }
      else
      {
        currentPreset.addInput(input);
      }
      
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
          if(typeof assignment.axis == 'function')
          {
            assignment.axis(e.value);
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_DOWN, function(e) {
        var control = e.control;
        
        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button.down == 'function')
          {
            button.down();
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_UP, function(e) {
        var control = e.control;

        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button.up == 'function')
          {
            button.up();
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
    
    update(previousInput, currentInput)
    {
      var self = this;

      //unregister from the current settings
      if(previousInput.controllers.has('gamepad'))
      {
        self.unregister(previousInput.controllers.get('gamepad'));
      }      
      
      //And update with the newest bindings
      self.register(currentInput.input, previousInput.actions);
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

    //Prevents registration of uninteded key presses


    register(key, actions)
    {
      if(Mousetrap.modified == undefined) 
      {

        var orgStopCalback = Mousetrap.prototype.stopCallback;
        Mousetrap.prototype.stopCallback = function (e, element, combo, sequence) 
        {
          if ((' ' + element.className + ' ').indexOf(' no-mousetrap ') > -1) {
            return true;
          }
          return orgStopCalback.call(this, e, element, combo, sequence);
        };
        Mousetrap.modified = true;
      }

      if(key == null)
      {
        console.error("Tried to register an undefined key from Mousetrap");
        return;
      }

      console.log("Registering:", key, "with Mousetrap");

      //Register actions, used for unbinding as well
      if(actions.up !== undefined)
      {
        Mousetrap.bind(key, actions.up, 'keyup');
      }

      if(actions.down !== undefined)
      {
        Mousetrap.bind(key, actions.down, 'keydown');
      }
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

    unregister(key, actions)
    {
      if(key == null)
      {
        console.error("Tried to unregister an undefined key from Mousetrap");
        return;
      }
      Mousetrap.unbind(key, 'keydown');
      Mousetrap.unbind(key, 'keyup');
    };

    update(previousInput, currentInput)
    {
      var self = this;

      //Unregister from the current settings, if necessar
      if(previousInput.controllers.has('keyboard'))
      {
        self.unregister(previousInput.controllers.get('keyboard'));
      }

      //And update with the newest bindings
      self.register(currentInput.input, previousInput.actions);
    };

  };

  window.Cockpit.plugins.push(inputController.InputController);
}(window, document));