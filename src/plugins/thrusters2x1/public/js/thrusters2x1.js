/*jshint multistr: true*/
(function (window, $, undefined) {
  'use strict';
  var Thrusters2x1;
  Thrusters2x1 = function Thrusters2x1(cockpit) {
    console.log('Loading thrusters2x1 plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    this.state = {
          port: 0,
          starboard: 0,
          vertical: 0
        }

    // Add required UI elements
  };

  Thrusters2x1.prototype.loaded = function() {
  };

  Thrusters2x1.prototype.listen = function() {
    var self = this;
    this.cockpit.on('plugin.thrusters2x1.motorTest', function(data){
      self.sendTestMotorMessage(data);
    });

    this.cockpit.on('plugin.thrusters2x1.set', function(state){
      self.sendTestMotorMessage(data);
    });
  };


  Thrusters2x1.prototype.sendTestMotorMessage = function sendTestMotorMessage(motor_values) {
    this.cockpit.rov.emit('plugin.thurster2x1.set', motor_values);
  };
  Thrusters2x1.prototype.setMotorTestSpeed = function setMotorTestSpeed(propertyName, value) {
    this[propertyName](value);
  };
  Thrusters2x1.prototype.LoadSettings = function LoadSettings(settings) {
  };
  Thrusters2x1.prototype.SaveDiagnostics = function() {
  };
  Thrusters2x1.prototype.SaveSettings = function() {
  };
  window.Cockpit.plugins.push(Thrusters2x1);
}(window, jQuery));
