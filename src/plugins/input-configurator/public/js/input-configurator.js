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

      //Listen for server setting changes
      this.rov.on('settings-change.inputConfigurator', function(settings) {
        if(!self.isSavingSettings)
        {
          self.settings = settings.inputConfigurator;

          //Update the saved preset name lists
          self.updateSavedPresetList();

          if(self.checkForLastPreset)
          {
            var lastPresetName = JSON.parse(self.settings.lastPreset, 'utf8');

            if(lastPresetName !== undefined && lastPresetName !== self.defaultPresetName)
            {
              //Load the last preset 
              self.loadPreset(lastPresetName);
            }
            self.checkForLastPreset = false;
          }
        }
      });

      this.cockpit.on('plugin.inputConfigurator.deletePreset', function(presetToDelete) {
        //console.log("Delete:", presetToDelete);
        self.deletePreset(presetToDelete);
      });

      this.cockpit.on('plugin.inputConfigurator.savePreset', function(presetIn) {
        console.log("Saving preset to settings");
        self.savePreset(presetIn);
      });
      
      this.cockpit.on('plugin.inputConfigurator.loadPreset', function(presetNameIn) {
        console.log("Loading preset", presetNameIn);
        self.loadPreset(presetNameIn);
      });

      this.cockpit.on('plugin.inputConfigurator.getSavedPresets', function() {
        console.log("Getting saved presets");
        self.updateSavedPresetList();
      });
    }

    //Class methods
    deletePreset(presetToDelete)
    {
      var self = this;

      //Remove this preset, if found
      for(var i = 0; i < self.settings.presets.length; ++i)
      {
        //Get the object
        var preset = JSON.parse(self.settings.presets[i], 'utf8');

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
        //Convert to Object
        preset = JSON.parse(preset, 'utf8');
        return preset.name == presetNameIn; 
      });

      if(result.length == 0)
      {
        console.error("There is no preset in the settings:", presetNameIn);
        return;
      }
      else if(result.length == 1)
      {
        console.log("Got preset from settings.", presetNameIn);

        var presetOut = JSON.parse(result[0], 'utf8');
        self.cockpit.emit('plugin.inputConfigurator.loadedPreset', presetOut);
      }
      else
      {
        console.error("Multiple presets with this name found:", presetNameIn);
        return;
      }
    };

    savePreset(presetIn)
    {
      var self = this;
      //The preset we want to save to the settings manager
      var presetToSave = JSON.stringify(presetIn, null, 2);

      //Add this preset to our settings object
      var presetName = presetIn.name;
      
      //Remove this preset, if found
      for(var i = 0; i < self.settings.presets.length; ++i)
      {
        //Get the object
        var preset = JSON.parse(self.settings.presets[i], 'utf8');

        if(preset.name == presetName)
        {
          self.settings.presets.splice(i, 1);
          break;
        }
      }

      //Add the preset
      self.settings.presets.push(presetToSave);

      var lastPreset = presetIn.name;
        
      self.settings.lastPreset = JSON.stringify(lastPreset,null,2);

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
        var preset = JSON.parse(self.settings.presets[i], 'utf8');
        self.savedPresets.push(preset.name);
      }

      console.log("Preset names:", self.savedPresets);
      self.cockpit.emit('plugin.inputConfigurator.savedPresets', self.savedPresets);
    }
  };

  
  window.Cockpit.plugins.push(inputConfigurator.InputConfigurator);
}(window, document)); 
