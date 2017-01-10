/*jshint multistr: true*/
(function(window, document) 
{
  'use strict';

  //Necessary for debug utils
  var log;
  var trace;
  var log_debug;
  $.getScript('components/visionmedia-debug/dist/debug.js', function() {
    log = debug('input-controller:log');
    trace = debug('input-controller:trace');
    log_debug = debug('input-controller:debug');
  });

  var inputConfigurator = namespace('plugin.inputConfigurator');
  inputConfigurator.InputConfigurator = class InputConfigurator
  {
    constructor(cockpit)
    {
      this.cockpit = cockpit;

      var self = this;
      
      self.settings = {
        presets: []
      };

      self.savedPresets = [];
      self.defaultPresetName = "defaults";

      self.rov = self.cockpit.rov.withHistory;
      self.isSavingSettings = false;
      self.checkForLastPreset = true;
    };


    listen()
    {
      var self = this;

      self.cockpit.rov.emit('plugin.inputController.requestCustomPresets', {data: "value"});

      //Listen for server setting changes
      this.rov.on('settings-change.inputConfigurator', function(settings) {
        if(!self.isSavingSettings)
        {
          self.settings = settings.inputConfigurator;
          if (self.settings.presets==undefined){
            self.settings.presets=[];
          }

          //Update the saved preset name lists
          self.updateSavedPresetList();
        }
      });

      this.cockpit.on('plugin.inputConfigurator.deletePreset', function(presetToDelete) {
        self.deletePreset(presetToDelete);
      });

      this.cockpit.withHistory.on('plugin.inputConfigurator.savePreset', function(presetIn) {
        self.savePreset(presetIn);
      });
      
      this.cockpit.rov.withHistory.on('plugin.inputConfigurator.existingPresets', function(presetIn) {
        
        self.savePreset(presetIn);
      });
      
      this.cockpit.on('plugin.inputConfigurator.loadPreset', function(presetNameIn) {
        self.loadPreset(presetNameIn);
      });

      this.cockpit.on('plugin.inputConfigurator.getSavedPresets', function() {
        self.updateSavedPresetList();
      });

    };

    copyPreset(presetIn)
    {
        var self = this;

        var returnPreset = {
            name: presetIn.name,
            actions: new Map(),
        };
        
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
    //Class methods
    deletePreset(presetToDelete)
    {
      var self = this;

      //Remove this preset, if found
      for(var i = 0; i < self.settings.presets.length; ++i)
      {
        //Get the object
        var preset = self.settings.presets[i];

        if(preset.name == presetToDelete)
        {
          self.settings.presets.splice(i, 1);
          break;
        }
      }
      
      //Update the server settings to reflect this new preset
      self.cockpit.rov.emit('plugin.settings-manager.saveSettings', {inputConfigurator: self.settings});
    }
    loadPreset(presetNameIn)
    {
      var self = this;
      //Search the settings for the preset requested
      var result = $.grep(self.settings.presets, function(preset){ 
        return preset.name == presetNameIn; 
      });

      if(result.length == 0)
      {
        //No preset found with that name found. Don't load
        return;
      }
      else if(result.length == 1)
      {

        var presetOut = result[0];
        self.cockpit.emit('plugin.inputConfigurator.loadedPreset', presetOut);

        //They loaded a preset, set the lastPreset to this name
        self.settings.lastPreset = presetNameIn;

        //Update the server settings to reflect this new preset
        self.cockpit.rov.emit('plugin.settings-manager.saveSettings', {inputConfigurator: self.settings});
      }
      else
      {
        return;
      }
    };
    savePreset(presetIn)
    {
      var self = this;
    
      //Add this preset to our settings object
      var presetName = presetIn.name;
      
      //Remove this preset, if found
        for(var i = 0; i < self.settings.presets.length; ++i)
        {
          //Get the object
          var tmpPreset = self.settings.presets[i];
          if(tmpPreset.name == presetName)
          {
            self.settings.presets.splice(i, 1);
            break;
          }
        }

      //Add the preset
      self.settings.presets.push(presetIn);
      self.settings.lastPreset = presetIn.name;

      //Update the server settings to reflect this new preset
      self.cockpit.rov.emit('plugin.settings-manager.saveSettings', {inputConfigurator: self.settings});
    }

    updateSavedPresetList()
    {
      var self = this;
      
      //Clear the array
      self.savedPresets.length = 0;

      //Update the saved preset name lists
        for(var i = 0; i < self.settings.presets.length; ++i)
        {
          var preset = self.settings.presets[i];
          self.savedPresets.push(preset.name);
        }
      
      self.cockpit.emit('plugin.inputConfigurator.savedPresets', self.savedPresets);
    }
  };

  
  window.Cockpit.plugins.push(inputConfigurator.InputConfigurator);
}(window, document)); 
