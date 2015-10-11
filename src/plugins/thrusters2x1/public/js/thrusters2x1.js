/*jshint multistr: true*/
(function (window, $, undefined) {
  'use strict';
  var Thrusters2x1;
  Thrusters2x1 = function Thrusters2x1(cockpit) {
    console.log('Loading thrusters2x1 plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;

    // Add required UI elements
  };

  Thrusters2x1.prototype.loaded = function() {
  };

  Thrusters2x1.prototype.listen = function() {
    var self = this;
    this.cockpit.on('plugin.thrusters2x1.motorTest', function(data){
      self.sendTestMotorMessage(data);
    });
  };


  Thrusters2x1.prototype.sendTestMotorMessage = function sendTestMotorMessage(motor_values) {
    this.cockpit.rov.emit('plugin.thurster2x1.motorTest', {
      port: motor_values.port,
      starboard: motor_values.starboard,
      vertical: motor_values.vertical
    });
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
