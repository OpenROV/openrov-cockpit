(function(window, document) 
{
  'use strict';
  loadScript('components/mousetrap-js/mousetrap.js');
  
  //Necessary for debug utils
  var log;
  var trace;
  var log_debug;

  $.getScript('components/visionmedia-debug/dist/debug.js', function() {
    log = debug('input-controller:log');
    trace = debug('input-controller:trace');
    log_debug = debug('input-controller:debug');
  });

  var recordPluginNeeded = true;

  var inputController = namespace('systemPlugin.inputController');
  inputController.InputController = class InputController
  {
    constructor(cockpit)
    {
      this.cockpit = cockpit;

      //Mapping from strings to JS functions
      this.actions = new Map();

      //Mapping from strings to hardware
      this.controllers = new Map();

      //Data structure to hold our presets on the browser side
      this.presets = new Map();
      this.currentPreset = "Defaults";
      this.defaultPreset = new inputController.Preset(this.currentPreset);

      this.deferSetupForMousetrap();
    };

    deferSetupForMousetrap()
    {
        var self = this;

        if ( (typeof Mousetrap !== "undefined") && recordPluginNeeded) {
          loadScript('components/mousetrap-js/plugins/record/mousetrap-record.js');
          recordPluginNeeded=false;
        }
        
        if((typeof Mousetrap == "undefined") || (typeof Mousetrap.record == "undefined") || self.setup() == false )
        {          
          // Call timeout again
          setTimeout( self.deferSetupForMousetrap.bind( self ), 100 );
        }
    }

    setup()
    {
      var self = this;

      if (typeof Mousetrap !== "undefined")
      {

        self.mousetrap = Mousetrap;
        
        //The OpenROV default mapping preset. Defined by crawling the plugins
        self.openrovPreset = new inputController.Preset("Defaults");

        //Add our default keyboard controllers
        self.keyboard = new Keyboard(cockpit, self.mousetrap);
        self.controllers.set("keyboard", self.keyboard);

        self.gamepad = new Gamepad(cockpit);
        self.controllers.set("gamepad", self.gamepad);

        //Add the controllers to this preset
        self.presets.set("Defaults", self.openrovPreset);
        self.presets.get("Defaults").addController("gamepad");
        self.presets.get("Defaults").addController("keyboard");
        
        //Crawl plugin directory for inputs
        self.listen();

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

      //Make sure that mousetrap is loaded before loading the plugin defaults
      if((typeof Mousetrap == "undefined") || (typeof self.mousetrap == "undefined"))
      {
        return;
      }

      self.cockpit.loadedPlugins.forEach(function(plugin) {
        
        //Map action strings to functions
        for(var action in plugin.actions)
        {
          self.actions.set(action, plugin.actions[action]);
        }

        //Add the inputs to our preset
        if(typeof plugin.inputDefaults !== 'function')
        {
          for(var controllerName in plugin.inputDefaults)
          {
            var controller = plugin.inputDefaults[controllerName];
            for(var inputName in controller)
            {
              var input = controller[inputName];

              var inputToRegister = {
                name: inputName,
                controller: controllerName,
                type: input.type,
                action: input.action
              };

              self.registerInput(inputToRegister);
            }
          }
        }
      });

      console.log("BOIO", self.actions);

      this.cockpit.on('plugin.inputController.sendPreset', function() {

        if(self.presets !== undefined)
        {
          log_debug(self.presets.get(self.currentPreset));
          self.cockpit.emit('plugin.inputController.updatedPreset', self.presets.get(self.currentPreset), self.actions);
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
        trace("Tried to update a null input");
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
        trace("Tried to update a null input");
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

    registerInput(input)
    {
      var self = this;

      if(input == null)
      {
        trace("Tried to register a null input");
        return;
      }

      self.registerInputWithPreset(input);
      self.registerInputWithHardware(input);

      //Let everyone know we just updated
      self.cockpit.emit('plugin.inputController.updatedPreset', self.presets.get(self.currentPreset));
    };

    //Registration of a single input
    //This function will register an input with the passed preset
    register(input, preset)
    {
      var self = this;

      if(input == null)
      {
        trace("Tried to register an undefined input!");
        return;
      }

      log_debug("Registering an input:", input, "to preset:", preset);

      self.registerInputWithPreset(input, preset);
      self.registerInputWithHardware(input);
    };

    registerInputWithHardware(input)
    {
      var self = this;

      var inputForHardware = {
        name: input.name,
        controller: input.controller,
        type: input.type,
        action: self.actions.get(input.action).controls[input.type] //Actually grab the function associated with this input
      };

      //iterate through controllers associated with the input
      var hardware = self.controllers.get(inputForHardware.controller);
      hardware.registerInput(inputForHardware);
    };

    registerInputWithPreset(input)
    {
      var self = this;

      var currentPreset = self.presets.get(self.currentPreset);

      //If this preset already exists, just update the preset
      console.log("CURRENT PRESET:", currentPreset);

      if(!self.actions.has(input.action))
      {
        console.error("Action does not exist", input.action);
        return;
      }

      var inputForPreset = {
        name: input.name,
        controller: input.controller,
        type: input.type,
        action: input.action
      };

      currentPreset.registerInput(inputForPreset);
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
        trace("Tried to unregister an undefined input!");
        return;
      }
      log_debug("Unregistering an input:", input, "to preset:", preset);
      
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
      log("Starting gamepad abstraction");
      
      self.assignments = new Map();
      self.cockpit = cockpit;
      self.gamepadHardware = new HTML5Gamepad();
      
      self.currentTime = new Date();

      //Ignore until time
      self.ignoreInputUntil = 0;

      //Bindingsadding
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
        log("Gamepad connected", device);
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.DISCONNECTED, function(device) {
        log("Gamepad disconnected", device);
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.UNSUPPORTED, function(device) {
        trace("Gamepad unsupported", device);
      });


      if(!self.gamepadHardware.init())
      {
        trace("Your browser doesn't support this gamepad");
        return;
      }

    };

  };

  /*Gamepad interface*/
  class Gamepad
  {
    constructor(cockpit)
    {
      log("Starting gamepad interface");
      
      var self = this;
      self.gamepadAbstraction = new GamepadAbstraction(cockpit);
    };

    addInput(input)
    {
      var self = this;
      console.log("ADDING INPUT TO GP:", input);
    };


    registerInput(input)
    {
      var self = this;

      self.gamepadAbstraction.assignments.set(input.name, input.action);
    };

    register(key, actions)
    {
      var self = this;
      if(key == null)
      {
        trace("Tried to register an undefined key with gamepad");
        return;
      }

      log_debug("Registering input:", key, "to gamepad");
      self.gamepadAbstraction.assignments.set(key, actions);
    };

    reset()
    {
      var self = this;

      log_debug("Resetting gamepad");
      self.gamepadAbstraction.assignments.clear();
    };
    
    unregister(key, actions)
    {
      var self = this;
      if(key == null)
      {
        trace("Tried to unregister an undefined key with gamepad");
        return;
      }

      log_debug("Unregistering:", key, "from gamepad");
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
    constructor(cockpit, mousetrap)
    {
      var self = this;
      self.mousetrap = mousetrap;

      log("Started keyboard abstraction");
    };

    
    addInput(input)
    {
      var self = this;
      console.log("ADDING INPUT TO Mousetrap:", input);
    };

    registerInput(input)
    {
      var self = this;

      if(self.mousetrap.modified == undefined) 
      {
        var orgStopCalback = self.mousetrap.prototype.stopCallback;
        self.mousetrap.prototype.stopCallback = function (e, element, combo, sequence) 
        {
          if ((' ' + element.className + ' ').indexOf(' no-mousetrap ') > -1) {
            return true;
          }
          return orgStopCalback.call(this, e, element, combo, sequence);
        };
        self.mousetrap.modified = true;
      }

      if(input.action.up !== undefined)
      {
        Mousetrap.bind(input.name, input.action.up, 'keyup');
      }

      if(input.action.down !== undefined)
      {
        self.mousetrap.bind(input.name, input.action.down, 'keydown');
      }
      
    };

    register(key, actions)
    {
      var self = this;
      if(self.mousetrap.modified == undefined) 
      {
        var orgStopCalback = self.mousetrap.prototype.stopCallback;
        self.mousetrap.prototype.stopCallback = function (e, element, combo, sequence) 
        {
          if ((' ' + element.className + ' ').indexOf(' no-mousetrap ') > -1) {
            return true;
          }
          return orgStopCalback.call(this, e, element, combo, sequence);
        };
        self.mousetrap.modified = true;
      }

      if(key == null)
      {
        trace("Tried to register an undefined key from Mousetrap");
        return;
      }

      log_debug("Registering:", key, "with Mousetrap");

      //Register actions, used for unbinding as well
      if(actions.up !== undefined)
      {
        Mousetrap.bind(key, actions.up, 'keyup');
      }

      if(actions.down !== undefined)
      {
        self.mousetrap.bind(key, actions.down, 'keydown');
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
      self.mousetrap.reset();
    };

    unregister(key, actions)
    {
      var self = this;
      if(key == null)
      {
        trace("Tried to unregister an undefined key from Mousetrap");
        return;
      }

      self.mousetrap.unbind(key, 'keydown');
      self.mousetrap.unbind(key, 'keyup');

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