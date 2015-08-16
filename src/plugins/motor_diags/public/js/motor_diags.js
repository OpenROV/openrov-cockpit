/*jshint multistr: true*/
(function (window, $, undefined) {
  'use strict';
  var Motor_diags;
  Motor_diags = function Motor_diags(cockpit) {
    console.log('Loading Motor_diags plugin in the browser.');
    // Instance variables

    // Add required UI elements
  };

  Motor_diags.prototype.getSettingSchema = function getSettingSchema(){
    return [
      {
          "title": "What do you think of Alpaca?",
          "id" : "motor_diags",
          "type": "object",
          "properties": {
              "name": {
                  "type": "string",
                  "title": "Name"
              },
              "ranking": {
                  "type": "string",
                  "title": "Ranking",
                  "enum": ['excellent', 'not too shabby', 'alpaca built my hotrod']
              }
          }
      }
    ]
  }

  Motor_diags.prototype.loaded = function() {
  };

  Motor_diags.prototype.sendTestMotorMessage = function sendTestMotorMessage() {
    var portVal = this.portMotorSpeed();
    var starbordVal = this.starbordMotorSpeed();
    var verticalVal = this.verticalMotorSpeed();
    this.cockpit.rov.emit('plugin.motorDiag.motorTest', {
      port: portVal,
      starbord: starbordVal,
      vertical: verticalVal
    });
  };
  Motor_diags.prototype.setMotorTestSpeed = function setMotorTestSpeed(propertyName, value) {
    this[propertyName](value);
  };
  Motor_diags.prototype.LoadSettings = function LoadSettings(settings) {
  };
  Motor_diags.prototype.SaveDiagnostics = function() {
  };
  Motor_diags.prototype.SaveSettings = function() {
  };
  window.Cockpit.plugins.push(Motor_diags);
}(window, jQuery));
