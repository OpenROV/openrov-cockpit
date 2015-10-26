(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.SystemEnvironment = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    console.log("SystemEnvironment Plugin running");

  };

  plugins.SystemEnvironment.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'FMEM', description: 'Free memory (bytes) reported by the MCU'},
      {name: 'UTIM', description: 'Uptime (ms) reported by the MCU'},
      {name: 'BRDT', description: 'Air temperature (degrees C) reported Arduino'} //only works on cape
    ]);
  }

  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.SystemEnvironment.prototype.listen = function listen() {
    var self = this;
    this.cockpit.rov.on('status',function(data){
//      self.cockpit.emit('plugin.cameraTilt.angle',angle);
    });

  };

  window.Cockpit.plugins.push(plugins.SystemEnvironment);

})(window);
