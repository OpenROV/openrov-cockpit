(function(window) {
  'use strict';
  
  var plugins = namespace('plugins');
  
  plugins.GPS = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;

  };

  plugins.GPS.prototype.inputDefaults = function inputDefaults() {
    return [
    //   // lights increment
    //   {
    //     name: 'plugin.lights.adjust_increment',
    //     description: 'Makes the ROV lights brighter.',
    //     defaults: { keyboard: 'p', gamepad: 'DPAD_UP' },
    //     down: function () {
    //       cockpit.rov.emit('plugin.lights.adjust', 0.1);
    //     }
    //   }
    ]

  };

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.GPS.prototype.listen = function listen() {
    var self = this;

    self.cockpit.rov.on('plugin.gps.TPV', function(data) {
		console.log( data );
      self.cockpit.emit('plugin.gps.TPV',data);
    });

  };

  window.Cockpit.plugins.push(plugins.GPS);

})(window);
