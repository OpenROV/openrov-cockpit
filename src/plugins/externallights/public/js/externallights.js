(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.ExternalLights = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    this.state = {};
  };

  plugins.ExternalLights.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'LIGPE', description: 'External Light percent power'}
    ]);
  }

plugins.ExternalLights.prototype.inputDefaults = function (){
  var cockpit = this.cockpit;
  var self = this;
  return [
    // lights increment
    {
      name: 'plugin.externalLights.adjust_increment',
      description: 'Makes the ROV lights brighter.',
      defaults: { keyboard: '6 ='},
      down: function () {
        cockpit.rov.emit('plugin.externalLights.set', 0.1+ Number.parseFloat(self.state.level));
      }
    },

    // lights decrement
    {
      name: 'plugin.externalLights.adjust_decrememt',
      description: 'Makes the ROV lights dimmer.',
      defaults: { keyboard: '6 -'},

      down: function () {
        cockpit.rov.emit('plugin.externalLights.set', -0.1 + Number.parseFloat(self.state.level));
      }
    },

    // lights toggle
    {
      name: 'plugin.externalLights.toggle',
      description: 'Toggles the ROV lights on/off.',
      defaults: { keyboard: '6 0' },
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

      self.cockpit.rov.withHistory.on('plugin.externalLights.state', function(state) {
        self.cockpit.emit('plugin.externalLights.level',state.level);
        self.state = state;
      });

      self.cockpit.on('plugin.externalLights.set',function(value){
          cockpit.rov.emit('plugin.externalLights.set',value);
      });

  };

  window.Cockpit.plugins.push(plugins.ExternalLights);

})(window);
