(function (window, $) {
  'use strict';
  var ROVpilotWire;
  ROVpilotWire = function ROVpilotWire(cockpit) {
    var self = this;
    deps.logger.debug('Loading ROVpilot-Wire plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.priorSetPoints = {};
    this.sendToROVEnabled = true;
    this.sendUpdateEnabled = true;
    this.depthHold_state = {};
    this.headingHold_state = {};
    this.headingHold_desiredOn = false;
    this.depthHold_desiredOn = false;
    
    //Defaults
    this.settings = { 
      controlResetsSetPoint: false 
    };

    this.actions = 
    {
      'rovPilot.toggleHeadingHold':
      {
        description: "Toggle Heading Hold",
        controls:
        {
          button:
          {
            down: function() {
              self.cockpit.emit('plugin.rovpilot.headingHold.set-enabled', !self.headingHold_state.enabled);
            }            
          }
        }
      },
      'rovPilot.toggleDepthHold':
      {
        description: "Toggle Depth Hold",
        controls:
        {
          button:
          {
            down: function() {
              self.cockpit.emit('plugin.rovpilot.depthHold.set-enabled', !self.depthHold_state.enabled);
            }            
          }
        }
      }      
    };

    this.inputDefaults = 
    {
      keyboard:
      {
        "m": { type: "button", 
               action: 'rovPilot.toggleHeadingHold' },
        "n": { type: "button", 
               action: 'rovPilot.toggleDepthHold' }
      }
    };

  };

  ROVpilotWire.prototype.altMenuDefaults = function altMenuDefaults() {
    var self = this;
    return [
      {
        label: 'Toggle Depth hold',
        callback: function () {
          self.cockpit.emit('plugin.rovpilot.depthHold.set-enabled', !self.depthHold_state.enabled);
        }
      },
      {
        label: 'Toggle Heading hold',
        callback: function () {
          self.cockpit.emit('plugin.rovpilot.headingHold.set-enabled', !self.headingHold_state.enabled);
        }
      }
    ];
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilotWire.prototype.listen = function listen() {
    var self = this;
    this.cockpit.rov.withHistory.on('settings-change.pilotwire', function (settings) {
      self.settings = settings.pilotwire;
    });
    this.rov.withHistory.on('plugin.rovpilot.depthHold.state', function (state) {
      self.cockpit.emit('plugin.rovpilot.depthHold.state', state);
      self.depthHold_state = state;
    });
    this.rov.withHistory.on('plugin.rovpilot.headingHold.state', function (state) {
      self.cockpit.emit('plugin.rovpilot.headingHold.state', state);
      self.headingHold_state = state;
    });
    this.cockpit.on('plugin.rovpilot.depthHold.set-enabled', function (value) {
      self.depthHold_desiredOn = value;
      self.rov.emit('plugin.rovpilot.depthHold.set', { enabled: value });
    });
    this.cockpit.on('plugin.rovpilot.headingHold.set-enabled', function (value) {
      self.headingHold_desiredOn = value;
      self.rov.emit('plugin.rovpilot.headingHold.set', { enabled: value });
    });
    //The code below will automatically disengadge the auto pilot in the axis that a flight control is
    //is actively being changed in by the pilot, and then will re-engadge selecting the current position
    //as the new set point when the control goes back to zero.
    //TODO: This code requires message delivery and does not recover well if the enable hold message
    //       fails to get delivered.
    var lastLiftCheck = false;
    this.cockpit.on('plugin.rovpilot.setLift', function (targetRate) {
      //short circuit if the condition is unchanged
      if (lastLiftCheck == (targetRate == 0)) {
        return;
      }
      lastLiftCheck = targetRate == 0;
      if (self.depthHold_desiredOn && self.settings.controlResetsSetPoint) {
        self.rov.emit('plugin.rovpilot.depthHold.set', { enabled: targetRate == 0 });
      }
    });
    var lastYawCheck = false;
    this.cockpit.on('plugin.rovpilot.setYaw', function (targetRate) {
      if (lastYawCheck == (targetRate == 0)) {
        return;
      }
      lastYawCheck = targetRate == 0;
      if (self.headingHold_desiredOn && self.settings.controlResetsSetPoint) {
        self.rov.emit('plugin.rovpilot.headingHold.set', { enabled: targetRate == 0 });
      }
    });
  };
  window.Cockpit.plugins.push(ROVpilotWire);
}(window, jQuery));