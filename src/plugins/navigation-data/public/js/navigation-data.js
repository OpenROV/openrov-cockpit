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
        name: 'depth_d',
        description: 'Depth in meters'
      },
      {
        name: 'imu_p',
        description: 'Pitch in degrees -180 to 180'
      },
      {
        name: 'imu_r',
        description: 'Roll in degrees -90 to 90'
      },
      {
        name: 'imu_y',
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