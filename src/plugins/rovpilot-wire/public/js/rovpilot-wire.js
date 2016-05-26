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
    this.depthHold_state = {};
    this.headingHold_state = {};

  };

  ROVpilotWire.prototype.inputDefaults = function inputDefaults() {
    var self = this;
    return [
      // Toggle heading hold
      {
        name: 'rovPilot.toggleHeadingHold',
        description: 'Toggles the heading hold on/off',
        defaults: { keyboard: 'm' },
        down: function () {
          self.cockpit.emit('plugin.rovpilot.headingHold.set-enabled',!self.headingHold_state.enabled);
        }
      },

      // Toggle depth hold
      {
        name: 'rovPilot.toggleDepthHold',
        description: 'Toggles the depth hold on/off',
        defaults: { keyboard: 'n' },
        down: function () {
          self.cockpit.emit('plugin.rovpilot.depthHold.set-enabled',!self.depthHold_state.enabled);
        }
      }
    ]

  }


  ROVpilotWire.prototype.altMenuDefaults = function altMenuDefaults() {
    var self=this;
    return [
      {
        label: 'Toggle Depth hold',
        callback: function () {
          self.cockpit.emit('plugin.rovpilot.depthHold.set-enabled',!self.depthHold_state.enabled);
        }
      },
      {
        label: 'Toggle Heading hold',
        callback: function () {
          self.cockpit.emit('plugin.rovpilot.headingHold.set-enabled',!self.headingHold_state.enabled);
        }
      }
    ]
  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilotWire.prototype.listen = function listen() {
    var self = this;

    this.rov.withHistory.on('plugin.rovpilot.depthHold.state', function(state){
      self.cockpit.emit('plugin.rovpilot.depthHold.state',state);
      self.depthHold_state=state;
    });

    this.rov.withHistory.on('plugin.rovpilot.headingHold.state', function(state){
      self.cockpit.emit('plugin.rovpilot.headingHold.state',state);
      self.headingHold_state=state;      
    });

    this.cockpit.on('plugin.rovpilot.depthHold.set-enabled',function(value){
      self.rov.emit('plugin.rovpilot.depthHold.set',{enabled: value});
    });

    this.cockpit.on('plugin.rovpilot.headingHold.set-enabled',function(value){
      self.rov.emit('plugin.rovpilot.headingHold.set',{enabled: value});
    });

  };


  window.Cockpit.plugins.push(ROVpilotWire);
}(window, jQuery));
