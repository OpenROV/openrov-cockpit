(function(window) {
  'use strict';
  var plugins = namespace('plugins');
  plugins.Laser = function(cockpit) {
    var self = this;
    self.cockpit = cockpit;
    this.laserState = {enabled:false};
  };

  plugins.Laser.prototype.getTelemetryDefintions = function getTelemetryDefintions() {
    return([
      {name: 'claser', description: 'Scaling Laser power 0 to 255'}
    ]);
  }

  plugins.Laser.prototype.inputDefaults = function inputDefaults() {
    var cockpit = this.cockpit;
    var self = this;
    return [
      {
        name: 'plugin.laser.Toggle',
        description: 'Toggles the lasers on or off.',
        defaults: { keyboard: 'l' },
        down: function () {
          cockpit.rov.emit('plugin.laser.set',self.laserState.enabled==true?0:1);
        }
      }
    ];
  }
  //This pattern will hook events in the cockpit and pull them all back
  //so that the reference to this instance is available for further processing
  plugins.Laser.prototype.listen = function listen() {
    var self = this;

    /* Forward calls on the COCKPIT emitter to the ROV  */
    self.cockpit.on('plugin.laser.set',function(value){
        cockpit.rov.emit('plugin.laser.set',value);
    });

    self.cockpit.rov.withHistory.on('plugin.laser.state', function(data){
      self.laserState = data;
      cockpit.emit('plugin.laser.state',data);
    });

  };

  window.Cockpit.plugins.push(plugins.Laser);

})(window);
