function thrusters2x1(name, deps) {
  deps.logger.debug('The motor_diags plugin.');
  //instance variables
  this.cockpit = deps.cockpit;
  this.global = deps.globalEventLoop;
  this.deps = deps;
  this.settings;
}
thrusters2x1.prototype.start = function start() {
  var self = this;

  //While we work on the best pattern this is a work around to make sure the MCU
  //gets the motor settings.  Every 30 seconds they get recent, or immediatly after
  //settings have changed.  This decouples the timing issues around the MCU not coming
  //up at the same time the Node module.
  this.settingtimer = setInterval(function(){self.SendMotorSettings()},30000)

  self.cockpit.on('callibrate_escs', function () {
    self.deps.globalEventLoop.emit('mcu.SendCommand', 'mcal()');
    self.deps.logger.debug('mcal() sent');
  });
  self.cockpit.on('plugin.thrusters2x1.motorTest', function (positions) {
    self.deps.globalEventLoop.emit('mcu.SendMotorTest', positions.port, positions.starboard, positions.vertical);
  });
  self.global.withHistory.on('settings-change.thrusters2x1', function (data) {  
    self.settings = data.thrusters2x1;
    self.SendMotorSettings();
  });
};

thrusters2x1.prototype.SendMotorSettings = function SendMotorSettings() {
    if (!this.settings){return;}
    var settings = this.settings;
    var port = settings.port['forward-modifier'];
    var vertical = settings.vertical['forward-modifier'];
    var starbord = settings.starboard['forward-modifier'];
    var nport = settings.port['reverse-modifier'];
    var nvertical = settings.vertical['reverse-modifier'];
    var nstarbord = settings.starboard['reverse-modifier'];
    if (settings.port.reversed) {
      port = port * -1;
      nport = nport * -1;
    }
    if (settings.vertical.reversed) {
      vertical = vertical * -1;
      nvertical = nvertical * -1;
    }
    if (settings.starboard.reversed) {
      starbord = starbord * -1;
      nstarbord = nstarbord * -1;
    }
    //todo: Move to motor-diag plugin
    //API to Arduino to pass a percent in 2 decimal accuracy requires multipling by 100 before sending.
    command = 'mtrmod1(' + port * 100 + ',' + vertical * 100 + ',' + starbord * 100 + ')';
    this.global.emit('mcu.SendCommand', command);
    command = 'mtrmod2(' + nport * 100 + ',' + nvertical * 100 + ',' + nstarbord * 100 + ')';
    this.global.emit('mcu.SendCommand', command);
  }

thrusters2x1.prototype.getSettingSchema = function getSettingSchema() {
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
              'default': true
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
//Expose either a function or object for require
module.exports = function (name, deps) {
  return new thrusters2x1(name, deps);
};