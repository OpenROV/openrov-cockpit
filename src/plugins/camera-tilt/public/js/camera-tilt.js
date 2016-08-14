(function (window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.CameraTilt = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;
    console.log('CameraTilt Plugin running');
    this.inputDefaults = [
      {
        name: 'plugin.cameraTilt.adjust_down',
        description: 'Point the camera further down.',
        defaults: {
          keyboard: 'z',
          gamepad: 'A'
        },
        down: function () {
          cockpit.rov.emit('plugin.cameraTilt.adjust', -0.1);
        }
      },
      {
        name: 'plugin.cameraTilt.adjust_centre',
        description: 'Point the camera straight ahead.',
        defaults: {
          keyboard: 'a',
          gamepad: 'B'
        },
        down: function () {
          cockpit.rov.emit('plugin.cameraTilt.set', 0);
        }
      },
      {
        name: 'plugin.cameraTilt.adjust_up',
        description: 'Point the camera further up.',
        defaults: {
          keyboard: 'q',
          gamepad: 'Y'
        },
        down: function () {
          cockpit.rov.emit('plugin.cameraTilt.adjust', 0.1);
        }
      }
    ];
  };
  plugins.CameraTilt.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return [
      {
        name: 'servo',
        description: 'Camera tilt reported in microseconds'
      },
      {
        name: 'starg',
        description: 'Target camera tilt reported in microseconds'
      }
    ];
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.CameraTilt.prototype.listen = function listen() {
    var self = this;
    this.cockpit.rov.withHistory.on('plugin.cameraTilt.angle', function (angle) {
      self.cockpit.emit('plugin.cameraTilt.angle', angle);
    });
  };
  window.Cockpit.plugins.push(plugins.CameraTilt);
}(window));