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
      this.currentPresetName = "defaults";
      this.currentPreset = new inputController.Preset(this.currentPresetName);
      
      this.presets.set(this.currentPresetName, this.currentPreset);

      this.needToSaveDefaults = true;
      this.checkForLastPreset = true;
      this.defaultPresetName = "defaults";
      this.inputConfiguratorSettings = {};
      this.rovPilotSettings = {};

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

      //Listen for server setting changes
      this.cockpit.rov.on('settings-change.inputConfigurator', function(settings) {
          self.inputConfiguratorSettings = settings.inputConfigurator;
          if(self.checkForLastPreset)
          {
            var lastPresetName = self.inputConfiguratorSettings.lastPreset;
            if(lastPresetName !== undefined && lastPresetName !== self.defaultPresetName)
            {
              //Load the last preset 
              self.cockpit.emit('plugin.inputConfigurator.loadPreset', lastPresetName);
            }
            self.checkForLastPreset = false;
          }
      });
      this.cockpit.rov.on('settings-change.rovPilot', function(settings) {
          self.rovPilotSettings = settings.rovPilot;
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

      this.cockpit.on('plugin.inputConfigurator.deletePreset', function(preset) {

        //Try to remove that preset from the list
        self.deletePreset(preset);
      });

      this.cockpit.on('plugin.inputConfigurator.loadedPreset', function(loadedPreset) {

        //Try to update that input
        self.handleLoadedPreset(loadedPreset);
      });


      this.cockpit.on('plugin.inputConfigurator.savePreset', function(presetToSave) {

        //Try to update that input
        self.handleSavePreset(presetToSave);
      });

      self.saveDefaults();

    };

    saveDefaults()
    {
      var self = this;

      //Work around for JSON.stringify not working on startup
      setTimeout( function() {
        var defaultPreset = self.presets.get("defaults");
        defaultPreset = self.convertToObject(defaultPreset);
        self.cockpit.emit('plugin.inputConfigurator.savePreset', defaultPreset);  
      }, 2500);
    };

    convertToObject(presetIn)
    {
      var self = this;
      var returnPreset = {
          name: presetIn.name,
          actions: new Map()
      };
      
      //Iterate through actions
      presetIn.actions.forEach(function(action, actionName) {
          var actionToAdd = new Map();

          action.forEach(function(input, controllerName) {
            actionToAdd.set(controllerName, input);  
          });
          returnPreset.actions.set(actionName, actionToAdd);
      });
      return returnPreset;
    };

    convertToPreset(presetIn)
    {
      var self = this;

      var returnPreset = new inputController.Preset(presetIn.name);

      //Iterate through actions
      presetIn.actions.forEach(function(action, actionName) {
        var actionToAdd = new Map();

        action.forEach(function(input, controllerName) {
          actionToAdd.set(controllerName, jQuery.extend({}, input));  
        });

        returnPreset.actions.set(actionName, actionToAdd);
      });
      return returnPreset;
    };

    deletePreset(preset)
    {
      var self = this;
      self.presets.delete(preset.name);

      if(preset == self.currentPresetName && preset !== "defaults")
      {
        self.cockpit.emit('plugin.inputConfigurator.loadPreset', "defaults");
      }
    };

    handleLoadedPreset(presetIn)
    {
      var self = this;

      self.deletePreset(presetIn.name);

      self.addPreset(presetIn);
    };

    handleChangePreset(presetName)
    {
      var self = this;

      //Grab a handle to our preset
      var preset = self.presets.get(presetName);
      
      //Unregister the old preset
      self.unregisterPresetWithHardware(self.currentPreset);

      //And update to the new one
      self.registerPresetWithHardware(preset);

      self.currentPreset = preset;
      self.currentPresetName = preset.name;
      self.cockpit.emit('plugin.inputController.updatedPreset', self.currentPreset, self.actions);
    };

    handleSavePreset(presetToSave)
    {
      var self = this;

      if(presetToSave.name !== "defaults")
      {
        var presetToSave = self.convertToPreset(presetToSave);

        self.presets.set(presetToSave.name, presetToSave);
        self.handleChangePreset(presetToSave.name);
      }
    };

    registerPresetWithHardware(preset)
    {
      var self = this;

      preset.actions.forEach(function(action, actionName) {
        action.forEach(function(inputIn){
          var inputToRegister = {
            action: actionName,
            input: inputIn
          };
          self.registerInputWithHardware(inputToRegister);
        })
      });
    };
    
    unregisterPresetWithHardware(preset)
    {
      var self = this;

      preset.actions.forEach(function(action, actionName) {
        action.forEach(function(inputIn){
          var inputToRegister = {
            action: actionName,
            input: inputIn
          };
          self.unregisterInputWithHardware(inputToRegister);
        })
      });

    };
    addPreset(presetIn)
    {
      var self = this;

      var newPreset = new inputController.Preset(presetIn.name);

      //Use the default list to init
      self.presets.get("defaults").actions.forEach(function(action, actionName) {
        newPreset.addAction(actionName);
      });

      for(var actionName in presetIn.actions)
      {
        var action = presetIn.actions[actionName];
        
        for(var controllerName in action[1])
        {
          var controller = action[1][controllerName];
          var actionToRegister = action[0];
          var inputToRegister = controller[1];

          newPreset.registerInput(actionToRegister, inputToRegister);
        }
      }

      //Add it to our internal Map
      self.presets.set(newPreset.name, newPreset);
      self.handleChangePreset(newPreset.name);
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
      var action = self.actions.get(inputIn.action).controls[input.type];


      var hardware = self.controllers.get(input.controller);
      
      //Check for inversions
      if(self.rovPilotSettings.inversions !== undefined && input.type == "axis")
      {
        action.update = self.wrapInInversionCheck(inputIn, action.update);
        action.update = self.wrapInExponentialStickCheck(inputIn, action.update);
      }


      var inputForHardware = {
        action: action,
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

    isInputInverted(inputIn)
    {
      var self = this;
      return self.rovPilotSettings.inversions[inputIn.input.name];
    };

    exponentialSticksEnabled(inputIn)
    {
      var self = this;
      return self.rovPilotSettings.exponentialSticks[inputIn.input.name].enabled;
    };

    getExponentialRate(inputIn)
    {
      var self = this;
      return self.rovPilotSettings.exponentialSticks[inputIn.input.name].rate;
    }
    wrapInInversionCheck(inputIn, update)
    {
      var self = this;

      //Check for inversion setting
      return function(value) {
        if(self.isInputInverted(inputIn))
        {
          value = -1 * value;
        }
        return update(value);
      }
    };
    wrapInExponentialStickCheck(inputIn, update)
    {
      var self = this;
      
      //Check for exp sticks
      return function(value)
      {
        if(self.exponentialSticksEnabled(inputIn))
        {
          var s = Math.sign(value);
          value = Math.pow(value, self.getExponentialRate(inputIn));
          if(Math.sign(value) !== s)
          {
            value = value * s;
          }
        }
        return value;
      }
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
          if(typeof assignment.action.update == 'function')
          {
            assignment.action.update(e.value);
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_DOWN, function(e) {
        var control = e.control;
        
        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button.action.down == 'function')
          {
            button.action.down();
          }
        }
      });

      self.gamepadHardware.bind(HTML5Gamepad.Event.BUTTON_UP, function(e) {
        var control = e.control;

        if(self.assignments.has(control))
        {
          var button = self.assignments.get(control);
          if(typeof button.action.up == 'function')
          {
            button.action.up();
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

    registerInput(inputIn)
    {
      var self = this;

      var input = inputIn.input;
      var inputToRegister = {
        action: inputIn.action
      };

      self.gamepadAbstraction.assignments.set(input.name, inputToRegister);
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