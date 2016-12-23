(function () {
  var DISABLED = 'DISABLED';
  var ArduinoHelper = require('../../lib/ArduinoHelper');
  var ROVPilot = function ROVPilot(deps) {
    deps.logger.debug('The rovpilot plugin.');
    var self = this;
    self.SAMPLE_PERIOD = 1000 / deps.config.sample_freq;
    this.physics = new ArduinoHelper().physics;
    self.cockpit = deps.cockpit;
    self.globalEventLoop = deps.globalEventLoop;
    self.sendToROVEnabled = true;
    self.sendUpdateEnabled = true;
    self.priorControls = {};
    self.powerLevel = 2;
    self.setPowerLevel(2);
    //rov.powerLevel = 2;
    self.positions = {
      throttle: 0,
      yaw: 0,
      lift: 0,
      pitch: 0,
      roll: 0,
      strafe: 0
    };
    deps.cockpit.on('plugin.rovpilot.getState', function (callback) {
      var state = {
          senToROVEnabled: self.sendToROVEnabled,
          sendUpdateEnabled: self.sendUpdateEnabled,
          powerLevel: self.powerLevel,
          positions: self.positions
        };
      callback(state);
    });
    deps.cockpit.on('plugin.rovpilot.setPowerLevel', function (value) {
      self.setPowerLevel(value);
    });
    //Send initial state
    deps.cockpit.emit('plugin.rovpilot.setPowerLevel', 2);
    deps.cockpit.on('plugin.rovpilot.allStop', function () {
      self.allStop();
    });
    deps.cockpit.on('plugin.rovpilot.rates.setThrottle', function (value) {
      self.positions.throttle = value;
      if (value === 0) {
        self.positions.throttle = self.ttrim;
      }
    });
    deps.cockpit.on('plugin.rovpilot.rates.setYaw', function (value) {
      self.positions.yaw = value;
    });
    deps.cockpit.on('plugin.rovpilot.rates.setLift', function (value) {
      self.positions.lift = value;
    });
    deps.cockpit.on('plugin.rovpilot.rates.setPitch', function (value) {
      self.positions.pitch = value;
    });
    deps.cockpit.on('plugin.rovpilot.rates.setRoll', function (value) {
      self.positions.roll = value;
    });
    deps.cockpit.on('plugin.rovpilot.disable', function () {
      self.sendToROVEnabled = false;
    });
    deps.cockpit.on('plugin.rovpilot.enable', function () {
      self.sendToROVEnabled = true;
    });
    deps.cockpit.on('plugin.rovpilot.desiredControlRates', function (rates, ack, fn) {
      self.positions = rates;
      fn(ack);  //ack
    });
    this.startInterval = function () {
      setInterval(function () {
        self.sendPilotingData();
      }, 25);  //constantly check to see if new commands need to be sent to arduino
    };
    this.startInterval();
    return this;
  };
  // --------------------
  ROVPilot.prototype.adjustForPowerLimit = function adjustForPowerLimit(value) {
    return value * this.power;
  };
  ROVPilot.prototype.adjustYawForPowerLimit = function adjustYawForPowerLimit(value) {
    return Math.min(Math.max(value * this.power * 1.5, -1), 1);
  };
  ROVPilot.prototype.setPowerLevel = function setPowerLevel(value) {
    switch (value) {
    case 1:
      this.power = 0.12;
      break;
    case 2:
      this.power = 0.25;
      break;
    case 3:
      this.power = 0.4;
      break;
    case 4:
      this.power = 0.7;
      break;
    case 5:
      this.power = 1;
      break;
    }
    this.powerLevel = value;
  };
  ROVPilot.prototype.allStop = function allStop() {
    this.positions.throttle = 0;
    this.positions.yaw = 0;
    this.positions.lift = 0;
    this.positions.pitch = 0;
    this.positions.roll = 0;
    this.postitions.strafe = 0;
  };
  ROVPilot.prototype.sendPilotingData = function () {
    var self = this;
    var positions = this.positions;
    var updateRequired = false;
    //Only send if there is a change
    var controls = {};
    controls.throttle = this.adjustForPowerLimit(positions.throttle);
    controls.yaw = this.adjustYawForPowerLimit(positions.yaw);
    controls.lift = this.adjustForPowerLimit(positions.lift);
    controls.pitch = this.adjustForPowerLimit(positions.pitch);
    controls.roll = this.adjustForPowerLimit(positions.roll);
    controls.strafe = this.adjustForPowerLimit(positions.strafe);
    for (var i in positions) {
      if (controls[i] != this.priorControls[i]) {
        updateRequired = true;
        break;
      }
    }
    if (this.sendUpdateEnabled && updateRequired || this.sendToROVEnabled === false) {
      if (this.sendToROVEnabled) {
        for (var control in controls) {
          if (controls[control] != this.priorControls[control]) {
            var command = control + '(' + controls[control] * 100 + ')';
            self.globalEventLoop.emit('mcu.SendCommand', command); 
          }
        }
      }
      this.priorControls = controls;
      //report back the actual commands after power restrictions
      var motorCommands = this.physics.mapMotors(controls.throttle, controls.yaw, controls.lift);
      this.cockpit.emit('plugin.rovpilot.controls', motorCommands);
    }
  };
  ROVPilot.prototype.getSettingSchema = function getSettingSchema() {
    return [{
        'title': 'ROV Pilot Settings',
        'id': 'rovPilot',
        'type': "object",
        'properties': {
          'currentConfiguration':{
            'type': 'string'
          },
          'configurations': {
            'type': 'array'
          },
          'exponentialSticks': {
            'LEFT_STICK_X': {
              'enabled': {
                'type': 'boolean',
                'default': false,
              },
              'rate': {
                'type': 'number',
                'default': 1.0
              }
            },
            'LEFT_STICK_Y': {
              'enabled': {
                'type': 'boolean',
                'default': false,
              },
              'rate': {
                'type': 'number',
                'default': 1.0
              }
            },
            'RIGHT_STICK_X': {
              'enabled': {
                'type': 'boolean',
                'default': false,
              },
              'rate': {
                'type': 'number',
                'default': 1.0
              }
            },
            'RIGHT_STICK_Y': {
              'enabled': {
                'type': 'boolean',
                'default': false,
              },
              'rate': {
                'type': 'number',
                'default': 1.0
              }
            }
          },
          'inversions': {
            'LEFT_STICK_X': {
              'type': 'boolean',
              'default': false
            },
            'LEFT_STICK_Y': {
              'type': 'boolean',
              'default': false
            },
            'RIGHT_STICK_X': {
              'type': 'boolean',
              'default': false
            },
            'RIGHT_STICK_Y': {
              'type': 'boolean',
              'default': false
            }
          }
        }
      }];
  };
  module.exports = function (name, deps) {
    return new ROVPilot(deps);
  };
}());