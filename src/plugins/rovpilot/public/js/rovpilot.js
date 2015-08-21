(function (window, $) {
  'use strict';
  var ROVpilot;
  ROVpilot = function ROVpilot(cockpit) {
    console.log('Loading ROVpilot plugin in the browser.');
    var rov = this;
    // Instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    rov.cockpit = cockpit;

    this.setPowerLevel(2);
    //rov.powerLevel = 2;

    this.priorControls = {};
    this.sendToROVEnabled = true;
    this.sendUpdateEnabled = true;

    this.positions = {
      throttle: 0,
      yaw: 0,
      lift: 0,
      pitch: 0,
      roll: 0,
      strafe: 0
    };

  };

  ROVpilot.prototype.adjustForPowerLimit = function adjustForPowerLimit(value){
    return value * this.power;
  }

  ROVpilot.prototype.adjustYawForPowerLimit = function adjustYawForPowerLimit(value){
    return Math.min(Math.max(value * this.power * 1.5,-1),1);
  }


  ROVpilot.prototype.setPowerLevel = function setPowerLevel(value) {

    switch (value) {
      case 1:
        this.power = 0.12;
        break;
      case 2:
        this.power = 0.25;
        break;
      case 3:
        this.power = 0.40;
        break;
      case 4:
        this.power = 0.70;
        break;
      case 5:
        this.power = 1;
        break;
    }

    this.powerLevel = value;
  };

  ROVpilot.prototype.defaultInputs = function defaultInputs() {
    self = this;
    return [
      // Increment power level
      {
        name: 'rovPilot.incrementPowerLevel',
        description: 'Increment the thruster power level',
        defaults: { },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.incrementPowerLevel');
        }
      },

      // Up / Forward
      {
        name: 'rovPilot.moveForward',
        description: 'Set throttle forward.',
        defaults: { keyboard: 'up' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setThrottle',1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setThrottle', 0);
        }
      },

      // Throttle axis
      {
        name: 'rovPilot.moveThrottle',
        description: 'Set throttle via axis input.',
        defaults: { gamepad: 'LEFT_STICK_Y' },
        axis: function (v) {
          rov.cockpit.emit('plugin.rovpilot.setThrottle', -1 * v);
        }
      },

      // Down / Backwards
      {
        name: 'rovPilot.moveBackwards',
        description: 'Set throttle backwards (aft).',
        defaults: { keyboard: 'down' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setThrottle', -1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setThrottle', 0);
        }
      },

      // yaw
      {
        name: 'rovPilot.moveYaw',
        description: 'Turn the ROV via axis input.',
        defaults: { gamepad: 'LEFT_STICK_X' },
        axis: function (v) {
          rov.cockpit.emit('plugin.rovpilot.setYaw', v);
        }
      },

      // left
      {
        name: 'rovPilot.moveLeft',
        description: 'Turn the ROV to the port side (left).',
        defaults: { keyboard: 'left' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setYaw', -1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setYaw', 0);
        }
      },

      // right
      {
        name: 'rovPilot.moveRight',
        description: 'Turn the ROV to the starboard side (right).',
        defaults: { keyboard: 'right' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setYaw', 1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setYaw', 0);
        }
      },

      // lift axis
      {
        name: 'rovPilot.moveLift',
        description: 'Bring the ROV shallower or deeper via axis input.',
        defaults: { gamepad: 'RIGHT_STICK_Y' },
        axis: function (v) {
          rov.cockpit.emit('plugin.rovpilot.setLift', -1 * v);
        }
      },
      // Lift up
      {
        name: 'rovPilot.moveUp',
        description: 'Bring the ROV shallower (up).',
        defaults: { keyboard: 'shift' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setLift', -1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setLift', 0);
        }
      },
      // Push down
      {
        name: 'rovPilot.moveDown',
        description: 'Bring the ROV deeper (down).',
        defaults: { keyboard: 'ctrl' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setLift', 1);
        },
        up: function () {
          rov.cockpit.emit('plugin.rovpilot.setLift', 0);
        }
      },

      // power level 1
      {
        name: 'rovPilot.powerLevel1',
        description: 'Set the power level of the ROV to level 1.',
        defaults: { keyboard: '1' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setPowerLevel', 1);
        }
      },
      // power level 2
      {
        name: 'rovPilot.powerLevel2',
        description: 'Set the power level of the ROV to level 2.',
        defaults: { keyboard: '2' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setPowerLevel', 2);
        }
      },
      // power level 3
      {
        name: 'rovPilot.powerLevel3',
        description: 'Set the power level of the ROV to level 3.',
        defaults: { keyboard: '3' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setPowerLevel', 3);
        }
      },
      // power level 4
      {
        name: 'rovPilot.powerLevel4',
        description: 'Set the power level of the ROV to level 4.',
        defaults: { keyboard: '4' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setPowerLevel', 4);
        }
      },
      // power level 5
      {
        name: 'rovPilot.powerLevel5',
        description: 'Set the power level of the ROV to level 5.',
        defaults: { keyboard: '5' },
        down: function () {
          rov.cockpit.emit('plugin.rovpilot.setPowerLevel', 5);
        }
      }    ]

  }


  ROVpilot.prototype.defaultMenu = function defaultMenu() {
    return [
      {
        label: 'Increment power level',
        callback: function () {
          rov.cockpit.emit('plugin.rovpilot.incrementPowerLevel');
        }
      }
    ]
  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilot.prototype.listen = function listen() {
    var self = this;

    this.cockpit.on('plugin.rovpilot.setPowerLevel',function(value){
      self.setPowerLevel(value);
    });

    //Send initial state
    this.cockpit.emit('plugin.rovpilot.setPowerLevel', 2);

    //As a general rule, we want to set a desired state before going over the
    //the wire to deliver control signals.  All kinds of problems from late arriving
    //packets to dropped packets can really do bad things.  We listen for the
    //control commands from the UI/Input devices and we set the desired orientation
    //and position state.  We send that desired state up to the server when it
    //changes.

    //Ideally, we could put hooks in so that we get verification that a requested state
    //has been acknoledged by the ROV so that we can automtically retry sending state
    //if that awk timesout.

    //We can also send our state updates with a timestamp if we figure out a way
    //to deal with the clocks not being in sync between the computer and the ROV.


    this.cockpit.on('plugin.rovpilot.setThrottle',function(value){
      this.positions.throttle = value;
    });

    this.cockpit.on('plugin.rovpilot.setYaw',function(value){
      this.positions.yaw = value;
    });

    this.cockpit.on('plugin.rovpilot.setLift',function(value){
      this.positions.lift = value;
    });

    this.cockpit.on('plugin.rovpilot.setPitch',function(value){
      this.positions.pitch = value;
    });

    this.cockpit.on('plugin.rovpilot.setRoll',function(value){
      this.positions.roll = value;
    });

    this.cockpit.on('plugin.rovpilot.setStrafe',function(value){
      this.positions.strafe = value;
    });

    this.cockpit.on('plugin.rovpilot.allStop', function allStop() {
      this.positions.throttle = 0;
      this.positions.yaw = 0;
      this.positions.lift = 0;
      this.positions.pitch = 0;
      this.positions.roll = 0;
      this.postitions.strafe = 0;
    });

    this.rovsendPilotingDataTimer = setInterval(function(){
      self.sendPilotingData();
    },100); //Todo: Make configurable

  };

  ROVpilot.prototype.sendPilotingData = function sendPilotingData() {
    var positions = this.positions;
    var self = this;
    //force an update if the ack has not been cleared
    var updateRequired = (this.ack == null) ? false : true ;
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
        this.ack = performance.now();
        this.rov.emit('plugin.rovpilot.desiredControlRates',controls,this.ack,function(ack){
          if (ack===self.ack) {self.ack = null;}
        });
      }
      this.priorControls = controls;
    }
  };


  window.Cockpit.plugins.push(ROVpilot);
}(window, jQuery));
