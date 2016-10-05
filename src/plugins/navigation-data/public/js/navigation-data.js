(function (window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.NavigatoinData = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;
  };
  plugins.NavigatoinData.prototype.getTelemetryDefinitions = function getTelemetryDefinitions() {
    return [
      {
        name: 'hdgd',
        description: 'Heading in degrees 0 to 360'
      },
      {
        name: 'deep',
        description: 'Depth in meters'
      },
      {
        name: 'pitc',
        description: 'Pitch in degrees -180 to 180'
      },
      {
        name: 'roll',
        description: 'Roll in degrees -90 to 90'
      },
      {
        name: 'yaw',
        description: 'Heading in degrees -180 to 180'
      },
      {
        name: 'fthr',
        description: 'Forward thrust power in percent of total thrust'
      }
    ];
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.NavigatoinData.prototype.listen = function listen() {
    var self = this;
    this.cockpit.rov.withHistory.on('plugin.navigationData.data', function (navdata) {
      self.cockpit.emit('plugin.navigationData.data', navdata);
    });
  };
  window.Cockpit.plugins.push(plugins.NavigatoinData);
}(window));