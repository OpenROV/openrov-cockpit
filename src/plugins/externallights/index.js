
(function() {
  function ExternalLights(name, deps) {
    var ArduinoHelper = require('../../lib/ArduinoHelper')();
    console.log('ExternalLights plugin loaded');
    this.lights = 0;
    var self=this;

    // Cockpit
    deps.cockpit.on('plugin.externalLights.toggle', function () {
      toggleLights();
    });

    deps.cockpit.on('plugin.externalLights.adjust', function (value) {
      adjustLights(value);
    });

    // Arduino
    deps.rov.on('status', function (data) {
      if ('LIGPE' in data) {
        //value of 0-1.0 representing percent
        var level = data.LIGPE;
        self.lights = level;
        deps.cockpit.emit('plugin.externalLights.level', level);
      }
    });

      var adjustLights = function adjustLights(value) {
      console.log("adjustLights:" + value);
      if (this.lights === 0 && value < 0) {
        //this code rounds the horn so to speak by jumping from zero to max and vise versa
        this.lights = 0;  //disabled the round the horn feature
      } else if (this.lights == 1 && value > 0) {
        this.lights = 1;  //disabled the round the horn feature
      } else {
        this.lights = parseFloat(value) + parseFloat(this.lights);
      }
      setLights(this.lights);
    };

    var toggleLights = function toggleLights() {
      if (this.lights > 0) {
        setLights(0);
      } else {
        setLights(1);
      }
    };

    var setLights = function setLights(value) {
      console.log("setLights:" + value);
      this.lights = value;
      if (this.lights > 1)
        this.lights = 1;
      if (this.lights < 0)
        this.lights = 0;

      var command = 'eligt(' + ArduinoHelper.serial.packPercent(this.lights) + ')';
      deps.rov.send(command);

    };


  }
  
  module.exports = ExternalLights;
})();
