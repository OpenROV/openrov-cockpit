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

  ROVpilotWire.prototype.inputDefaults = function inputDefaults() {
    self = this;
    return [
      // Toggle heading hold
      {
        name: 'rovPilot.toggleHeadingHold',
        description: 'Toggles the heading hold on/off',
        defaults: { keyboard: 'm' },
        down: function () {
          self.cockpit.rov.emit('plugin.rovpilot.headingHold.toggle');
        }
      },

      // Toggle depth hold
      {
        name: 'rovPilot.toggleDepthHold',
        description: 'Toggles the depth hold on/off',
        defaults: { keyboard: 'n' },
        down: function () {
          self.cockpit.rov.emit('plugin.rovpilot.depthHold.toggle');
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
          self.rov.cockpit.rov.emit('plugin.rovpilot.depthHold.toggle');
        }
      },
      {
        label: 'Toggle Heading hold',
        callback: function () {
          self.rov.cockpit.rov.emit('plugin.rovpilot.headingHold.toggle');
        }
      }
    ]
  };


  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  ROVpilotWire.prototype.listen = function listen() {
    var self = this;

    this.rov.on('plugin.rovpilot.depthHold.enabled', function(){
      self.cockpit.emit('plugin.rovpilot.depthHold.enabled');
    });

    this.rov.on('plugin.rovpilot.depthHold.disabled', function(){
      self.cockpit.emit('plugin.rovpilot.depthHold.disabled');
    });

    this.rov.on('plugin.rovpilot.depthHold.target', function(target){
      self.cockpit.emit('plugin.rovpilot.depthHold.target',target);
    });

    this.rov.on('plugin.rovpilot.headingHold.enabled', function(){
      self.cockpit.emit('plugin.rovpilot.headingHold.enabled');
    });

    this.rov.on('plugin.rovpilot.headingHold.disabled', function(){
      self.cockpit.emit('plugin.rovpilot.headingHold.disabled');
    });

    this.rov.on('plugin.rovpilot.headingHold.target', function(target){
      self.cockpit.emit('plugin.rovpilot.headingHold.target',target);
    });

//    this.rovsendPilotingDataTimer = setInterval(function(){
//      self.rovsendPilotingData();
//    },100); //Todo: Make configurable

  };


  window.Cockpit.plugins.push(ROVpilotWire);
}(window, jQuery));
