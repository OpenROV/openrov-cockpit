/*jshint multistr: true*/
(function (window, $, undefined) {
  'use strict';
  const plugin = 'plugin.inputConfigurator';

  var InputConfigurator;
  InputConfigurator = function InputConfigurator(cockpit) {
    console.log('Loading InputConfigurator in the browser.');
    this.cockpit = cockpit;
    var self = this;
    self.settings = undefined;

    self.rov = self.cockpit.rov.withHistory;

  };

  InputConfigurator.prototype.listen = function listen() {
    var self = this;

    self.cockpit.on(plugin + '.updateBinding', function(arg, callback) {
      var mapping = self.settings.currentMap.find(function(item) { return item.name == arg.name });
      if (mapping) {
        mapping.bindings = arg.bindings;
        self.cockpit.rov.emit('plugin.settings-manager.saveSettings', { inputConfigurator: self.settings }, callback);

        // apply to inputConfigurator
        self.sendToInputController(mapping);
      }
      // else handle error?
    });

    self.cockpit.on(plugin + '.loadPreset', function(preset, fn) {
      preset.map.forEach(function(item) {
        self.sendToInputController(item);
      });
      self.settings.currentMap = JSON.parse( JSON.stringify(preset.map)); //clone
      self.cockpit.emit(plugin + '.currentMap.update', self.settings.currentMap);
      if (fn) {fn();}
    });

    self.cockpit.on(plugin + '.saveNewPreset', function(presetName, fn){
        self.settings.maps.push({ name: presetName, map: JSON.parse(JSON.stringify(self.settings.currentMap))})
        self.cockpit.emit(plugin + '.presets.update', self.settings.maps);
        self.cockpit.rov.emit('plugin.settings-manager.saveSettings', { inputConfigurator: self.settings }, fn);
    });

    self.rov.on('settings-change.inputConfigurator', function (settings) {
      self.loadSettings(settings.inputConfigurator, function(loadedSettings) {
        self.settings = loadedSettings;
        self.cockpit.emit(plugin + '.currentMap.update', loadedSettings.currentMap);
        self.cockpit.emit(plugin + '.presets.update', loadedSettings.maps);

        //load mapping into input controller
        loadedSettings.currentMap.forEach(function(item) {
          self.sendToInputController(item);
        });
      });
    });
  };

  InputConfigurator.prototype.sendToInputController = function (mapping) {
    var self = this;
    var control = { name: mapping.name, bindings: {}};
    mapping.bindings.forEach(function(aBinding) { control.bindings[aBinding.name] = aBinding.binding })
    self.cockpit.emit('InputController.updateBinding', control, function() {  console.log('done');  });
  };

  InputConfigurator.prototype.loadSettings = function (settings, loaded) {
    var self = this;
    var current = settings.currentMap;
    var result = settings;

    self.loadDefaultMapping(function(defaultMap) {
      if (current.length == 1 && current[0] === null) { // the default mapping isn't setup as the current map yet.
        result = { 
          currentMap: defaultMap, 
          maps: [
            { 
              name: 'OpenROV Default',
              default: true,
              map: JSON.parse(JSON.stringify(defaultMap)) 
            }
          ]
        };
        self.cockpit.rov.emit('plugin.settings-manager.saveSettings', { inputConfigurator: result });
      }
      else {
        result = settings;
        result.currentMap.forEach(function(mapping) {
          var defaultItem = defaultMap.find(function(item) {
            return mapping.name == item.name;
          });
          if (defaultItem) { 
            mapping.description = defaultItem.description;
            mapping.defaults = defaultItem.defaults; 
          } // copy description and defaults
        });
      }
      loaded(result);
    });
  };

  InputConfigurator.prototype.loadDefaultMapping = function (callback) {
    var self = this;
    self.cockpit.emit('InputController.getCommands', function (commands) {
      var currentMap = commands.map(function (command) {
        var result = { name: command.name, bindings: [], description: command.description, defaults: command.defaults };
        for (var bindingName in command.bindings) {
          result.bindings.push({ name: bindingName, binding: command.bindings[bindingName] });
        }
        return result;
      });
      callback(currentMap);
    });

  }

  window.Cockpit.plugins.push(InputConfigurator);
} (window, jQuery));
