class Thrusters2X1
{
  constructor( name, deps )
  {
    deps.logger.debug( 'The Thrusters 2x1 plugin.' );

    this.cockpit  = deps.cockpit;
    this.global   = deps.globalEventLoop;
    this.deps     = deps;
  }

  start()
  {
    var self = this;

    self.global.withHistory.on( 'settings-change.thrusters2x1', ( data ) =>
    {
      var settings  = data.thrusters2x1;

      // Get motor modifier settings
      var port      = settings.port['forward-modifier'];
      var vertical  = settings.vertical['forward-modifier'];
      var starbord  = settings.starboard['forward-modifier'];

      var nport     = settings.port['reverse-modifier'];
      var nvertical = settings.vertical['reverse-modifier'];
      var nstarbord = settings.starboard['reverse-modifier'];

      // Handle reversals
      if( settings.port.reversed ) 
      {
        port = port * -1;
        nport = nport * -1;
      }

      if( settings.vertical.reversed ) 
      {
        vertical = vertical * -1;
        nvertical = nvertical * -1;
      }

      if( settings.starboard.reversed ) 
      {
        starbord = starbord * -1;
        nstarbord = nstarbord * -1;
      }

      // Send motor mods to the rov
      var command = 'mtrmod1(' + port * 100 + ',' + vertical * 100 + ',' + starbord * 100 + ')';
      self.deps.globalEventLoop.emit('mcu.SendCommand', command);

      var command = 'mtrmod2(' + nport * 100 + ',' + nvertical * 100 + ',' + nstarbord * 100 + ')';
      self.deps.globalEventLoop.emit('mcu.SendCommand', command);
    });

    self.cockpit.on('plugin.thrusters2x1.motorTest', (positions) =>
    {
      self.deps.globalEventLoop.emit('mcu.SendMotorTest', positions.port, positions.starboard, positions.vertical );
    });
  }

  getSettingSchema()
  {
    return [{
        'title': 'Thrusters',
        'description' : 'Settings for thrusters in a 2X1 (2 Port/Starboard lateral X 1 Vertical)',
        'category': 'hardware',
        'id': 'thrusters2x1',
        'type': 'object',
        'properties': {
          'motor-response-delay-ms': {
            'type': 'number',
            'title': 'Motor response delay (ms)',
            'description' : 'Response delay will smooth out thruster accelerations over time which prevents large current spikes.',
            'minimum': 0,
            'maximum': 100,
            'default': 0
          },
          'port': {
            'title:': 'Port Motor',
            'type': 'object',
            'properties': {
              'reversed': {
                'type': 'boolean',
                'format': 'checkbox',
                'default': false
              },
              'forward-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',
                'type': 'number',
                'default': 1
              },
              'reverse-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',              
                'type': 'number',
                'default': 2
              }
            }
          },
          'vertical': {
            'title:': 'Port Motor',
            'type': 'object',
            'properties': {
              'reversed': {
                'type': 'boolean',
                'format': 'checkbox',
                'default': false
              },
              'forward-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',              
                'type': 'number',
                'default': 1
              },
              'reverse-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',              
                'type': 'number',
                'default': 2
              }
            }
          },
          'starboard': {
            'title:': 'Port Motor',
            'type': 'object',
            'properties': {
              'reversed': {
                'type': 'boolean',
                'format': 'checkbox',
                'default': false
              },
              'forward-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',              
                'type': 'number',
                'default': 1
              },
              'reverse-modifier': {
                'description' : 'Used to adjust the power sent to the motor so that thrusters provide equal thrust',              
                'type': 'number',
                'default': 2
              }
            }
          }
        }
      }];
  };
}

//Expose either a function or object for require
module.exports = function (name, deps) 
{
  return new Thrusters2X1(name, deps);
};