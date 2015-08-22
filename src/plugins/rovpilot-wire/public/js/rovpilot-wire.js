(function (window, $) {
  'use strict';
  var ROVpilotWire;
  ROVpilotWire = function ROVpilotWire(cockpit) {
    console.log('Loading ROVpilot-Wire plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;

    this.priorSetPoints = {};
    this.sendToROVEnabled = true;
    this.sendUpdateEnabled = true;

    this.setPoints = {
      heading: 0,
      depth: 0
    };

  };

  ROVpilotWire.prototype.defaultInputs = function defaultInputs() {
    self = this;
    return [
      // Toggle heading hold
      {
        name: 'rovPilot.toggleHeadingHold',
        description: 'Toggles the heading hold on/off',
        defaults: { keyboard: 'm' },
        down: function () {
          rov.cockpit.rov.emit('plugin.rovpilot.headingHold.toggle');
        }
      },

      // Toggle depth hold
      {
        name: 'rovPilot.toggleDepthHold',
        description: 'Toggles the depth hold on/off',
        defaults: { keyboard: 'n' },
        down: function () {
          rov.cockpit.rov.emit('plugin.rovpilot.depthHold.toggle');
        }
      }
    ]

  }


  ROVpilotWire.prototype.defaultMenu = function defaultMenu() {
    return [
      {
        label: 'Toggle Depth hold',
        callback: function () {
          rov.cockpit.rov.emit('plugin.rovpilot.depthHold.toggle');
        }
      },
      {
        label: 'Toggle Heading hold',
        callback: function () {
          rov.cockpit.rov.emit('plugin.rovpilot.headingHold.toggle');
        }
      }
    ]
  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilotWire.prototype.listen = function listen() {
    var self = this;

    this.cockpit.on('plugin.rovpilot.allStop',function allStop() {
      this.positions.throttle = 0;
      this.positions.yaw = 0;
      this.positions.lift = 0;
      this.positions.pitch = 0;
      this.positions.roll = 0;
      this.postitions.strafe = 0;
    });

//    this.rovsendPilotingDataTimer = setInterval(function(){
//      self.rovsendPilotingData();
//    },100); //Todo: Make configurable

  };

  ROVpilotWire.prototype.sendPilotingData = function sendPilotingData() {
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
        this.rov.emit('plugin.rovpilot.desiredControlRates',controls,function(ack){
          if (ack===self.ack) {self.ack = null;}
        });
      }
      this.priorControls = controls;
    }
  };


  window.Cockpit.plugins.push(ROVpilotWire);
}(window, jQuery));
