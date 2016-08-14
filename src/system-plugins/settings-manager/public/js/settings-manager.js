(function (window, $, undefined) {
  'use strict';
  var SettingsManager;
  SettingsManager = function SettingsManager(cockpit) {
    console.log('Loading SettingsManager plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.settings = {};
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  SettingsManager.prototype.listen = function listen() {
    var self = this;
    self.cockpit.on('plugin.settings-manager.persist-data', function (data, fn) {
      console.log(data);
      self.rov.emit('plugin.settings-manager.saveSettings', data, fn);
    });
    self.cockpit.on('plugin.settings-manager.getSchemas', function (fn) {
      self.rov.emit('plugin.settings-manager.getSchemas', fn);
    });
    self.cockpit.on('plugin.settings-manager.getSettings', function (module, fn) {
      self.rov.emit('plugin.settings-manager.getSettings', module, fn);
    });
    //Forward all save settings and changes to the cockpit emitter
    self.rov.withHistory.on('settings-change', function (settings) {
      self.cockpit.emit('settings-change', settings);
      for (var item in settings) {
        var result = {};
        result[item] = settings[item];
        self.cockpit.emit('settings-change.' + item, result);
      }
    });
  };
  window.Cockpit.plugins.push(SettingsManager);
}(window, jQuery));