(function(window, document)
{
  'use strict'
  
  //Necessary for debug utils
  var log;
  var trace;
  var log_debug;
  $.getScript('components/visionmedia-debug/dist/debug.js', function() {
    log = debug('ROVPilotWire:log');
    trace = debug('ROVPilotWire:trace');
    log_debug = debug('ROVPilotWire:debug');
  });



  class ROVPilotWire
  {
    constructor(cockpit)
    {
      var self = this;
      self.cockpit = cockpit;
      self.rov = cockpit.rov;
      
      // Instance variables
      self.priorSetPoints = {};
      self.sendToROVEnabled = true;
      self.sendUpdateEnabled = true;

      self.depthHold_state = {};
      self.headingHold_state = {};

      self.headingHold_desiredOn = false;
      self.depthHold_desiredOn = false;

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
          "h": { type: "button", 
                action: 'rovPilot.toggleHeadingHold' },
          "g": { type: "button", 
                action: 'rovPilot.toggleDepthHold' }
        }
      };
    };
    
    altMenuDefaults()
    {
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

      listen()
      {
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

    };


    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.ROVPilotWire = ROVPilotWire;
    window.Cockpit.plugins.push( plugins.ROVPilotWire );

}(window, document));
