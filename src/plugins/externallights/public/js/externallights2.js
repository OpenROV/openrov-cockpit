(function (window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.ExternalLights = function (cockpit) {
    var self = this;
    self.cockpit = cockpit;  //self.state    = [ {}, {} ];
  };
  plugins.ExternalLights.prototype.getTelemetryDefinitions = function getTelemetryDefinitions() {
    return [
      {
        name: 'LIGPE0',
        description: 'External Light 0 percent power'
      },
      {
        name: 'LIGPE1',
        description: 'External Light 1 percent power'
      }
    ];
  };
  plugins.ExternalLights.prototype.inputDefaults = function () {
    var cockpit = this.cockpit;
    var self = this;
    return [
      {
        name: 'plugin.externalLights.0.adjust_increment',
        description: 'Makes the ROV lights brighter.',
        defaults: { keyboard: '8' },
        down: function () {
          //cockpit.rov.emit( 'plugin.externalLights.set', 0, self.state[0].level + 1 );
          cockpit.rov.emit('plugin.externalLights.adjust', 0, 1);
        }
      },
      {
        name: 'plugin.externalLights.0.adjust_decrememt',
        description: 'Makes the ROV lights dimmer.',
        defaults: { keyboard: '7' },
        down: function () {
          //cockpit.rov.emit( 'plugin.externalLights.set', 0, self.state[0].level - 1 );
          cockpit.rov.emit('plugin.externalLights.adjust', 0, -1);
        }
      },
      {
        name: 'plugin.externalLights.0.toggle',
        description: 'Toggles the ROV lights on/off.',
        defaults: { keyboard: '6' },
        down: function () {
          cockpit.rov.emit('plugin.externalLights.toggle', 0);
        }
      },
      {
        name: 'plugin.externalLights.1.adjust_increment',
        description: 'Makes the ROV lights brighter.',
        defaults: { keyboard: '-' },
        down: function () {
          //cockpit.rov.emit('plugin.externalLights.set', 1, self.state[1].level + 1 );
          cockpit.rov.emit('plugin.externalLights.adjust', 1, 1);
        }
      },
      {
        name: 'plugin.externalLights.1.adjust_decrememt',
        description: 'Makes the ROV lights dimmer.',
        defaults: { keyboard: '0' },
        down: function () {
          //cockpit.rov.emit('plugin.externalLights.set', 1, self.state[1].level - 1);
          cockpit.rov.emit('plugin.externalLights.adjust', 1, -1);
        }
      },
      {
        name: 'plugin.externalLights.1.toggle',
        description: 'Toggles the ROV lights on/off.',
        defaults: { keyboard: '9' },
        down: function () {
          cockpit.rov.emit('plugin.externalLights.toggle', 1);
        }
      }
    ];
  };
  // This pattern will hook events in the cockpit and pull them all back
  // so that the reference to this instance is available for further processing
  plugins.ExternalLights.prototype.listen = function listen() {
    var self = this;

    self.cockpit.rov.withHistory.on('plugin.externalLights.state', function (lightNum, state)
    {
      self.cockpit.emit('plugin.externalLights.level', lightNum, state.level);  //self.state[ lightNum ]  = state;
    });

    self.cockpit.on('plugin.externalLights.adjust', function (lightNum, value)
    {
      cockpit.rov.emit('plugin.externalLights.adjust', lightNum, value);
    });

    self.cockpit.on('plugin.externalLights.setOnOff', function (lightNum, setOn)
    {
      cockpit.rov.emit('plugin.externalLights.setOnOff', lightNum, setOn);
    });
  };
  window.Cockpit.plugins.push(plugins.ExternalLights);
}(window));
