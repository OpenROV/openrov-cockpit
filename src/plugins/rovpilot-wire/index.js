(function() {
  var DISABLED = 'DISABLED';

  var ROVPilotWire = function ROVPilotWire(deps) {
    console.log('The rovpilot plugin.');
    var self = this;
    self.SAMPLE_PERIOD = 1000 / deps.config.sample_freq;

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

    deps.cockpit.on('plugin.rovpilot.headingHold.toggle', function () {
      deps.rov.send('holdHeading_toggle()');
    });

    deps.cockpit.on('plugin.rovpilot.headingHold.set', function (value) {
      deps.rov.send('holdHeading_toggle('+ value +')');
    });

    deps.cockpit.on('plugin.rovpilot.depthHold.toggle', function () {
      deps.rov.send('holdDepth_toggle()');
    });

    deps.cockpit.on('plugin.rovpilot.depthHold.set', function (value) {
      deps.rov.send('holdDepth_toggle('+ value +')');
    });

    deps.cockpit.on('plugin.rovpilot.disable', function () {
      self.sendToROVEnabled = false;
    });

    deps.cockpit.on('plugin.rovpilot.enable', function () {
      self.sendToROVEnabled = true;
    });

    // Arduino
    deps.rov.on('status', function (status) {
      var enabled;
      if ('targetDepth' in status) {
        enabled = status.targetDepth != DISABLED;
        deps.cockpit.emit('plugin.rovpilot.depthHold.' + (enabled ? 'enabled' : 'disabled'));
        if (enabled) {
           deps.cockpit.emit('plugin.rovpilot.depthHold.target', Number(status.targetDepth)/100);
       }
      }
      if ('targetHeading' in status) {
        enabled = status.targetHeading != DISABLED;
        deps.cockpit.emit('plugin.rovpilot.headingHold.' + (enabled ? 'enabled' : 'disabled'));
        if (enabled) {
          deps.cockpit.emit('plugin.rovpilot.headingHold.target', status.targetHeading);
        }
      }
    });

    this.startInterval  = function() {
      setInterval(
        function() {
          self.sendPilotingData();
        },
        100);
    };

    this.startInterval();

    return this;
  };

  ROVPilotWire.prototype.allStop = function allStop() {
    this.positions.throttle = 0;
    this.positions.yaw = 0;
    this.positions.lift = 0;
    this.positions.pitch = 0;
    this.positions.roll = 0;
    this.postitions.strafe = 0;
  };



  ROVPilotWire.prototype.sendPilotingData = function() {
    var positions = this.positions;
    var updateRequired = false;
    //Only send if there is a change
    var controls = {};
    controls.throttle = positions.throttle * this.power;
    controls.yaw = positions.yaw * this.power * 1.5;
    controls.yaw = Math.min(Math.max(controls.yaw, -1), 1);
    controls.lift = positions.lift * this.power;
    controls.pitch = positions.pitch;
    controls.roll = positions.roll;
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
      //      console.log(command);
          }
        }
      }
      this.rov.sendCommand(controls.throttle, controls.yaw, controls.lift);
      this.priorControls = controls;
    }
  };

  module.exports = function (name, deps) {
    return new ROVPilotWire(deps);
  };

})();
