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

(function (window, document) {
  var log,trace,log_debug;
  $.getScript('components/visionmedia-debug/dist/debug.js', function () {  
    log = debug('input-controlller:log');
    trace = debug('input-controlller:trace') 
    log_debug = debug('input-controlller:debug')   
  });

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
      this.currentPresetName = "Defaults";
      this.currentPreset = new inputController.Preset(this.currentPresetName);

      this.presets.set(this.currentPresetName, this.currentPreset);

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
        
        //Add our default keyboard controllers
        self.keyboard = new Keyboard(cockpit, self.mousetrap);
        self.controllers.set("keyboard", self.keyboard);

        self.gamepad = new Gamepad(cockpit);
        self.controllers.set("gamepad", self.gamepad);
        
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
                action: input.action,
                input: {
                  name: inputName,
                  controller: controllerName,
                  type: input.type
                }
              };

              //Add this action
              self.currentPreset.addAction(input.action);

              self.registerInput(inputToRegister);
            }
          }
        }
      });

      this.cockpit.on('plugin.inputController.sendPreset', function() {

        if(self.currentPreset !== undefined)
        {
          self.cockpit.emit('plugin.inputController.updatedPreset', self.currentPreset, self.actions);
        }
        
      });

      this.cockpit.on('plugin.inputController.resetControllers', function() {
        self.resetControllers();
      });

      this.cockpit.on('plugin.inputController.updateInput', function(input) {

        //Try to update that input
        self.updateInput(input);
      });

      this.cockpit.on('plugin.inputController.unregisterInput', function(input) {

        //Try to update that input
        self.unregisterInput(input);
      });

    };



    updateInput(input)
    {
      var self = this;

      if(input == null)
      {
        trace("Tried to update a null input");
        return;
      }

      self.updateInputWithHardware(input);
      self.updateInputWithPreset(input);

      //Let everyone know we just updated
      self.cockpit.emit('plugin.inputController.updatedPreset', self.currentPreset, self.actions);
    };
    
    updateInputWithHardware(inputIn)
    {
      var self = this;

           
      //Grab the input object from the passed object
      var newInput = inputIn.input;

      //Grab a handle to the hardware controller associated with this input
      var hardware = self.controllers.get(newInput.controller);
      
      //The action we are interested in updating
      var oldPreset = self.currentPreset.actions.get(inputIn.action);

      //If this controller is registered with this controller, proceed with hardware update
      if(oldPreset.has(newInput.controller))
      {
        var previousInput = {
          action: inputIn.action,
          input: oldPreset.get(newInput.controller)
        };

        var action = self.actions.get(inputIn.action).controls[newInput.type];
        hardware.updateInput(previousInput, inputIn, action);
      }
      else
      {
        var inputToRegister = {
          action: inputIn.action,
          input: newInput
        };

        self.registerInput(inputToRegister);
      }
 
    };

    updateInputWithPreset(inputIn)
    {
      var self = this;


      //Grab the input object from the passed object      
      var newInput = inputIn.input;
      
      self.currentPreset.updateInput(inputIn.action, newInput);
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
      self.cockpit.emit('plugin.inputController.updatedPreset', self.currentPreset, self.actions);
    };

    registerInputWithHardware(inputIn)
    {
      var self = this;

      var input = inputIn.input;
      var hardware = self.controllers.get(input.controller);

      var inputForHardware = {
        action: self.actions.get(inputIn.action).controls[input.type],
        input: input
      };

      hardware.registerInput(inputForHardware);
    };

    registerInputWithPreset(inputIn)
    {
      var self = this;

      //If this preset already exists, just update the preset
      if(!self.actions.has(inputIn.action))
      {
        console.error("Action does not exist", input.action);
        return;
      }

      var input = inputIn.input;
      self.currentPreset.registerInput(inputIn.action, input);
    };

    resetControllers()
    {
      var self = this;
      
      self.controllers.forEach(function(controller) {
        controller.reset();
      });
    };

    unregisterInput(input)
    {
      var self = this;

      if(input == null)
      {
        trace("Tried to update a null input");
        return;
      }

      //Unregister with current preset
      self.unregisterInputWithPreset(input);

      //And with hardware
      self.unregisterInputWithHardware(input);
      
      //Let everyone know we just updated
      self.cockpit.emit('plugin.inputController.updatedPreset', self.currentPreset, self.actions);
    };
    
    unregisterInputWithHardware(inputIn)
    {
      var self = this;

      var input = inputIn.input;
      var hardware = self.controllers.get(input.controller);
      
      hardware.unregisterInput(input);
    };
    
    unregisterInputWithPreset(inputIn)
    {
      var self = this;
      
      var currentPreset = self.presets.get(self.currentPreset);
      var input = inputIn.input;

      var inputToUnregister = {
        name: input.name,
        controller: input.controller,
        type: input.type
      };

      self.currentPreset.unregisterInput(inputIn.action, inputToUnregister);
    };
  };

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
          if(typeof assignment.update == 'function')
          {
            assignment.update(e.value);
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


    registerInput(inputIn)
    {
      var self = this;

      var input = inputIn.input;

      self.gamepadAbstraction.assignments.set(input.name, inputIn.action);
    };

    reset()
    {
      var self = this;

      log_debug("Resetting gamepad");
      self.gamepadAbstraction.assignments.clear();
    };
    
    unregisterInput(inputIn)
    {
      var self = this;

      if(inputIn == null)
      {
        trace("Tried to unregister an undefined key with gamepad");
        return;
      }

      log_debug("Unregistering:", inputIn.name, "from gamepad");
      self.gamepadAbstraction.assignments.delete(inputIn.name);
    };
    
    updateInput(previousInput, newInput, action)
    {
      var self = this;

      //If there was a previous input, unregister
      if(previousInput !== null)
      {
        self.unregisterInput(previousInput);
      }

      //Register the new input
      var inputToRegister = {
        action: action,
        input: newInput.input
      };

      self.registerInput(inputToRegister);     
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

    registerInput(inputIn)
    {
      var self = this;

      var input = inputIn.input;
      var action = inputIn.action;
      
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

      if(action.up !== undefined)
      {
        Mousetrap.bind(input.name, action.up, 'keyup');
      }

      if(action.down !== undefined)
      {
        self.mousetrap.bind(input.name, action.down, 'keydown');
      }
      
    };

    reset()
    {
      console.log("Resetting keyboard interface");
      self.mousetrap.reset();
    };

    unregisterInput(inputIn)
    {
      var self = this;

      if(inputIn == null)
      {
        trace("Tried to unregister an undefined key from Mousetrap");
        return;
      }

      self.mousetrap.unbind(inputIn.name, 'keydown');
      self.mousetrap.unbind(inputIn.name, 'keyup');
    };


    updateInput(previousInput, newInput, action)
    {
      var self = this;

      //If there was a previous input, unregister
      if(previousInput !== null)
      {
        self.unregisterInput(previousInput.input);
      }

      var inputToRegister = {
        action: action,
        input: newInput.input
      };

      self.registerInput(inputToRegister);     
    };

  };

  window.Cockpit.plugins.push(inputController.InputController);
}(window, document));