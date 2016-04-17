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

    this.priorControls = {};
    this.sendToROVEnabled = true;
    this.sendUpdateEnabled = true;
    this.powerLevel;
    this.positions = {
      throttle: 0,
      yaw: 0,
      lift: 0,
      pitch: 0,
      roll: 0,
      strafe: 0
    };

  };


  ROVpilot.prototype.inputDefaults = function inputDefaults() {
    var self = this;
    var rov = this;
    function postProcessStickValues(input){
      if (self.settings.exponentialSticks){
        var s = Math.sign(input);
        input=Math.pow(input,self.settings.exponentialRate);
        if (Math.sign(input)!==s){
          input = input * s;
        }
      }
      return input;
    }
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
          rov.cockpit.emit('plugin.rovpilot.setThrottle', -1 * postProcessStickValues(v));
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
          rov.cockpit.emit('plugin.rovpilot.setYaw', postProcessStickValues(v));
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
          rov.cockpit.emit('plugin.rovpilot.setLift', -1 * postProcessStickValues(v));
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

  ROVpilot.prototype.altMenuDefaults = function altMenuDefaults() {
    var self=this;
    return [
      {
        label: 'Increment power level',
        callback: function () {
          self.rov.cockpit.emit('plugin.rovpilot.incrementPowerLevel');
        }
      }
    ]
  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilot.prototype.listen = function listen() {
    var self = this;


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

    this.cockpit.on('settings-change.rovpilot',function(settings){
      self.settings=settings.rovpilot;
    })

    //initial sync of state information
    this.rov.emit('plugin.rovpilot.getState', function(state){
      this.powerLevel = state.powerLevel;
      self.cockpit.emit('plugin.rovpilot.setPowerLevel',this.powerLevel);
    });

    this.cockpit.on('plugin.rovpilot.getState', function(callback){
      var state = {
        powerLevel : self.powerLevel
      };
      callback(state);
    });

    this.rov.on('plugin.rovpilot.controls', function(controls){
      self.cockpit.emit('plugin.rovpilot.controls', controls);
    });


    this.cockpit.on('plugin.rovpilot.setPowerLevel', function(level){
      self.rov.emit('plugin.rovpilot.setPowerLevel',level);
    });

    this.cockpit.on('plugin.rovpilot.setThrottle',function(value){
      self.positions.throttle = value;
    });

    this.cockpit.on('plugin.rovpilot.setYaw',function(value){
      self.positions.yaw = value;
    });

    this.cockpit.on('plugin.rovpilot.setLift',function(value){
      self.positions.lift = value;
    });

    this.cockpit.on('plugin.rovpilot.setPitch',function(value){
      self.positions.pitch = value;
    });

    this.cockpit.on('plugin.rovpilot.setRoll',function(value){
      self.positions.roll = value;
    });

    this.cockpit.on('plugin.rovpilot.setStrafe',function(value){
      self.positions.strafe = value;
    });

    this.cockpit.on('plugin.rovpilot.allStop', function allStop() {
      self.positions.throttle = 0;
      self.positions.yaw = 0;
      self.positions.lift = 0;
      self.positions.pitch = 0;
      self.positions.roll = 0;
      self.postitions.strafe = 0;
    });

    this.rovsendPilotingDataTimer = setInterval(function(){
      self.sendPilotingData();
    },100); //Todo: Make configurable

    this.cockpit.on('plugin.rovpilot.sendToROVEnabled', function(value){
      self.sendToROVEnabled=value;
    });

  };

  ROVpilot.prototype.sendPilotingData = function sendPilotingData() {
    var positions = this.positions;
    var self = this;
    //force an update if the ack has not been cleared
    var updateRequired = (this.ack == null) ? false : true ;
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
