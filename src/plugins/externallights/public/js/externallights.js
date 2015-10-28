(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.ExternalLights = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;

  };

  plugins.ExternalLights.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'LIGPE', description: 'External Light percent power'}
    ]);
  }

plugins.ExternalLights.prototype.inputDefaults = function (){
  var cockpit = this.cockpit;
  return [
    // lights increment
    {
      name: 'plugin.externalLights.adjust_increment',
      description: 'Makes the ROV lights brighter.',
      defaults: { keyboard: ''},
      down: function () {
        cockpit.rov.emit('plugin.externalLights.adjust', 0.1);
      }
    },

    // lights decrement
    {
      name: 'plugin.externalLights.adjust_increment',
      description: 'Makes the ROV lights dimmer.',
      defaults: { keyboard: ''},

      down: function () {
        cockpit.rov.emit('plugin.externalLights.adjust', -0.1);
      }
    },

    // lights toggle
    {
      name: 'plugin.externalLights.toggle',
      description: 'Toggles the ROV lights on/off.',
      defaults: { keyboard: '6' },
      down: function () {
        cockpit.rov.emit('plugin.externalLights.toggle');
      }
    }

  ]
}

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.ExternalLights.prototype.listen = function listen() {
    var self = this;

      self.cockpit.rov.withHistory.on('plugin.externalLights.level', function(level) {
        self.cockpit.emit('plugin.externalLights.level',level);
      });

  };

  window.Cockpit.plugins.push(plugins.ExternalLights);

})(window);
