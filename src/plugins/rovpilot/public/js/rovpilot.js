(function (window, $) 
{
  'use strict';
  class ROVpilot
  {
    constructor(cockpit)
    {
      console.log("ROV Pilot started");
      var self = this;

      self.cockpit = cockpit;
      
      
      self.positions = {
        throttle: 0,
        yaw: 0,
        lift: 0,
        pitch: 0,
        roll: 0,
        strafe: 0
      };
      self.powerLevel = undefined;
      self.priorControls = {};

      self.sendToROVEnabled = true;
      self.sendUpdateEnabled = true;

      self.settings = {};

      //Get the stick values
      self.cockpit.withHistory.on('settings-change.rovPilot', function (settings) {
        //Init settings with defaults
        self.settings = settings.rovPilot;
      });

      //Input mappings
      self.actions = 
      {
        'rovPilot.moveForward':
        {
          description: 'Set throttle forward',
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setThrottle', 1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setThrottle', 0);
              }           
            }
          }
        },
        'rovPilot.moveBackwards':
        {
          description: 'Set throttle backwards (aft)',
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setThrottle', -1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setThrottle', 0);
              }           
            }
          }
        },
        'rovPilot.moveThrottle':
        {
          description: "Command throttle with gamepad thumbsticks",
          controls:
          {
            axis: 
            {
              update: function(value) {
                self.cockpit.emit('plugin.rovpilot.setThrottle', value);
              }
            }
          }
        },
        'rovPilot.moveYaw':
        {
          description: "Command yaw with gamepad thumbsticks",
          controls:
          {
            axis: 
            {
              update: function(value) {
                self.cockpit.emit('plugin.rovpilot.setYaw', value);
              }
            }
          }
        },
        'rovPilot.moveLeft':
        {
          description: "Move left",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setYaw', -1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setYaw', 0);
              }           
            }
          }
        },
        'rovPilot.moveRight':
        {
          description: "Move right",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setYaw', 1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setYaw', 0);
              }           
            }
          }
        },
        'rovPilot.moveLift':
        {
          description: "Command depth with gamepad thumbsticks",
          controls:
          {
            axis: 
            {
              update: function(value) {
                self.cockpit.emit('plugin.rovpilot.setLift', value);
              }
            }
          }
        },
        'rovPilot.moveUp':
        {
          description: "Ascend",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setLift', -1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setLift', 0);
              }           
            }
          }
        },
        'rovPilot.moveDown':
        {
          description: "Descend",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setLift', 1);
              },
              up: function() {
                self.cockpit.emit('plugin.rovpilot.setLift', 0);
              }           
            }
          }
        },
        'rovPilot.powerLevel1':
        {
          description: "Set power level to 1",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setPowerLevel', 1);
              }          
            }
          }
        },
        'rovPilot.powerLevel2':
        {
          description: "Set power level to 2",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setPowerLevel', 2);
              }          
            }
          }
        },
        'rovPilot.powerLevel3':
        {
          description: "Set power level to 3",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setPowerLevel', 3);
              }          
            }
          }
        },
        'rovPilot.powerLevel4':
        {
          description: "Set power level to 4",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setPowerLevel', 4);
              }          
            }
          }
        },
        'rovPilot.powerLevel5':
        {
          description: "Set power level to 5",
          controls:
          {
            button:
            {
              down: function() {
                self.cockpit.emit('plugin.rovpilot.setPowerLevel', 5);
              }          
            }
          }
        },
        'rovPilot.incrementPowerLevel':
        {
          description: "Increment ROV Power Level",
          controls:
          {
            button:
            {
              down: function() {
                // Get the ROV's current power level 
                self.cockpit.rov.emit('plugin.rovpilot.getState', function(state) {
                  self.powerLevel = state.powerLevel;
                  if(self.powerLevel < 5)
                  {
                    self.powerLevel = self.powerLevel + 1;
                  }
                  self.cockpit.emit('plugin.rovpilot.setPowerLevel', self.powerLevel);
                });
              }
            }
          }
        },
        'rovPilot.decrementPowerLevel':
        {
          description: "Decrement ROV Power Level",
          controls:
          {
            button:
            {
              down: function() {
                // Get the ROV's current power level 
                self.cockpit.rov.emit('plugin.rovpilot.getState', function(state) {
                  self.powerLevel = state.powerLevel;
                  if(self.powerLevel > 1)
                  {
                    self.powerLevel = self.powerLevel - 1;
                  }
                  self.cockpit.emit('plugin.rovpilot.setPowerLevel', self.powerLevel);
                });
              }
            }
          }
        }
      };

      self.inputDefaults =
      {
        keyboard:
        {
          "w": { type: "button",
                action: 'rovPilot.moveForward' },
          "s": { type: "button",
                action: 'rovPilot.moveBackwards' },
          "a": { type: "button",
                action: 'rovPilot.moveLeft' },
          "d": { type: "button",
                action: 'rovPilot.moveRight' },
          "e": { type: "button",
                action: 'rovPilot.moveUp' },       
          "c": { type: "button",
                action: 'rovPilot.moveDown' }, 
          "1": { type: "button",
                action: 'rovPilot.powerLevel1' }, 
          "2": { type: "button",
                action: 'rovPilot.powerLevel2' }, 
          "3": { type: "button",
                action: 'rovPilot.powerLevel3' }, 
          "4": { type: "button",
                action: 'rovPilot.powerLevel4' }, 
          "5": { type: "button",
                action: 'rovPilot.powerLevel5' }, 
          "-": { type: "button",
                action: 'rovPilot.decrementPowerLevel' },
          "=": { type: "button",
                action: 'rovPilot.incrementPowerLevel' }, 
        },
        gamepad:
        {
          "LEFT_STICK_Y": { type: "axis",
                            action: 'rovPilot.moveThrottle',
                            options: {
                              inverted: true,
                              exponentialSticks: {
                                enabled: false,
                                rate: 1.0
                              }
                            } 
                          },
          "RIGHT_STICK_X": { type: "axis",
                            action: 'rovPilot.moveYaw',
                            options: {
                              inverted: false,
                              exponentialSticks: {
                                enabled: false,
                                rate: 1.0
                              }
                            } 
                          },
          "RIGHT_STICK_Y": { type: "axis",
                            action: 'rovPilot.moveLift',
                            options: {
                              inverted: false,
                              exponentialSticks: {
                                enabled: false,
                                rate: 1.0
                              }
                            } 
                          },
          "LB": { type: "button",
                            action: 'rovPilot.decrementPowerLevel'
          },
          "RB": { type: "button",
                              action: 'rovPilot.incrementPowerLevel'
          }
        }
      };
    };
    
    altMenuDefaults() 
    {
      var self = this;
      return [{
          label: 'Increment power level',
          callback: function () {
            self.rov.cockpit.emit('plugin.rovpilot.incrementPowerLevel');
          }
        }];
    };

    listen() 
    {
      //As a general rule, we want to set a desired state before going over the
      //the wire to deliver control signals.  All kinds of problems from late arriving
      //packets to dropped packets can really do bad things.  We listen for the
      //control commands from the UI/Input devices and we set the desired orientation
      //and position state.  We send that desired state up to the server when it
      //changes.
      //Ideally, we could put hooks in so that we get verification that a requested state
      //has been acknowledged by the ROV so that we can automatically retry sending state
      //if that awk timesout.
      //We can also send our state updates with a timestamp if we figure out a way
      //to deal with the clocks not being in sync between the computer and the ROV.
      var self = this;



      //Get the stick values
      self.cockpit.withHistory.on('settings-change.rovPilot', function (settings) {
        
        //Init settings with defaults
        self.settings = settings.rovPilot;
      });

      self.cockpit.on('plugin.rovpilot.allStop', function() {
        for(var position in self.positions)
        {
          self.positions[position] = 0;
        }
      });

      self.cockpit.rov.on('plugin.rovpilot.controls', function(controls) {
        self.cockpit.emit('plugin.rovpilot.controls', controls);
      });

      self.cockpit.on('plugin.rovpilot.getState', function(callback) {
        var state = { powerLevel: self.powerLevel };
        callback(state);
      });

      self.cockpit.on('plugin.rovpilot.setPowerLevel', function(level) {
        //Set our state to what was requested
        self.powerLevel = level;
        self.cockpit.rov.emit('plugin.rovpilot.setPowerLevel', level);
      });

      self.cockpit.on('plugin.rovpilot.setLift', function(value) {
        self.positions.lift = value;
      });

      self.cockpit.on('plugin.rovpilot.setPitch', function (value) {
        self.positions.pitch = value;
      });

      self.cockpit.on('plugin.rovpilot.setRoll', function (value) {
        self.positions.roll = value;
      });

      self.cockpit.on('plugin.rovpilot.setStrafe', function (value) {
        self.positions.strafe = value;
      });

      self.cockpit.on('plugin.rovpilot.setThrottle', function (value) {
        self.positions.throttle = value;
      });

      self.cockpit.on('plugin.rovpilot.setYaw', function (value) {
        self.positions.yaw = value;
      });

      self.rovSendPilotingDataTimer = setInterval(function() {
        self.sendPilotingData();
      }, 100 );

      //TODO: Make configurable
      self.cockpit.on('plugin.rovpilot.sendToROVEnabled', function (value) {
        self.sendToROVEnabled = value;
      });

      //Initial sync of state, for some reason this is not firing on the listen call
      self.syncState();
    }

    syncState()
    {
      var self = this;
      setTimeout(function() {
        self.cockpit.rov.emit('plugin.rovpilot.getState', function(state) {
          self.powerLevel = state.powerLevel;
          self.cockpit.emit('plugin.rovpilot.setPowerLevel', self.powerLevel);
        });
      }, 2000);
    }

    sendPilotingData() 
    {
      var self = this;
      var positions = self.positions;

      //Force an update if the ack has not been cleared
      var updateRequired = this.ack == null ? false : true;

      //Only send if there is a change
      var controls = {}

      controls.throttle = positions.throttle;
      controls.yaw = positions.yaw;
      controls.lift = positions.lift;
      controls.pitch = positions.pitch;
      controls.roll = positions.roll;
      controls.strafe = positions.strafe;
      for (var i in positions) {
        if (controls[i] != self.priorControls[i]) {
          updateRequired = true;
          break;
        }
      }
      if (self.sendUpdateEnabled && updateRequired || self.sendToROVEnabled === false) {
        if (self.sendToROVEnabled) {
          self.ack = performance.now();
          self.cockpit.rov.emit('plugin.rovpilot.desiredControlRates', controls, this.ack, function (ack) {
            if (ack === self.ack) {
              self.ack = null;
            }
          });
        }
        self.priorControls = controls;
      }
    }
  };

  var plugins = namespace('plugins');
  plugins.ROVpilot = ROVpilot;
  window.Cockpit.plugins.push(plugins.ROVpilot);
}(window, jQuery));