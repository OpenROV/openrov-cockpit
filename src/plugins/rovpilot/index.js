(function() {
  var DISABLED = 'DISABLED';
  var ArduinoHelper = require('../../lib/ArduinoHelper');

  var ROVPilot = function ROVPilot(deps) {
    console.log('The rovpilot plugin.');
    var self = this;
    self.SAMPLE_PERIOD = 1000 / deps.config.sample_freq;
    this.physics = new ArduinoHelper().physics;

    self.cockpit = deps.cockpit;
    self.rov = deps.rov;
    self.sendToROVEnabled = true;
    self.sendUpdateEnabled = true;
    self.priorControls = {};

    self.positions = {
      throttle: 0,
      yaw: 0,
      lift: 0,
      pitch: 0,
      roll: 0,
      strafe: 0
    };

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

    deps.cockpit.on('plugin.rovpilot.desiredControlRates', function (rates,ack,fn) {
      self.positions = rates;
//      console.log("this should be a callback!");
//      console.dir(fn);
//      fn(ack); //ack
    });


    this.startInterval  = function() {
      setInterval(
        function() {
          self.sendPilotingData();
        },
        25); //constantly check to see if new commands need to be sent to arduino
    };

    this.startInterval();

    return this;
  };

  ROVPilot.prototype.allStop = function allStop() {
    this.positions.throttle = 0;
    this.positions.yaw = 0;
    this.positions.lift = 0;
    this.positions.pitch = 0;
    this.positions.roll = 0;
    this.postitions.strafe = 0;
  };



  ROVPilot.prototype.sendPilotingData = function() {
    var positions = this.positions;
    var updateRequired = false;
    //Only send if there is a change
    var controls = {};
    controls.throttle = positions.throttle
    controls.yaw = positions.yaw;
    controls.lift = positions.lift;
    controls.pitch = positions.pitch;
    controls.roll = positions.roll;
    controls.strafe = positions.strafe;
    for (var i in positions) {
      if (controls[i] != this.priorControls[i]) {
        updateRequired = true;
        break;
      }
    }
    if (this.sendUpdateEnabled && updateRequired || this.sendToROVEnabled === false) {
      if (this.sendToROVEnabled) {
        for(var control in controls){
          if(controls[control] != this.priorControls[control]){
            var command = control + '(' + controls[control] * 100+ ')';
            this.rov.send(command);
          //  console.log(command);
          }
        }
      }
      this.priorControls = controls;
//      Apparent code from Dom's merge. Still needs a home.
//      var motorCommands = this.physics.mapMotors(controls.throttle, controls.yaw, controls.lift);
//      this.cockpit.emit('plugin.rovpilot.controls', motorCommands);
    }
  };

  module.exports = function (name, deps) {
    return new ROVPilot(deps);
  };

})();
