(function(window) 
{
  'use strict';
  var plugins = namespace('plugins');
  
  console.log( "hey" );
  
  plugins.ExternalLights = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    self.state = [ {}, {} ];
  };

  plugins.ExternalLights.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'LIGPE0', description: 'External Light 0 percent power'},
      {name: 'LIGPE1', description: 'External Light 1 percent power'}
    ]);
    
    console.log( "guys" );
  }

plugins.ExternalLights.prototype.inputDefaults = function ()
{
  var cockpit = this.cockpit;
  var self = this;
  
  console.log( "heyyyyy" );
  
  return [
    // ELIGHT 0
    {
      name: 'plugin.externalLights.0.adjust_increment',
      description: 'Makes the ROV lights brighter.',
      defaults: { keyboard: '6'},
      down: function () {
        console.log( "a" );
        console.log( 0.1+ Number.parseFloat(self.state[0].level) );
        cockpit.rov.emit('plugin.externalLights.set', 0, 0.1+ Number.parseFloat(self.state[0].level));
      }
    },
    {
      name: 'plugin.externalLights.0.adjust_decrememt',
      description: 'Makes the ROV lights dimmer.',
      defaults: { keyboard: '7'},
      down: function () {
        console.log( "b" );
        cockpit.rov.emit('plugin.externalLights.set', 0, -0.1 + Number.parseFloat(self.state[0].level));
      }
    },
    {
      name: 'plugin.externalLights.0.toggle',
      description: 'Toggles the ROV lights on/off.',
      defaults: { keyboard: '8' },
      down: function () {
        console.log( "c" );
        cockpit.rov.emit('plugin.externalLights.toggle', 0);
      }
    },
    
    // ELIGHT 1
    {
      name: 'plugin.externalLights.1.adjust_increment',
      description: 'Makes the ROV lights brighter.',
      defaults: { keyboard: '9'},
      down: function () {
        console.log( "d" );
        console.log( 0.1+ Number.parseFloat(self.state[1].level) );
        cockpit.rov.emit('plugin.externalLights.set', 1, 0.1+ Number.parseFloat(self.state[1].level));
      }
    },
    {
      name: 'plugin.externalLights.1.adjust_decrememt',
      description: 'Makes the ROV lights dimmer.',
      defaults: { keyboard: '0'},

      down: function () {
        console.log( "e" );
        cockpit.rov.emit('plugin.externalLights.set', 1, -0.1 + Number.parseFloat(self.state[1].level));
      }
    },
    {
      name: 'plugin.externalLights.1.toggle',
      description: 'Toggles the ROV lights on/off.',
      defaults: { keyboard: '-' },
      down: function () {
        console.log( "f" );
        cockpit.rov.emit('plugin.externalLights.toggle', 1);
      }
    }
  ]
}

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.ExternalLights.prototype.listen = function listen() 
  {
    var self = this;

      self.cockpit.rov.withHistory.on('plugin.externalLights.state', function(lightNum, state) 
      {
        console.log( "got elight state: " + lightNum + ": " + state.level );
        self.cockpit.emit('plugin.externalLights.level', lightNum, state.level);
        self.state[ lightNum ]  = state;
      });

      self.cockpit.on('plugin.externalLights.set',function(lightNum, value)
      {
          cockpit.rov.emit('plugin.externalLights.set',lightNum, value);
      });

  };

  window.Cockpit.plugins.push(plugins.ExternalLights);

})(window);
