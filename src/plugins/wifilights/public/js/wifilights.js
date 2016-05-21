(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.wifiLights = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;

  };

  plugins.wifiLights.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([{name: 'WLIGP', description: 'WiFi lights percent of power'}]);
  }

  plugins.wifiLights.prototype.inputDefaults = function inputDefaults() {
    return [
      // lights increment
      {
        name: 'plugin.wifilights.adjust_increment',
        description: 'Makes the ROV lights brighter.',
        defaults: { keyboard: 'e', gamepad: 'DPAD_UP' },//gamepad button needs to be changed
        down: function () {
          cockpit.rov.emit('plugin.wifilights.adjust', 0.1);
        }
      },

      // lights decrement
      {
        name: 'plugin.wifilights.adjust_increment',
        description: 'Makes the ROV lights dimmer.',
        defaults: { keyboard: 'd', gamepad: 'DPAD_DOWN' },//gamepad button needs to be changed

        down: function () {
          cockpit.rov.emit('plugin.wifilights.adjust', -0.1);
        }
      },

      // lights ON
      {
        name: 'plugin.wifilights.set',
        description: 'WiFi lights on.',
        defaults: { keyboard: 'w' },
        down: function () {
          cockpit.rov.emit('plugin.wifilights.set',1);
        }
      },

      // lights OFF
      {
        name: 'plugin.wifilights.set',
        description: 'WiFi lights off.',
        defaults: { keyboard: 's' },
        down: function () {
          cockpit.rov.emit('plugin.wifilights.set',0);
        }
      },
      
    ]

  };

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.wifiLights.prototype.listen = function listen() {
    var self = this;

    self.cockpit.rov.withHistory.on('plugin.wifilights.state', function(state) {
      self.cockpit.emit('plugin.wifilights.state',state);
    });

    self.cockpit.on('plugin.wifilights.set',function(value){
        self.cockpit.rov.emit('plugin.wifilights.set',value);
    });

  };

  window.Cockpit.plugins.push(plugins.wifiLights);

})(window);
