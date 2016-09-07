(function (window, $, undefined) {
  'use strict';
  var SerialMonitor;
  SerialMonitor = function SerialMonitor(cockpit) {
    console.log('Loading SerialMonitor plugin in the browser.');
    // Instance variables
    this.cockpit = cockpit;
    var self = this;
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  SerialMonitor.prototype.listen = function listen() {
    var self = this;
    this.cockpit.on('plugin.serial-monitor.start', function () {
      self.start();
    });
    this.cockpit.on('plugin.serial-monitor.stop', function () {
      self.stop();
    });
    this.cockpit.rov.on('plugin.serial-monitor.serial-received', function (data) {
      self.cockpit.emit('plugin.serial-monitor.serial-received', data);
    });
    this.cockpit.on('plugin.serial-monitor.serial-sent', function (data) {
      self.cockpit.rov.emit('plugin.serial-monitor.serial-sent', data);
    });
  };
  SerialMonitor.prototype.start = function start() {
    this.cockpit.rov.emit('plugin.serial-monitor.start');
    this.cockpit.emit('plugin.serial-monitor.streaming', true);
  };
  SerialMonitor.prototype.start = function start() {
    this.cockpit.rov.emit('plugin.serial-monitor.start');
    this.cockpit.emit('plugin.serial-monitor.streaming', true);
  };
  SerialMonitor.prototype.stop = function stop() {
    this.cockpit.rov.emit('plugin.serial-monitor.stop');
    this.cockpit.emit('plugin.serial-monitor.streaming', false);
  };
  SerialMonitor.prototype.inputDefaults = function inputDefaults() {
    return [{
        name: 'serialMonitor.toggleSerialMonitor',
        description: 'Shows/hides raw serial monitor.',
        defaults: { keyboard: 'u' },
        down: function () {
          this.cockpit.rov.emit('plugin.serial-monitor.toggle');
        }
      }];
  };
  window.Cockpit.plugins.push(SerialMonitor);
}(window, jQuery));