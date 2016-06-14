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

    self.cockpit.on(plugin + '.currentMap.save', function (newMap) {
      self.cockpit.rov.emit('plugin.settings-manager.saveSettings', { inputConfigurator: { currentMap: newMap } })
    });

    self.rov.on('settings-change.inputConfigurator', function (settings) {
      self.loadSettings(settings.inputConfigurator, function(loadedSettings) {
        self.settings = loadedSettings;
        self.cockpit.emit(plugin + '.currentMap.update', loadedSettings.currentMap);
      });

    });

  };

  InputConfigurator.prototype.loadSettings = function (settings, loaded) {
    var self = this;
    var current = settings.currentMap;
    var result = settings;

    self.loadDefaultMapping(function(defaultMap) {
      if (current.length == 1 && current[0] === null) { // the default mapping isn't setup as the current map yet.
        result = { currentMap: defaultMap, maps: [] };
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
