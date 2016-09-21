(function (window, $, undefined) {
  return;
  //TODO: Remove disable
  'use strict';
  var capestatus = namespace('plugins.capestatus');
  capestatus.Capestatus = function Capestatus(cockpit) {
    var self = this;
    console.log('Loading Capestatus plugin in the browser.');
    self.cockpit = cockpit;
    self.lastPing = null;
    var jsFileLocation = urlOfJsFile('capestatus.js');
    setInterval(function () {
      self.updateConnectionStatus();
      var now = new Date();
      var nowFormatted = now.toLocaleTimeString();
      self.cockpit.rov.emit('plugin.capestatus.time.time', {
        raw: now,
        formatted: nowFormatted
      });
    }, 1000);
  };
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  capestatus.Capestatus.prototype.listen = function listen() {
    var capes = this;
    this.cockpit.withHistory.on('status', function (data) {
      capes.UpdateStatusIndicators(data);
    });
  };
  capestatus.Capestatus.prototype.UpdateStatusIndicators = function UpdateStatusIndicators(data) {
    var self = this;
    this.lastPing = new Date();
  };
  capestatus.Capestatus.prototype.updateConnectionStatus = function () {
    var self = this;
    var now = new Date();
    var delay = now - this.lastPing;
    var isConnected = delay <= 3000;
    self.cockpit.rov.emit('plugin.capestatus.connection.' + (isConnected ? 'connected' : 'disconnected'));
  };
  window.Cockpit.plugins.push(capestatus.Capestatus);
}(window, jQuery));