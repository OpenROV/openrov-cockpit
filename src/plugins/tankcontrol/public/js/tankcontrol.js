(function (window, $, undefined) {
  'use strict';
  var TankControl;
  TankControl = function TankControl(cockpit) {
    console.log('Loading TankControl plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.tankControlActive = false;
    this.originalsettings = {};
    this.leftx = 0;
    this.lefty = 0;
    this.rightx = 0;
    this.righty = 0;
    this.lift = 0;

    //inputControl names
    this.controlNames = {
      leftLift: 'tankControl.leftLift',
      portThrottle: 'tankControl.portThrottle',
      rightLift: 'tankControl.rightLift',
      starboardThrottle: 'tankControl.starboardThrottle'
    };

    // for plugin management:
    this.name = 'TankControl';   // for the settings
    this.viewName = 'Tank GamePad Controls'; // for the UI
    this.canBeDisabled = true; //allow enable/disable
    var self = this;
    this.enable = function () {
      if (!self.tankControlActive){
        self.toggleControl();
      }
    };
    this.disable = function () {
      if (self.tankControlActive){
        self.toggleControl();
      }
    };


  };


  TankControl.prototype.inputDefaults = function inputDefaults() {
    var rov = this;
    return [
      {
        name: 'tankcontrol.toggleTankControl',
        description: 'Toggles the tank control mode on/off',
        defaults: { keyboard: 't' },
        down: function() { rov.toggleControl(); }
      },
        {
          name: 'rov.controlNames.leftLift',
          description: 'Tankcontrol: Lift control control for the left hand gamepad.',
          defaults: { gamepad: 'LEFT_STICK_X' },
          active: false,
          axis: function (v) {
            var direction;
            rov.leftx = -v;
            if (rov.leftx + rov.rightx >= 0) {
              direction = 1;
            } else {
              direction = -1;
            }
            rov.lift = direction * Math.max(Math.abs(rov.leftx), Math.abs(rov.rightx));
            rov.cockpit.rov.emit('plugin.rovpilot.manualMotorThrottle', rov.lefty, rov.lift, rov.righty);
          }
        },
        {
          name: 'rov.controlNames.portThrottle',
          description: 'Tankcontrol: Throttle control for the port prop.',
          defaults: { gamepad: 'LEFT_STICK_Y' },
          active: false,
          axis: function (v) {
            rov.lefty = v;
            rov.cockpit.rov.emit('plugin.rovpilot.manualMotorThrottle', rov.lefty, rov.lift, rov.righty);
          }
        },
        {
          name: 'rov.controlNames.rightLift',
          description: 'Tankcontrol: Lift control control for the right hand gamepad.',
          defaults: { gamepad: 'RIGHT_STICK_X' },
          active: false,
          axis: function (v) {
            var direction;
            rov.rightx = v;
            if (rov.leftx + rov.rightx >= 0) {
              direction = 1;
            } else {
              direction = -1;
            }
            rov.lift = direction * Math.max(Math.abs(rov.leftx), Math.abs(rov.rightx));
            rov.cockpit.rov.emit('plugin.rovpilot.manualMotorThrottle', rov.lefty, rov.lift, rov.righty);
            console.log('rov.lift:' + rov.lift);
          }
        },
        {
          name: 'rov.controlNames.starboardThrottle',
          description: 'Tankcontrol: Throttle control for the starboard prop.',
          defaults: { gamepad: 'RIGHT_STICK_Y' },
          active: false,
          axis: function (v) {
            rov.righty = v;
            rov.cockpit.rov.emit('plugin.rovpilot.manualMotorThrottle', rov.lefty, rov.lift, rov.righty);
          }
        }
    ];
  }

  TankControl.prototype.listen = function listen() {
    var rov = this;
  };

  TankControl.prototype.toggleControl = function toggleControl() {
    var rov = this;
    var controls = [];
    for (var name in rov.controlNames) {
      controls.push('tankControl.' + name);
    }

    if (!this.tankControlActive) {
      //TODO: Be sure to upgrade input controller for message activation
      rov.cockpit.emit('inputController.activate',controls,function(){
        rov.cockpit.emit('plugin.tankControl.state',{enabled:true});
        rov.tankControlActive = true;
        console.log('Tank Control Active');
      });
    }
    else {
      rov.cockpit.emit('inputController.deactivate',controls,function(){
        rov.tankControlActive = false;
        rov.cockpit.emit('plugin.tankControl.state',{enabled:false});
        console.log('Tank Control Deactivated');
      });
    }
  };
  window.Cockpit.plugins.push(TankControl);
}(window, jQuery));
